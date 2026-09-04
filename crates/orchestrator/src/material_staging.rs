//! BDL staging project contract (material-intake v0.1, "Staging project
//! contract").
//!
//! The `local_reusable_vpm` path builds its isolated staging project from a
//! VUA-bundled minimal template: two text files plus an empty `Assets/`
//! folder — no DLLs, no source code. Template versions live as constants;
//! a VRChat SDK deprecation ships a small client update of these files.
//! The staging project serves exactly one atomic task and is destroyed on
//! success, failure, and panic paths alike (`Drop` performs best-effort
//! cleanup so panic unwinds still honor the contract).

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

/// Template layout version — bump when the unpacked file set changes.
pub const STAGING_TEMPLATE_VERSION: &str = "1";

/// Baseline-locked editor version written into `ProjectVersion.txt`.
pub const STAGING_UNITY_VERSION: &str = "2022.3.22f1";

pub const STAGING_PROJECT_VERSION_TXT: &str = "m_EditorVersion: 2022.3.22f1\n";

/// The VUA Bridge package id inside the staging project.
pub const BRIDGE_PACKAGE_ID: &str = "com.ph-r.vua";

/// Fixed VPM dependency lock: the same SDK base VCC would produce, with the
/// VRChat scoped registry so the lib backend can resolve the packages.
pub const STAGING_MANIFEST_JSON: &str = r#"{
  "dependencies": {
    "com.vrchat.avatars": "3.10.11",
    "com.vrchat.base": "3.10.11",
    "com.unity.textmeshpro": "3.0.6"
  },
  "scopedRegistries": [
    {
      "name": "VRChat",
      "url": "https://packages.vrchat.com",
      "scopes": ["com.vrchat"]
    }
  ]
}
"#;

/// `%TEMP%\VUA_Staging_{session_id}` — never user-visible folders
/// (Downloads/Desktop), where real-time antivirus scanning produces locks.
pub fn staging_root(temp_root: &Path, session_id: &str) -> PathBuf {
    temp_root.join(format!("VUA_Staging_{session_id}"))
}

/// One staging project guarded for the duration of one atomic task.
pub struct StagingProject {
    root: PathBuf,
    destroyed: bool,
}

impl StagingProject {
    /// Unpacks the bundled template into
    /// `%TEMP%\VUA_Staging_{session_id}` and writes the `.vua/staging.json`
    /// token marker the Bridge requires for `create_local_vpm_package`.
    pub fn create(temp_root: &Path, session_id: &str, staging_token: &str) -> io::Result<Self> {
        let root = staging_root(temp_root, session_id);
        fs::create_dir_all(root.join("Assets"))?;
        fs::create_dir_all(root.join("ProjectSettings"))?;
        fs::create_dir_all(root.join("Packages"))?;
        fs::create_dir_all(root.join(".vua"))?;
        fs::write(
            root.join("ProjectSettings").join("ProjectVersion.txt"),
            STAGING_PROJECT_VERSION_TXT,
        )?;
        fs::write(root.join("Packages").join("manifest.json"), STAGING_MANIFEST_JSON)?;
        // The scaffold (Bridge package + MA compile stub) is what makes the
        // staging project able to execute Bridge commands at all; without
        // it the first dispatch fails for lack of a batchmode entry point.
        crate::staging_scaffold::write_scaffold(&root.join("Packages"))?;
        fs::write(root.join(".vua").join("staging.json"), staging_token)?;
        Ok(Self {
            root,
            destroyed: false,
        })
    }

    /// Same contract, but the project skeleton comes from
    /// `template_override_dir` (recursively copied) instead of the bundled
    /// constants — the local-harness seam for real-Unity staging runs that
    /// need the Bridge package and compile scaffolding inside the staging
    /// project. The token marker contract is identical.
    pub fn create_from_template(
        template_override_dir: &Path,
        temp_root: &Path,
        session_id: &str,
        staging_token: &str,
    ) -> io::Result<Self> {
        let root = staging_root(temp_root, session_id);
        copy_tree(template_override_dir, &root)?;
        fs::create_dir_all(root.join(".vua"))?;
        fs::write(root.join(".vua").join("staging.json"), staging_token)?;
        Ok(Self {
            root,
            destroyed: false,
        })
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    /// Destroys the staging project immediately. Idempotent; also performed
    /// best-effort by `Drop`, so failure and panic paths still clean up.
    pub fn destroy(mut self) -> io::Result<()> {
        self.destroyed = true;
        fs::remove_dir_all(&self.root)
    }
}

impl Drop for StagingProject {
    fn drop(&mut self) {
        if !self.destroyed {
            let _ = fs::remove_dir_all(&self.root);
        }
    }
}

fn copy_tree(source: &Path, target: &Path) -> io::Result<()> {
    fs::create_dir_all(target)?;
    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let target = target.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            copy_tree(&entry.path(), &target)?;
        } else {
            fs::copy(entry.path(), target)?;
        }
    }
    Ok(())
}
