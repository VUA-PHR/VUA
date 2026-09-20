using System;
using System.IO;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;

namespace Vua.Editor.Bridge.Tests
{
    /// <summary>
    /// v4 build_preview 合同测试(slice/production-nav-bake-preview,用户裁决
    /// 2026-09-20)。仓库内无 batchmode 运行链——本文件随切片落地,EditMode
    /// 真机运行候 Unity 窗口(诚实纪律:未运行不作通过宣称)。
    /// </summary>
    internal sealed class BridgePreviewBakeTests
    {
        [Test]
        public void BuildPreviewDryRunResolvesAvatarWithoutProducingImages()
        {
            var avatar = new GameObject("vua-preview-fixture-avatar");
            avatar.AddComponent<Animator>();
            avatar.AddComponent<SkinnedMeshRenderer>();
            try
            {
                var command = Command("build_preview", true);
                command.schemaVersion = 4;
                command.payload.avatarGlobalObjectId =
                    GlobalObjectId.GetGlobalObjectIdSlow(avatar).ToString();

                var result = BridgeCommandProcessor.Process(command);

                Assert.That(result.status, Is.EqualTo("succeeded"));
                Assert.That(result.changedPaths, Is.Empty);
                Assert.That(result.diagnostics, Has.Count.EqualTo(1));
                Assert.That(result.diagnostics[0].code, Is.EqualTo("preview.dry_run"));
                Assert.That(result.data.avatarName, Is.EqualTo(avatar.name));
                Assert.That(result.data.skinnedMeshRenderers, Is.EqualTo(1));
                // dryRun 只出统计不产图:产物目录不得存在。
                var outputDir = Path.Combine(
                    Path.GetFullPath(Path.Combine(Application.dataPath, "..")),
                    ".vua", "bridge", "preview", command.commandId);
                Assert.That(Directory.Exists(outputDir), Is.False,
                    "dry-run must not create the preview artifact directory");
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(avatar);
            }
        }

        [Test]
        public void BuildPreviewRejectsRealRunWithoutFingerprint()
        {
            var command = Command("build_preview", false);
            command.schemaVersion = 4;

            var result = BridgeCommandProcessor.Process(command);

            Assert.That(result.status, Is.EqualTo("rejected"));
            Assert.That(result.diagnostics[0].code, Is.EqualTo("bridge.fingerprint_required"));
        }

        [Test]
        public void BuildPreviewRequiresProtocolV4()
        {
            var command = Command("build_preview", true);

            var result = BridgeCommandProcessor.Process(command);

            Assert.That(result.status, Is.EqualTo("rejected"));
            Assert.That(result.diagnostics[0].code, Is.EqualTo("bridge.unsupported_schema"));
        }

        [Test]
        public void BuildPreviewRejectsSceneWithoutAvatar()
        {
            var command = Command("build_preview", true);
            command.schemaVersion = 4;
            command.payload.avatarGlobalObjectId = "not-a-global-object-id";

            var result = BridgeCommandProcessor.Process(command);

            Assert.That(result.status, Is.EqualTo("rejected"));
            Assert.That(result.diagnostics[0].code, Is.EqualTo("preview.no_avatar"));
        }

        private static BridgeCommand Command(string operation, bool dryRun)
        {
            return new BridgeCommand
            {
                schemaVersion = 1,
                commandId = "test-command-" + operation,
                operation = operation,
                projectId = "test-project",
                dryRun = dryRun,
                payload = new BridgePayload()
            };
        }
    }
}
