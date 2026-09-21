using System;
using System.IO;
using NUnit.Framework;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Vua.Editor.Bridge.Tests
{
    internal sealed class BridgeV4ReceiptTests
    {
        private static BridgeCommand Command(string operation = "build_preview") => new BridgeCommand
        {
            schemaVersion = 4, commandId = "v4-receipt-" + Guid.NewGuid().ToString("N"),
            projectId = "synthetic", operation = operation, dryRun = true,
            payload = new BridgePayload { planHash = "sha256:" + new string('a', 64),
                snapshotId = "synthetic-snapshot", planSchemaVersion = "0.3", planRef = ".vua/bridge/approved-plan.json" }
        };
        private static void Record(string name, BridgeCommand command, BridgeResult result, string code)
        {
            Assert.That(result.schemaVersion, Is.EqualTo(4));
            Assert.That(result.operation, Is.EqualTo(command.operation));
            Assert.That(result.diagnostics[0].code, Is.EqualTo(code));
            var output = Path.Combine(Directory.GetCurrentDirectory(), ".vua/bridge/v4-test-receipts");
            Directory.CreateDirectory(output);
            File.WriteAllText(Path.Combine(output, name + ".json"), BridgeResultJson.Serialize(result));
        }
        [TestCase("inspect_project")]
        [TestCase("import_unity_package")]
        [TestCase("materialize_extracted_package")]
        [TestCase("create_local_vpm_package")]
        [TestCase("validate_asset_paths")]
        [TestCase("identify_assets")]
        [TestCase("install_outfit")]
        [TestCase("create_toggle")]
        [TestCase("validate_avatar")]
        [TestCase("analyze_performance")]
        [TestCase("execute_production_job")]
        [TestCase("restore_project")]
        [TestCase("inspect_avatar_references")]
        [TestCase("inspect_lighting")]
        [TestCase("inspect_upload_readiness")]
        [TestCase("build_preview")]
        public void UnsupportedEditorEchoesEveryV4Operation(string operation)
        {
            var command = Command(operation);
            Record("editor-" + operation, command, BridgeCommandProcessor.Process(command, "2022.3.6f1"),
                "bridge.editor_version_unsupported");
        }
        [Test]
        public void PublicRejectionsAndExceptionsSerializeV4()
        {
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var command = Command();
            command.payload.planHash = ""; // genuinely absent optional hashes must be omitted
            command.dryRun = false;
            Record("fingerprint-required", command, BridgeCommandProcessor.Process(command), "bridge.fingerprint_required");
            command.expectedProjectFingerprint = "stale";
            Record("stale", command, BridgeCommandProcessor.Process(command), "bridge.stale_project");
            command.expectedProjectFingerprint = ProjectFingerprint.Compute();
            var path = Path.Combine(Directory.GetCurrentDirectory(), ".vua/bridge/completed", command.commandId + ".json");
            Directory.CreateDirectory(Path.GetDirectoryName(path));
            var prior = BridgeResult.Success(command);
            prior.data.commandFingerprint = "sha256:" + new string('0', 64);
            prior.diagnostics.Add(BridgeDiagnostic.Info("preview.baked", "Synthetic receipt"));
            File.WriteAllText(path, BridgeResultJson.Serialize(prior));
            Record("id-conflict", command, BridgeCommandProcessor.Process(command), "bridge.command_id_conflict");
            File.WriteAllText(path, "not JSON");
            Record("outer-exception", command, BridgeCommandProcessor.Process(command), "bridge.unhandled");
            File.Delete(path);
            var request = Path.Combine(Directory.GetCurrentDirectory(), ".vua/bridge/v4-test-request.json");
            File.WriteAllText(request, JsonUtility.ToJson(command));
            Record("entry-exception", command, BridgeEntryPoint.ReadAndProcess(request,
                _ => throw new IOException("synthetic entry exception")), "bridge.entry_failed");
            Record("no-avatar", command, BridgeCommandProcessor.Process(command), "preview.no_avatar");
            var avatar = new GameObject("receipt-avatar");
            avatar.AddComponent<SkinnedMeshRenderer>();
            var output = Path.Combine(Directory.GetCurrentDirectory(), ".vua/bridge/preview", command.commandId);
            Directory.CreateDirectory(Path.GetDirectoryName(output));
            File.WriteAllText(output, "synthetic path obstruction");
            try
            {
                command.expectedProjectFingerprint = ProjectFingerprint.Compute();
                Record("inner-exception", command, BridgeCommandProcessor.Process(command), "bridge.unhandled");
            }
            finally { UnityEngine.Object.DestroyImmediate(avatar); File.Delete(output); }
        }
        [Test]
        public void ProductionEntryFailureDoesNotInventSnapshotData()
        {
            var command = Command("execute_production_job");
            command.dryRun = false;
            command.expectedProjectFingerprint = ProjectFingerprint.Compute();
            var request = Path.Combine(Directory.GetCurrentDirectory(), ".vua/bridge/v4-production-request.json");
            File.WriteAllText(request, JsonUtility.ToJson(command));
            var result = BridgeEntryPoint.ReadAndProcess(request, _ => throw new IOException("synthetic failure"));
            Record("production-entry-exception", command, result, "bridge.entry_failed");
            StringAssert.DoesNotContain("snapshotId", BridgeResultJson.Serialize(result));
        }
        [Test]
        public void LegacyOuterExceptionStillBelongsToEntryBoundary()
        {
            var command = Command("install_outfit"); command.schemaVersion = 1;
            var receipt = Path.Combine(Directory.GetCurrentDirectory(), ".vua/bridge/completed", command.commandId + ".json");
            Directory.CreateDirectory(Path.GetDirectoryName(receipt));
            File.WriteAllText(receipt, "invalid JSON");
            try { Assert.Throws<ArgumentException>(() => BridgeCommandProcessor.Process(command)); }
            finally { File.Delete(receipt); }
        }
        [TestCase(1)] [TestCase(2)] [TestCase(3)]
        public void LegacyRejectionsKeepTheirWireRepresentation(int version)
        {
            var command = Command("inspect_project"); command.schemaVersion = version;
            var result = BridgeCommandProcessor.Process(command, "unsupported");
            Assert.That(result.schemaVersion, Is.EqualTo(1));
            Assert.That(result.operation, Is.Empty);
            Assert.That(BridgeResultJson.Serialize(result), Is.EqualTo(JsonUtility.ToJson(result, true)));
        }
    }
}
