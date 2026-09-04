@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
set CMAKE_GENERATOR=Ninja
cd /d "C:\Users\AR\Documents\VUA-frontend\spikes\steamvr-overlay"
cargo build --release
