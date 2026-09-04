//! S-F7a VR Overlay Spike v3:视线正前方 1.5 米红色大方块(HMD 相对锚定)。
//! 依据:G4 实测报告 + integrations-and-overlays §Overlay 边界。
//! 只走 SteamVR 公开 IVROverlay:独立进程、用户显式启动、自绘纹理、
//! 语义动作回传;不触碰 VRChat 进程、不挂钩渲染、不读内存。
//!
//! 用法:`vua-steamvr-overlay-spike.exe [--duration 秒]`(默认 600)。
//! 退出码:0 = 全程无错误;2 = 初始化失败。

use libloading::{Library, Symbol};
use std::ffi::{c_char, c_void, CString};
use std::time::{Duration, Instant};

const OVERLAY_KEY: &str = "vua.spike.overlay";
const OVERLAY_NAME: &str = "VUA Overlay Spike";
const TEXTURE_SIZE: usize = 512;
const ROLE_LEFT_HAND: u32 = 1;
const ROLE_RIGHT_HAND: u32 = 2;

// ---- 官方 IVROverlay_028 fn 表槽位(VRCX openvr_api.cs 字段序,0 起) ----
const SLOT_CREATE_OVERLAY: usize = 1;
const SLOT_SET_OVERLAY_RAW: usize = 62;
const SLOT_SET_OVERLAY_WIDTH: usize = 22;
const SLOT_SET_OVERLAY_TRANSFORM_RELATIVE: usize = 35;
const SLOT_SET_TEXEL_ASPECT: usize = 18;
const SLOT_SHOW_OVERLAY: usize = 43;
const SLOT_HIDE_OVERLAY: usize = 44;
// ---- 官方 IVRSystem_023 fn 表槽位 ----
const SYS_SLOT_POLL_NEXT_EVENT: usize = 29;
const SYS_SLOT_CONTROLLER_ROLE_INDEX: usize = 17;

#[repr(C)]
struct HmdMatrix34 {
    m: [[f32; 4]; 3],
}

/// 视线正前方变换:恒定悬于头显前方 1 米,转头即跟随,不可错过
fn front_transform() -> HmdMatrix34 {
    HmdMatrix34 {
        m: [
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, -1.0],
        ],
    }
}

/// 纯红大方块 + 中心白块:最大对比度,一眼可见
fn build_texture() -> Vec<u8> {
    let size = TEXTURE_SIZE;
    let mut rgba = vec![0u8; size * size * 4];
    for y in 0..size {
        for x in 0..size {
            let index = (y * size + x) * 4;
            rgba[index] = 255;
            rgba[index + 1] = 0;
            rgba[index + 2] = 0;
            rgba[index + 3] = 255;
        }
    }
    let center = size / 2;
    let half = 60;
    for y in center - half..center + half {
        for x in center - half..center + half {
            let index = (y * size + x) * 4;
            rgba[index] = 255;
            rgba[index + 1] = 255;
            rgba[index + 2] = 255;
        }
    }
    rgba
}

/// VREvent_t:仅前 12 字节被消费(eventType / trackedDeviceIndex / age),
/// data 联合体以 240 字节占位(总大小覆盖官方 184 字节布局)
#[repr(C)]
struct VREvent {
    event_type: u32,
    tracked_device: u32,
    age: f32,
    data: [u8; 240],
}

fn now() -> String {
    let seconds = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("t+{}s", seconds)
}

