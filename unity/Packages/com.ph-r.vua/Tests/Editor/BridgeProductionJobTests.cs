using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Vua.Editor.Bridge.Tests
{
    // W25 window obligation A1: the EditMode suite carries the exclude_object
    // VRCMetaObject component assertion. The package asmdef does not reference
    // the VRCSDK (the Bridge resolves the marker type reflectively), so the
    // assertion is environment-conditional by design:
    // - with the SDK loaded (the W25 real-machine editor), the test drives the
    //   v2 execute_production_job chain end to end and asserts the pinned
    //   marker form (VRCMetaObject.excluded == true) on the located object;
    // - without the SDK (SDK-less checkouts), the same test asserts the typed
    //   honest failure (exclude_marker_unavailable) and that the object is
    //   left untouched.
    // No stub type is registered under a real SDK namespace, so the
    // reflective lookup stays exact on real-machine runs.
    internal sealed class BridgeProductionJobTests
    {
        // Mirrors BridgeCommandProcessor.FindType candidates (same order).
        private static readonly string[] MetaObjectTypeNames =
        {
            "VRC.SDKVRCStripe.VRCMetaObject",
            "VRC.SDK3A.VRCMetaObject",
            "VRC.SDKBase.VRCMetaObject"
        };

        private const string TestFolder = "Assets/VuaBridgeSyntheticTests";
        private string scenePath;
        private string projectRoot;
        private string planPath;
        private string snapshotId;

        [SetUp]
        public void SetUp()
        {
            projectRoot = Path.GetFullPath(Path.Combine(Application.dataPath, ".."));
            planPath = null;
            snapshotId = null;
            if (!AssetDatabase.IsValidFolder(TestFolder))
            {
                AssetDatabase.CreateFolder("Assets", "VuaBridgeSyntheticTests");
            }
            scenePath = $"{TestFolder}/{Guid.NewGuid():N}.unity";
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        }

        [TearDown]
        public void TearDown()
        {
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            if (!string.IsNullOrWhiteSpace(scenePath) &&
                AssetDatabase.LoadAssetAtPath<SceneAsset>(scenePath) != null)
            {
                AssetDatabase.DeleteAsset(scenePath);
            }
            if (AssetDatabase.IsValidFolder(TestFolder)) AssetDatabase.DeleteAsset(TestFolder);
            if (!string.IsNullOrWhiteSpace(planPath) && File.Exists(planPath))
            {
                File.Delete(planPath);
            }
            if (!string.IsNullOrWhiteSpace(snapshotId))
            {
                var snapshotDir = Path.Combine(projectRoot, ".vua", "bridge", "snapshots", snapshotId);
                if (Directory.Exists(snapshotDir)) Directory.Delete(snapshotDir, recursive: true);
            }
        }

        [Test]
        public void ExcludeObjectMarksVrcMetaObjectOrFailsHonestlyWithoutSdk()
        {
            var avatar = new GameObject("Avatar");
            var outfit = Child(avatar, "Outfit");
            Assert.That(EditorSceneManager.SaveScene(SceneManager.GetActiveScene(), scenePath), Is.True);

            var commandId = $"prodjob-{Guid.NewGuid():N}";
            WritePlanFile(commandId, new BridgePlanDocument
            {
                schemaVersion = "0.3",
                planId = $"plan-{commandId}",
                target = new BridgePlanTarget { avatarInstanceId = "Avatar" },
                jobs =
                {
                    new BridgePlanJob
                    {
                        jobId = "job-1",
                        kind = "exclude_object",
                        selector = new BridgeObjectSelector { pathHint = { "Avatar", "Outfit" } }
                    }
                }
            });

            var result = BridgeCommandProcessor.Process(new BridgeCommand
            {
                schemaVersion = 2,
                commandId = commandId,
                operation = "execute_production_job",
                projectId = "synthetic-project",
                dryRun = false,
                expectedProjectFingerprint = ProjectFingerprint.Compute(),
                payload = new BridgePayload
                {
                    planHash = Sha256Of(File.ReadAllText(planPath)),
                    planSchemaVersion = "0.3",
                    planRef = $".vua/bridge/plan-{commandId}.json"
                }
            });
            snapshotId = result.data.snapshotId;

            var metaType = FindMetaObjectType();
            if (metaType == null)
            {
                // SDK-less checkout: typed honest failure, object untouched.
                Assert.That(result.status, Is.EqualTo("failed"),
                    "VRCSDK 缺席时 exclude_object 必须失败而不是伪装成功。");
                Assert.That(result.data.steps[0].status, Is.EqualTo("failed"));
                Assert.That(
                    result.diagnostics.Any(d => d.code == "exclude_marker_unavailable"),
                    Is.True,
                    "SDK 缺席的失败必须携带类型化诚实缺口码。");
                Assert.That(FindMetaObjectComponent(outfit), Is.Null,
                    "失败路径不得在对象上留下任何标记组件。");
            }
            else
            {
                // SDK present (W25 real machine): pinned marker form asserted
                // on the exact reflected type.
                Assert.That(result.status, Is.EqualTo("succeeded"));
                Assert.That(result.data.steps[0].status, Is.EqualTo("executed"));
                var component = FindMetaObjectComponent(outfit);
                Assert.That(component, Is.Not.Null,
                    "exclude_object 必须在目标对象上落 VRCMetaObject 组件。");
                Assert.That(ReadExcluded(component, metaType), Is.True,
                    "钉死形态：VRCMetaObject.excluded 必须为 true。");
            }
        }

        [Test]
        public void ExcludeObjectUnresolvedSelectorFailsTypedWithoutTouchingScene()
        {
            var avatar = new GameObject("Avatar");
            Child(avatar, "Outfit");
            Assert.That(EditorSceneManager.SaveScene(SceneManager.GetActiveScene(), scenePath), Is.True);
            var componentsBefore = avatar.GetComponents<Component>().Select(c => c.GetType()).ToList();

            var commandId = $"prodjob-{Guid.NewGuid():N}";
            WritePlanFile(commandId, new BridgePlanDocument
            {
                schemaVersion = "0.3",
                planId = $"plan-{commandId}",
                target = new BridgePlanTarget { avatarInstanceId = "Avatar" },
                jobs =
                {
                    new BridgePlanJob
                    {
                        jobId = "job-1",
                        kind = "exclude_object",
                        selector = new BridgeObjectSelector { pathHint = { "Missing", "Object" } }
                    }
                }
            });

            var result = BridgeCommandProcessor.Process(new BridgeCommand
            {
                schemaVersion = 2,
                commandId = commandId,
                operation = "execute_production_job",
                projectId = "synthetic-project",
                dryRun = false,
                expectedProjectFingerprint = ProjectFingerprint.Compute(),
                payload = new BridgePayload
                {
                    planHash = Sha256Of(File.ReadAllText(planPath)),
                    planSchemaVersion = "0.3",
                    planRef = $".vua/bridge/plan-{commandId}.json"
                }
            });
            snapshotId = result.data.snapshotId;

            Assert.That(result.status, Is.EqualTo("failed"));
            Assert.That(result.data.steps[0].status, Is.EqualTo("failed"));
            Assert.That(
                result.diagnostics.Any(d => d.code == "selector_unresolved"),
                Is.True,
                "selector 无解必须携带类型化失败码。");
            Assert.That(
                avatar.GetComponents<Component>().Select(c => c.GetType()).ToList(),
                Is.EqualTo(componentsBefore),
                "selector 无解时对象必须保持未被修改。");
        }

        [Test]
        public void ProductionReceiptVersionEchoesTheCommandProtocolVersion()
        {
            // v3 production-face migration (proposal 016): a v3
            // execute_production_job gets a v3 receipt, whose data legally
            // carries instanceGlobalObjectId (proposal 011); a v2 command
            // keeps receiving a v2 receipt during the transition window.
            // Dry-run only: no snapshot, no scene mutation, no SDK
            // dependency.
            var avatar = new GameObject("Avatar");
            Child(avatar, "Outfit");
            Assert.That(EditorSceneManager.SaveScene(SceneManager.GetActiveScene(), scenePath), Is.True);

            foreach (var protocolVersion in new[] { 3, 2 })
            {
                var commandId = $"prodjob-{Guid.NewGuid():N}";
                WritePlanFile(commandId, new BridgePlanDocument
                {
                    schemaVersion = "0.3",
                    planId = $"plan-{commandId}",
                    target = new BridgePlanTarget { avatarInstanceId = "Avatar" },
                    jobs =
                    {
                        new BridgePlanJob
                        {
                            jobId = "job-1",
                            kind = "set_object_active",
                            selector = new BridgeObjectSelector { pathHint = { "Avatar" } },
                            active = true
                        }
                    }
                });

                var result = BridgeCommandProcessor.Process(new BridgeCommand
                {
                    schemaVersion = protocolVersion,
                    commandId = commandId,
                    operation = "execute_production_job",
                    projectId = "synthetic-project",
                    dryRun = true,
                    payload = new BridgePayload
                    {
                        planHash = Sha256Of(File.ReadAllText(planPath)),
                        planSchemaVersion = "0.3",
                        planRef = $".vua/bridge/plan-{commandId}.json"
                    }
                });

                Assert.That(result.status, Is.EqualTo("succeeded"),
                    "dry-run 计划校验必须成功，才能钉住收据版本回显。");
                Assert.That(result.schemaVersion, Is.EqualTo(protocolVersion),
                    "收据版本必须回显命令协议版本（v3 命令＝v3 收据；v2 命令＝v2 收据）。");
                Assert.That(result.data.dryRun, Is.True, "dry-run 收据不得冒充实跑。");
                Assert.That(result.data.steps[0].status, Is.EqualTo("pending"),
                    "dry-run 只做计划校验，作业序列保持未执行。");
            }
        }

        private void WritePlanFile(string commandId, BridgePlanDocument plan)
        {
            var bridgeDir = Path.Combine(projectRoot, ".vua", "bridge");
            Directory.CreateDirectory(bridgeDir);
            planPath = Path.Combine(bridgeDir, $"plan-{commandId}.json");
            File.WriteAllText(planPath, JsonUtility.ToJson(plan, prettyPrint: false));
        }

        private static Type FindMetaObjectType()
        {
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                foreach (var fullName in MetaObjectTypeNames)
                {
                    var type = assembly.GetType(fullName, throwOnError: false);
                    if (type != null) return type;
                }
            }
            return null;
        }

        private static Component FindMetaObjectComponent(GameObject target)
        {
            var metaType = FindMetaObjectType();
            if (metaType == null) return null;
            return target.GetComponent(metaType);
        }

        private static bool ReadExcluded(Component component, Type metaType)
        {
            var property = metaType.GetProperty("excluded");
            if (property != null) return (bool)property.GetValue(component, null);
            var field = metaType.GetField("excluded");
            Assert.That(field, Is.Not.Null, "VRCMetaObject 缺少 excluded 成员（SDK 版本差异）。");
            return (bool)field.GetValue(component);
        }

        private static string Sha256Of(string content)
        {
            using (var sha = SHA256.Create())
            {
                var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(content));
                return "sha256:" + BitConverter.ToString(hash).Replace("-", string.Empty)
                    .ToLowerInvariant();
            }
        }

        private static GameObject Child(GameObject parent, string name)
        {
            var child = new GameObject(name);
            child.transform.SetParent(parent.transform);
            return child;
        }
    }
}
