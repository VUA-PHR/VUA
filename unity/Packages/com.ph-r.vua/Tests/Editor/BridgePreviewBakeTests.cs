using System;
using System.IO;
using System.Linq;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;

namespace Vua.Editor.Bridge.Tests
{
    /// <summary>
    /// v4 build_preview 合同测试(slice/production-nav-bake-preview,用户裁决
    /// 2026-09-20)。隔离/脏资源回归使用合成对象；运行记录见 collab/state/wt-8.md。
    /// </summary>
    public sealed class PreviewDirtyAsset : ScriptableObject { public int value; }

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

        [TestCase(true, true)]
        [TestCase(false, true)]
        [TestCase(false, false)]
        public void PreviewPreservesDirtyUserResourcesAndRendersOnlyItsScene(bool dryRun, bool initiallyDirty)
        {
            const string folder = "Assets/VuaPreviewIsolationTest";
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            AssetDatabase.CreateFolder("Assets", "VuaPreviewIsolationTest");
            var material = new Material(Shader.Find("Unlit/Color")) { color = Color.cyan };
            var settings = ScriptableObject.CreateInstance<PreviewDirtyAsset>();
            AssetDatabase.CreateAsset(material, folder + "/material.mat");
            AssetDatabase.CreateAsset(settings, folder + "/settings.asset");
            var avatar = new GameObject("synthetic-avatar");
            avatar.AddComponent<Animator>();
            var cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.transform.SetParent(avatar.transform);
            cube.transform.localScale = new Vector3(1, 1.5f, .3f);
            var mesh = cube.GetComponent<MeshFilter>().sharedMesh;
            UnityEngine.Object.DestroyImmediate(cube.GetComponent<MeshRenderer>());
            var renderer = cube.AddComponent<SkinnedMeshRenderer>();
            renderer.sharedMesh = mesh;
            renderer.sharedMaterial = material;
            var scene = SceneManager.GetActiveScene();
            EditorSceneManager.SaveScene(scene, folder + "/scene.unity");
            AssetDatabase.SaveAssets();
            var paths = new[] { folder + "/material.mat", folder + "/settings.asset", scene.path };
            var bytes = paths.Select(File.ReadAllBytes).ToArray();
            material.color = Color.blue;
            settings.value = 42;
            EditorUtility.SetDirty(material);
            EditorUtility.SetDirty(settings);
            var obstacle = GameObject.CreatePrimitive(PrimitiveType.Cube);
            obstacle.name = "user-scene-interference";
            obstacle.transform.localScale = Vector3.one * 30;
            var interference = new Material(Shader.Find("Unlit/Color")) { color = Color.magenta };
            obstacle.GetComponent<Renderer>().sharedMaterial = interference;
            EditorSceneManager.MarkSceneDirty(scene);
            var command = Command("build_preview", dryRun);
            command.schemaVersion = 4;
            command.commandId = "preview-isolation-" + Guid.NewGuid().ToString("N");
            command.payload.avatarGlobalObjectId = GlobalObjectId.GetGlobalObjectIdSlow(avatar).ToString();
            command.expectedProjectFingerprint = ProjectFingerprint.Compute();
            var sceneCount = SceneManager.sceneCount;
            var previewCount = EditorSceneManager.previewSceneCount;
            if (!initiallyDirty)
            {
                AssetDatabase.SaveAssets();
                EditorSceneManager.SaveScene(scene);
                bytes = paths.Select(File.ReadAllBytes).ToArray();
                command.expectedProjectFingerprint = ProjectFingerprint.Compute();
            }
            var previousActive = RenderTexture.active;
            var sentinel = new RenderTexture(8, 8, 0);
            RenderTexture.active = sentinel;
            try
            {
                var result = BridgeCommandProcessor.Process(command);
                Assert.That(result.status, Is.EqualTo("succeeded"), JsonUtility.ToJson(result));
                var receiptOutput = Path.Combine(Directory.GetCurrentDirectory(), ".vua/bridge/v4-test-receipts");
                Directory.CreateDirectory(receiptOutput);
                File.WriteAllText(Path.Combine(receiptOutput, dryRun ? "preview-dryrun.json" : "preview-baked.json"),
                    BridgeResultJson.Serialize(result));
                var replay = BridgeCommandProcessor.Process(command);
                Assert.That(replay.diagnostics.Any(item => item.code == "bridge.idempotent_replay"), Is.True);
                File.WriteAllText(Path.Combine(receiptOutput, dryRun ? "dryrun-replay.json" : "baked-replay.json"),
                    BridgeResultJson.Serialize(replay));
                for (var i = 0; i < paths.Length; i++)
                    Assert.That(File.ReadAllBytes(paths[i]), Is.EqualTo(bytes[i]), paths[i]);
                Assert.That(EditorUtility.IsDirty(material), Is.EqualTo(initiallyDirty));
                Assert.That(EditorUtility.IsDirty(settings), Is.EqualTo(initiallyDirty));
                Assert.That(scene.isDirty, Is.EqualTo(initiallyDirty));
                Assert.That(SceneManager.sceneCount, Is.EqualTo(sceneCount));
                Assert.That(EditorSceneManager.previewSceneCount, Is.EqualTo(previewCount));
                Assert.That(RenderTexture.active, Is.EqualTo(sentinel));
                var output = Path.Combine(Directory.GetCurrentDirectory(), ".vua/bridge/preview", command.commandId);
                if (dryRun) Assert.That(Directory.Exists(output), Is.False);
                else
                {
                    var frames = Directory.GetFiles(Path.Combine(output, "frames"), "*.png");
                    Assert.That(frames.Length, Is.EqualTo(60));
                    Assert.That(File.ReadAllBytes(frames[0]), Is.Not.EqualTo(File.ReadAllBytes(frames[15])));
                    foreach (var file in frames)
                    {
                        var image = new Texture2D(2, 2);
                        try
                        {
                            Assert.That(image.LoadImage(File.ReadAllBytes(file)), Is.True);
                            Assert.That(image.width, Is.EqualTo(1024));
                            Assert.That(image.height, Is.EqualTo(1024));
                            var pixels = image.GetPixels32();
                            Assert.That(pixels.Any(c => c.a > 200 && c.b > 150 && c.r < 40), Is.True,
                                "The blue avatar copy must be visible: " + file);
                            Assert.That(pixels.Any(c => c.a > 200 && c.b > 150 && c.r > 150), Is.False,
                                "The original scene magenta obstacle must be excluded");
                            Assert.That(pixels[0].a, Is.EqualTo(0), "Transparent background");
                        }
                        finally { UnityEngine.Object.DestroyImmediate(image); }
                    }
                }
            }
            finally
            {
                RenderTexture.active = previousActive;
                sentinel.Release();
                UnityEngine.Object.DestroyImmediate(sentinel);
                EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                UnityEngine.Object.DestroyImmediate(interference);
                AssetDatabase.DeleteAsset(folder);
            }
        }

        private static BridgeCommand Command(string operation, bool dryRun)
        {
            return new BridgeCommand
            {
                schemaVersion = 1,
                commandId = "test-command-" + operation + "-" + Guid.NewGuid().ToString("N"),
                operation = operation,
                projectId = "test-project",
                dryRun = dryRun,
                payload = new BridgePayload()
            };
        }
    }
}
