# VUA — VRC Ultra Assistant

[English](README.md) | [简体中文](README_ZH.md) | 日本語 | [한국어](README_KO.md)

VUA は Windows を第一対象とする、ローカル優先の VRChat デスクトップ制作環境です。環境構築、
正規に許可されたアセットの取得、Avatar の組み立てと検査、ローカルアセット管理、再現可能な
制作記録を、一つの連続したワークフローにまとめます。

> [!IMPORTANT]
> **現在の製品バージョンは v0.4.1（pre-alpha）です。** このリポジトリは早期評価と開発向けで、
> 一般ユーザーの日常利用に適した安定版ではありません。

## 製品方針

VUA はユーザーが得たい結果から作業を始めます。環境準備や、選択したアセットからの Avatar 制作
などの目的を選ぶと、必要な手順を計画し、Unity Bridge を通じて決定的な Unity 操作を実行し、
結果を検証して、確認可能な Build Record を保存します。

ユーザーは目的地を選び、VUA が依存関係、プロジェクト準備、インポート順序、バインド、メニュー、
最適化、検証、復旧という経路を扱います。

## 主なモジュール

- **デスクトップアプリ:** Electron、React、TypeScript、Vite。型付けされた限定的な Gateway と、
  隔離されたリモート Web コンテンツを使用します。
- **Kernel とアプリケーションホスト:** 小型 Node.js Kernel が起動、デスクトップセキュリティ、
  Gateway、Orchestrator Provider のライフサイクルを担当します。React UI は制御されたプレゼンテーション面です。
- **環境・プロジェクト管理:** VR、Unity、VRChat と関連ツールを検出・案内し、`vrc-get` ベースの
  VUA パッケージマネージャーと、ALCOM/VCC 管理プロジェクトとの互換性を提供します。
- **Orchestrator:** 計画、承認、永続タスク、キャンセル、復旧、アダプター、Build Record を担う
  Rust 中核で、交換可能なバージョン化 Provider 境界を通じて Kernel に接続します。
- **Avatar MegaFactory（AMF）:** Warehouse、Recipe、Assembly、Inspection、Release の 5 段階から
  なる Recipe-first 制作フローです。
- **BDL（Booth Database Local）:** カタログ、出所、利用条件、互換性、検索、Warehouse 対応情報を
  管理する AMF 専用ローカルモジュールです。
- **Unity Bridge:** グローバル版 Unity `2022.3.22f1` で決定的な操作を実行するためのバージョン付きプロトコルです。
- **デスクトップ／VR Overlay:** 安定したアプリケーションサービスから状態と案内を表示します。
- **プラグインプロトコル:** 能力宣言式の拡張境界として計画中です。ホスト型マーケットプレイスや
  信頼できないコードの実行は現在の提供計画に含みません。

SlimeVR Server や VRCFaceTracking などの実行時統合は製品方針に残しますが、実装開始は
`1.0.0` リリース後です。

## アーキテクチャ境界

```text
React View
  -> typed frontend feature / Gateway
  -> Electron preload and main-process adapter
  -> versioned application contract
  -> Orchestrator use case
  -> domain port
  -> local / third-party adapter
```

View は Electron、Node.js、SQLite、Unity、Orchestrator 内部、OS API を直接呼び出しません。
リモートページにはローカル権限を与えません。BDL は AMF だけから利用し、決定的な Unity 変更は
Unity Bridge を経由します。

## セキュリティと配布

- 購入、支払い、本人確認、年齢、認証、アクセス制御を回避しません。
- BOOTH セッション、注文、ダウンロード、有料アセット、制作状態はユーザー端末に保持します。
- リポジトリとクラウド CI のテストには、実在の商品やユーザー内容を含まず、本番と同等の構造を
  持つ合成データを使用します。ローカルの読み取り専用互換性テストでは公開 BOOTH ページを利用できます。
- 開発者は合法的に取得したアセットで Unity ワークフローをローカル検証できます。有料アセット、
  ユーザープロジェクト、認証情報、取得したページ内容、本番データ、非公開ログはローカルに保持します。
- 第三者バイナリを同梱する前に、ライセンス、再配布、更新、署名、通知を個別に審査します。

## ドキュメントと貢献

- [Developer documentation — English](docs/README_EN.md)
- [开发文档 — 简体中文](docs/README_ZH.md)
- [Versioning policy — English](docs/release/versioning_EN.md)
- [Contributing — English](CONTRIBUTING_EN.md)
- [贡献指南 — 简体中文](CONTRIBUTING_ZH.md)

本リポジトリは [Apache License 2.0](LICENSE) で公開します。[NOTICE](NOTICE)、
[商標ガイダンス（英語）](TRADEMARKS_EN.md)、[第三者通知（英語）](THIRD_PARTY_NOTICES_EN.md)も
参照してください。
製品リリースは Semantic Versioning 2.0.0 に従い、各プロトコルと Schema は独立した互換性
バージョンを保持します。

Copyright 2026 Aran52.
