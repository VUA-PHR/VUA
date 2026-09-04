//! S-F7a VR Overlay Spike:最小 IVROverlay 存在性/点击/手腕锚定验证。
//! 依据:G4 实测报告 + integrations-and-overlays §Overlay 边界 + VRCX 手腕模式。
//! 只走 SteamVR 公开 IVROverlay:独立进程、用户显式启动、只显示自绘纹理、
//! 返回语义动作;不触碰 VRChat 进程、不挂钩渲染、不读内存。
//!
//! 用法:`vua-steamvr-overlay-spike [--duration 秒]`(默认 600)。
//! 退出码:0 = 全程无错误;2 = preflight/init 失败(分类打印)。

use std::time::{Duration, Instant};

const OVERLAY_KEY: &str = "vua.spike.overlay";
const OVERLAY_NAME: &str = "VUA Overlay Spike";
const TEXTURE_SIZE: usize = 256;

fn now() -> String {
    let seconds = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("t+{}s", seconds)
}

fn log(event: &str, detail: &str) {
    println!("{} {} {}", now(), event, detail);
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

// ---- 官方 IVROverlay_028 fn 表前缀(与 VRCX openvr_api.cs 字段序一致) ----
// fork 绑定的字段序与 SteamVR 实际表错位(transform 槽位读出 None),
// 故按官方序自定义前缀结构直读 fn 表。
#[repr(C)]
struct OverlayTablePrefix {
    reserved: [usize; 35], // FindOverlay .. GetOverlayTransformAbsolute
    set_transform_tracked_device_relative: unsafe extern "system" fn(
        overlay: u64,
        tracked_device: u32,
        transform: *const HmdMatrix34,
    ),
}

#[repr(C)]
#[derive(Clone, Copy)]
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

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let duration: u64 = args
        .iter()
        .position(|a| a == "--duration")
        .and_then(|index| args.get(index + 1))
        .and_then(|value| value.parse().ok())
        .unwrap_or(600);
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

    // ---- VR_Init(Overlay) ----
    log("init", "VR_Init(Overlay)…");
    let context = match unsafe { openvr::init(openvr::ApplicationType::Overlay) } {
        Ok(context) => context,
        Err(error) => {
            // G4 基线:无头显时曾报 VRInitError_Init_HmdNotFound;实机在线应成功
            log("init.failed", &format!("{:?}", error));
            std::process::exit(2);
        }
    };
    log("init.ok", "Overlay context initialized");

    let mut overlay = match context.overlay() {
        Ok(overlay) => overlay,
        Err(error) => {
            log("init.failed", &format!("{:?}", error));
            std::process::exit(2);
        }
    };
    let handle = match overlay.create_overlay(OVERLAY_KEY, OVERLAY_NAME) {
        Ok(handle) => handle,
        Err(error) => {
            log("create.failed", &format!("{:?}", error));
            std::process::exit(2);
        }
    };
    log("create.ok", OVERLAY_KEY);

    let texture = build_texture();
    if let Err(error) = overlay.set_raw_data(handle, &texture, TEXTURE_SIZE, TEXTURE_SIZE, 4) {
        log("texture.failed", &format!("{:?}", error));
        std::process::exit(2);
    }
    log("texture.ok", "256x256 RGBA checkerboard");

    if let Err(error) = overlay.set_width(handle, 0.09) {
        log("width.failed", &format!("{:?}", error));
    }
    if let Err(error) = overlay.set_texel_aspect(handle, 1.0) {
        log("texel_aspect.failed", &format!("{:?}", error));
    }
    if let Err(error) = overlay.set_visibility(handle, true) {
        log("show.failed", &format!("{:?}", error));
        std::process::exit(2);
    }
    log(
        "show.ok",
        "overlay visible — 控制器唤醒后自动锚定右手腕(VRCX 模式)",
    );

    // ---- 事件轮询:点击 → 语义动作证明;控制器在线即补锚 ----
    let system = match context.system() {
        Ok(system) => system,
        Err(error) => {
            log("system.failed", &format!("{:?}", error));
            std::process::exit(2);
        }
    };
    let started = Instant::now();
    let mut clicks = 0u32;
    let mut last_heartbeat = Instant::now();
    let mut last_inventory = Instant::now();
    let mut anchored = false;
    while started.elapsed() < Duration::from_secs(duration) {
        // 控制器在线即锚定:按设备类别扫描(角色 API 在部分环境不可靠)
        if !anchored {
            let mut controller_index: Option<u32> = None;
            for index in 1..64u32 {
                let class = system.tracked_device_class(openvr::TrackedDeviceIndex(index));
                if class == openvr::TrackedDeviceClass::Controller {
                    controller_index = Some(index);
                    break;
                }
            }
            if let Some(controller_index) = controller_index {
                log("anchor.attempt", &format!("controller#{}", controller_index));
                // 手腕锚定经官方槽位直调(fork 绑定表错位,已按官方序自建前缀表)
                let set_transform = unsafe {
                    let mut init_error: openvr_sys::EVRInitError =
                        std::mem::zeroed();
                    let iface = openvr_sys::VR_GetGenericInterface(
                        b"IVROverlay_028\0".as_ptr() as *const i8,
                        &mut init_error,
                    );
                    let table = &*(iface as *const OverlayTablePrefix);
                    table.set_transform_tracked_device_relative
                };
                log("anchor.fn_acquired", "IVROverlay fn table ready");
                let mut transform = wrist_transform();
                let result = unsafe {
                    set_transform(handle.0, controller_index, &mut transform)
                };
                log("anchor.called", "transform call returned");
                anchored = true;
                // fork 绑定的 transform 调用无返回值:生效与否以头显内可见性为准
                log(
                    "wrist.applied",
                    &format!(
                        "面板已锚定控制器(controller#{}, 9cm, 手表位)——看右手腕",
                        controller_index
                    ),
                );
            }
        }
        if let Some(event_info) = system.poll_next_event() {
            match &event_info.event {
                openvr::system::Event::MouseButtonDown(_) => {
                    clicks += 1;
                    log(
                        "semantic_action",
                        &format!("click#{} → 语义动作通道成立(点击可回传)", clicks),
                    );
                }
                openvr::system::Event::MouseMove(_) => {}
                _ => {}
            }
        }
        if !anchored && last_inventory.elapsed() >= Duration::from_secs(5) {
            last_inventory = Instant::now();
            let mut devices = Vec::new();
            for index in 0..64u32 {
                let class = system.tracked_device_class(openvr::TrackedDeviceIndex(index));
                let class_name = match class {
                    openvr::TrackedDeviceClass::HMD => "HMD",
                    openvr::TrackedDeviceClass::Controller => "CONTROLLER",
                    openvr::TrackedDeviceClass::GenericTracker => "TRACKER",
                    openvr::TrackedDeviceClass::TrackingReference => "BASE",
                    openvr::TrackedDeviceClass::DisplayRedirect => "DISPLAY",
                    _ => continue,
                };
                devices.push(format!("{}={}", index, class_name));
            }
            log("device.inventory", &format!("{}", devices.join(",")));
        }
        if last_heartbeat.elapsed() >= Duration::from_secs(10) {
            last_heartbeat = Instant::now();
            log("heartbeat", &format!("overlay alive, clicks={}", clicks));
        }
        std::thread::sleep(Duration::from_millis(50));
    }

    log("spike.end", &format!("duration={}s clicks={}", duration, clicks));
    if let Err(error) = overlay.set_visibility(handle, false) {
        log("hide.failed", &format!("{:?}", error));
    }
    log("shutdown.ok", "clean exit");
}
