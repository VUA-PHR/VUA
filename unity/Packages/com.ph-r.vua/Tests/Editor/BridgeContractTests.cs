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
