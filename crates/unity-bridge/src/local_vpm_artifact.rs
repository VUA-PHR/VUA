//! Deterministic publication of a generated local VPM directory and zip.

use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use zip::write::SimpleFileOptions;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PublishedLocalVpmArtifact {
    pub package_root: PathBuf,
    pub archive_path: PathBuf,
    pub manifest_sha256: String,
    pub tree_sha256: String,
    pub archive_sha256: String,
}

pub fn publish_local_vpm_artifact(
    staging_package_root: &Path,
    output_root: &Path,
    package_id: &str,
    version: &str,
) -> io::Result<PublishedLocalVpmArtifact> {
    validate_segment(package_id)?;
    validate_segment(version)?;
    if !staging_package_root.join("package.json").is_file() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "package.json is missing",
        ));
    }
    fs::create_dir_all(output_root)?;
    let package_root = output_root.join(package_id).join(version);
    let archive_path = output_root.join(format!("{package_id}-{version}.zip"));
    if package_root.exists() || archive_path.exists() {
        return Err(io::Error::new(
            io::ErrorKind::AlreadyExists,
            "artifact already exists",
        ));
    }
    let temporary_root = output_root.join(format!(".{package_id}-{version}.work"));
    let temporary_zip = output_root.join(format!(".{package_id}-{version}.zip.tmp"));
    if temporary_root.exists() || temporary_zip.exists() {
        return Err(io::Error::new(
            io::ErrorKind::AlreadyExists,
            "incomplete artifact needs recovery",
        ));
    }
    let result = (|| {
        copy_tree(staging_package_root, &temporary_root)?;
        let files = sorted_files(&temporary_root)?;
        let tree_sha256 = tree_digest(&temporary_root, &files)?;
        write_zip(&temporary_root, &files, &temporary_zip)?;
        let manifest_sha256 = file_digest(&temporary_root.join("package.json"))?;
        let archive_sha256 = file_digest(&temporary_zip)?;
        if let Some(parent) = package_root.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::rename(&temporary_zip, &archive_path)?;
        if let Err(error) = fs::rename(&temporary_root, &package_root) {
            let _ = fs::remove_file(&archive_path);
            return Err(error);
        }
        Ok(PublishedLocalVpmArtifact {
            package_root,
            archive_path,
            manifest_sha256,
            tree_sha256,
            archive_sha256,
        })
    })();
    if result.is_err() {
        // Retain a completed temporary directory for explicit recovery, but a
        // partial zip is never presented as a package artifact.
        let _ = fs::remove_file(&temporary_zip);
    }
    result
}

fn validate_segment(value: &str) -> io::Result<()> {
    if value.is_empty()
        || value.len() > 128
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'-' | b'_'))
    {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "invalid artifact identity",
        ));
    }
    Ok(())
}

fn copy_tree(source: &Path, destination: &Path) -> io::Result<()> {
    fs::create_dir(destination)?;
    let mut entries = fs::read_dir(source)?.collect::<Result<Vec<_>, _>>()?;
    entries.sort_by_key(|entry| entry.file_name());
    for entry in entries {
        let kind = entry.file_type()?;
        if kind.is_symlink() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "package contains a symlink",
            ));
        }
        let target = destination.join(entry.file_name());
        if kind.is_dir() {
            copy_tree(&entry.path(), &target)?;
        } else if kind.is_file() {
            fs::copy(entry.path(), target)?;
        }
    }
    Ok(())
}

fn sorted_files(root: &Path) -> io::Result<Vec<PathBuf>> {
    fn walk(root: &Path, current: &Path, output: &mut Vec<PathBuf>) -> io::Result<()> {
        let mut entries = fs::read_dir(current)?.collect::<Result<Vec<_>, _>>()?;
        entries.sort_by_key(|entry| entry.file_name());
        for entry in entries {
            let kind = entry.file_type()?;
            if kind.is_symlink() {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidData,
                    "package contains a symlink",
                ));
            }
            if kind.is_dir() {
                walk(root, &entry.path(), output)?;
            } else if kind.is_file() {
                output.push(entry.path().strip_prefix(root).unwrap().to_owned());
            }
        }
        Ok(())
    }
    let mut files = Vec::new();
    walk(root, root, &mut files)?;
    files.sort_by_key(|path| path.to_string_lossy().replace('\\', "/"));
    Ok(files)
}

fn tree_digest(root: &Path, files: &[PathBuf]) -> io::Result<String> {
    let mut digest = Sha256::new();
    digest.update(b"vua-vpm-tree-v1\0");
    for relative in files {
        let name = relative.to_string_lossy().replace('\\', "/");
        digest.update((name.len() as u64).to_le_bytes());
        digest.update(name.as_bytes());
        digest.update(file_bytes(root.join(relative))?);
    }
    Ok(digest_text(digest.finalize().as_ref()))
}

fn write_zip(root: &Path, files: &[PathBuf], destination: &Path) -> io::Result<()> {
    let output = File::create(destination)?;
    let mut zip = zip::ZipWriter::new(output);
    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);
    for relative in files {
        let name = relative.to_string_lossy().replace('\\', "/");
        zip.start_file(name, options).map_err(zip_io)?;
        zip.write_all(&file_bytes(root.join(relative))?)?;
    }
    zip.finish().map_err(zip_io)?.sync_all()
}

fn file_bytes(path: impl AsRef<Path>) -> io::Result<Vec<u8>> {
    let mut file = File::open(path)?;
    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes)?;
    Ok(bytes)
}

fn file_digest(path: &Path) -> io::Result<String> {
    Ok(digest_text(Sha256::digest(file_bytes(path)?).as_ref()))
}

fn digest_text(bytes: &[u8]) -> String {
    let mut output = String::from("sha256:");
    for byte in bytes {
        use std::fmt::Write as _;
        write!(&mut output, "{byte:02x}").expect("writing to String");
    }
    output
}

fn zip_io(error: zip::result::ZipError) -> io::Error {
    io::Error::other(error)
}
