# VUA — VRC Ultra Assistant

[English](README.md) | [简体中文](README_ZH.md) | 日本語 | [한국어](README_KO.md)

[![rust](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml)
[![ts](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml)
[![schema-vectors](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml)

**VUA（VRC Ultra Assistant）** は、VRChat プレイヤーのための Windows デスクトップ
制作環境です——特に、Unity に触れたことがない、あるいは何が必要かまだ分からない
プレイヤーのために。目標と自分の素材から出発し、環境構築・プロジェクト準備・
Avatar の組み立て・検査・復旧まで、VUA がガイドします。

## VUA でできること

### [1] ゲームアシスタント

**Materials checked and cleared.**

プレイに必要なソフトウェアや設定を準備し、移動、メニュー、安全設定、デバイスの基本を学びます。目的と機器に応じて必要なものを説明し、環境構築を案内します。

### [2] Avatar 制作

**Sugar, spice, and everything nice.**

所有する素材を組み合わせ、選択と設定を Recipe に記録して共有し、各自で素材を入手した人が再現できるようにします。目標は、検査と制御された変更を伴う Avatar 制作の自動化と、公式 SDK への成果物の引き渡しです。Recipe に含めるのは参照と設定であり、有料素材そのものではありません。

## 使い方の流れ

目的と手元の素材から始め、計画、手順、結果を確認します。Build Record は制作手順、検査の証拠、エラーをまとめ、実行内容と対処が必要な箇所を示します。

プロジェクトとパッケージの管理では、Unity 環境や依存関係、VPM リポジトリ、パッケージのインストール・更新・削除を扱います。既存の ALCOM/VCC プロジェクトは読み取り専用で確認し、編集はユーザーが指定して作成する VUA 管理のコピーで行います。最後のログインとアップロードは、ユーザー自身が VRChat 公式 SDK で行います。

## 安全上の境界

- VUA は VRChat Inc. と提携せず、公認も受けていない独立した第三者製アシスタントであり、公開された外部インターフェース、OSC、起動オプション、必要なローカルログと公開設定のみを対象とし、VRChat クライアントへの注入、フック、パッチや EAC の回避を行いません。
- VUA は VRChat のパスワード、認証トークン、Cookie、セッションなどのログイン認証情報を要求、読み取り、保存、送信してはなりません。
- アカウントの変更はユーザーが許可された手順で開始し、VUA がクラウドからアカウントを操作したり、Avatar を代理で自動アップロードしたりすることはありません。
- 必要最小限のデータを原則ローカルに保存し、不要なフレンド活動の追跡やプロファイリングは行わず、有料素材をローカルに保ち、共有 Recipe に素材本体を含めません。
- 非公開のクライアント動作、隠し設定、制御されない API 自動化は標準の対象外であり、技術検査の成功は外観、動作、本番環境での安全性を保証しません。

[VRChat Creator Guidelines](https://hello.vrchat.com/creator-guidelines) · [Configuration File](https://docs.vrchat.com/docs/configuration-file)

## 開発状況

最新の公開成果物は引き続き v0.6.0 で、当時の公開区分は pre-alpha です。[N1–N7](docs/development-outline.md) に沿って環境構築、指定の二つのツール、複雑な Avatar 制作、Recipe 再現、素材管理の監査と再実装、復旧、画像付きガイドを備えた Beta インストーラーを進めます。

プロジェクトは今後も長期間 Beta の状態が続く見込みです。説明は製品の方向性であり、実装や自動テストだけで実機の一連の動作が検証済みになるわけではありません。実際の受け入れ状況は開発計画とリリースの証拠を参照してください。

## ドキュメント

- [ドキュメントガイド](docs/README.md)——タスクごとの最小ルート
- [プロダクト境界](docs/product-boundary.md)
- [アーキテクチャ](docs/architecture/system.md)
- [v0.6.0 リリースノート（中国語）](docs/release/v0.6.0.md)
- [コントリビューション](CONTRIBUTING.md) · [セキュリティポリシー](SECURITY.md)

## ライセンス

VUA は [Apache-2.0](LICENSE) です。最初の対応予定ツールは [VRCFaceTracking（Apache-2.0）](https://github.com/benaclejames/VRCFaceTracking/blob/master/LICENSE) と [Space Calibrator の MIT 部分](https://github.com/hyblocker/OpenVR-SpaceCalibrator/blob/develop/LICENSE) です。Space Calibrator の変更版では SimpleBLE とベースステーションの BLE 管理を除去する計画です。[第三者通知](THIRD_PARTY_NOTICES.md) に帰属、その他の依存ライセンスと配布条件を記載していますが、変更版の配布完了を意味するものではありません。

[NOTICE](NOTICE) · [Trademark guidance](TRADEMARKS.md)

Copyright 2026 Aran52.
