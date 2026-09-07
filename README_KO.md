# VUA — VRC Ultra Assistant

[English](README.md) | [简体中文](README_ZH.md) | [日本語](README_JA.md) | 한국어

[![rust](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml)
[![ts](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml)
[![schema-vectors](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml)

VUA는 Windows를 우선 대상으로 하는 로컬 우선 VRChat 데스크톱 제작 환경입니다. 환경 구성,
정당하게 허가된 에셋 획득, Avatar 조립과 검사, 로컬 에셋 관리, 재현 가능한 제작 기록을 하나의
하나의 연속된 워크플로로 구성합니다.

> [!IMPORTANT]
> **현재 제품 버전은 v0.5.0(pre-alpha)입니다.** 이 저장소는 초기 평가와 개발을 위한 것이며,
> 일반 사용자가 일상적으로 사용할 수 있는 안정 버전은 아직 아닙니다.

## 제품 방향

VUA는 사용자가 원하는 결과에서 시작합니다. 환경 준비 또는 선택한 에셋으로 Avatar 제작 같은 목표를
고르면 필요한 단계를 계획하고, Unity Bridge를 통해 결정적인 Unity 작업을 실행하고, 결과를 검증한 뒤
검토 가능한 Build Record를 보관합니다.

사용자는 목적지를 고르고, VUA는 의존성, 프로젝트 준비, 가져오기 순서, 바인딩, 메뉴, 최적화, 검증,
복구라는 경로를 처리합니다.

## 주요 모듈

- **데스크톱 앱:** Electron, React, TypeScript, Vite와 제한된 타입 기반 Gateway, 격리된 원격 웹
  콘텐츠를 사용합니다.
- **Kernel 및 애플리케이션 호스트:** 소형 Node.js Kernel이 시작, 데스크톱 보안, Gateway,
  Orchestrator Provider 수명 주기를 담당합니다. React UI는 통제된 프레젠테이션 표면입니다.
- **환경 및 프로젝트 관리:** VR, Unity, VRChat과 관련 도구를 검사하고 안내합니다. `vrc-get` 기반
  VUA 패키지 관리자와 ALCOM/VCC 관리 프로젝트 호환성을 제공합니다.
- **Orchestrator:** 계획, 승인, 영속 작업, 취소, 복구, 어댑터, Build Record를 담당하는 Rust 핵심이며,
  교체 가능한 버전형 Provider 경계를 통해 Kernel에 연결됩니다.
- **Avatar MegaFactory(AMF):** Warehouse, Recipe, Assembly, Inspection, Release의 다섯 사용자
  단계로 이루어진 Recipe-first 제작 흐름입니다.
- **BDL(Booth Database Local):** 카탈로그, 출처, 이용 조건, 호환성, 검색, Warehouse 매핑 메타데이터를
  관리하는 AMF 전용 로컬 모듈입니다.
- **Unity Bridge:** 글로벌 Unity `2022.3.22f1`에서 결정적인 작업을 수행하는 버전 지정 프로토콜입니다.
- **데스크톱 및 VR Overlay:** 안정된 애플리케이션 서비스를 통해 상태와 안내를 표시합니다.
- **플러그인 프로토콜:** 기능 선언형 확장 경계로 계획되어 있습니다. 호스팅 마켓플레이스와 신뢰할 수
  없는 코드 실행은 현재 제공 계획에 포함되지 않습니다.

SlimeVR Server, VRCFaceTracking 같은 런타임 통합은 제품 방향에 남아 있지만 구현은 `1.0.0`
출시 이후에 시작합니다.

## 아키텍처 경계

```text
React View
  -> typed frontend feature / Gateway
  -> Electron preload and main-process adapter
  -> versioned application contract
  -> Orchestrator use case
  -> domain port
  -> local or third-party adapter
```

View는 Electron, Node.js, SQLite, Unity, Orchestrator 내부 또는 OS API를 직접 호출하지 않습니다.
원격 페이지에는 로컬 애플리케이션 권한을 주지 않습니다. BDL은 AMF를 통해서만 사용하며 결정적인
Unity 변경은 Unity Bridge를 거칩니다.

## 보안 및 배포 경계

- 구매, 결제, 신원, 연령, 인증 또는 접근 제어를 우회하지 않습니다.
- BOOTH 세션, 주문, 다운로드, 유료 에셋 및 제작 상태는 사용자 기기에 유지합니다.
- 저장소와 클라우드 CI 테스트에는 실제 상품이나 사용자 콘텐츠 없이 운영 데이터와 같은 구조를 가진
  합성 데이터를 사용합니다. 로컬 읽기 전용 호환성 테스트에서는 공개 BOOTH 페이지를 사용할 수 있습니다.
- 개발자는 합법적으로 취득한 에셋으로 Unity 워크플로를 로컬에서 검증할 수 있습니다. 유료 에셋,
  사용자 프로젝트, 인증 정보, 캡처한 페이지 콘텐츠, 운영 데이터 및 비공개 로그는 로컬에만 보관합니다.
- 제3자 바이너리를 번들하기 전에 라이선스, 재배포, 업데이트, 서명, 고지 요건을 개별 심사합니다.

## 문서 및 기여

- [Developer documentation — English](docs/README_EN.md)
- [开发文档 — 简体中文](docs/README_ZH.md)
- [Versioning policy — English](docs/release/versioning_EN.md)
- [Contributing — English](CONTRIBUTING_EN.md)
- [贡献指南 — 简体中文](CONTRIBUTING_ZH.md)

이 저장소는 [Apache License 2.0](LICENSE)으로 배포됩니다. [NOTICE](NOTICE),
[상표 지침(영문)](TRADEMARKS_EN.md), [제3자 고지(영문)](THIRD_PARTY_NOTICES_EN.md)도 확인하세요.
제품 릴리스는 Semantic Versioning 2.0.0을 따르며 버전이 지정된 프로토콜과 Schema는 독립적인
호환성 버전을 유지합니다.

Copyright 2026 Aran52.
