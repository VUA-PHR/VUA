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
        public string manifestSha256 = string.Empty;
        public string packageId = string.Empty;
        public string packageDisplayName = string.Empty;
        public string packageVersion = string.Empty;
        public List<BridgePackageDependency> packageDependencies = new List<BridgePackageDependency>();
        public string stagingToken = string.Empty;
        public List<string> expectedAssetPaths = new List<string>();
        // v2 (unity-bridge v2, proposal 009): production-job and restore inputs.
        public string planHash = string.Empty;
        public string planSchemaVersion = string.Empty;
        public string planRef = string.Empty;
        public string snapshotId = string.Empty;
    }

    [Serializable]
    internal sealed class BridgeResolvedSource
    {
        public string sourceKind = string.Empty; // original | generated_vpm
        public string artifactSha256 = string.Empty;
        public string warehouseItemId = string.Empty; // empty = null (no warehouse item)
    }

    // objectSelector v0.2 form: selectorId plus (catalogEntryId or pathHint).
    [Serializable]
    internal sealed class BridgeObjectSelector
    {
        public string selectorId = string.Empty;
        public string catalogEntryId = string.Empty;
        public List<string> pathHint = new List<string>();
    }

    [Serializable]
    internal sealed class BridgeLocalTransform
    {
        public float px;
        public float py;
        public float pz;
        public float qx;
        public float qy;
        public float qz;
        public float qw = 1f;
        public float sx = 1f;
        public float sy = 1f;
        public float sz = 1f;
    }

    [Serializable]
    internal sealed class BridgeStep
    {
        public string kind = string.Empty; // vocabulary owned by the approved-plan schema (recipe v0.3)
        public string status = "pending";  // pending | executed | failed | skipped
        public string warning = string.Empty;
        public BridgeResolvedSource resolvedSource;
    }

    // Approved-plan document (job-directory file form; recipe v0.3). Only the
    // fields the Bridge consumes are mapped — the plan schema remains the
    // single authority (reference, do not copy).
    [Serializable]
    internal sealed class BridgePlanJob
    {
        public string jobId = string.Empty;
        public string kind = string.Empty;
        public BridgeResolvedSource resolvedSource;
        // Flattened execution inputs (vocabulary follows kind); fields that do
        // not apply to a given kind stay empty and are ignored.
        public string assetId = string.Empty;
        public string selectorId = string.Empty;
        public string bone = string.Empty;
        public string objectPath = string.Empty;
        public bool active;
        public BridgeLocalTransform localTransform;
        public BridgeObjectSelector selector;
        public string sourcePackagePath = string.Empty;
        public string sourcePackageSha256 = string.Empty;
        public string manifestSha256 = string.Empty;
        public List<string> expectedAssetPaths = new List<string>();
    }

    [Serializable]
    internal sealed class BridgePlanTarget
    {
        public string avatarInstanceId = string.Empty;
    }

    [Serializable]
    internal sealed class BridgePlanDocument
    {
        public string schemaVersion = string.Empty;
        public string planId = string.Empty;
        public BridgePlanTarget target = new BridgePlanTarget();
        public List<BridgePlanJob> jobs = new List<BridgePlanJob>();
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

        public static BridgeDiagnostic Warning(string code, string message) =>
            new BridgeDiagnostic { code = code, severity = "warning", message = message };

        public static BridgeDiagnostic Error(string code, string message) =>
            new BridgeDiagnostic { code = code, severity = "error", message = message };
    }

    [Serializable]
    internal sealed class BridgeData
    {
        public string projectFingerprint = string.Empty;
        public string projectFingerprintBefore = string.Empty;
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
        // v2: production-job and restore receipts (unity-bridge v2).
        public bool replayed;
        public bool dryRun;
        public string planHash = string.Empty;
        public List<BridgeStep> steps = new List<BridgeStep>();
        public string snapshotId = string.Empty;
        public string restoredFrom = string.Empty;
        // 011 §成功判定: the receipt of an install_modular_asset job carries
        // the GlobalObjectId of the instantiated instance root. Reserved at
        // aa2a9da, wired for real in the M7 inspection slice (v3), and
        // legalized in the unity-bridge v3 result.data (proposal 016). The
        // production face migrated to v3 (receipt version echoes the command
        // version), so v3 receipts carry the field legally; a v2-labeled
        // receipt only occurs for a v2 command from a pre-migration provider
        // (declared v2 transition drift — JsonUtility emits every public
        // field; the frozen v2 schema does not carry this field, see
        // proposal 016).
        public string instanceGlobalObjectId = string.Empty;
    }

    [Serializable]
    internal sealed class BridgeResult
    {
        public int schemaVersion = 1;
        public string commandId = string.Empty;
        public string operation = string.Empty;
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
