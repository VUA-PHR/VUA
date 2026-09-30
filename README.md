# VUA — VRC Ultra Assistant

English | [简体中文](README_ZH.md) | [日本語](README_JA.md) | [한국어](README_KO.md)

**VUA (VRC Ultra Assistant)** is a Windows desktop production environment for VRChat
players — especially players who have never touched Unity, or don't yet know what they
need. Start from a goal and your own assets; VUA guides you through environment setup,
project preparation, Avatar assembly, inspection, and recovery.

## What you can do with VUA

### [1] Game assistant

> **Materials checked and cleared.**

Prepare the software and settings your play setup needs, then learn the basics of movement, menus, safety options and devices. Choose your goal and hardware; deployment is intended to explain what is needed and guide installation.

The first account guide opens official registration pages in the built-in browser: Steam and VRChat for play, with optional Unity and BOOTH accounts for creators. Users complete registration, Steam library actions and official account linking themselves. Upload guidance explains the full VRChat account and New User requirements; local Avatar preparation can start before upload eligibility.

The first two optional tool connections are VRCFaceTracking and hyblocker OpenVR Space Calibrator. VUA is planned to detect and launch their independent installations and guide setup in the upstream applications; Steam/upstream manages installation and updates.

### [2] Avatar production

> **Sugar, spice, and everything nice.**

Combine your own materials, capture the choices in a Recipe, and share the Recipe so others can reproduce the setup with assets they obtain themselves. The goal is automated Avatar production with checks and controlled changes before handing the result to the official SDK; a Recipe contains references and settings, not paid assets.

## How it works

Start with your goal and available materials, review the proposed steps, and follow the results. A Build Record keeps production steps, inspection evidence and errors together so that you can see what happened and what needs attention.

Project and package management prepares the required Unity environment and dependencies, including VPM repositories, package installation, updates and removal. Existing ALCOM/VCC projects are inspected read-only; editing starts from a user-requested VUA-managed copy. Final login and upload remain your actions in the official VRChat SDK.

## Safety boundaries

- VUA is an independent third-party assistant, with no affiliation with or endorsement by VRChat Inc.; its integration policy permits documented external interfaces, OSC, launch options, necessary local logs and documented configuration fields, never VRChat client injection, hooks, patches or EAC bypass.
- Initial account guidance uses isolated temporary browser sessions. VUA application features do not collect passwords or extract login cookies/tokens into application or Agent data; first delivery does not remember VRChat sign-in. Later web-reading and experimental persistence are deferred and are not a claim of platform approval; see the [account boundary](docs/product-boundary.md#account-onboarding-user-ruling-2026-09-30).
- Account changes must be initiated by you through an allowed path; VUA does not take over your account from a cloud service or automatically upload Avatars on your behalf.
- Only data needed for the feature is kept, locally by default, without unnecessary friend-activity tracking or profiling; purchased materials stay local and shared Recipes exclude their contents.
- Undocumented client behavior, hidden configuration fields and uncontrolled API automation are outside the default scope; a successful technical check is not a guarantee of appearance, behavior or production safety.

[VRChat Creator Guidelines](https://hello.vrchat.com/creator-guidelines) · [Configuration File](https://docs.vrchat.com/docs/configuration-file)

## Development progress

The latest published artifact remains v0.6.0, historically labeled pre-alpha. Development follows the [N1–N7 sequence](docs/development-outline.md): deployment, two selected runtime tools, complex Avatar production, Recipe reproduction, audited material-management rework, recovery, and a Beta installer with an illustrated guide.

The project is expected to remain in Beta for a long time. These descriptions express the product direction; implemented pieces and automated tests do not establish complete real-machine workflows. Read the sequence and release evidence for actual acceptance status.

### Current delivery and starting points

- For players: consult the [published artifacts](https://github.com/VUA-Project/VUA/releases) and [v0.6.0 evidence and limitations](docs/release/v0.6.0.md). The features described above are product direction; N1–N7 outcomes are not declared accepted by this README.
- The screenshot-based user guide and tested Beta installer are N7 deliverables, not current onboarding instructions. Use [Issues](https://github.com/VUA-Project/VUA/issues/new/choose) for usage questions.
- For developers: [install dependencies, launch the desktop app and select checks](apps/desktop/README.md#development-commands), then follow [Contributing](CONTRIBUTING.md).

## Documentation

- [Documentation guide](docs/README.md) — the smallest route for every task
- [Product boundary](docs/product-boundary.md)
- [Architecture](docs/architecture/system.md)
- [v0.6.0 release notes (Chinese)](docs/release/v0.6.0.md)
- [Contributing](CONTRIBUTING.md) · [Security policy](SECURITY.md)

## License

VUA is licensed under [Apache-2.0](LICENSE). The first planned external connections are [VRCFaceTracking (Apache-2.0)](https://github.com/benaclejames/VRCFaceTracking/blob/master/LICENSE) and [Space Calibrator (MIT core; separate third-party licenses)](https://github.com/hyblocker/OpenVR-SpaceCalibrator/blob/develop/LICENSE). See [third-party notices](THIRD_PARTY_NOTICES.md) for upstream attribution and conditions for any future redistribution.

[NOTICE](NOTICE) · [Trademark guidance](TRADEMARKS.md)

Copyright 2026 Aran52.
