//! S-F7a VR Overlay Spike:最小 IVROverlay 存在性/点击验证。
//! 依据:G4 实测报告(接口与教训)+ integrations-and-overlays §Overlay 边界。
//! 只走 SteamVR 公开 IVROverlay:独立进程、用户显式启动、只显示自绘纹理、
//! 返回语义动作;不触碰 VRChat 进程、不挂钩渲染、不读内存。
//!
//! 用法:`vua-steamvr-overlay-spike [--duration 秒]`(默认 300)。
//! 退出码:0 = 全程无错误;2 = preflight/init 失败(分类打印)。

use std::time::{Duration, Instant};

const OVERLAY_KEY: &str = "vua.spike.overlay";
const OVERLAY_NAME: &str = "VUA Overlay Spike";
const TEXTURE_SIZE: usize = 512;

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
            let cell = ((x / 64) + (y / 64)) % 2 == 0;
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
    // 中心白十字(准星参照)
    let center = size / 2;
    for y in 0..size {
        for x in 0..size {
            if (x == center || y == center)
                && x.abs_diff(center) < 40
                && y.abs_diff(center) < 40
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

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let duration: u64 = args
        .iter()
        .position(|a| a == "--duration")
        .and_then(|index| args.get(index + 1))
        .and_then(|value| value.parse().ok())
        .unwrap_or(300);
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

    // ---- CreateOverlay + 自绘纹理 ----
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
    if let Err(error) =
        overlay.set_raw_data(handle, &texture, TEXTURE_SIZE, TEXTURE_SIZE, 4)
    {
        log("texture.failed", &format!("{:?}", error));
        std::process::exit(2);
    }
    log("texture.ok", "512x512 RGBA checkerboard");

    if let Err(error) = overlay.set_width(handle, 1.2) {
        log("width.failed", &format!("{:?}", error));
    }
    // texel aspect:让控制器激光可命中(点击 → 语义动作证明)
    if let Err(error) = overlay.set_texel_aspect(handle, 1.0) {
        log("texel_aspect.failed", &format!("{:?}", error));
    }
    if let Err(error) = overlay.set_visibility(handle, true) {
        log("show.failed", &format!("{:?}", error));
        std::process::exit(2);
    }
    log("show.ok", "overlay visible — 请在头显内寻找紫/橙棋盘面板");

    // ---- 事件轮询:点击 → 语义动作证明 ----
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
    while started.elapsed() < Duration::from_secs(duration) {
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
