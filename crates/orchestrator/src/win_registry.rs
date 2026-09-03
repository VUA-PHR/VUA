//! Read-only Windows registry string lookups behind an injectable seam.
//!
//! Environment checks observe well-known registry values (Steam install
//! path, the active OpenXR runtime, OS and GPU identity) the same way they
//! observe file roots: through a source that production points at the real
//! registry and tests point at synthetic entries, so no test depends on
//! this machine (ORC-TST-006). Lookups are string values only, read-only,
//! and a missing value is `None` — a normal finding, never an error.

use std::collections::HashMap;

/// The registry hives environment checks read from.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum RegistryHive {
    LocalMachine,
    CurrentUser,
}

/// Injectable registry view. `None` means "value absent", which the caller
/// treats as a deterministic missing finding.
pub trait RegistrySource: Send + Sync + std::fmt::Debug {
    fn get_string(&self, hive: RegistryHive, subkey: &str, value: &str) -> Option<String>;
}

/// Production source backed by the real Windows registry.
#[derive(Debug, Clone, Copy, Default)]
pub struct WindowsRegistrySource;

impl RegistrySource for WindowsRegistrySource {
    fn get_string(&self, hive: RegistryHive, subkey: &str, value: &str) -> Option<String> {
        windows_get_string(hive, subkey, value)
    }
}

/// Synthetic source for tests: exact `(hive, subkey, value)` entries.
#[derive(Debug, Clone, Default)]
pub struct FakeRegistrySource {
    entries: HashMap<(RegistryHive, String, String), String>,
}

impl FakeRegistrySource {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with(mut self, hive: RegistryHive, subkey: &str, value: &str, data: &str) -> Self {
        self.entries.insert(
            (hive, subkey.to_owned(), value.to_owned()),
            data.to_owned(),
        );
        self
    }
}

impl RegistrySource for FakeRegistrySource {
    fn get_string(&self, hive: RegistryHive, subkey: &str, value: &str) -> Option<String> {
        self.entries
            .get(&(hive, subkey.to_owned(), value.to_owned()))
            .cloned()
    }
}

#[cfg(windows)]
fn windows_get_string(hive: RegistryHive, subkey: &str, value: &str) -> Option<String> {
    use windows_sys::Win32::System::Registry::{
        RegGetValueW, HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, RRF_RT_REG_SZ,
    };

    const ERROR_SUCCESS: u32 = 0;
    const BUFFER_U16: usize = 16 * 1024;

    let hkey = match hive {
        RegistryHive::LocalMachine => HKEY_LOCAL_MACHINE,
        RegistryHive::CurrentUser => HKEY_CURRENT_USER,
    };
    let wide = |text: &str| -> Vec<u16> {
        use std::os::windows::ffi::OsStrExt as _;
        std::ffi::OsStr::new(text)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect()
    };
    let subkey_wide = wide(subkey);
    let value_wide = wide(value);
    let mut buffer = [0u16; BUFFER_U16];
    let mut byte_length = (buffer.len() * std::mem::size_of::<u16>()) as u32;
    let status = unsafe {
        RegGetValueW(
            hkey,
            subkey_wide.as_ptr(),
            value_wide.as_ptr(),
            RRF_RT_REG_SZ,
            std::ptr::null_mut(),
            buffer.as_mut_ptr().cast(),
            &mut byte_length,
        )
    };
    if status != ERROR_SUCCESS {
        return None;
    }
    let len = byte_length as usize / std::mem::size_of::<u16>();
    let len = len.min(BUFFER_U16);
    let mut end = len;
    while end > 0 && buffer[end - 1] == 0 {
        end -= 1;
    }
    Some(String::from_utf16_lossy(&buffer[..end]))
}

#[cfg(not(windows))]
fn windows_get_string(_hive: RegistryHive, _subkey: &str, _value: &str) -> Option<String> {
    None
}