fn log(event: &str, detail: &str) {
    // stderr 无缓冲:进程崩溃/退出前日志必已落盘
    eprintln!("{} {} {}", now(), event, detail);
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let duration: u64 = args
        .iter()
        .position(|a| a == "--duration")
        .and_then(|index| args.get(index + 1))
        .and_then(|value| value.parse().ok())
        .unwrap_or(600);

    // dll 解析顺序:CLI 覆盖 → VRCX 官方(生产已验证)→ VRChat 自带副本
    let dll_candidates = [
        String::from("C:/Program Files/VRCX/openvr_api.dll"),
        String::from(
            "G:/SteamLibrary/steamapps/common/VRChat/VRChat_Data/Plugins/x86_64/openvr_api.dll",
        ),
    ];
    let dll_path = args
        .iter()
        .position(|a| a == "--dll")
        .and_then(|index| args.get(index + 1))
        .map(String::from)
        .unwrap_or_else(|| {
            dll_candidates
                .iter()
                .find(|candidate| std::path::Path::new(candidate).exists())
                .cloned()
                .expect("openvr_api.dll not found: VRCX 或 VRChat 安装目录缺失")
        });
    log("dll.selected", &dll_path);
    log("spike.start", &format!("duration={}s", duration));

    // ---- preflight:SteamVR 运行时在场(G4 preflight 语义) ----
    let runtime_present = std::process::Command::new("tasklist")
        .args(["/FI", "IMAGENAME eq vrserver.exe", "/FO", "CSV"])
        .output()
        .map(|output| String::from_utf8_lossy(&output.stdout).contains("vrserver.exe"))
        .unwrap_or(false);
    log(
        "preflight",
        &format!(
            "SteamVR runtime {}",
            if runtime_present {
                "present"
            } else {
                "NOT detected (continuing per OpenVR semantics)"
            }
        ),
    );

    // ---- 加载官方 openvr_api.dll 并初始化 ----
    let library = match unsafe { Library::new(dll_path) } {
        Ok(library) => library,
        Err(error) => {
            log("library.failed", &format!("{:?}", error));
            std::process::exit(2);
        }
    };
    unsafe {
        let init_internal2: Symbol<
            unsafe extern "system" fn(*mut i32, u32, *const c_char),
        > = library.get(b"VR_InitInternal2\0").expect("missing VR_InitInternal2");
        let get_generic_interface: Symbol<
            unsafe extern "system" fn(*const c_char, *mut i32) -> *mut c_void,
        > = library.get(b"VR_GetGenericInterface\0").expect("missing VR_GetGenericInterface");
        let shutdown_internal: Symbol<unsafe extern "system" fn()> =
            library.get(b"VR_ShutdownInternal\0").expect("missing VR_ShutdownInternal");

        let mut init_error: i32 = -1;
        let startup = CString::new("").unwrap();
        init_internal2(&mut init_error, 2, startup.as_ptr());
        if init_error != 0 {
            // G4 基线:无头显时报 VRInitError_Init_HmdNotFound(126);实机在线应成功
            log("init.failed", &format!("EVRInitError={}", init_error));
            std::process::exit(2);
        }
        log("init.ok", "Overlay context initialized");

        // ---- fn 表获取(FnTable: 前缀 = 函数指针表;裸版本串返回 C++ 对象) ----
        let overlay_version = CString::new("FnTable:IVROverlay_028").unwrap();
        let system_version = CString::new("FnTable:IVRSystem_023").unwrap();
        let mut table_error: i32 = -1;
        let overlay_table_raw =
            get_generic_interface(overlay_version.as_ptr(), &mut table_error);
        if overlay_table_raw.is_null() {
            log("table.failed", "IVROverlay_028 fn table unavailable");
            std::process::exit(2);
        }
        let overlay_slots = &*(overlay_table_raw as *const [usize; 82]);
        let system_table_raw = get_generic_interface(system_version.as_ptr(), &mut table_error);
        if system_table_raw.is_null() {
            log("system.table.failed", "IVRSystem_023 fn table unavailable");
            std::process::exit(2);
        }
        let system_slots = &*(system_table_raw as *const [usize; 92]);
        log("tables.ok", "IVROverlay_028 + IVRSystem_023");

        // ---- 槽位函数绑定(官方序;签名对照 Valve openvr.h / VRCX 委托) ----
        let create_overlay: unsafe extern "system" fn(*const c_char, *const c_char, *mut u64) -> i32 =
            std::mem::transmute(overlay_slots[SLOT_CREATE_OVERLAY]);
        let set_overlay_raw: unsafe extern "system" fn(u64, *const u8, u32, u32, u32) -> i32 =
            std::mem::transmute(overlay_slots[SLOT_SET_OVERLAY_RAW]);
        let set_width: unsafe extern "system" fn(u64, f32) -> i32 =
            std::mem::transmute(overlay_slots[SLOT_SET_OVERLAY_WIDTH]);
        let set_texel_aspect: unsafe extern "system" fn(u64, f32) -> i32 =
            std::mem::transmute(overlay_slots[SLOT_SET_TEXEL_ASPECT]);
        let set_transform_relative: unsafe extern "system" fn(u64, u32, *const HmdMatrix34) -> i32 =
            std::mem::transmute(overlay_slots[SLOT_SET_OVERLAY_TRANSFORM_RELATIVE]);
        let show_overlay: unsafe extern "system" fn(u64) -> i32 =
            std::mem::transmute(overlay_slots[SLOT_SHOW_OVERLAY]);
        let hide_overlay: unsafe extern "system" fn(u64) -> i32 =
            std::mem::transmute(overlay_slots[SLOT_HIDE_OVERLAY]);
        let controller_role_index: unsafe extern "system" fn(u32) -> u32 =
            std::mem::transmute(system_slots[SYS_SLOT_CONTROLLER_ROLE_INDEX]);
        let poll_next_event: unsafe extern "system" fn(*mut VREvent, u32) -> bool =
            std::mem::transmute(system_slots[SYS_SLOT_POLL_NEXT_EVENT]);

        // ---- CreateOverlay + 红色纹理 ----
        let right_role = controller_role_index(ROLE_RIGHT_HAND);
        let left_role = controller_role_index(ROLE_LEFT_HAND);
        log(
            "controllers.probe",
            &format!(
                "right={} left={} (FFFFFFFF=未追踪)",
                right_role, left_role
            ),
        );

        let key = CString::new(OVERLAY_KEY).unwrap();
        let name = CString::new(OVERLAY_NAME).unwrap();
        let mut handle: u64 = 0;
        let result = create_overlay(key.as_ptr(), name.as_ptr(), &mut handle);
        if result != 0 {
            log("create.failed", &format!("err={}", result));
            std::process::exit(2);
        }
        log("create.ok", OVERLAY_KEY);

        let texture = build_texture();
        let raw_result =
            set_overlay_raw(handle, texture.as_ptr(), TEXTURE_SIZE as u32, TEXTURE_SIZE as u32, 4);
        if raw_result != 0 {
            log("texture.failed", &format!("err={}", raw_result));
            return;
        }
        log("texture.ok", "512x512 pure red");

        // 视线正前方 1 米(HMD 相对锚定),1.5 米宽——转头即跟随,不可错过
        let transform = front_transform();
        let transform_result = set_transform_relative(handle, 0, &transform);
        log(
            "anchor.applied",
            &format!("HMD 相对锚定 err={}", transform_result),
        );
        set_width(handle, 1.5);
        show_overlay(handle);
        log("show.ok", "红色面板已悬于你视线正前方——看正前方");

        // ---- 主循环:事件=语义动作证明 ----
        let started = Instant::now();
        let mut clicks = 0u32;
        let mut last_heartbeat = Instant::now();
        while started.elapsed() < Duration::from_secs(duration) {
            let mut event = VREvent {
                event_type: 0,
                tracked_device: 0,
                age: 0.0,
                data: [0; 240],
            };
            if poll_next_event(&mut event, std::mem::size_of::<VREvent>() as u32) {
                // 200=ButtonPress(控制器扳机) 301=MouseButtonDown(激光点击)
                if event.event_type == 200 || event.event_type == 301 {
                    clicks += 1;
                    log(
                        "semantic_action",
                        &format!(
                            "click#{} → 语义动作通道成立(事件类型 {})",
                            clicks, event.event_type
                        ),
                    );
                }
            }
            if last_heartbeat.elapsed() >= Duration::from_secs(10) {
                last_heartbeat = Instant::now();
                log("heartbeat", &format!("overlay alive, clicks={}", clicks));
            }
            std::thread::sleep(Duration::from_millis(50));
        }

        hide_overlay(handle);
        log("spike.end", &format!("duration={}s clicks={}", duration, clicks));
        shutdown_internal();
        log("shutdown.ok", "clean exit");
    }
}
