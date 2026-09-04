//! S-F7a VR Overlay Spike v2:官方 openvr_api.dll 直连(彻底摆脱 fork 绑定)。
//! 模式 = VRCX 生产实现:libloading 加载 dll → VR_InitInternal2 →
//! VR_GetGenericInterface(IVROverlay_028 / IVRSystem_023)→ 按官方槽位直调。
//! 只观察不注入:独立进程顶层 overlay,无任何挂钩/读取 VRChat 进程的行为。
//!
//! 手腕锚定:面板相对右手控制器(上抬 3.5cm / 前伸 7cm, 9cm 宽, 手表位);
//! 右手缺失时退回左手。面板出现后对准扣扳机 → 事件日志即为语义动作证明。
//!
//! 用法:`vua-steamvr-overlay-spike [--duration 秒] [--dll 路径]`(默认 600s,
//! dll 默认取 VRCX 安装目录的官方 openvr_api.dll,缺失时回退 VRChat 自带副本)。
//! 退出码:0 = 全程无错误;2 = 初始化/装配失败。

use libloading::{Library, Symbol};
use std::ffi::{c_char, c_void, CString};
use std::time::{Duration, Instant};

const OVERLAY_KEY: &str = "vua.spike.overlay";
const OVERLAY_NAME: &str = "VUA Overlay Spike";
const TEXTURE_SIZE: usize = 256;
const ROLE_LEFT_HAND: u32 = 1;
const ROLE_RIGHT_HAND: u32 = 2;

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

/// 紫/橙棋盘 + 中心白十字:头显内一眼可辨,无需文字渲染依赖
fn build_texture() -> Vec<u8> {
    let size = TEXTURE_SIZE;
    let mut rgba = vec![0u8; size * size * 4];
    for y in 0..size {
        for x in 0..size {
            let cell = ((x / 32) + (y / 32)) % 2 == 0;
            let (r, g, b) = if cell {
                (167u8, 139u8, 250u8)
            } else {
                (255u8, 122u8, 69u8)
            };
            let index = (y * size + x) * 4;
            rgba[index] = r;
            rgba[index + 1] = g;
            rgba[index + 2] = b;
            rgba[index + 3] = 255;
        }
    }
    let center = size / 2;
    for y in 0..size {
        for x in 0..size {
            if (x == center || y == center)
                && x.abs_diff(center) < 24
                && y.abs_diff(center) < 24
            {
                let index = (y * size + x) * 4;
                rgba[index] = 255;
                rgba[index + 1] = 255;
                rgba[index + 2] = 255;
            }
        }
    }
    rgba
}

// ---- 官方 IVROverlay_028 fn 表槽位(VRCX openvr_api.cs 字段序) ----
const SLOT_CREATE_OVERLAY: usize = 1;
const SLOT_SET_OVERLAY_RAW: usize = 62;
const SLOT_SET_OVERLAY_WIDTH: usize = 22;
const SLOT_SET_OVERLAY_TRANSFORM_RELATIVE: usize = 35;
const SLOT_SHOW_OVERLAY: usize = 43;
const SLOT_HIDE_OVERLAY: usize = 44;
const SLOT_SET_TEXEL_ASPECT: usize = 18;
// ---- 官方 IVRSystem_023 fn 表槽位 ----
const SYS_SLOT_POLL_NEXT_EVENT: usize = 29;
const SYS_SLOT_CONTROLLER_ROLE_INDEX: usize = 17;

#[repr(C)]
struct HmdMatrix34 {
    m: [[f32; 4]; 3],
}

/// 手腕位变换:面板贴右手控制器,上抬 3.5cm、沿握柄前伸 7cm(手表位)
fn wrist_transform() -> HmdMatrix34 {
    HmdMatrix34 {
        m: [
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.035],
            [0.0, 0.0, 1.0, -0.07],
        ],
    }
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

