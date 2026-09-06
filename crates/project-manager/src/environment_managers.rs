//! B6: project-manager capability detection (ALCOM/VCC), productized from
//! the environment detection spike.
//!
//! Read-only, targeted observation of configured well-known roots — the
//! same discipline as `environment`: never a scan, never a write. VCC
//! exposes its registered projects through `settings.json`; the current
//! VCC (and our `vrc-get-vpm` package backend) resolve that file under
//! `%LOCALAPPDATA%\VRChatCreatorCompanion`, with the legacy `%APPDATA%`
//! location kept as fallback (see the environment detection spike
//! findings). `userProjects` lists absolute project paths explicitly, so
//! project discovery reads exactly those paths instead of sweeping user
//! folders; the legacy `localProjectFolders` form falls back to reading
//! the registered folders' immediate subdirectories. ALCOM is probed at
//! presence level only — its configuration format is an open question on
//! the spike record, so the probe reports what it sees without inventing
//! a schema.
//!
//! Output is the versioned `EnvironmentManagersSnapshotV01` payload, whose
//! shape is pinned by `schemas/environment-spike/v0.1/snapshot.schema.json`.

use crate::editor_targets::{self, EditorClass};
use crate::time::Clock;
use serde::Serialize;
use serde_json::Value;
use std::io;
use std::path::{Path, PathBuf};

pub const ENV_MANAGERS_SNAPSHOT_SCHEMA_VERSION: &str = "vua.environment-managers-snapshot/v0.1";

/// Stable spike codes; findings and fix plans key on them.
pub mod codes {
    pub const VCC_SETTINGS_READ_FAILED: &str = "vua.env_managers.vcc_settings_read_failed";
    pub const VCC_SETTINGS_SCHEMA_UNEXPECTED: &str = "vua.env_managers.vcc_settings_schema_unexpected";
    pub const MANAGER_SETTINGS_READ_FAILED: &str = "vua.env_managers.manager_settings_read_failed";
    pub const ALCOM_PROJECTS_NOT_RECOGNIZED: &str =
        "vua.env_managers.alcom_projects_not_recognized";
    pub const PROJECT_PATH_MISSING: &str = "vua.env_managers.project_path_missing";
    pub const PROJECT_MARKERS_INCOMPLETE: &str = "vua.env_managers.project_markers_incomplete";
    pub const PROJECT_VERSION_UNPARSEABLE: &str = "vua.env_managers.project_version_unparseable";
    pub const EDITOR_ENTRY_UNPARSEABLE: &str = "vua.env_managers.editor_entry_unparseable";
    pub const EDITOR_ROOT_READ_FAILED: &str = "vua.env_managers.editor_root_read_failed";
}

/// Injectable well-known roots. Defaults follow what the current VCC and
/// `vrc-get-vpm` actually resolve on Windows; tests substitute synthetic
/// trees, so no test depends on this machine.
#[derive(Debug, Clone)]
pub struct ManagerRoots {
    /// VCC settings candidates in priority order.
    pub vcc_settings_candidates: Vec<PathBuf>,
    /// ALCOM settings candidates in priority order.
    pub alcom_settings_candidates: Vec<PathBuf>,
}

