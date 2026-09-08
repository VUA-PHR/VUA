//! The AMF production-domain document store for Recipe v0.3 documents
//! (011 convergence decision 1: a document store per the BuildRecordStore
//! precedent — whole-document read/write, versioned, identity-addressed;
//! never BDL).
//!
//! Save semantics (011 §7 convergence decisions + data stance): the whole
//! document is submitted with a `base_revision` for optimistic concurrency —
//! a mismatch is a typed conflict, never a silent overwrite; each accepted
//! save bumps the revision. The document body is carried as a transparent
//! JSON value here; structural validation (Recipe v0.3 Schema) belongs to
//! the application face that accepts the save.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "kind")]
pub enum RecipeSaveError {
    #[serde(rename = "revision_conflict")]
    RevisionConflict { current_revision: u64 },
    #[serde(rename = "invalid_id")]
    InvalidId,
    #[serde(rename = "store_io")]
    StoreIo { detail: String },
}

impl From<RecipeSaveError> for io::Error {
    fn from(error: RecipeSaveError) -> Self {
        match error {
            RecipeSaveError::RevisionConflict { .. }
            | RecipeSaveError::InvalidId
            | RecipeSaveError::StoreIo { .. } => {
                io::Error::other(format!("{error:?}"))
            }
        }
    }
}

/// One stored recipe document: the transparent body plus the store-managed
/// metadata (revision bumps on every accepted save; updatedAt is the store
/// clock at save time).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredRecipeDocument {
    pub recipe: Value,
    pub revision: u64,
    pub updated_at: String,
}

/// A listing entry (identity + title + stamps; bodies via get).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeListEntry {
    pub recipe_id: String,
    pub revision: u64,
    pub title: String,
    pub updated_at: String,
}

/// The AMF production-domain recipe document store.
pub struct RecipeDocumentStore {
    root: PathBuf,
    /// Produces the store clock stamp for `updatedAt` (RFC 3339 string).
    now: Box<dyn Fn() -> String + Send + Sync>,
}

impl RecipeDocumentStore {
    pub fn new(root: impl Into<PathBuf>, now: Box<dyn Fn() -> String + Send + Sync>) -> Self {
        Self { root: root.into(), now }
    }

    pub fn new_with_system_clock(root: impl Into<PathBuf>) -> Self {
        Self::new(
            root,
            Box::new(|| {
                let d = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default();
                let total = d.as_secs();
                let millis = d.subsec_millis();
                format!(
                    "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
                    1970 + total / 31_536_000,
                    (total / 2_592_000) % 12 + 1,
                    (total / 86_400) % 30 + 1,
                    (total / 3_600) % 24,
                    (total / 60) % 60,
                    total % 60,
                    millis
                )
            }),
        )
    }

    fn path_for(&self, recipe_id: &str) -> Result<PathBuf, RecipeSaveError> {
        validate_id(recipe_id)?;
        Ok(self.root.join(format!("{recipe_id}.json")))
    }

    /// Whole-document save with optimistic concurrency. `base_revision = 0`
    /// creates (the document must not exist); otherwise `base_revision` must
    /// match the stored revision. Accepted saves bump the revision.
    pub fn save(
        &self,
        recipe_id: &str,
        document: &Value,
        base_revision: u64,
    ) -> Result<StoredRecipeDocument, RecipeSaveError> {
        let path = self.path_for(recipe_id)?;
        let current = self.read_metadata(recipe_id)?;
        match (current, base_revision) {
            (None, 0) => {}
            (None, other) => {
                let _ = other;
                return Err(RecipeSaveError::RevisionConflict { current_revision: 0 });
            }
            (Some(existing), base) if existing.revision == base => {}
            (Some(existing), _) => {
                return Err(RecipeSaveError::RevisionConflict {
                    current_revision: existing.revision,
                })
            }
        }
        let stored = StoredRecipeDocument {
            recipe: document.clone(),
            revision: base_revision + 1,
            updated_at: (self.now)(),
        };
        fs::create_dir_all(&self.root).map_err(|error| {
            RecipeSaveError::StoreIo { detail: error.to_string() }
        })?;
        let temporary = self.root.join(format!(".{recipe_id}.tmp"));
        let bytes = serde_json::to_vec_pretty(&stored)
            .map_err(|error| RecipeSaveError::StoreIo { detail: error.to_string() })?;
        {
            let mut output = OpenOptions::new()
                .create(true)
                .write(true)
                .truncate(true)
                .open(&temporary)
                .map_err(|error| RecipeSaveError::StoreIo { detail: error.to_string() })?;
            output.write_all(&bytes).map_err(|error| {
                RecipeSaveError::StoreIo { detail: error.to_string() }
            })?;
        }
        // Replace is safe here: recipes are mutable documents (unlike
        // evidence/records), fenced by the baseRevision check above.
        fs::rename(&temporary, &path).map_err(|error| {
            RecipeSaveError::StoreIo { detail: error.to_string() }
        })?;
        Ok(stored)
    }

