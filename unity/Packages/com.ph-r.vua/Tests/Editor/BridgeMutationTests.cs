using System;
using System.Linq;
using nadena.dev.modular_avatar.core;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Vua.Editor.Bridge.Tests
{
    internal sealed class BridgeMutationTests
    {
        private const string TestFolder = "Assets/VuaBridgeSyntheticTests";
        private string scenePath;

        [SetUp]
        public void SetUp()
        {
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
            if (!string.IsNullOrWhiteSpace(scenePath)) AssetDatabase.DeleteAsset(scenePath);
            if (AssetDatabase.IsValidFolder(TestFolder)) AssetDatabase.DeleteAsset(TestFolder);
        }

        [Test]
        public void OutfitAndToggleMutationsAreSavedAndIdempotent()
        {
            var avatar = new GameObject("Avatar");
            var avatarArmature = Child(avatar, "Armature");
            Child(avatarArmature, "Hips");
            var outfit = new GameObject("Outfit");
            var outfitArmature = Child(outfit, "Armature");
            Child(outfitArmature, "Hips");
            Assert.That(EditorSceneManager.SaveScene(SceneManager.GetActiveScene(), scenePath), Is.True);

            var payload = new BridgePayload
            {
                avatarGlobalObjectId = Id(avatar),
                avatarArmatureGlobalObjectId = Id(avatarArmature),
                outfitGlobalObjectId = Id(outfit),
                outfitArmatureGlobalObjectId = Id(outfitArmature),
                toggleName = "Synthetic Outfit"
            };
            var runId = Guid.NewGuid().ToString("N");
            var install = BridgeCommandProcessor.Process(Command(
                "install_outfit", payload, ProjectFingerprint.Compute(), runId + "-install"));

            Assert.That(install.status, Is.EqualTo("succeeded"));
            Assert.That(outfit.transform.parent, Is.EqualTo(avatar.transform));
            Assert.That(outfitArmature.GetComponent<ModularAvatarMergeArmature>(), Is.Not.Null);

            var toggleCommand = Command(
                "create_toggle", payload, install.data.projectFingerprint, runId + "-toggle-1");
            var firstToggle = BridgeCommandProcessor.Process(toggleCommand);
            Assert.That(firstToggle.status, Is.EqualTo("succeeded"));
            Assert.That(ToggleCount(avatar), Is.EqualTo(1));

            var replay = BridgeCommandProcessor.Process(toggleCommand);
            Assert.That(replay.status, Is.EqualTo("succeeded"));
            Assert.That(replay.diagnostics.Any(value => value.code == "bridge.idempotent_replay"), Is.True);

            var conflictingPayload = new BridgePayload
            {
                avatarGlobalObjectId = payload.avatarGlobalObjectId,
                outfitGlobalObjectId = payload.outfitGlobalObjectId,
                toggleName = "Different request"
            };
            var conflict = BridgeCommandProcessor.Process(Command(
                "create_toggle", conflictingPayload, firstToggle.data.projectFingerprint, runId + "-toggle-1"));
            Assert.That(conflict.status, Is.EqualTo("rejected"));
            Assert.That(conflict.diagnostics[0].code, Is.EqualTo("bridge.command_id_conflict"));

            var repeatedToggle = BridgeCommandProcessor.Process(Command(
                "create_toggle", payload, firstToggle.data.projectFingerprint, runId + "-toggle-2"));
            Assert.That(repeatedToggle.status, Is.EqualTo("succeeded"));
            Assert.That(ToggleCount(avatar), Is.EqualTo(1));
        }

        private static BridgeCommand Command(
            string operation,
            BridgePayload payload,
            string fingerprint,
            string commandId)
        {
            return new BridgeCommand
            {
                schemaVersion = 1,
                commandId = commandId,
                operation = operation,
                projectId = "synthetic-project",
                dryRun = false,
                expectedProjectFingerprint = fingerprint,
                payload = payload
            };
        }

        private static GameObject Child(GameObject parent, string name)
        {
            var child = new GameObject(name);
            child.transform.SetParent(parent.transform);
            return child;
        }

        private static string Id(GameObject value) =>
            GlobalObjectId.GetGlobalObjectIdSlow(value).ToString();

        private static int ToggleCount(GameObject avatar) =>
            avatar.transform.Cast<Transform>().Count(child => child.name == "VUA Toggle - Synthetic Outfit");
    }
}
