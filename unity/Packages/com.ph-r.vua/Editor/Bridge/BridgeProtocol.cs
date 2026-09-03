using System;
using System.Collections.Generic;

namespace Vua.Editor.Bridge
{
    [Serializable]
    internal sealed class BridgePackageDependency
    {
        public string packageId = string.Empty;
        public string version = string.Empty;
    }

    [Serializable]
    internal sealed class BridgePayload
    {
        public string avatarGlobalObjectId = string.Empty;
        public string avatarArmatureGlobalObjectId = string.Empty;
        public string outfitGlobalObjectId = string.Empty;
        public string outfitArmatureGlobalObjectId = string.Empty;
        public string toggleName = string.Empty;
        public string sourcePackagePath = string.Empty;
        public string sourcePackageSha256 = string.Empty;
        public string packageId = string.Empty;
        public string packageDisplayName = string.Empty;
        public string packageVersion = string.Empty;
        public List<BridgePackageDependency> packageDependencies = new List<BridgePackageDependency>();
        public string stagingToken = string.Empty;
        public List<string> expectedAssetPaths = new List<string>();
    }

    [Serializable]
    internal sealed class BridgeCommand
    {
        public int schemaVersion = 1;
        public string commandId = string.Empty;
        public string operation = string.Empty;
        public string projectId = string.Empty;
        public bool dryRun;
        public string expectedProjectFingerprint = string.Empty;
        public BridgePayload payload = new BridgePayload();
    }

    [Serializable]
    internal sealed class BridgeDiagnostic
    {
        public string code = string.Empty;
        public string severity = "info";
        public string message = string.Empty;

        public static BridgeDiagnostic Info(string code, string message) =>
            new BridgeDiagnostic { code = code, message = message };

        public static BridgeDiagnostic Error(string code, string message) =>
            new BridgeDiagnostic { code = code, severity = "error", message = message };
    }

    [Serializable]
    internal sealed class BridgeData
    {
        public string projectFingerprint = string.Empty;
        public string avatarName = string.Empty;
        public string outfitName = string.Empty;
        public string basis = string.Empty;
        public int triangles;
        public int materialSlots;
        public int skinnedMeshRenderers;
        public int bones;
        public List<string> recommendations = new List<string>();
        public List<string> importedAssetPaths = new List<string>();
        public string packageRoot = string.Empty;
        public List<string> loadedAssetPaths = new List<string>();
        public string commandFingerprint = string.Empty;
    }

    [Serializable]
    internal sealed class BridgeResult
    {
        public int schemaVersion = 1;
        public string commandId = string.Empty;
        public string status = "rejected";
        public List<string> changedPaths = new List<string>();
        public List<BridgeDiagnostic> diagnostics = new List<BridgeDiagnostic>();
        public BridgeData data = new BridgeData();

        public static BridgeResult Success(BridgeCommand command) => new BridgeResult
        {
            commandId = command.commandId,
            status = "succeeded"
        };

        public static BridgeResult Reject(BridgeCommand command, string code, string message) => new BridgeResult
        {
            commandId = CorrelationId(command),
            status = "rejected",
            diagnostics = new List<BridgeDiagnostic> { BridgeDiagnostic.Error(code, message) }
        };

        public static BridgeResult Fail(BridgeCommand command, string code, string message) => new BridgeResult
        {
            commandId = CorrelationId(command),
            status = "failed",
            diagnostics = new List<BridgeDiagnostic> { BridgeDiagnostic.Error(code, message) }
        };

        private static string CorrelationId(BridgeCommand command) =>
            command == null || string.IsNullOrWhiteSpace(command.commandId) ? "unknown" : command.commandId;
    }
}