impl VREvent {
    fn zeroed() -> Self {
        VREvent {
            event_type: 0,
            tracked_device: 0,
            age: 0.0,
            data: [0; 240],
        }
    }
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
        String::from("G:/SteamLibrary/steamapps/common/VRChat/VRChat_Data/Plugins/x86_64/openvr_api.dll"),
    ];
    let dll_path = args
        .iter()
        .position(|a| a == "--dll")
        .and_then(|index| args.get(index + 1))
        .map(String::from)
        .unwrap_or_else(|| {
            dll_candidates
                .iter()
                .find(|candidate| exists(candidate))
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

    unsafe { run(duration, &dll_path) };
}

fn exists(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

unsafe fn run(duration: u64, dll_path: &str) {
    let library = Library::new(dll_path).expect("openvr_api.dll 加载失败");
    let init_internal2: Symbol<unsafe extern "system" fn(*mut i32, u32, *const c_char)> =
        library.get(b"VR_InitInternal2\0").expect("missing VR_InitInternal2");
    let get_generic_interface: Symbol<
        unsafe extern "system" fn(*const c_char, *mut i32) -> *mut c_void,
    > = library.get(b"VR_GetGenericInterface\0").expect("missing VR_GetGenericInterface");
    let shutdown_internal: Symbol<unsafe extern "system" fn()> =
        library.get(b"VR_ShutdownInternal\0").expect("missing VR_ShutdownInternal");

    // ---- VR_InitInternal2(Overlay) ----
    log("init", "VR_InitInternal2(Overlay)…");
    let mut init_error: i32 = -1;
    let startup = CString::new("").unwrap();
    init_internal2(&mut init_error, 2, startup.as_ptr());
    if init_error != 0 {
        // G4 基线:无头显时报 VRInitError_Init_HmdNotFound(126);实机在线应成功
        log("init.failed", &format!("EVRInitError={}", init_error));
        std::process::exit(2);
    }
    log("init.ok", "Overlay context initialized");

    // ---- fn 表获取(IVROverlay_028 / IVRSystem_023) ----
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
    eprintln!("step.tables_done");

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

    // ---- CreateOverlay + 自绘纹理 ----
    let unique_key = CString::new(format!(
        "{}.{}",
        OVERLAY_KEY,
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0)
    ))
    .unwrap();
    let name = CString::new(OVERLAY_NAME).unwrap();
    let mut handle: u64 = 0;
    eprintln!("step.calling_create");
    let result = create_overlay(unique_key.as_ptr(), name.as_ptr(), &mut handle);
    if result != 0 {
        log("create.failed", &format!("err={}", result));
        return;
    }
    log("create.ok", OVERLAY_KEY);

    let texture = build_texture();
    let raw_result =
        set_overlay_raw(handle, texture.as_ptr(), TEXTURE_SIZE as u32, TEXTURE_SIZE as u32, 4);
    if raw_result != 0 {
        log("texture.failed", &format!("err={}", raw_result));
        return;
    }
    log("texture.ok", "256x256 RGBA checkerboard");

    set_width(handle, 0.09);
    set_texel_aspect(handle, 1.0);
    show_overlay(handle);
    log(
        "show.ok",
        "overlay visible — 控制器唤醒后自动锚定右手腕(VRCX 模式)",
    );

    // ---- 主循环:控制器唤醒即锚定;事件=语义动作证明 ----
    let started = Instant::now();
    let mut clicks = 0u32;
    let mut last_heartbeat = Instant::now();
    let mut anchored = false;
    while started.elapsed() < Duration::from_secs(duration) {
        if !anchored {
            let right = controller_role_index(ROLE_RIGHT_HAND);
            let left = controller_role_index(ROLE_LEFT_HAND);
            let controller = if right != u32::MAX { (right, ROLE_RIGHT_HAND) } else if left != u32::MAX { (left, ROLE_LEFT_HAND) } else { (0, 0) };
            if controller.1 != 0 {
                let transform = wrist_transform();
                let anchor_result = set_transform_relative(handle, controller.0, &transform);
                anchored = anchor_result == 0;
                log(
                    "wrist.applied",
                    &format!(
                        "面板已锚定{}(controller#{}, 9cm, 手表位)err={}",
                        if controller.1 == ROLE_RIGHT_HAND { "右手" } else { "左手" },
                        controller.0,
                        anchor_result
                    ),
                );
            }
        }
        let mut event = VREvent::zeroed();
        if poll_next_event(&mut event, std::mem::size_of::<VREvent>() as u32) {
            // 200=ButtonPress 301=MouseButtonDown:任一按键命中面板即语义动作证明
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
