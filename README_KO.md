# VUA — VRC Ultra Assistant

[English](README.md) | [简体中文](README_ZH.md) | [日本語](README_JA.md) | 한국어

[![rust](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml)
[![ts](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml)
[![schema-vectors](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml)

> 「Packed up and ready!(출격 준비 완료!)」——『Command & Conquer: Red Alert』의 MCV

**VUA(VRC Ultra Assistant)** 는 VRChat 플레이어를 위한 Windows 데스크톱 제작
환경입니다——특히 Unity를 다뤄 본 적이 없거나, 무엇이 필요한지 아직 모르는 플레이어를
위합니다. 목표와 보유한 에셋에서 출발하여, 환경 구축·프로젝트 준비·Avatar 조립·검사·
복구까지 VUA가 안내합니다.

> [!IMPORTANT]
> **현재 상태: v0.6.0(pre-alpha).** 이 리포지토리는 개발자 프리뷰를 제공합니다.
> 아래 기능들은 리포지토리에 구현되어 있고 자동화 테스트로 검증되지만, 실제 기기에서의
> 엔드투엔드 검증은 아직 완료되지 않았으며 일부 기능은 UI에서 아직 사용할 수 없습니다.
> 모든 흐름을 초기 평가판으로 다뤄 주세요. 일반 플레이어를 위한 안정성 약속은
> `1.0.0`부터 시작됩니다.

## VUA로 할 수 있는 것

- **환경 구축.** VUA가 하드웨어·소프트웨어·네트워크를 확인하고 목표에 맞는 설치 계획을
  만듭니다. 헤드셋이 실제로 필요로 하는 VR 런타임과 드라이버, Unity `2022.3.22f1`,
  VRChat SDK, 그리고 선택한 트래킹 도구. 계정 등록과 인증은 항상 공식 페이지에서
  진행됩니다——VUA는 안내할 뿐, 대신 인증하지 않습니다.
- **게임 배우기.** 5개 페이지의 인앱 튜토리얼이 설정 기초, 이동과 메뉴, 조정해 두면 좋은
  안전 설정(`Personal Space`, `Allow Untrusted URLs`, Avatar 표시 제한), 그리고 사용 중인
  디바이스를 다룹니다. SteamVR 오버레이 튜토리얼은 `1.0.0` 이후의 목표입니다.
- **Avatar 제작.** Warehouse에서 에셋을 고르거나 보유한 에셋을 가져와 Recipe로 조합하면,
  VUA가 결정론적이고 버전 관리되는 Bridge를 통해 Unity 안에서 조립을 실행합니다——가져오기
  순서, 바인딩, 메뉴, 파라미터. 모든 단계에 스냅샷과 복구 경로가 있습니다.
- **검사와 기록 보관.** 모든 제작 실행은 Build Record를 남기고, 검사 증거와 로그를
  담습니다. 문제는 알림 센터와 실행 기록 양쪽에 표시됩니다. 알림을 닫아도 문제는
  사라지지 않습니다.
- **프로젝트와 패키지 관리.** 내장 패키지 매니저(`vrc-get` 기반)가 VPM 리포지토리 구독,
  패키지 설치/업그레이드/제거, 로컬 패키지, 프로젝트 생성을 처리합니다. ALCOM이나 공식
  VCC가 관리하는 프로젝트와의 호환성도 유지됩니다.
- **파일이 아닌 Recipe 공유.** Recipe는 공유 가능한 텍스트 선언입니다: BOOTH 에셋 참조와
  색상·토글·위치/회전/크기처럼 명시적으로 지원되는 옵션. 유료 에셋, 커스텀 텍스처, 메시는
  절대 포함되지 않습니다. 재현하는 사람은 자신의 BOOTH 권한으로 에셋을 다시 가져옵니다.

## 작동 방식

VUA는 골 퍼스트입니다. 목적지는 당신이 고르고, 경로는 VUA가 계획합니다. 마법사가 목표·
디바이스·현재 상태에 따라 경로를 고르기 때문에, 모든 플레이어가 하나의 큰 흐름을 따라갈
필요가 없습니다. 모든 Unity 변경은 버전 관리되는 Unity Bridge를 거치며——스크립트 없는
UI 클릭으로 대신하지 않습니다——위험한 단계에는 명시적 확인과 롤백 경로가 준비됩니다.

내부 구조: Electron 데스크톱 셸, 좁은 타입 게이트웨이 뒤의 React UI, 그리고 유스케이스·
영구 작업·복구를 소유하는 Rust Orchestrator. 자세한 내용은
[아키텍처 문서](docs/architecture/system.md)를 참조하세요.

## VUA · AMF · BDL

| 이름 | 정의 |
| --- | --- |
| **VUA** | Windows 데스크톱 클라이언트 본체——이 리포지토리 |
| **AMF**(Avatar MegaFactory) | VUA의 제작 도메인: Warehouse, Recipe, Assembly, Inspection, Release |
| **BDL**(Booth Database Local) | AMF 전용 로컬 카탈로그: 에셋·출처·호환성 메모——클우드가 아니라 당신의 디스크 |

## 보안 경계

- 유료 에셋은 당신의 PC에서만 처리되며, 어떤 서버·리포지토리·진단 파이프라인에도
  업로드되지 않습니다.
- VUA는 VRChat·BOOTH·Unity의 비밀번호, 쿠키, 2단계 인증 코드를 수집하지 않으며, 구매·
  결제·연령·인증·접근 제어를 우회하지 않습니다.
- VUA는 VRChat 클라이언트에 주입하거나 수정하지 않습니다. 로그인과 최종 업로드는 VRChat
  공식 흐름에 남습니다——업로드 버튼은 공식 SDK에서 당신이 직접 누릅니다.
- 공유되는 Recipe에는 구조·출처 참조·설정만 포함됩니다.
- 기술적 검사는 취향이 아니라 사실을 보고합니다. Avatar의 외모와 동작이 기대에 부합함을
  보장하지 않습니다.

## VUA의 방향

- `1.0.0`: 일반 플레이어를 위한 안정성 약속. 전체 흐름의 실기 수용을 관문으로 합니다.
- `1.0.0` 이후: SteamVR 오버레이 튜토리얼, 런타임 통합(SlimeVR, VRCFaceTracking),
  플러그인 생태계——각각 독립적인 보안 결정을 전제로 합니다.
- 채택되었지만 아직 미구현인 방향: 마법사 경로 선택, Recipe 오버레이 의미와 명시적 충돌
  선택지, 공유 시 출처 보완, 검사의 제작 기록으로의 완전한 통합. 기본 꺼짐 상태의 실험적
  호환성 증거 수집기가 뒤따를 수 있습니다. 어느 쪽이든 BDL의 로컬 저장소는 영향을 받지
  않습니다.
- 독립 경량 UI(egui/Slint)는 무기한 연기되었습니다. Electron 리소스 절약 모드는
  유지됩니다.

## 문서

- [문서 가이드](docs/README.md)——작업별 최소 경로
- [제품 경계](docs/product-boundary.md)
- [아키텍처](docs/architecture/system.md)
- [v0.6.0 릴리스 노트(중국어)](docs/release/v0.6.0.md)
- [기여 가이드](CONTRIBUTING.md) · [보안 정책](SECURITY.md)

## 라이선스

이 리포지토리는 [Apache License 2.0](LICENSE)으로 라이선스됩니다. [NOTICE](NOTICE),
[상표 안내](TRADEMARKS.md), [서드파티 고지](THIRD_PARTY_NOTICES.md)도 참조하세요.
제품 릴리스는 Semantic Versioning 2.0.0을 따릅니다. 버전 관리되는 프로토콜과 스키마는
각각 독립적인 호환성 버전을 유지합니다.

Copyright 2026 Aran52.