    /// Reads one stored document (latest revision).
    pub fn get(&self, recipe_id: &str) -> Result<Option<StoredRecipeDocument>, RecipeSaveError> {
        let path = self.path_for(recipe_id)?;
        match fs::read(&path) {
            Ok(bytes) => Ok(Some(serde_json::from_slice(&bytes).map_err(|error| {
                RecipeSaveError::StoreIo { detail: error.to_string() }
            })?)),
            Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(None),
            Err(error) => Err(RecipeSaveError::StoreIo { detail: error.to_string() }),
        }
    }

    /// Lists every stored recipe (identity + title + stamps, sorted by
    /// updatedAt). Pagination/filtering belongs to the application face.
    pub fn list(&self) -> Result<Vec<RecipeListEntry>, RecipeSaveError> {
        let mut entries = Vec::new();
        for entry in fs::read_dir(&self.root).map_err(|error| {
            RecipeSaveError::StoreIo { detail: error.to_string() }
        })? {
            let entry = entry.map_err(|error| {
                RecipeSaveError::StoreIo { detail: error.to_string() }
            })?;
            let name = entry.file_name();
            let name = name.to_string_lossy().into_owned();
            if let Some(recipe_id) = name.strip_suffix(".json") {
                if recipe_id.starts_with('.') {
                    continue;
                }
                if let Some(stored) = self.get(recipe_id)? {
                    entries.push(RecipeListEntry {
                        recipe_id: recipe_id.to_owned(),
                        revision: stored.revision,
                        title: stored
                            .recipe
                            .get("title")
                            .and_then(Value::as_str)
                            .unwrap_or_default()
                            .to_owned(),
                        updated_at: stored.updated_at,
                    });
                }
            }
        }
        entries.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        Ok(entries)
    }
}

fn validate_id(value: &str) -> Result<(), RecipeSaveError> {
    if value.is_empty()
        || value.len() > 128
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
    {
        return Err(RecipeSaveError::InvalidId);
    }
    Ok(())
}

/// Reads the stored metadata without the body (for the concurrency check).
fn read_metadata_at(path: &Path) -> io::Result<Option<(u64, String)>> {
    match fs::read(path) {
        Ok(bytes) => {
            let stored: StoredRecipeDocument = serde_json::from_slice(&bytes)
                .map_err(|error| io::Error::new(io::ErrorKind::InvalidData, error))?;
            Ok(Some((stored.revision, stored.updated_at)))
        }
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error),
    }
}

impl RecipeDocumentStore {
    fn read_metadata(&self, recipe_id: &str) -> Result<Option<StoredRecipeDocument>, RecipeSaveError> {
        self.get(recipe_id)
    }
}

// Keep the helper referenced (metadata read currently delegates to get; the
// helper documents the intent and serves the list face if it ever needs a
// body-free read).
#[allow(dead_code)]
fn _metadata_helper_used() {
    let _ = read_metadata_at;
}

#[cfg(test)]
mod tests {
    use super::*;

    fn unique_root(tag: &str) -> PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!(
            "vua-recipe-docs-{tag}-{}-{nanos}",
            std::process::id()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn doc(title: &str) -> Value {
        serde_json::json!({
            "formatVersion": "0.3",
            "recipeId": "019e0000-0000-7000-8000-000000000001",
            "revision": 1,
            "title": title
        })
    }

    const ID: &str = "019e0000-0000-7000-8000-000000000001";

    #[test]
    fn save_create_then_optimistic_concurrency() {
        let store = RecipeDocumentStore::new_with_system_clock(unique_root("conc"));
        // Create requires base_revision 0.
        assert!(matches!(
            store.save(ID, &doc("one"), 3),
            Err(RecipeSaveError::RevisionConflict { current_revision: 0 })
        ));
        let created = store.save(ID, &doc("one"), 0).unwrap();
        assert_eq!(created.revision, 1);
        // Matching base saves bump the revision.
        let saved = store.save(ID, &doc("two"), 1).unwrap();
        assert_eq!(saved.revision, 2);
        // A stale base (against the now-current revision 2) is a typed
        // conflict that names the current revision.
        assert!(matches!(
            store.save(ID, &doc("three"), 1),
            Err(RecipeSaveError::RevisionConflict { current_revision: 2 })
        ));
        let read = store.get(ID).unwrap().unwrap();
        assert_eq!(read.revision, 2);
        assert_eq!(read.recipe["title"], "two");
    }

    #[test]
    fn list_returns_identity_entries_sorted_by_update() {
        let store = RecipeDocumentStore::new_with_system_clock(unique_root("list"));
        store.save("019e0000-0000-7000-8000-00000000000a", &doc("alpha"), 0).unwrap();
        std::thread::sleep(std::time::Duration::from_millis(5));
        store.save("019e0000-0000-7000-8000-00000000000b", &doc("beta"), 0).unwrap();
        let entries = store.list().unwrap();
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].title, "beta", "updatedAt descending");
        assert_eq!(entries[1].title, "alpha");
    }

    #[test]
    fn invalid_ids_are_typed_errors() {
        let store = RecipeDocumentStore::new_with_system_clock(unique_root("ids"));
        assert!(matches!(
            store.save("../escape", &doc("x"), 0),
            Err(RecipeSaveError::InvalidId)
        ));
    }
}
