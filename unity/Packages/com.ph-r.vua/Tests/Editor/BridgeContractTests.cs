using System;
using System.IO;
using NUnit.Framework;
using UnityEngine;

namespace Vua.Editor.Bridge.Tests
{
    internal sealed class BridgeContractTests
    {
        [Test]
        public void NullCommandUsesSchemaValidFallbackCorrelationId()
        {
            var result = BridgeCommandProcessor.Process(null);

            Assert.That(result.status, Is.EqualTo("rejected"));
            Assert.That(result.commandId, Is.EqualTo("unknown"));
            Assert.That(result.diagnostics[0].code, Is.EqualTo("bridge.invalid_json"));
        }

        [Test]
        public void CanonicalInspectFixtureUsesTheCSharpWireNames()
        {
            const string json = "{\"schemaVersion\":1,\"commandId\":\"01K45VUA000000000000000001\"," +
                                "\"operation\":\"inspect_project\",\"projectId\":\"local-project-01\"," +
                                "\"dryRun\":true,\"payload\":{}}";

            var command = JsonUtility.FromJson<BridgeCommand>(json);

            Assert.That(command.schemaVersion, Is.EqualTo(1));
            Assert.That(command.commandId, Is.EqualTo("01K45VUA000000000000000001"));
            Assert.That(command.operation, Is.EqualTo("inspect_project"));
            Assert.That(command.projectId, Is.EqualTo("local-project-01"));
            Assert.That(command.dryRun, Is.True);
            Assert.That(command.payload, Is.Not.Null);
        }

        [Test]
        public void RejectsUnknownOperation()
        {
            var result = BridgeCommandProcessor.Process(Command("unknown", true));

            Assert.That(result.status, Is.EqualTo("rejected"));
            Assert.That(result.diagnostics[0].code, Is.EqualTo("bridge.operation_not_allowed"));
        }

        [Test]
        public void RejectsReadOnlyOperationWithoutDryRun()
        {
            var result = BridgeCommandProcessor.Process(Command("inspect_project", false));

            Assert.That(result.status, Is.EqualTo("rejected"));
            Assert.That(result.diagnostics[0].code, Is.EqualTo("bridge.dry_run_required"));
        }

        [Test]
        public void RejectsMutationWithoutFingerprint()
        {
            var result = BridgeCommandProcessor.Process(Command("create_toggle", false));

            Assert.That(result.status, Is.EqualTo("rejected"));
            Assert.That(result.diagnostics[0].code, Is.EqualTo("bridge.fingerprint_required"));
        }

        [Test]
        public void ImportRejectsMissingSourceBeforeMutation()
        {
            var command = Command("import_unity_package", false);
            command.expectedProjectFingerprint = ProjectFingerprint.Compute();
            command.payload.sourcePackagePath = Path.Combine(Path.GetTempPath(), Guid.NewGuid() + ".unitypackage");
            command.payload.sourcePackageSha256 = "sha256:" + new string('0', 64);

            var result = BridgeCommandProcessor.Process(command);

            Assert.That(result.status, Is.EqualTo("rejected"));
            Assert.That(result.diagnostics[0].code, Is.EqualTo("package.source_missing"));
        }

        [Test]
        public void LocalPackageCreationRejectsOrdinaryProjectWithoutStagingToken()
        {
            var command = Command("create_local_vpm_package", false);
            command.expectedProjectFingerprint = ProjectFingerprint.Compute();
            command.payload.packageId = "com.example.fixture";
            command.payload.packageDisplayName = "Fixture";
            command.payload.packageVersion = "0.0.1";
            command.payload.stagingToken = "not-present";

            var result = BridgeCommandProcessor.Process(command);

            Assert.That(result.status, Is.EqualTo("rejected"));
            Assert.That(result.diagnostics[0].code, Is.EqualTo("vpm.staging_required"));
        }

        [TestCase("2022.3.22f1c1")]
        [TestCase("2022.3.6f1")]
        [TestCase("2023.2.20f1")]
        [TestCase("")]
        public void RejectsEveryEditorVersionOtherThanTheExactProductionTarget(string editorVersion)
        {
            var result = BridgeCommandProcessor.Process(Command("inspect_project", true), editorVersion);

            Assert.That(result.status, Is.EqualTo("rejected"));
            Assert.That(result.changedPaths, Is.Empty);
            Assert.That(result.diagnostics[0].code, Is.EqualTo("bridge.editor_version_unsupported"));
            Assert.That(result.diagnostics[0].message, Does.Contain(BridgeCommandProcessor.SupportedEditorVersion));
        }

        [Test]
        public void UnsupportedEditorRejectsMutationBeforeProjectAccess()
        {
            var command = Command("create_toggle", false);
            command.expectedProjectFingerprint = "v1:synthetic";

            var result = BridgeCommandProcessor.Process(command, "2022.3.6f1");

            Assert.That(result.status, Is.EqualTo("rejected"));
            Assert.That(result.changedPaths, Is.Empty);
            Assert.That(result.diagnostics[0].code, Is.EqualTo("bridge.editor_version_unsupported"));
        }

        [Test]
        public void BridgePathAcceptsOnlyProjectJobDirectory()
        {
            var projectRoot = Path.GetFullPath(Path.Combine(Application.dataPath, ".."));
            var accepted = Path.Combine(projectRoot, ".vua", "bridge", "command.request.json");
            var rejected = Path.Combine(projectRoot, "command.request.json");

            Assert.That(BridgeEntryPoint.SafeBridgePath(accepted), Is.EqualTo(Path.GetFullPath(accepted)));
            Assert.Throws<UnauthorizedAccessException>(() => BridgeEntryPoint.SafeBridgePath(rejected));
        }

        private static BridgeCommand Command(string operation, bool dryRun)
        {
            return new BridgeCommand
            {
                schemaVersion = 1,
                commandId = "test-command",
                operation = operation,
                projectId = "test-project",
                dryRun = dryRun,
                payload = new BridgePayload()
            };
        }
    }
}
