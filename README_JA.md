# VUA — VRC Ultra Assistant

[English](README.md) | [简体中文](README_ZH.md) | 日本語 | [한국어](README_KO.md)

[![rust](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml)
[![ts](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml)
[![schema-vectors](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml)

> 「Packed up and ready!（出撃準備完了！）」——『Command & Conquer: Red Alert』の MCV

**VUA（VRC Ultra Assistant）** は、VRChat プレイヤーのための Windows デスクトップ
制作環境です——特に、Unity に触れたことがない、あるいは何が必要かまだ分からない
プレイヤーのために。目標と自分の素材から出発し、環境構築・プロジェクト準備・
Avatar の組み立て・検査・復旧まで、VUA がガイドします。

> [!IMPORTANT]
> **現在の状態：v0.6.0（pre-alpha）。** このリポジトリは開発者プレビューを公開して
> います。以下の機能はリポジトリ内に実装され自動テストで検証されていますが、実機での
> エンドツーエンド検証はまだ完了しておらず、一部の機能は UI からまだ利用できません。
> すべてのフローを早期評価版として扱ってください。一般プレイヤー向けの安定性の約束は
> `1.0.0` から始まります。

## VUA でできること

- **環境をセットアップする。** ハードウェア・ソフトウェア・ネットワークを確認し、
  目標に応じたインストール計画を作成します。お使いのヘッドセットが実際に必要とする
  VR ランタイムとドライバー、Unity `2022.3.22f1`、VRChat SDK、そして任意のトラッキング
  ツール。アカウント登録と認証は常に公式ページで行います——VUA は案内するだけで、
  代行することはありません。
- **ゲームを学ぶ。** 5 ページのアプリ内チュートリアルで、セットアップの基本、移動と
  メニュー、調整しておきたい安全設定（`Personal Space`、`Allow Untrusted URLs`、
  Avatar 表示制限）、そしてお使いのデバイスをカバーします。SteamVR オーバーレイの
  チュートリアルは `1.0.0` 以降の目標です。
- **Avatar を制作する。** Warehouse から素材を選ぶか、所有する素材をインポートして
  Recipe に組み合わせると、VUA が決定論的でバージョン管理された Bridge を通じて
  Unity 内で組み立てを実行します——インポート順序、バインド、メニュー、パラメータ。
  すべてのステップにスナップショットと復旧経路があります。
- **検査して記録を残す。** すべての制作実行は Build Record を残し、検査証跡とログを
  保持します。問題は通知センターと実行記録の両方に表示されます。通知を閉じても問題は
  消えません。
- **プロジェクトとパッケージを管理する。** 内蔵パッケージマネージャー（`vrc-get`
  ベース）が VPM リポジトリの購読、パッケージのインストール／アップグレード／削除、
  ローカルパッケージ、プロジェクト作成を処理します。ALCOM や公式 VCC が管理する
  プロジェクトとの互換性も維持されます。
- **ファイルではなく Recipe を共有する。** Recipe は共有可能なテキスト宣言です：
  BOOTH 素材への参照と、色・オンオフ・位置回転拡縮など明示的にサポートされた設定。
  有償素材・カスタムテクスチャ・メッシュは一切含まれません。再現する人は自分の
  BOOTH アクセス権で素材を取得し直します。

## 仕組み

VUA はゴールファーストです。目的地を選ぶのはあなた、経路を計画するのは VUA。
目標・デバイス・現在の状態に応じてウィザードが経路を選ぶため、すべてのプレイヤーが
一本の大きなフローを通る必要はありません。Unity への変更はすべてバージョン管理された
Unity Bridge を経由し——未検証の UI 操作で代行することはありません——リスクのある
ステップでは明示的な確認とロールバック経路が用意されます。

内部構造：Electron デスクトップシェル、狭い型付き Gateway の後ろにある React UI、
そしてユースケース・永続タスク・復旧を所有する Rust Orchestrator。詳細は
[アーキテクチャドキュメント](docs/architecture/system.md) を参照してください。

## VUA・AMF・BDL

| 名前 | 定義 |
| --- | --- |
| **VUA** | Windows デスクトップクライアント本体——このリポジトリ |
| **AMF**（Avatar MegaFactory） | VUA の制作ドメイン：Warehouse、Recipe、Assembly、Inspection、Release |
| **BDL**（Booth Database Local） | AMF 専用のローカルカタログ：素材・出所・互換性メモ——クラウドではなくあなたのディスク上 |

## 安全上の境界

- 有償素材はお使いの PC 上でのみ処理され、サーバー・リポジトリ・診断パイプラインに
  アップロードされることはありません。
- VUA は VRChat・BOOTH・Unity のパスワード、Cookie、二要素認証コードを収集せず、
  購入・決済・年齢・認証・アクセス制御を迂回しません。
- VUA は VRChat クライアントへの注入や改変を行いません。ログインと最終アップロードは
  VRChat の公式フローに残ります——アップロードボタンは公式 SDK であなた自身が押します。
- 共有される Recipe に含まれるのは構造・出所参照・設定のみです。
- 技術的チェックが報告するのは事実であり、趣味ではありません。Avatar の見た目や動作が
  期待どおりであることを保証するものではありません。

## VUA の今後

- `1.0.0`：一般プレイヤー向けの安定性の約束。全フローの実機受け入れを条件とします。
- `1.0.0` 以降：SteamVR オーバーレイチュートリアル、ランタイム統合（SlimeVR、
  VRCFaceTracking）、プラグインエコシステム——それぞれ独立したセキュリティ決定を前提とします。
- 採択済みだが未実装の方向：ウィザードの経路選択、Recipe の重ね合わせ意味論と明示的な
  競合の選択肢、共有時の出所補完、検査の制作記録への完全な統合。デフォルトでオフの
  実験的な互換性証跡コレクターが続く可能性があります。いずれの場合も BDL のローカル
  ストレージは影響を受けません。
- 独立した軽量 UI（egui/Slint）は無期限に延期されています。Electron のリソース節約
  モードは維持されます。

## ドキュメント

- [ドキュメントガイド](docs/README.md)——タスクごとの最小ルート
- [プロダクト境界](docs/product-boundary.md)
- [アーキテクチャ](docs/architecture/system.md)
- [v0.6.0 リリースノート（中国語）](docs/release/v0.6.0.md)
- [コントリビューション](CONTRIBUTING.md) · [セキュリティポリシー](SECURITY.md)

## ライセンス

このリポジトリは [Apache License 2.0](LICENSE) の下でライセンスされています。
[NOTICE](NOTICE)、[商標ガイダンス](TRADEMARKS.md)、[サードパーティ通知](THIRD_PARTY_NOTICES.md)
も参照してください。製品リリースは Semantic Versioning 2.0.0 に従います。バージョン管理
されたプロトコルとスキーマは、それぞれ独自の互換性バージョンを保持します。

Copyright 2026 Aran52.