impl Default for ManagerRoots {
    fn default() -> Self {
        let local_app_data = std::env::var("LOCALAPPDATA")
            .or_else(|_| std::env::var("XDG_DATA_HOME"))
            .unwrap_or_default();
        let roaming_app_data = std::env::var("APPDATA")
            .or_else(|_| std::env::var("XDG_CONFIG_HOME"))
            .unwrap_or_default();
        Self {
            vcc_settings_candidates: vec![
                PathBuf::from(&local_app_data)
                    .join("VRChatCreatorCompanion")
                    .join("settings.json"),
                PathBuf::from(&roaming_app_data)
                    .join("VRChatCreatorCompanion")
                    .join("settings.json"),
            ],
            alcom_settings_candidates: vec![PathBuf::from(&roaming_app_data)
                .join("alcom")
                .join("setting.json")],
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ManagerPresence {
    Found,
    NotFound,
    ReadFailed,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorFinding {
    pub version: String,
    pub classification: EditorClass,
    pub china_distribution: bool,
    pub guidance_code: &'static str,
    pub path: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VccCapability {
    pub presence: ManagerPresence,
    /// Which settings file answered (current LOCALAPPDATA location vs
    /// legacy Roaming location).
    pub settings_path: Option<String>,
    /// `userProjects` is the current explicit per-project list;
    /// `localProjectFolders` is the legacy folder-list form.
    pub projects_source: Option<&'static str>,
    pub user_projects: Vec<String>,
    pub local_project_folders: Vec<String>,
    pub error_code: Option<&'static str>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AlcomCapability {
    pub presence: ManagerPresence,
    pub settings_path: Option<String>,
    pub top_level_keys: Vec<String>,
    /// ALCOM resolves the same vrc-get-compatible `userProjects` field; the
    /// array is read only when present — an absent or unrecognized field is
    /// a warning finding, never an invented schema.
    pub user_projects: Vec<String>,
    pub error_code: Option<&'static str>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ProjectAssociation {
    VccRegistered,
    AlcomRegistered,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectFinding {
    pub path: String,
    /// All managers that registered this path, sorted — VCC and ALCOM can
    /// manage the same project simultaneously.
    pub associations: Vec<ProjectAssociation>,
    pub unity_version: Option<String>,
    pub unity_classification: Option<EditorClass>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum FindingSeverity {
    Info,
    Warning,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManagerDiagnostic {
    pub code: &'static str,
    pub severity: FindingSeverity,
    pub detail: String,
}

/// Versioned spike payload pinned by
/// `schemas/environment-spike/v0.1/snapshot.schema.json`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentManagersSnapshotV01 {
    pub schema_version: &'static str,
    pub captured_at: String,
    pub production_target: &'static str,
    pub migration_sources: [&'static str; 2],
    pub editor_roots: Vec<String>,
    pub editors: Vec<EditorFinding>,
    pub vcc: VccCapability,
    pub alcom: AlcomCapability,
    pub projects: Vec<ProjectFinding>,
    pub diagnostics: Vec<ManagerDiagnostic>,
}

/// Assembles the full read-only snapshot. Every finding is deterministic
/// for a given tree: a missing component is a normal finding, and only a
/// failed *observation* produces an error diagnostic.
pub fn collect_environment_managers_snapshot(
    roots: &ManagerRoots,
    editor_roots: &[PathBuf],
    clock: &dyn Clock,
) -> EnvironmentManagersSnapshotV01 {
    let mut diagnostics = Vec::new();
    let editors = collect_editors(editor_roots, &mut diagnostics);
    let vcc = read_vcc_settings(&roots.vcc_settings_candidates, &mut diagnostics);
    let alcom = read_alcom_settings(&roots.alcom_settings_candidates, &mut diagnostics);
    let projects = collect_projects(&vcc, &alcom, &mut diagnostics);
    EnvironmentManagersSnapshotV01 {
        schema_version: ENV_MANAGERS_SNAPSHOT_SCHEMA_VERSION,
        captured_at: clock.now_rfc3339(),
        production_target: editor_targets::PRODUCTION_TARGET,
        migration_sources: editor_targets::MIGRATION_SOURCES,
        editor_roots: editor_roots
            .iter()
            .map(|root| root.to_string_lossy().into_owned())
            .collect(),
        editors,
        vcc,
        alcom,
        projects,
        diagnostics,
    }
}

// --- editors ---

fn collect_editors(editor_roots: &[PathBuf], diagnostics: &mut Vec<ManagerDiagnostic>) -> Vec<EditorFinding> {
    let mut editors = Vec::new();
    for root in editor_roots {
        let read_dir = match std::fs::read_dir(root) {
            Ok(read_dir) => read_dir,
            Err(error) if error.kind() == io::ErrorKind::NotFound => continue,
            Err(error) => {
                diagnostics.push(ManagerDiagnostic {
                    code: codes::EDITOR_ROOT_READ_FAILED,
                    severity: FindingSeverity::Error,
                    detail: format!("{}: {error}", root.display()),
                });
                continue;
            }
        };
        for entry in read_dir.flatten() {
            let path = entry.path();
            if !path.is_dir() || !path.join("Editor").is_dir() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().into_owned();
            let Some(parsed) = editor_targets::parse_editor_version(&name) else {
                diagnostics.push(ManagerDiagnostic {
                    code: codes::EDITOR_ENTRY_UNPARSEABLE,
                    severity: FindingSeverity::Warning,
                    detail: format!("{}: editor directory name is not a complete version string", path.display()),
                });
                continue;
            };
            let (classification, guidance_code) = editor_targets::classify_editor(&parsed);
            editors.push(EditorFinding {
                version: name,
                classification,
                china_distribution: parsed.china_suffix.is_some(),
                guidance_code,
                path: path.to_string_lossy().into_owned(),
            });
        }
    }
    // read_dir order is OS-defined; a snapshot must be deterministic, so
    // sort by class (target first) then newest version first.
    let class_rank = |finding: &EditorFinding| match finding.classification {
        EditorClass::ProductionTarget => 0,
        EditorClass::MigrationSource => 1,
        EditorClass::OtherUnityVersion => 2,
        EditorClass::TuanjieFamily => 3,
    };
    let version_key = |finding: &EditorFinding| {
        editor_targets::parse_editor_version(&finding.version)
            .map(|parsed| (parsed.major, parsed.minor, parsed.patch, parsed.release_number))
            .unwrap_or((0, 0, 0, 0))
    };
    editors.sort_by(|left, right| {
        (class_rank(left), version_key(left)).cmp(&(class_rank(right), version_key(right)))
    });
    editors
}

// --- VCC ---

/// Reads the first existing VCC settings candidate. Public so the
/// environment engine can item-ize VCC capability without duplicating the
/// resolution order or the schema handling.
pub fn read_vcc_settings(
    candidates: &[PathBuf],
    diagnostics: &mut Vec<ManagerDiagnostic>,
) -> VccCapability {
    for path in candidates {
        let metadata = match std::fs::metadata(path) {
            Ok(metadata) => metadata,
            Err(_) => continue,
        };
        if !metadata.is_file() {
            continue;
        }
        let display = path.to_string_lossy().into_owned();
        let text = match std::fs::read_to_string(path) {
            Ok(text) => text,
            Err(error) => return vcc_read_failed(&display, codes::VCC_SETTINGS_READ_FAILED, format!("{}: {error}", display), diagnostics),
        };
        let value: Value = match serde_json::from_str(&text) {
            Ok(value) => value,
            Err(error) => {
                return vcc_read_failed(
                    &display,
                    codes::VCC_SETTINGS_SCHEMA_UNEXPECTED,
                    format!("{}: settings.json is not valid JSON: {error}", display),
                    diagnostics,
                )
            }
        };
        let user_projects = string_array(value.get("userProjects"), &display, diagnostics);
        let local_project_folders = string_array(value.get("localProjectFolders"), &display, diagnostics);
        if value.get("userProjects").is_none() && value.get("localProjectFolders").is_none() {
            // A found-but-unrecognized settings file is a finding, not a
            // crash: report presence with an unexpected-schema warning.
            diagnostics.push(ManagerDiagnostic {
                code: codes::VCC_SETTINGS_SCHEMA_UNEXPECTED,
                severity: FindingSeverity::Warning,
                detail: format!(
                    "{}: neither userProjects nor localProjectFolders present; keys: {}",
                    display,
                    top_level_keys(&value).join(", ")
                ),
            });
            return VccCapability {
                presence: ManagerPresence::Found,
                settings_path: Some(display),
                projects_source: None,
                user_projects,
                local_project_folders,
                error_code: Some(codes::VCC_SETTINGS_SCHEMA_UNEXPECTED),
            };
        }
        let projects_source = if value.get("userProjects").is_some() {
            "userProjects"
        } else {
            "localProjectFolders"
        };
        return VccCapability {
            presence: ManagerPresence::Found,
            settings_path: Some(display),
            projects_source: Some(projects_source),
            user_projects,
            local_project_folders,
            error_code: None,
        };
    }
    VccCapability {
        presence: ManagerPresence::NotFound,
        settings_path: None,
        projects_source: None,
        user_projects: Vec::new(),
        local_project_folders: Vec::new(),
        error_code: None,
    }
}

fn vcc_read_failed(
    display: &str,
    code: &'static str,
    detail: String,
    diagnostics: &mut Vec<ManagerDiagnostic>,
) -> VccCapability {
    diagnostics.push(ManagerDiagnostic {
        code,
        severity: FindingSeverity::Error,
        detail,
    });
    VccCapability {
        presence: ManagerPresence::ReadFailed,
        settings_path: Some(display.to_owned()),
        projects_source: None,
        user_projects: Vec::new(),
        local_project_folders: Vec::new(),
        error_code: Some(code),
    }
}

fn string_array(value: Option<&Value>, source: &str, diagnostics: &mut Vec<ManagerDiagnostic>) -> Vec<String> {
    match value {
        None => Vec::new(),
        Some(Value::Array(items)) => items
            .iter()
            .filter_map(|item| item.as_str().map(str::to_owned))
            .collect(),
        Some(_) => {
            diagnostics.push(ManagerDiagnostic {
                code: codes::VCC_SETTINGS_SCHEMA_UNEXPECTED,
                severity: FindingSeverity::Warning,
                detail: format!("{}: expected a JSON string array", source),
            });
            Vec::new()
        }
    }
}

fn top_level_keys(value: &Value) -> Vec<String> {
    let mut keys: Vec<String> = value
        .as_object()
        .map(|object| object.keys().cloned().collect())
        .unwrap_or_default();
    keys.sort();
    keys
}

// --- ALCOM (presence level only; schema is an open spike question) ---

fn read_alcom_settings(candidates: &[PathBuf], diagnostics: &mut Vec<ManagerDiagnostic>) -> AlcomCapability {
    for path in candidates {
        let metadata = match std::fs::metadata(path) {
            Ok(metadata) => metadata,
            Err(_) => continue,
        };
        if !metadata.is_file() {
            continue;
        }
        let display = path.to_string_lossy().into_owned();
        let text = match std::fs::read_to_string(path) {
            Ok(text) => text,
            Err(error) => {
                diagnostics.push(ManagerDiagnostic {
                    code: codes::MANAGER_SETTINGS_READ_FAILED,
                    severity: FindingSeverity::Error,
                    detail: format!("{}: {error}", display),
                });
                return AlcomCapability {
                    presence: ManagerPresence::ReadFailed,
                    settings_path: Some(display),
                    top_level_keys: Vec::new(),
                    user_projects: Vec::new(),
                    error_code: Some(codes::MANAGER_SETTINGS_READ_FAILED),
                };
            }
        };
        let (top_level_keys, user_projects) = match serde_json::from_str::<Value>(&text) {
            Ok(value) => {
                let keys = top_level_keys(&value);
                let user_projects =
                    string_array(value.get("userProjects"), &display, diagnostics);
                if value.get("userProjects").is_none() {
                    diagnostics.push(ManagerDiagnostic {
                        code: codes::ALCOM_PROJECTS_NOT_RECOGNIZED,
                        severity: FindingSeverity::Warning,
                        detail: format!(
                            "{}: no userProjects field recognized; keys: {}",
                            display,
                            keys.join(", ")
                        ),
                    });
                }
                (keys, user_projects)
            }
            Err(_) => {
                diagnostics.push(ManagerDiagnostic {
                    code: codes::MANAGER_SETTINGS_READ_FAILED,
                    severity: FindingSeverity::Warning,
                    detail: format!("{}: settings file is not valid JSON", display),
                });
                (Vec::new(), Vec::new())
            }
        };
        return AlcomCapability {
            presence: ManagerPresence::Found,
            settings_path: Some(display),
            top_level_keys,
            user_projects,
            error_code: None,
        };
    }
    AlcomCapability {
        presence: ManagerPresence::NotFound,
        settings_path: None,
        top_level_keys: Vec::new(),
        user_projects: Vec::new(),
        error_code: None,
    }
}

// --- projects ---

/// Per-path accumulation across managers during project discovery.
#[derive(Default)]
struct AccumulatedProject {
    associations: Vec<ProjectAssociation>,
    unity_version: Option<String>,
    unity_classification: Option<EditorClass>,
}

/// Collects the union of VCC- and ALCOM-managed projects. A path registered
/// by both managers produces ONE finding carrying both associations — the
/// project is the same folder, and the read face must not duplicate it.
fn collect_projects(
    vcc: &VccCapability,
    alcom: &AlcomCapability,
    diagnostics: &mut Vec<ManagerDiagnostic>,
) -> Vec<ProjectFinding> {
    let mut by_path: std::collections::BTreeMap<String, AccumulatedProject> =
        std::collections::BTreeMap::new();

    match vcc.projects_source {
        Some("userProjects") => {
            for path in &vcc.user_projects {
                inspect_project(path, ProjectAssociation::VccRegistered, diagnostics, &mut by_path);
            }
        }
        Some("localProjectFolders") => {
            for folder in &vcc.local_project_folders {
                scan_project_folder(folder, diagnostics, &mut by_path);
            }
        }
        _ => {}
    }
    for path in &alcom.user_projects {
        inspect_project(path, ProjectAssociation::AlcomRegistered, diagnostics, &mut by_path);
    }

    by_path
        .into_iter()
        .map(|(path, accumulated)| ProjectFinding {
            path,
            associations: accumulated.associations,
            unity_version: accumulated.unity_version,
            unity_classification: accumulated.unity_classification,
        })
        .collect()
}

fn scan_project_folder(
    folder: &str,
    diagnostics: &mut Vec<ManagerDiagnostic>,
    by_path: &mut std::collections::BTreeMap<String, AccumulatedProject>,
) {
    let read_dir = match std::fs::read_dir(folder) {
        Ok(read_dir) => read_dir,
        Err(error) => {
            diagnostics.push(ManagerDiagnostic {
                code: codes::PROJECT_PATH_MISSING,
                severity: FindingSeverity::Warning,
                detail: format!("{}: {error}", folder),
            });
            return;
        }
    };
    for entry in read_dir.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        inspect_project(
            &path.to_string_lossy(),
            ProjectAssociation::VccRegistered,
            diagnostics,
            by_path,
        );
    }
}

fn inspect_project(
    path: &str,
    association: ProjectAssociation,
    diagnostics: &mut Vec<ManagerDiagnostic>,
    by_path: &mut std::collections::BTreeMap<String, AccumulatedProject>,
) {
    let dir = Path::new(path);
    let metadata = match std::fs::metadata(dir) {
        Ok(metadata) => metadata,
        Err(_) => {
            diagnostics.push(ManagerDiagnostic {
                code: codes::PROJECT_PATH_MISSING,
                severity: FindingSeverity::Warning,
                detail: format!("{}: registered project path does not exist", path),
            });
            return;
        }
    };
    if !metadata.is_dir() {
        diagnostics.push(ManagerDiagnostic {
            code: codes::PROJECT_MARKERS_INCOMPLETE,
            severity: FindingSeverity::Warning,
            detail: format!("{}: registered project path is not a directory", path),
        });
        return;
    }
    let Some(marker) = read_project_markers(dir) else {
        diagnostics.push(ManagerDiagnostic {
            code: codes::PROJECT_MARKERS_INCOMPLETE,
            severity: FindingSeverity::Warning,
            detail: format!("{}: missing vpm-manifest.json or a parseable ProjectVersion.txt", path),
        });
        return;
    };
    let entry = by_path.entry(path.to_owned()).or_default();
    if !entry.associations.contains(&association) {
        entry.associations.push(association);
        entry.associations.sort();
    }
    match marker {
        Ok((version, classification)) => {
            if entry.unity_version.is_none() {
                entry.unity_version = Some(version);
                entry.unity_classification = Some(classification);
            }
        }
        Err(raw) => {
            if entry.unity_version.is_none() {
                diagnostics.push(ManagerDiagnostic {
                    code: codes::PROJECT_VERSION_UNPARSEABLE,
                    severity: FindingSeverity::Warning,
                    detail: format!(
                        "{}: ProjectVersion.txt does not contain a complete version string: {}",
                        path, raw
                    ),
                });
            }
        }
    }
}

/// `Ok((version, class))` for a classified project, `Err(raw_version)`
/// when the version file exists but does not parse, `None` when the VPM
/// project markers are incomplete. The manifest is only checked for
/// presence; its contents belong to the VPM domain, not the environment.
fn read_project_markers(dir: &Path) -> Option<Result<(String, EditorClass), String>> {
    if !dir.join("Packages").join("vpm-manifest.json").is_file() {
        return None;
    }
    let version_file = dir.join("ProjectSettings").join("ProjectVersion.txt");
    if !version_file.is_file() {
        return None;
    }
    let text = std::fs::read_to_string(version_file).ok()?;
    let raw = text
        .lines()
        .find_map(|line| line.strip_prefix("m_EditorVersion:"))
        .map(str::trim)
        .unwrap_or_default();
    if raw.is_empty() {
        return Some(Err(raw.to_owned()));
    }
    let Some((classification, _)) = editor_targets::classify_version_string(raw) else {
        return Some(Err(raw.to_owned()));
    };
    Some(Ok((raw.to_owned(), classification)))
}
