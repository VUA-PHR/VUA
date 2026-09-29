# VUA — VRC Ultra Assistant

[English](README.md) | [简体中文](README_ZH.md) | [日本語](README_JA.md) | 한국어

[![rust](https://github.com/VUA-Project/VUA/actions/workflows/rust.yml/badge.svg)](https://github.com/VUA-Project/VUA/actions/workflows/rust.yml)
[![ts](https://github.com/VUA-Project/VUA/actions/workflows/ts.yml/badge.svg)](https://github.com/VUA-Project/VUA/actions/workflows/ts.yml)
[![schema-vectors](https://github.com/VUA-Project/VUA/actions/workflows/schema-vectors.yml/badge.svg)](https://github.com/VUA-Project/VUA/actions/workflows/schema-vectors.yml)

**VUA(VRC Ultra Assistant)** 는 VRChat 플레이어를 위한 Windows 데스크톱 제작
환경입니다——특히 Unity를 다뤄 본 적이 없거나, 무엇이 필요한지 아직 모르는 플레이어를
위합니다. 목표와 보유한 에셋에서 출발하여, 환경 구축·프로젝트 준비·Avatar 조립·검사·
복구까지 VUA가 안내합니다.

## VUA로 할 수 있는 일

### [1] 게임 도우미

> **Materials checked and cleared.**

플레이에 필요한 소프트웨어와 설정을 준비하고 이동, 메뉴, 안전 설정, 기기 사용의 기초를 배웁니다. 사용 목적과 하드웨어에 맞춰 필요한 항목을 설명하고 환경 설치를 안내합니다.

### [2] Avatar 제작

> **Sugar, spice, and everything nice.**

보유한 소재를 조합하고 선택과 설정을 Recipe에 기록해 공유하며, 다른 사용자는 직접 구한 소재로 이를 재현합니다. 목표는 검사와 통제된 변경을 거쳐 Avatar를 자동 제작하고 결과물을 공식 SDK에 전달하는 것입니다. Recipe에는 참조와 설정만 담으며 유료 소재 자체는 포함하지 않습니다.

## 사용 흐름

목표와 보유한 소재에서 시작하여 계획, 실행 단계와 결과를 확인합니다. Build Record는 제작 단계, 검사 근거와 오류를 모아 수행한 작업과 조치가 필요한 부분을 보여 줍니다.

프로젝트 및 패키지 관리는 Unity 환경과 의존성, VPM 저장소, 패키지 설치·업데이트·제거를 준비합니다. 기존 ALCOM/VCC 프로젝트는 읽기 전용으로 검사하고, 편집은 사용자가 요청해 만든 VUA 관리 사본에서 진행합니다. 최종 로그인과 업로드는 사용자가 VRChat 공식 SDK에서 직접 수행합니다.

## 안전 경계

- VUA는 VRChat Inc.와 제휴하거나 공식 승인을 받은 제품이 아닌 독립적인 서드파티 도우미이며, 공개된 외부 인터페이스, OSC, 실행 옵션, 필요한 로컬 로그와 공개 설정만 사용하고 VRChat 클라이언트 주입·후킹·패치 또는 EAC 우회를 하지 않습니다.
- VUA는 비밀번호, 인증 토큰, Cookie, Session을 포함한 VRChat 로그인 인증 정보를 요청·읽기·저장·전송해서는 안 됩니다.
- 계정 변경은 사용자가 허용된 절차로 시작해야 하며, VUA가 클라우드에서 계정을 대신 조작하거나 Avatar를 자동으로 대신 업로드하지 않습니다.
- 기능에 필요한 최소 데이터만 기본적으로 로컬에 보관하고 불필요한 친구 활동 추적이나 프로파일링을 만들지 않으며, 유료 소재는 로컬에 두고 공유 Recipe에는 소재 자체를 넣지 않습니다.
- 공개적으로 지원되지 않는 클라이언트 동작, 숨겨진 설정 및 통제되지 않는 API 자동화는 기본 범위에서 제외되며, 기술 검사 통과는 외형·동작·실사용 안전성을 보장하지 않습니다.

[VRChat Creator Guidelines](https://hello.vrchat.com/creator-guidelines) · [Configuration File](https://docs.vrchat.com/docs/configuration-file)

## 개발 진행 상황

최신 공개 결과물은 여전히 v0.6.0이며 당시 공개 단계는 pre-alpha입니다. [N1–N7 개발 순서](docs/development-outline.md)에 따라 환경 설치, 지정된 두 도구, 복합 Avatar 제작, Recipe 재현, 소재 관리 점검과 재작업, 복구 및 스크린샷 가이드가 포함된 Beta 설치 프로그램을 개발합니다.

프로젝트는 앞으로도 오랫동안 Beta 상태를 유지할 것으로 예상합니다. 소개는 제품의 방향이며, 구현과 자동 테스트만으로 전체 실제 기기 흐름의 검증을 의미하지 않습니다. 실제 검증 상태는 개발 순서와 릴리스 근거를 확인해 주세요.

## 문서

- [문서 가이드](docs/README.md)——작업별 최소 경로
- [제품 경계](docs/product-boundary.md)
- [아키텍처](docs/architecture/system.md)
- [v0.6.0 릴리스 노트(중국어)](docs/release/v0.6.0.md)
- [기여 가이드](CONTRIBUTING.md) · [보안 정책](SECURITY.md)

## 라이선스

VUA는 [Apache-2.0](LICENSE)을 사용합니다. 첫 대응 예정 도구는 [VRCFaceTracking(Apache-2.0)](https://github.com/benaclejames/VRCFaceTracking/blob/master/LICENSE)과 [Space Calibrator의 MIT 본체](https://github.com/hyblocker/OpenVR-SpaceCalibrator/blob/develop/LICENSE)입니다. 공간 보정 수정판에서는 SimpleBLE와 베이스 스테이션 BLE 관리를 제거할 예정입니다. 저작권, 다른 의존성 라이선스와 배포 조건은 [서드파티 고지](THIRD_PARTY_NOTICES.md)를 확인하세요. 이는 수정 바이너리가 이미 배포되었다는 뜻이 아닙니다.

[NOTICE](NOTICE) · [Trademark guidance](TRADEMARKS.md)

Copyright 2026 Aran52.
