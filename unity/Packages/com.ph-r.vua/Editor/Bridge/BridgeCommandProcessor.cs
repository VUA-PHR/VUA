using System;
using System.Reflection;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.IO;
using System.Text.RegularExpressions;
using System.Text;
using nadena.dev.modular_avatar.core;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Vua.Editor.Bridge
{
    internal static class BridgeCommandProcessor
    {
        internal const string SupportedEditorVersion = "2022.3.22f1";

        internal static BridgeResult Process(BridgeCommand command)
        {
            return Process(command, Application.unityVersion);
        }

        internal static BridgeResult Process(BridgeCommand command, string editorVersion)
        {
            var invalid = ValidateEnvelope(command);
            if (invalid != null) return invalid;

            if (!string.Equals(editorVersion, SupportedEditorVersion, StringComparison.Ordinal))
            {
                var actualVersion = string.IsNullOrWhiteSpace(editorVersion) ? "unknown" : editorVersion;
                return BridgeResult.Reject(command, "bridge.editor_version_unsupported",
                    $"当前 Unity Editor 版本为 {actualVersion}；Unity Bridge v1 仅支持 {SupportedEditorVersion}。");
            }

            if (IsMutating(command.operation) && TryReadReceipt(command, out var repeated))
            {
                if (!string.Equals(repeated.data.commandFingerprint, CommandFingerprint(command), StringComparison.Ordinal))
                {
                    return BridgeResult.Reject(command, "bridge.command_id_conflict",
                        "相同 commandId 已绑定到不同请求，请重新规划。");
                }
                repeated.diagnostics.Add(BridgeDiagnostic.Info("bridge.idempotent_replay",
                    "相同 commandId 已完成；返回既有结果，未重复执行副作用。"));
                return repeated;
            }

            try
            {
                var currentFingerprint = ProjectFingerprint.Compute();
                if (!string.IsNullOrWhiteSpace(command.expectedProjectFingerprint) &&
                    command.expectedProjectFingerprint != currentFingerprint)
                {
                    return BridgeResult.Reject(command, "bridge.stale_project",
                        "Unity 项目已经发生变化，请重新检查后再执行。");
                }

                BridgeResult result;
                switch (command.operation)
                {
                    case "inspect_project":
                        result = InspectProject(command);
                        break;
                    case "import_unity_package":
                        result = ImportUnityPackage(command);
                        break;
                    case "materialize_extracted_package":
                        result = MaterializeExtractedPackage(command);
                        break;
                    case "create_local_vpm_package":
                        result = CreateLocalVpmPackage(command);
                        break;
                    case "validate_asset_paths":
                        result = ValidateAssetPaths(command);
                        break;
                    case "identify_assets":
                        result = IdentifyAssets(command);
                        break;
                    case "install_outfit":
                        result = InstallOutfit(command);
                        break;
                    case "create_toggle":
                        result = CreateToggle(command);
                        break;
                    case "validate_avatar":
                        result = ValidateAvatar(command);
                        break;
                    case "analyze_performance":
                        result = AnalyzePerformance(command);
                        break;
                    case "execute_production_job":
                        result = ExecuteProductionJob(command);
                        break;
                    case "restore_project":
                        result = RestoreProject(command);
                        break;
                    case "inspect_avatar_references":
                        result = InspectAvatarReferences(command);
                        break;
                    case "inspect_lighting":
                        result = InspectLighting(command);
                        break;
                    case "inspect_upload_readiness":
                        result = InspectUploadReadiness(command);
                        break;
                    case "build_preview":
                        result = BridgePreviewBake.Bake(command);
                        break;
                    default:
                        return BridgeResult.Reject(command, "bridge.operation_not_allowed", "该操作不在允许列表中。");
                }

                if (result.status == "succeeded" && IsMutating(command.operation))
                {
                    AssetDatabase.SaveAssets();
                    // build_preview 刻意跳过场景保存:烘焙全程在 preview scene
                    // 隔离内进行(BridgePreviewBake),用户场景从未被本操作弄脏;
                    // 即使用户场景自带未保存改动,一次预览烘焙也绝不可以替用户
                    // 保存——用户场景必须零改动(用户裁决 2026-09-20)。
                    if (command.operation != "build_preview")
                    {
                        var scene = SceneManager.GetActiveScene();
                        if (scene.IsValid() && scene.isDirty)
                        {
                            if (string.IsNullOrWhiteSpace(scene.path) || !EditorSceneManager.SaveScene(scene))
                            {
                                return BridgeResult.Fail(command, "bridge.scene_save_failed",
                                    "Unity 场景无法保存，本次操作未记录为成功。");
                            }
                        }
                    }
                }
                result.data.projectFingerprint = ProjectFingerprint.Compute();
                if (result.status == "succeeded" && IsMutating(command.operation))
                {
                    result.data.commandFingerprint = CommandFingerprint(command);
                    WriteReceipt(command, result);
                }
                return result;
            }
            catch (Exception exception)
            {
                var stackTop = (exception.StackTrace ?? "").Split('\n').FirstOrDefault()?.Trim() ?? "";
                return BridgeResult.Fail(command, "bridge.unhandled",
                    exception.GetType().Name + "：" + exception.Message + " @ " + stackTop);
            }
        }

        private static bool IsMutating(string operation)
        {
            return operation == "import_unity_package" ||
                   operation == "materialize_extracted_package" ||
                   operation == "create_local_vpm_package" ||
                   operation == "install_outfit" || operation == "create_toggle" ||
                   operation == "execute_production_job" || operation == "restore_project" ||
                   // v4 (slice/production-nav-bake-preview, 用户裁决 2026-09-20):
                   // 产物写入工程目录(.vua/bridge/preview/)即副作用,按 mutating
                   // 落信封纪律;preview scene 隔离保证用户场景零改动。
                   operation == "build_preview";
        }

        private static bool IsInspection(string operation)
        {
            return operation == "inspect_avatar_references" ||
                   operation == "inspect_lighting" ||
                   operation == "inspect_upload_readiness";
        }

        private static BridgeResult ImportUnityPackage(BridgeCommand command)
        {
            // 原语义保留：接收 .unitypackage 绝对路径并校验 SHA-256。已知
            // 限制（2026-09-04 实测）：-batchmode 下 ImportPackage 静默
            // 空操作；batchmode 执行请改用 materialize_extracted_package。
            var source = command.payload.sourcePackagePath;
            if (string.IsNullOrWhiteSpace(source) || !Path.IsPathRooted(source) || !File.Exists(source))
            {
                return BridgeResult.Reject(command, "package.source_missing", "找不到待导入的 Unity Package。");
            }
            if (!string.Equals(Path.GetExtension(source), ".unitypackage", StringComparison.OrdinalIgnoreCase))
            {
                return BridgeResult.Reject(command, "package.source_type_invalid", "来源文件不是 .unitypackage。");
            }
            var actualDigest = FileSha256(source);
            if (string.IsNullOrWhiteSpace(command.payload.sourcePackageSha256) ||
                !string.Equals(actualDigest, command.payload.sourcePackageSha256, StringComparison.OrdinalIgnoreCase))
            {
                return BridgeResult.Reject(command, "package.source_drift", "来源包摘要已变化，请重新检查。");
            }
            if (command.dryRun)
            {
                var dryRun = BridgeResult.Success(command);
                dryRun.diagnostics.Add(BridgeDiagnostic.Info("package.import_ready", "来源包可读取，尚未导入。"));
                return dryRun;
            }
            var before = new HashSet<string>(AssetDatabase.GetAllAssetPaths(), StringComparer.Ordinal);
            AssetDatabase.ImportPackage(source, false);
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
            var imported = AssetDatabase.GetAllAssetPaths()
                .Where(path => path.StartsWith("Assets/", StringComparison.Ordinal) && !before.Contains(path))
                .OrderBy(path => path, StringComparer.Ordinal)
                .ToList();
            var result = BridgeResult.Success(command);
            result.changedPaths.AddRange(imported);
            result.data.importedAssetPaths.AddRange(imported);
            result.diagnostics.Add(BridgeDiagnostic.Info("package.import_debug",
                $"beforeAssets={before.Count} afterAssets={AssetDatabase.GetAllAssetPaths().Length} imported={imported.Count}"));
            result.diagnostics.Add(BridgeDiagnostic.Info("package.imported", "Unity Package 已完成受控导入。"));
            return result;
        }

        private static BridgeResult MaterializeExtractedPackage(BridgeCommand command)
        {
            // The caller extracts the .unitypackage (tar.gz of guid folders)
            // under .vua/imports/<commandId>/ — Unity's own ImportPackage is
            // a silent no-op in batchmode, so this op MATERIALIZES that
            // extracted layout into Assets/ and refreshes the database.
            var extractedRoot = command.payload.sourcePackagePath;
            if (string.IsNullOrWhiteSpace(extractedRoot) || !Directory.Exists(extractedRoot))
            {
                return BridgeResult.Reject(command, "package.source_missing", "找不到待物化的解包目录。");
            }
            var manifestLines = new Dictionary<string, string>(StringComparer.Ordinal);
            var manifestPath = Path.Combine(extractedRoot, "manifest.sha256");
            if (!File.Exists(manifestPath))
            {
                return BridgeResult.Reject(command, "package.manifest_missing", "解包目录缺少 manifest.sha256。");
            }
            // The manifest lives in the same editable directory as the files
            // it describes; verify its OWN digest (bound into the command by
            // the caller) before trusting a single entry.
            if (string.IsNullOrWhiteSpace(command.payload.manifestSha256) ||
                !string.Equals(FileSha256(manifestPath), command.payload.manifestSha256, StringComparison.OrdinalIgnoreCase))
            {
                return BridgeResult.Reject(command, "package.manifest_drift", "解包清单自身摘要不符，解包内容可能在检查后被替换。");
            }
            foreach (var line in File.ReadAllLines(manifestPath))
            {
                var separator = line.IndexOf("  ", StringComparison.Ordinal);
                if (separator <= 0)
                {
                    continue;
                }
                var manifestKey = line.Substring(separator + 2);
                manifestLines[manifestKey] = line.Substring(0, separator);
            }

            var before = new HashSet<string>(AssetDatabase.GetAllAssetPaths(), StringComparer.Ordinal);
            var imported = new List<string>();
            foreach (var guidDir in Directory.GetDirectories(extractedRoot))
            {
                var pathnamePath = Path.Combine(guidDir, "pathname");
                if (!File.Exists(pathnamePath))
                {
                    continue;
                }
                var logical = File.ReadAllText(pathnamePath).Trim().Replace("\\", "/");
                if (!logical.StartsWith("Assets/", StringComparison.Ordinal) &&
                    !logical.StartsWith("Packages/", StringComparison.Ordinal))
                {
                    continue;
                }
                var target = Path.Combine(ProjectRoot(), logical.Replace('/', Path.DirectorySeparatorChar));
                var assetPath = Path.Combine(guidDir, "asset");
                var metaPath = Path.Combine(guidDir, "asset.meta");
                if (File.Exists(assetPath))
                {
                    // Regular asset: verify then copy the payload bytes.
                    VerifyAgainstManifest(manifestLines, extractedRoot,
                        Path.Combine(guidDir, "asset"));
                    Directory.CreateDirectory(Path.GetDirectoryName(target) ?? ProjectRoot());
                    File.Copy(assetPath, target, true);
                }
                else
                {
                    // Folder asset: no payload file exists in the archive.
                    Directory.CreateDirectory(target);
                }
                if (File.Exists(metaPath))
                {
                    VerifyAgainstManifest(manifestLines, extractedRoot,
                        Path.Combine(guidDir, "asset.meta"));
                    File.Copy(metaPath, target + ".meta", true);
                }
                imported.Add(logical);
            }
            imported.Sort(StringComparer.Ordinal);
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
            var result = BridgeResult.Success(command);
            result.changedPaths.AddRange(imported);
            result.data.importedAssetPaths.AddRange(imported);
            // Empirical probe: ImportPackage is a silent no-op in some
            // batchmode contexts; surface the counters so the caller can see
            // exactly what happened instead of a lying "success".
            var afterAssets = AssetDatabase.GetAllAssetPaths().Length;
            result.diagnostics.Add(BridgeDiagnostic.Info("package.import_debug",
                $"beforeAssets={before.Count} afterAssets={afterAssets} imported={imported.Count}"));
            result.diagnostics.Add(BridgeDiagnostic.Info("package.imported", "Unity Package 已完成受控导入。"));
            return result;
        }

        private static BridgeResult CreateLocalVpmPackage(BridgeCommand command)
        {
            if (!ValidPackageId(command.payload.packageId) || string.IsNullOrWhiteSpace(command.payload.packageDisplayName) ||
                string.IsNullOrWhiteSpace(command.payload.packageVersion))
            {
                return BridgeResult.Reject(command, "vpm.manifest_invalid", "本地 VPM 包身份或版本无效。");
            }
            var marker = Path.Combine(ProjectRoot(), ".vua", "staging.json");
            if (!File.Exists(marker) || string.IsNullOrWhiteSpace(command.payload.stagingToken) ||
                !string.Equals(File.ReadAllText(marker).Trim(), command.payload.stagingToken, StringComparison.Ordinal))
            {
                return BridgeResult.Reject(command, "vpm.staging_required", "该操作只允许在 VUA 暂存项目中执行。");
            }
            var packageRoot = "Packages/" + command.payload.packageId;
            if (AssetDatabase.IsValidFolder(packageRoot))
            {
                return BridgeResult.Reject(command, "vpm.package_root_exists", "目标本地包目录已经存在。");
            }
            if (command.dryRun)
            {
                var dryRun = BridgeResult.Success(command);
                dryRun.data.packageRoot = packageRoot;
                dryRun.diagnostics.Add(BridgeDiagnostic.Info("vpm.creation_ready", "暂存项目可转换为本地 VPM 包。"));
                return dryRun;
            }

            // 暂存项目是一次性容器：包布局直接在文件系统层组装，最后统一
            // Refresh。AssetDatabase 的 Move/Copy 不能跨包边界（Assets 与
            // Packages/<id> 对 AssetDatabase 是两个包）。
            var packageRootFs = Path.Combine(ProjectRoot(), packageRoot.Replace('/', Path.DirectorySeparatorChar));
            Directory.CreateDirectory(Path.Combine(packageRootFs, "Runtime"));
            var changed = new List<string>();
            var assetsRoot = Path.Combine(ProjectRoot(), "Assets");
            var allEntries = Directory.GetFileSystemEntries(assetsRoot)
                .OrderBy(entry => entry, StringComparer.Ordinal).ToList();
            var directories = allEntries.Where(entry => Directory.Exists(entry)).ToList();
            var files = allEntries.Where(entry => File.Exists(entry) &&
                !entry.EndsWith(".meta", StringComparison.OrdinalIgnoreCase)).ToList();
            foreach (var entry in directories)
            {
                var name = Path.GetFileName(entry);
                if (name.Equals("Editor", StringComparison.OrdinalIgnoreCase))
                {
                    MoveFileSystemEntry(entry, Path.Combine(packageRootFs, "Editor"));
                    changed.Add(packageRoot + "/Editor");
                    continue;
                }
                MoveFileSystemEntry(entry, Path.Combine(packageRootFs, "Runtime", name));
                changed.Add(packageRoot + "/Runtime/" + name.Replace('\\', '/'));
            }
            foreach (var entry in files)
            {
                var name = Path.GetFileName(entry);
                MoveFileSystemEntry(entry, Path.Combine(packageRootFs, "Runtime", name));
                changed.Add(packageRoot + "/Runtime/" + name.Replace('\\', '/'));
            }
            File.WriteAllText(Path.Combine(ProjectRoot(), packageRoot, "package.json"), PackageManifest(command));
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
            var result = BridgeResult.Success(command);
            result.changedPaths.AddRange(changed);
            result.changedPaths.Add(packageRoot + "/package.json");
            result.data.packageRoot = packageRoot;
            result.diagnostics.Add(BridgeDiagnostic.Info("vpm.package_created", "已生成 local-reusable VPM 包。"));
            return result;
        }

        private static BridgeResult ValidateAssetPaths(BridgeCommand command)
        {
            var expected = command.payload.expectedAssetPaths ?? new List<string>();
            if (expected.Count == 0 || expected.Any(path => string.IsNullOrWhiteSpace(path) ||
                (!path.StartsWith("Assets/", StringComparison.Ordinal) && !path.StartsWith("Packages/", StringComparison.Ordinal))))
            {
                return BridgeResult.Reject(command, "validation.asset_paths_invalid", "最小结构验证缺少有效素材路径。");
            }
            var missing = expected.Where(path => AssetDatabase.LoadMainAssetAtPath(path) == null).ToList();
            if (missing.Count > 0)
            {
                var reject = BridgeResult.Reject(command, "validation.asset_load_failed", "至少一个计划素材无法由 AssetDatabase 加载。");
                reject.diagnostics.Add(BridgeDiagnostic.Error("validation.missing_assets",
                    "missing: " + string.Join("; ", missing)));
                return reject;
            }
            var result = BridgeResult.Success(command);
            result.data.loadedAssetPaths.AddRange(expected.OrderBy(path => path, StringComparer.Ordinal));
            result.diagnostics.Add(BridgeDiagnostic.Info("validation.minimum_structure_passed",
                "计划素材可由 AssetDatabase 加载；该结果不代表 Avatar 或衣装语义正确。"));
            return result;
        }

        private static string PackageManifest(BridgeCommand command)
        {
            var dependencies = command.payload.packageDependencies ?? new List<BridgePackageDependency>();
            var entries = dependencies.OrderBy(value => value.packageId, StringComparer.Ordinal)
                .Select(value => "\"" + JsonEscape(value.packageId) + "\":\"" + JsonEscape(value.version) + "\"");
            return "{\n" +
                   "  \"name\": \"" + JsonEscape(command.payload.packageId) + "\",\n" +
                   "  \"displayName\": \"" + JsonEscape(command.payload.packageDisplayName) + "\",\n" +
                   "  \"version\": \"" + JsonEscape(command.payload.packageVersion) + "\",\n" +
                   "  \"unity\": \"2022.3\",\n" +
                   "  \"vpmDependencies\": {" + string.Join(",", entries) + "}\n" +
                   "}\n";
        }

        /// 移动一个文件或目录（同卷，走文件系统层；失败抛出带原因的异常）。
        private static void MoveFileSystemEntry(string source, string target)
        {
            if (Directory.Exists(source))
            {
                Directory.Move(source, target);
            }
            else if (File.Exists(source))
            {
                File.Move(source, target);
            }
            else
            {
                throw new FileNotFoundException("source entry missing: " + source);
            }
        }

        /// 校验解包文件与 manifest.sha256 记录一致；不一致即失败。
        private static void VerifyAgainstManifest(
            Dictionary<string, string> manifest, string extractedRoot, string relative)
        {
            var rootFullPath = Path.GetFullPath(extractedRoot);
            var manifestKey = Path.GetFullPath(relative)
                .Substring(rootFullPath.Length + 1)
                .Replace(Path.DirectorySeparatorChar, '/');
            if (!manifest.TryGetValue(manifestKey, out var expected))
            {
                throw new FileNotFoundException("解包文件不在清单中，key=" + manifestKey);
            }
            var actual = FileSha256(Path.Combine(extractedRoot, relative));
            if (!string.Equals(actual, expected, StringComparison.OrdinalIgnoreCase))
            {
                throw new FileNotFoundException("摘要不一致，key=" + manifestKey);
            }
        }

        private static string JsonEscape(string value) => (value ?? string.Empty)
            .Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "\\r").Replace("\n", "\\n");

        private static bool ValidPackageId(string value) => !string.IsNullOrWhiteSpace(value) &&
            Regex.IsMatch(value, "^[a-z0-9][a-z0-9._-]{2,127}$", RegexOptions.CultureInvariant);

        private static string ProjectRoot() => Path.GetFullPath(Path.Combine(Application.dataPath, ".."));

        private static string FileSha256(string path)
        {
            using (var stream = File.OpenRead(path))
            using (var sha = SHA256.Create())
            {
                return "sha256:" + BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", string.Empty).ToLowerInvariant();
            }
        }

        private static string CommandFingerprint(BridgeCommand command)
        {
            var bytes = Encoding.UTF8.GetBytes(JsonUtility.ToJson(command, false));
            using (var sha = SHA256.Create())
            {
                return "sha256:" + BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", string.Empty).ToLowerInvariant();
            }
        }

        private static string ReceiptPath(BridgeCommand command) => Path.Combine(
            ProjectRoot(), ".vua", "bridge", "completed", command.commandId + ".json");

        private static bool TryReadReceipt(BridgeCommand command, out BridgeResult result)
        {
            result = null;
            var path = ReceiptPath(command);
            if (!File.Exists(path)) return false;
            result = JsonUtility.FromJson<BridgeResult>(File.ReadAllText(path));
            return result != null && result.commandId == command.commandId && result.status == "succeeded";
        }

        private static void WriteReceipt(BridgeCommand command, BridgeResult result)
        {
            var path = ReceiptPath(command);
            var directory = Path.GetDirectoryName(path);
            if (string.IsNullOrWhiteSpace(directory)) throw new InvalidOperationException("回执路径缺少父目录。");
            Directory.CreateDirectory(directory);
            var temporary = path + ".tmp";
            File.WriteAllText(temporary, JsonUtility.ToJson(result, true));
            if (File.Exists(path)) File.Delete(temporary);
            else File.Move(temporary, path);
        }

        private static BridgeResult InspectProject(BridgeCommand command)
        {
            var result = BridgeResult.Success(command);
            var scene = SceneManager.GetActiveScene();
            if (!scene.IsValid() || !scene.isLoaded)
            {
                return BridgeResult.Reject(command, "project.no_scene", "请先打开包含 Avatar 的场景。");
            }
            result.diagnostics.Add(BridgeDiagnostic.Info("project.ready", "Unity 项目和当前场景可以读取。"));
            return result;
        }

        private static BridgeResult IdentifyAssets(BridgeCommand command)
        {
            if (!TryResolve(command.payload.avatarGlobalObjectId, out var avatar) ||
                !TryResolve(command.payload.outfitGlobalObjectId, out var outfit))
            {
                return BridgeResult.Reject(command, "selection.not_found", "找不到已选择的 Avatar 或衣装，请重新选择。");
            }
            var result = BridgeResult.Success(command);
            result.data.avatarName = avatar.name;
            result.data.outfitName = outfit.name;
            result.diagnostics.Add(BridgeDiagnostic.Info("selection.identified", $"已确认 {avatar.name} 与 {outfit.name}。"));
            return result;
        }

        private static BridgeResult InstallOutfit(BridgeCommand command)
        {
            if (!TryResolve(command.payload.avatarGlobalObjectId, out var avatar) ||
                !TryResolve(command.payload.avatarArmatureGlobalObjectId, out var avatarArmature) ||
                !TryResolve(command.payload.outfitGlobalObjectId, out var outfit) ||
                !TryResolve(command.payload.outfitArmatureGlobalObjectId, out var outfitArmature))
            {
                return BridgeResult.Reject(command, "outfit.selection_incomplete", "Avatar、衣装或 Armature 选择已失效。");
            }
            if (avatar == outfit || avatar.transform.IsChildOf(outfit.transform))
            {
                return BridgeResult.Reject(command, "outfit.invalid_hierarchy", "衣装不能是 Avatar 的父对象。");
            }
            if (command.dryRun)
            {
                var dryRun = BridgeResult.Success(command);
                dryRun.diagnostics.Add(BridgeDiagnostic.Info("outfit.dry_run", "衣装安装检查通过，尚未修改项目。"));
                return dryRun;
            }

            if (!outfit.transform.IsChildOf(avatar.transform))
            {
                Undo.SetTransformParent(outfit.transform, avatar.transform, "VUA: attach outfit");
            }
            var merge = outfitArmature.GetComponent<ModularAvatarMergeArmature>();
            if (merge == null)
            {
                merge = Undo.AddComponent<ModularAvatarMergeArmature>(outfitArmature);
            }
            Undo.RecordObject(merge, "VUA: configure Merge Armature");
            merge.mergeTarget = new AvatarObjectReference(avatarArmature);
            merge.InferPrefixSuffix();
            EditorUtility.SetDirty(merge);
            MarkSceneDirty(avatar.scene);

            var result = BridgeResult.Success(command);
            result.changedPaths.Add(HierarchyPath(outfit));
            result.diagnostics.Add(BridgeDiagnostic.Info("outfit.installed", "已创建并配置 MA Merge Armature。"));
            return result;
        }

        private static BridgeResult CreateToggle(BridgeCommand command)
        {
            if (!TryResolve(command.payload.avatarGlobalObjectId, out var avatar) ||
                !TryResolve(command.payload.outfitGlobalObjectId, out var outfit))
            {
                return BridgeResult.Reject(command, "toggle.selection_incomplete", "Avatar 或衣装选择已失效。");
            }
            if (string.IsNullOrWhiteSpace(command.payload.toggleName))
            {
                return BridgeResult.Reject(command, "toggle.name_required", "请输入衣装开关名称。");
            }
            if (command.dryRun)
            {
                var dryRun = BridgeResult.Success(command);
                dryRun.diagnostics.Add(BridgeDiagnostic.Info("toggle.dry_run", "开关创建检查通过，尚未修改项目。"));
                return dryRun;
            }

            var objectName = "VUA Toggle - " + command.payload.toggleName.Trim();
            var existing = avatar.transform.Cast<Transform>().FirstOrDefault(child => child.name == objectName);
            var toggleObject = existing == null ? new GameObject(objectName) : existing.gameObject;
            if (existing == null)
            {
                Undo.RegisterCreatedObjectUndo(toggleObject, "VUA: create outfit toggle");
                Undo.SetTransformParent(toggleObject.transform, avatar.transform, "VUA: parent outfit toggle");
            }

            EnsureComponent<ModularAvatarMenuInstaller>(toggleObject);
            var menuItem = EnsureComponent<ModularAvatarMenuItem>(toggleObject);
            Undo.RecordObject(menuItem, "VUA: configure menu item");
            menuItem.label = command.payload.toggleName.Trim();
            menuItem.PortableControl.Type = PortableControlType.Toggle;
            menuItem.PortableControl.Value = 1;
            menuItem.isDefault = outfit.activeSelf;

            var objectToggle = EnsureComponent<ModularAvatarObjectToggle>(toggleObject);
            Undo.RecordObject(objectToggle, "VUA: configure object toggle");
            objectToggle.Objects = new List<ToggledObject>
            {
                new ToggledObject { Object = new AvatarObjectReference(outfit), Active = true }
            };
            EditorUtility.SetDirty(menuItem);
            EditorUtility.SetDirty(objectToggle);
            MarkSceneDirty(avatar.scene);

            var result = BridgeResult.Success(command);
            result.changedPaths.Add(HierarchyPath(toggleObject));
            result.diagnostics.Add(BridgeDiagnostic.Info("toggle.created", "已创建 MA 菜单项和衣装开关。"));
            return result;
        }

        private static BridgeResult ValidateAvatar(BridgeCommand command)
        {
            if (!TryResolve(command.payload.avatarGlobalObjectId, out var avatar) ||
                !TryResolve(command.payload.outfitGlobalObjectId, out var outfit) ||
                !TryResolve(command.payload.outfitArmatureGlobalObjectId, out var outfitArmature))
            {
                return BridgeResult.Reject(command, "validation.selection_incomplete", "验证对象已经失效。");
            }
            if (!outfit.transform.IsChildOf(avatar.transform))
            {
                return BridgeResult.Reject(command, "validation.outfit_not_attached", "衣装尚未放入 Avatar 层级。");
            }
            if (outfitArmature.GetComponent<ModularAvatarMergeArmature>() == null)
            {
                return BridgeResult.Reject(command, "validation.merge_missing", "衣装 Armature 缺少 MA Merge Armature。");
            }
            var result = BridgeResult.Success(command);
            result.diagnostics.Add(BridgeDiagnostic.Info("validation.passed", "衣装层级、Merge Armature 和选择引用检查通过。"));
            return result;
        }

        private static BridgeResult AnalyzePerformance(BridgeCommand command)
        {
            if (!TryResolve(command.payload.avatarGlobalObjectId, out var avatar))
            {
                return BridgeResult.Reject(command, "performance.avatar_not_found", "找不到要分析的 Avatar。");
            }
            var renderers = avatar.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            var result = BridgeResult.Success(command);
            result.data.basis = "local_estimate";
            result.data.skinnedMeshRenderers = renderers.Length;
            result.data.materialSlots = renderers.Sum(renderer => renderer.sharedMaterials.Length);
            result.data.bones = renderers.Sum(renderer => renderer.bones == null ? 0 : renderer.bones.Length);
            result.data.triangles = renderers.Sum(renderer => TriangleCount(renderer.sharedMesh));
            if (result.data.triangles > 70000) result.data.recommendations.Add("三角面较多，建议检查衣装遮挡区域与 LOD/网格合并方案。");
            if (result.data.materialSlots > 16) result.data.recommendations.Add("材质槽较多，建议合并可共用贴图和材质的部件。");
            if (result.data.skinnedMeshRenderers > 8) result.data.recommendations.Add("Skinned Mesh Renderer 较多，可评估 Avatar Optimizer 的合并功能。");
            result.diagnostics.Add(BridgeDiagnostic.Info("performance.estimated", "已生成本地结构估算；这不是 VRChat 官方性能等级。"));
            return result;
        }

        // ---- v3: M7 inspection read operations (proposal 016 hard
        // precondition 1). Read-only: dryRun is forced true by the envelope
        // gate, findings travel as typed diagnostics codes, and the receipt
        // carries no data fields of its own. These operations report
        // deterministic Unity-observed facts only — never official VRChat
        // ratings (official_sdk_rating stays reserved until the SDK-handoff
        // slice). ----

        private static BridgeResult InspectAvatarReferences(BridgeCommand command)
        {
            if (!TryResolve(command.payload.avatarGlobalObjectId, out var avatar))
            {
                return BridgeResult.Reject(command, "validation.avatar_not_found", "找不到要检查的 Avatar。");
            }
            var result = BridgeResult.Success(command);
            var findings = 0;
            foreach (var renderer in avatar.GetComponentsInChildren<Renderer>(true))
            {
                if (renderer is SkinnedMeshRenderer skinned && skinned.sharedMesh == null)
                {
                    findings++;
                    result.diagnostics.Add(BridgeDiagnostic.Error("references.missing_mesh",
                        $"SkinnedMeshRenderer「{renderer.name}」的网格引用丢失。"));
                }
                var materials = renderer.sharedMaterials;
                for (var slot = 0; slot < materials.Length; slot++)
                {
                    if (materials[slot] != null) continue;
                    findings++;
                    result.diagnostics.Add(BridgeDiagnostic.Error("references.missing_material",
                        $"Renderer「{renderer.name}」材质槽 {slot} 引用丢失。"));
                }
            }
            foreach (var component in avatar.GetComponentsInChildren<Component>(true))
            {
                if (component != null) continue;
                findings++;
                result.diagnostics.Add(BridgeDiagnostic.Error("references.missing_script",
                    "层级中存在脚本缺失的组件（m_Script 空引用）。"));
            }
            if (findings == 0)
            {
                result.diagnostics.Add(BridgeDiagnostic.Info("references.clean",
                    "Avatar 层级内网格、材质槽与脚本引用完整。"));
            }
            return result;
        }

        private static BridgeResult InspectLighting(BridgeCommand command)
        {
            if (!TryResolve(command.payload.avatarGlobalObjectId, out var avatar))
            {
                return BridgeResult.Reject(command, "validation.avatar_not_found", "找不到要检查的 Avatar。");
            }
            var scene = avatar.gameObject.scene.IsValid()
                ? avatar.gameObject.scene
                : SceneManager.GetActiveScene();
            if (!scene.IsValid())
            {
                return BridgeResult.Reject(command, "lighting.scene_invalid", "没有可检查的有效场景。");
            }
            var result = BridgeResult.Success(command);
            var lights = scene.GetRootGameObjects()
                .SelectMany(root => root.GetComponentsInChildren<Light>(true))
                .ToList();
            var baked = lights.Count(light => light.lightmapBakeType == LightmapBakeType.Baked);
            var realtime = lights.Count - baked;
            var probes = scene.GetRootGameObjects()
                .SelectMany(root => root.GetComponentsInChildren<ReflectionProbe>(true))
                .Count();
            if (realtime > 0)
            {
                result.diagnostics.Add(BridgeDiagnostic.Warning("lighting.realtime_lights_present",
                    $"场景存在 {realtime} 个非纯烘焙光源（实时/混合）；光照烘焙状态可能影响观感一致性。本操作报告观察事实，不是官方光照评级。"));
            }
            else if (baked > 0)
            {
                result.diagnostics.Add(BridgeDiagnostic.Info("lighting.baked_only",
                    $"场景 {baked} 个光源均为纯烘焙；另观察到 {probes} 个反射探针。本操作报告观察事实，不是官方光照评级。"));
            }
            else
            {
                result.diagnostics.Add(BridgeDiagnostic.Info("lighting.clean",
                    $"场景无光源；观察到 {probes} 个反射探针。本操作报告观察事实，不是官方光照评级。"));
            }
            return result;
        }

        private static BridgeResult InspectUploadReadiness(BridgeCommand command)
        {
            if (!TryResolve(command.payload.avatarGlobalObjectId, out var avatar))
            {
                return BridgeResult.Reject(command, "validation.avatar_not_found", "找不到要检查的 Avatar。");
            }
            var result = BridgeResult.Success(command);
            // SDK 前置组件以公开组件名做确定性查找；SDK 未导入的项目里这些
            // 类型不存在——如实告知「前置未就绪」，不伪造就绪，也不代官方
            // SDK 下判定。
            var descriptorType = FindType("VRC.SDK3.Avatars.Components.VRCAvatarDescriptor");
            if (descriptorType == null)
            {
                result.diagnostics.Add(BridgeDiagnostic.Warning("upload_readiness.sdk_absent",
                    "本项目未检测到 VRChat Avatar SDK 前置组件；上传前置未就绪。这是前置观察，不是官方 SDK 判定。"));
            }
            else
            {
                var descriptor = avatar.GetComponent(descriptorType);
                if (descriptor == null)
                {
                    result.diagnostics.Add(BridgeDiagnostic.Error("upload_readiness.descriptor_missing",
                        "Avatar 上缺少 VRCAvatarDescriptor 组件。"));
                }
                else
                {
                    var hasPipeline = avatar.GetComponents<Component>()
                        .Any(component => component != null && component.GetType().Name == "PipelineManager");
                    if (!hasPipeline)
                    {
                        result.diagnostics.Add(BridgeDiagnostic.Warning("upload_readiness.pipeline_missing",
                            "Avatar 上缺少 PipelineManager 组件（SDK 上传管道前置）。"));
                    }
                    else
                    {
                        result.diagnostics.Add(BridgeDiagnostic.Info("upload_readiness.clean",
                            "Avatar Descriptor 与 PipelineManager 前置组件在位。这是前置观察，不是官方 SDK 判定。"));
                    }
                }
            }
            result.diagnostics.Add(BridgeDiagnostic.Info("upload_readiness.build_target",
                $"活动构建目标：{EditorUserBuildSettings.activeBuildTarget}。"));
            return result;
        }

        private static Type FindType(string fullName)
        {
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                Type type = null;
                try
                {
                    type = assembly.GetType(fullName, false);
                }
                catch (Exception)
                {
                    type = null;
                }
                if (type != null) return type;
            }
            return null;
        }

        // ---- v2: production jobs and restore (unity-bridge v2, proposal 009) ----

        private static readonly string[] SupportedPlanSchemaVersions = { "0.3" };

        private static BridgeResult ExecuteProductionJob(BridgeCommand command)
        {
            if (string.IsNullOrWhiteSpace(command.payload.planHash) ||
                string.IsNullOrWhiteSpace(command.payload.planSchemaVersion) ||
                string.IsNullOrWhiteSpace(command.payload.planRef))
            {
                return BridgeResult.Reject(command, "bridge.payload_required",
                    "execute_production_job 需要 planHash、planSchemaVersion 与 planRef。");
            }
            if (Array.IndexOf(SupportedPlanSchemaVersions, command.payload.planSchemaVersion) < 0)
            {
                return BridgeResult.Reject(command, "plan_schema_version_unsupported",
                    $"计划 schemaVersion {command.payload.planSchemaVersion} 不在支持集合内。");
            }

            var planPath = ResolveJobFile(command.payload.planRef);
            if (planPath == null || !File.Exists(planPath))
            {
                return BridgeResult.Reject(command, "plan_ref_missing",
                    "计划文件在 job 目录中不存在或越出 job 目录。");
            }
            var actualPlanHash = FileSha256(planPath);
            if (!string.Equals(actualPlanHash, command.payload.planHash, StringComparison.OrdinalIgnoreCase))
            {
                // Local integrity check: the Bridge never trusts the provider's
                // word that the file matches the approved hash (009 ruling).
                return BridgeResult.Reject(command, "plan_hash_mismatch",
                    "计划文件哈希与 planHash 不一致，拒绝执行。");
            }

            BridgePlanDocument plan;
            try
            {
                plan = JsonUtility.FromJson<BridgePlanDocument>(File.ReadAllText(planPath));
            }
            catch (Exception exception)
            {
                return BridgeResult.Reject(command, "plan_unreadable",
                    "计划文件无法解析：" + exception.Message);
            }
            if (plan == null || plan.jobs == null)
            {
                return BridgeResult.Reject(command, "plan_unreadable", "计划文件缺少作业序列。");
            }
            if (plan.jobs.Count == 0)
            {
                return BridgeResult.Reject(command, "plan_empty", "计划不含任何作业。");
            }

            var steps = new List<BridgeStep>();
            foreach (var job in plan.jobs)
            {
                steps.Add(new BridgeStep
                {
                    kind = job.kind,
                    status = "pending",
                    resolvedSource = job.resolvedSource
                });
            }

            // Receipt version echoes the command's protocol version (v3
            // production-face migration, proposal 016): a v3 command gets a
            // v3 receipt, whose data legally carries instanceGlobalObjectId
            // (proposal 011). A v2-labeled receipt can only occur for a v2
            // command from a pre-migration provider — the declared v2
            // transition drift (JsonUtility serializes the field into v2
            // receipts too), never a v3 claim on a v2 label.
            var receipt = new BridgeResult
            {
                schemaVersion = command.schemaVersion,
                commandId = command.commandId,
                operation = command.operation,
                status = "succeeded",
                data =
                {
                    dryRun = command.dryRun,
                    replayed = false,
                    planHash = command.payload.planHash,
                    steps = steps
                }
            };

            if (command.dryRun)
            {
                // A dry-run never touches the project; the returned
                // fingerprint is the pre-check-time state, never a prediction.
                receipt.data.projectFingerprint = ProjectFingerprint.Compute();
                return receipt;
            }

            // Real run: pre-job snapshot first (proposal 012 minimal form).
            var fingerprintBefore = ProjectFingerprint.Compute();
            receipt.data.projectFingerprintBefore = fingerprintBefore;
            string snapshotId;
            var snapshotProblem = ProjectSnapshot.Create(out snapshotId);
            if (snapshotProblem != null)
            {
                // Pre-condition failure before any change: rejected (same
                // semantics as the fingerprint gate), not a run failure —
                // no snapshot exists yet to reference.
                return BridgeResult.Reject(command, "snapshot_failed", snapshotProblem);
            }
            receipt.data.snapshotId = snapshotId;

            // Execute the ordered job sequence (proposal 011 execution-semantics
            // spec, core 2026-09-08). Known-but-unimplementable kinds fail
            // with typed codes that name exactly what is missing. An
            // install_modular_asset success carries the instance-root
            // GlobalObjectId (proposal 011 success criterion — the receipt
            // carries the instance identity; single-material plans are the
            // primary form, and for multi-install plans the FIRST successful
            // instance is kept as the receipt's instance identity).
            for (var index = 0; index < plan.jobs.Count; index++)
            {
                var job = plan.jobs[index];
                var (ok, errorCode, message, instanceGlobalObjectId) = job.kind switch
                {
                    "install_modular_asset" => ExecuteInstallModularAsset(job, plan, command),
                    "attach_to_bone" => ExecuteAttachToBone(job, plan),
                    "exclude_object" => ExecuteExcludeObject(job),
                    "set_object_active" => ExecuteSetObjectActive(job),
                    _ => (false, "job_kind_unknown",
                        $"作业 {job.jobId} 的 kind「{job.kind}」不在计划词表内。", string.Empty)
                };
                if (ok)
                {
                    steps[index].status = "executed";
                    if (!string.IsNullOrEmpty(message)) steps[index].warning = message;
                    if (!string.IsNullOrEmpty(instanceGlobalObjectId) &&
                        string.IsNullOrEmpty(receipt.data.instanceGlobalObjectId))
                    {
                        receipt.data.instanceGlobalObjectId = instanceGlobalObjectId;
                    }
                    continue;
                }
                steps[index].status = "failed";
                receipt.status = "failed";
                receipt.diagnostics.Add(BridgeDiagnostic.Error(errorCode,
                    $"作业 {job.jobId}（{job.kind}）：{message}；序列已中断，未执行后续作业。"));
                break;
            }

            AssetDatabase.SaveAssets();
            receipt.data.projectFingerprint = ProjectFingerprint.Compute();
            return receipt;
        }

        private static BridgeResult RestoreProject(BridgeCommand command)
        {
            if (string.IsNullOrWhiteSpace(command.payload.snapshotId))
            {
                return BridgeResult.Reject(command, "bridge.payload_required", "restore_project 需要 snapshotId。");
            }
            var snapshotProblem = ProjectSnapshot.VerifyExists(command.payload.snapshotId, command.dryRun);
            if (snapshotProblem != null)
            {
                return BridgeResult.Fail(command, "restore_failed", snapshotProblem);
            }
            if (command.dryRun)
            {
                // Receipt version echoes the command protocol version (v3
                // production-face migration, proposal 016).
                return new BridgeResult
                {
                    schemaVersion = command.schemaVersion,
                    commandId = command.commandId,
                    operation = command.operation,
                    status = "succeeded",
                    data =
                    {
                        replayed = false,
                        restoredFrom = command.payload.snapshotId,
                        projectFingerprint = ProjectFingerprint.Compute()
                    }
                };
            }

            var restoreProblem = ProjectSnapshot.Restore(command.payload.snapshotId);
            if (restoreProblem != null)
            {
                return BridgeResult.Fail(command, "restore_failed", restoreProblem);
            }
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
            return new BridgeResult
            {
                schemaVersion = command.schemaVersion,
                commandId = command.commandId,
                operation = command.operation,
                status = "succeeded",
                changedPaths = new List<string> { "Assets/", "Packages/", "ProjectSettings/" },
                data =
                {
                    replayed = false,
                    restoredFrom = command.payload.snapshotId,
                    projectFingerprint = ProjectFingerprint.Compute()
                }
            };
        }

        // ---- v2 job-kind executors (proposal 011 execution-semantics spec) ----

        private static (bool ok, string errorCode, string message, string instanceGlobalObjectId) ExecuteInstallModularAsset(
            BridgePlanJob job, BridgePlanDocument plan, BridgeCommand command)
        {
            // The material enters the project through the v1-verified
            // materialize base; the physical source must be staged into the
            // job directory by the provider-side executor (Rust) before the
            // command is sent — the Bridge cannot reach the warehouse.
            if (string.IsNullOrWhiteSpace(job.sourcePackagePath) ||
                string.IsNullOrWhiteSpace(job.manifestSha256))
            {
                return (false, "source_not_staged",
                    "来源物未由 provider 物化到 job 目录（缺 sourcePackagePath/manifestSha256）。", string.Empty);
            }
            var sub = new BridgeCommand
            {
                schemaVersion = command.schemaVersion,
                commandId = command.commandId,
                operation = "materialize_extracted_package",
                projectId = command.projectId,
                dryRun = false,
                payload =
                {
                    sourcePackagePath = job.sourcePackagePath,
                    manifestSha256 = job.manifestSha256
                }
            };
            var imported = MaterializeExtractedPackage(sub);
            if (imported.status != "succeeded")
            {
                foreach (var diagnostic in imported.diagnostics)
                {
                    if (diagnostic.severity == "error")
                    {
                        return (false, diagnostic.code, diagnostic.message, string.Empty);
                    }
                }
                return (false, "source_import_failed", "来源物物化未成功。", string.Empty);
            }

            // Instantiate the first new prefab as the instance root, named by
            // the recipe assetId so later jobs can resolve it.
            var prefabPath = imported.data.importedAssetPaths
                .FirstOrDefault(path => path.EndsWith(".prefab", StringComparison.OrdinalIgnoreCase));
            if (prefabPath == null)
            {
                return (false, "instance_prefab_missing",
                    "来源物内容已入项目，但未找到可实例化的 prefab 根。", string.Empty);
            }
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
            if (prefab == null)
            {
                return (false, "instance_prefab_missing", "prefab 无法由 AssetDatabase 加载。", string.Empty);
            }
            var instance = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
            if (instance == null)
            {
                return (false, "instance_failed", "prefab 实例化失败。", string.Empty);
            }
            instance.name = string.IsNullOrWhiteSpace(job.assetId) ? instance.name : job.assetId;
            // Proposal 011 success criterion: the receipt carries the
            // instance-root identity as a GlobalObjectId string.
            // GetGlobalObjectIdSlow is the always-correct Unity 2022.3 API
            // (GetGlobalObjectIdFor does not exist — compile error caught by
            // the first real EditMode compilation, W25-adjacent verification
            // slice 2026-09-15).
            var instanceId = GlobalObjectId.GetGlobalObjectIdSlow(instance).ToString();
            return (true, string.Empty, string.Empty, instanceId);
        }

        private static (bool ok, string errorCode, string message, string instanceGlobalObjectId) ExecuteAttachToBone(
            BridgePlanJob job, BridgePlanDocument plan)
        {
            var target = FindSceneObjectBySelector(
                new BridgeObjectSelector { selectorId = job.selectorId });
            if (target == null)
            {
                return (false, "selector_unresolved",
                    $"挂载对象 selectorId「{job.selectorId}」无解（场景中无同名对象）。", string.Empty);
            }
            var avatar = FindAvatarFromPlan(plan);
            if (avatar == null)
            {
                return (false, "avatar_not_found", "目标 Avatar 实例不存在或缺少 Animator。", string.Empty);
            }
            if (!Enum.TryParse(job.bone, ignoreCase: true, out HumanBodyBones bone) ||
                bone == HumanBodyBones.LastBone ||
                avatar.GetBoneTransform(bone) == null)
            {
                return (false, "bone_not_in_humanoid_mapping",
                    $"骨骼「{job.bone}」不在 Avatar 的 humanoid 映射内。", string.Empty);
            }
            var boneTransform = avatar.GetBoneTransform(bone);
            target.transform.SetParent(boneTransform, false);
            var transform = job.localTransform ?? new BridgeLocalTransform();
            target.transform.localPosition = new Vector3(transform.px, transform.py, transform.pz);
            target.transform.localRotation = new Quaternion(transform.qx, transform.qy, transform.qz, transform.qw);
            target.transform.localScale = new Vector3(transform.sx, transform.sy, transform.sz);
            return (true, string.Empty, string.Empty, string.Empty);
        }

        private static (bool ok, string errorCode, string message, string instanceGlobalObjectId) ExecuteExcludeObject(
            BridgePlanJob job)
        {
            var target = FindSceneObjectBySelector(job.selector);
            if (target == null)
            {
                return (false, "selector_unresolved",
                    "排除对象 selector 无解（目录条目不可达且 pathHint 无命中）。", string.Empty);
            }
            // Pinned marker form (core, 011 inline): VRCMetaObject.excluded.
            // The VRCSDK assembly is not referenced by this package's asmdef;
            // the type is resolved reflectively so the package keeps compiling
            // in SDK-less checkouts (W25 real-machine assertion covers the
            // exact assembly). A missing type is a typed honest failure.
            var metaType = FindType("VRC.SDKVRCStripe.VRCMetaObject",
                "VRC.SDK3A.VRCMetaObject", "VRC.SDKBase.VRCMetaObject");
            if (metaType == null)
            {
                return (false, "exclude_marker_unavailable",
                    "VRCMetaObject 类型未找到（VRCSDK 未在当前项目加载）；对象已定位但未被修改。", string.Empty);
            }
            var component = target.GetComponent(metaType) ??
                            target.AddComponent(metaType);
            var excludedMember = metaType.GetProperty("excluded") ??
                                 (MemberInfo)metaType.GetField("excluded");
            if (excludedMember == null)
            {
                return (false, "exclude_marker_unavailable",
                    "VRCMetaObject 上找不到 excluded 成员（SDK 版本差异）；对象已定位但未被修改。", string.Empty);
            }
            var property = excludedMember as PropertyInfo;
            if (property != null) property.SetValue(component, true, null);
            else ((FieldInfo)excludedMember).SetValue(component, true);
            return (true, string.Empty, string.Empty, string.Empty);
        }

        private static Type FindType(params string[] fullNames)
        {
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                foreach (var fullName in fullNames)
                {
                    var type = assembly.GetType(fullName, throwOnError: false);
                    if (type != null) return type;
                }
            }
            return null;
        }

        private static (bool ok, string errorCode, string message, string instanceGlobalObjectId) ExecuteSetObjectActive(
            BridgePlanJob job)
        {
            var target = FindSceneObjectBySelector(job.selector);
            if (target == null)
            {
                return (false, "selector_unresolved", "对象 selector 无解。", string.Empty);
            }
            target.SetActive(job.active);
            if (target.activeSelf != job.active)
            {
                return (false, "active_state_mismatch", "激活态未按目标生效。", string.Empty);
            }
            return (true, string.Empty, string.Empty, string.Empty);
        }

        /// objectSelector resolution: pathHint (name chain from the scene
        /// root, inactive included) is fully resolvable in-scene; a selector
        /// with only a catalogEntryId has no in-Bridge catalog source and
        /// fails honestly (the catalog lives in provider-side BDL).
        private static GameObject FindSceneObjectBySelector(BridgeObjectSelector selector)
        {
            if (selector == null) return null;
            if (selector.pathHint != null && selector.pathHint.Count > 0)
            {
                GameObject current = null;
                foreach (var name in selector.pathHint)
                {
                    current = FindChildByName(current, name);
                    if (current == null) return null;
                }
                return current;
            }
            if (!string.IsNullOrWhiteSpace(selector.selectorId))
            {
                return FindByNameDeep(null, selector.selectorId);
            }
            return null; // catalogEntryId-only: no in-Bridge catalog source
        }

        private static GameObject FindChildByName(GameObject parent, string name)
        {
            if (parent == null)
            {
                var scene = SceneManager.GetActiveScene();
                foreach (var root in scene.GetRootGameObjects())
                {
                    if (root.name == name) return root;
                    var deep = FindByNameDeep(root, name);
                    if (deep != null) return deep;
                }
                return null;
            }
            return FindByNameDeep(parent, name);
        }

        private static GameObject FindByNameDeep(GameObject root, string name)
        {
            if (root != null && root.name == name) return root;
            Transform start = root != null ? root.transform : null;
            IEnumerable<GameObject> Iterate(Transform node)
            {
                for (var i = 0; i < node.childCount; i++) yield return node.GetChild(i).gameObject;
            }
            var queue = new Queue<Transform>();
            if (start == null)
            {
                var scene = SceneManager.GetActiveScene();
                foreach (var rootObject in scene.GetRootGameObjects())
                {
                    queue.Enqueue(rootObject.transform);
                }
            }
            else
            {
                foreach (var child in Iterate(start)) queue.Enqueue(child.transform);
            }
            while (queue.Count > 0)
            {
                var node = queue.Dequeue();
                if (node.name == name) return node.gameObject;
                for (var i = 0; i < node.childCount; i++) queue.Enqueue(node.GetChild(i));
            }
            return null;
        }

        private static Animator FindAvatarFromPlan(BridgePlanDocument plan)
        {
            GameObject avatarRoot = null;
            if (plan?.target != null && !string.IsNullOrWhiteSpace(plan.target.avatarInstanceId))
            {
                avatarRoot = FindByNameDeep(null, plan.target.avatarInstanceId);
            }
            if (avatarRoot == null)
            {
                var scene = SceneManager.GetActiveScene();
                foreach (var rootObject in scene.GetRootGameObjects())
                {
                    var animator = rootObject.GetComponent<Animator>();
                    if (animator != null && animator.isHuman)
                    {
                        avatarRoot = rootObject;
                        break;
                    }
                }
            }
            return avatarRoot != null ? avatarRoot.GetComponent<Animator>() : null;
        }

        private static string ResolveJobFile(string planRef)
        {
            if (string.IsNullOrWhiteSpace(planRef)) return null;
            var projectRoot = Directory.GetParent(Application.dataPath)?.FullName;
            if (string.IsNullOrWhiteSpace(projectRoot)) return null;
            var candidate = Path.GetFullPath(Path.Combine(projectRoot, planRef.Replace("\\", "/")));
            var bridgeRoot = Path.GetFullPath(Path.Combine(projectRoot, ".vua", "bridge"));
            // The plan file must live inside the job-directory root (existing
            // discipline: request/result files stay under .vua/bridge/).
            if (!candidate.StartsWith(bridgeRoot, StringComparison.Ordinal)) return null;
            return candidate;
        }

        internal static class ProjectSnapshot
        {
            private static string SnapshotRoot =>
                Path.Combine(Directory.GetParent(Application.dataPath)?.FullName ?? "",
                    ".vua", "bridge", "snapshots");

            private static readonly string[] TrackedRoots = { "Assets", "Packages", "ProjectSettings" };

            internal static string Create(out string snapshotId)
            {
                snapshotId = NewUuidV7();
                try
                {
                    var root = Path.Combine(SnapshotRoot, snapshotId);
                    Directory.CreateDirectory(root);
                    var projectRoot = Directory.GetParent(Application.dataPath).FullName;
                    foreach (var tracked in TrackedRoots)
                    {
                        var source = Path.Combine(projectRoot, tracked);
                        if (!Directory.Exists(source)) continue;
                        CopyDirectory(source, Path.Combine(root, tracked));
                    }
                    File.WriteAllText(Path.Combine(root, "snapshot.meta"),
                        "{\"snapshotId\":\"" + snapshotId + "\",\"phase\":\"pre_job\"}");
                    return null;
                }
                catch (Exception exception)
                {
                    return "快照创建失败：" + exception.Message;
                }
            }

            internal static string VerifyExists(string snapshotId, bool dryRunOnly)
            {
                var dir = Path.Combine(SnapshotRoot, snapshotId);
                return Directory.Exists(dir) ? null : "恢复点不存在或已被清理：" + snapshotId;
            }

            internal static string Restore(string snapshotId)
            {
                try
                {
                    var root = Path.Combine(SnapshotRoot, snapshotId);
                    var projectRoot = Directory.GetParent(Application.dataPath).FullName;
                    foreach (var tracked in TrackedRoots)
                    {
                        var current = Path.Combine(projectRoot, tracked);
                        var backup = Path.Combine(root, tracked);
                        if (!Directory.Exists(backup)) continue;
                        if (Directory.Exists(current))
                        {
                            var trash = Path.Combine(SnapshotRoot, snapshotId + ".replaced", tracked);
                            Directory.CreateDirectory(Path.GetDirectoryName(trash));
                            if (Directory.Exists(trash)) Directory.Delete(trash, true);
                            Directory.Move(current, trash);
                        }
                        CopyDirectory(backup, current);
                    }
                    return null;
                }
                catch (Exception exception)
                {
                    return "恢复失败：" + exception.Message;
                }
            }

            private static void CopyDirectory(string source, string target)
            {
                Directory.CreateDirectory(target);
                foreach (var file in Directory.GetFiles(source))
                {
                    File.Copy(file, Path.Combine(target, Path.GetFileName(file)), true);
                }
                foreach (var dir in Directory.GetDirectories(source))
                {
                    CopyDirectory(dir, Path.Combine(target, Path.GetFileName(dir)));
                }
            }

            // UUID v7 form (unix-ms timestamp + random), matching the
            // build-record recoveryPoints identity convention.
            internal static string NewUuidV7()
            {
                var unixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var random = new byte[10];
                System.Security.Cryptography.RandomNumberGenerator.Fill(random);
                var bytes = new byte[16];
                bytes[0] = (byte)(unixMs >> 40);
                bytes[1] = (byte)(unixMs >> 32);
                bytes[2] = (byte)(unixMs >> 24);
                bytes[3] = (byte)(unixMs >> 16);
                bytes[4] = (byte)(unixMs >> 8);
                bytes[5] = (byte)unixMs;
                bytes[6] = (byte)(0x70 | (random[0] & 0x0F));
                bytes[7] = random[1];
                bytes[8] = (byte)(0x80 | (random[2] & 0x3F));
                Array.Copy(random, 3, bytes, 9, 7);
                var hex = BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
                return hex.Insert(8, "-").Insert(14, "-").Insert(19, "-").Insert(24, "-");
            }
        }

        private static BridgeResult ValidateEnvelope(BridgeCommand command)
        {
            if (command == null) return BridgeResult.Reject(null, "bridge.invalid_json", "命令 JSON 无法解析。");
            if (command.schemaVersion != 1 && command.schemaVersion != 2 && command.schemaVersion != 3 && command.schemaVersion != 4) return BridgeResult.Reject(command, "bridge.unsupported_schema", "不支持该协议版本。");
            if (command.schemaVersion == 1 && (command.operation == "execute_production_job" || command.operation == "restore_project"))
            {
                return BridgeResult.Reject(command, "bridge.unsupported_schema", "生产作业与恢复操作需要协议 v2。");
            }
            if (command.schemaVersion < 3 && IsInspection(command.operation))
            {
                return BridgeResult.Reject(command, "bridge.unsupported_schema", "检查读面操作需要协议 v3。");
            }
            if (command.schemaVersion < 4 && command.operation == "build_preview")
            {
                return BridgeResult.Reject(command, "bridge.unsupported_schema", "烘焙预览操作需要协议 v4。");
            }
            if (string.IsNullOrWhiteSpace(command.commandId) ||
                !Regex.IsMatch(command.commandId, "^[A-Za-z0-9_-]{1,128}$", RegexOptions.CultureInvariant))
                return BridgeResult.Reject(command, "bridge.command_id_required", "命令 ID 无效。");
            if (string.IsNullOrWhiteSpace(command.projectId)) return BridgeResult.Reject(command, "bridge.project_id_required", "命令缺少项目 ID。");
            if (command.payload == null) return BridgeResult.Reject(command, "bridge.payload_required", "命令缺少参数。");
            if (!IsAllowed(command.operation)) return BridgeResult.Reject(command, "bridge.operation_not_allowed", "该操作不在允许列表中。");
            if (!IsMutating(command.operation) && !command.dryRun)
            {
                return BridgeResult.Reject(command, "bridge.dry_run_required", "只读命令必须使用 dry-run 模式。");
            }
            if (IsMutating(command.operation) && !command.dryRun && string.IsNullOrWhiteSpace(command.expectedProjectFingerprint))
            {
                return BridgeResult.Reject(command, "bridge.fingerprint_required", "修改项目之前必须提供项目指纹。");
            }
            return null;
        }

        private static bool IsAllowed(string operation)
        {
            return operation == "inspect_project" ||
                   operation == "import_unity_package" ||
                   operation == "materialize_extracted_package" ||
                   operation == "create_local_vpm_package" ||
                   operation == "validate_asset_paths" ||
                   operation == "identify_assets" ||
                   operation == "install_outfit" ||
                   operation == "create_toggle" ||
                   operation == "validate_avatar" ||
                   operation == "analyze_performance" ||
                   operation == "execute_production_job" ||
                   operation == "restore_project" ||
                   operation == "inspect_avatar_references" ||
                   operation == "inspect_lighting" ||
                   operation == "inspect_upload_readiness" ||
                   operation == "build_preview";
        }

        private static bool TryResolve(string serializedId, out GameObject gameObject)
        {
            gameObject = null;
            if (string.IsNullOrWhiteSpace(serializedId)) return false;
            if (GlobalObjectId.TryParse(serializedId, out var id))
            {
                gameObject = GlobalObjectId.GlobalObjectIdentifierToObjectSlow(id) as GameObject;
                if (gameObject != null) return true;
            }
            // Unsaved-scene instances serialize with a zero scene GUID, a form
            // GlobalObjectId.TryParse rejects on this editor build (2022.3.22f1,
            // probe-verified 2026-09-15). Production receipts (execute_production_job
            // instanceGlobalObjectId) carry exactly this form, so inspection
            // resolution falls back to regenerating identifiers over every loaded
            // scene and comparing — deterministic, no guessing.
            for (var sceneIndex = 0; sceneIndex < SceneManager.sceneCount; sceneIndex++)
            {
                var scene = SceneManager.GetSceneAt(sceneIndex);
                if (!scene.IsValid() || !scene.isLoaded) continue;
                foreach (var root in scene.GetRootGameObjects())
                {
                    foreach (var candidate in root.GetComponentsInChildren<Transform>(true))
                    {
                        var candidateObject = candidate.gameObject;
                        if (GlobalObjectId.GetGlobalObjectIdSlow(candidateObject).ToString() != serializedId)
                        {
                            continue;
                        }
                        gameObject = candidateObject;
                        return true;
                    }
                }
            }
            return false;
        }

        private static T EnsureComponent<T>(GameObject target) where T : Component
        {
            return target.GetComponent<T>() ?? Undo.AddComponent<T>(target);
        }

        private static int TriangleCount(Mesh mesh)
        {
            if (mesh == null) return 0;
            ulong indices = 0;
            for (var subMesh = 0; subMesh < mesh.subMeshCount; subMesh++)
            {
                indices += mesh.GetIndexCount(subMesh);
            }
            return indices > int.MaxValue * 3UL ? int.MaxValue : (int)(indices / 3);
        }

        private static string HierarchyPath(GameObject value)
        {
            var names = new Stack<string>();
            for (var current = value.transform; current != null; current = current.parent) names.Push(current.name);
            return string.Join("/", names);
        }

        private static void MarkSceneDirty(Scene scene)
        {
            if (scene.IsValid()) EditorSceneManager.MarkSceneDirty(scene);
        }
    }

    internal static class ProjectFingerprint
    {
        internal static string Compute()
        {
            var scene = SceneManager.GetActiveScene();
            if (!scene.IsValid()) return "no-scene";
            var dependencyHash = string.IsNullOrWhiteSpace(scene.path)
                ? "unsaved"
                : AssetDatabase.GetAssetDependencyHash(scene.path).ToString();
            var description = new StringBuilder(scene.path).Append('|').Append(dependencyHash);
            foreach (var root in scene.GetRootGameObjects()) AppendHierarchy(description, root.transform);
            using (var sha256 = SHA256.Create())
            {
                var digest = sha256.ComputeHash(Encoding.UTF8.GetBytes(description.ToString()));
                return "v1:" + BitConverter.ToString(digest).Replace("-", string.Empty).ToLowerInvariant();
            }
        }

        private static void AppendHierarchy(StringBuilder target, Transform transform)
        {
            target.Append('|').Append(transform.GetSiblingIndex()).Append(':').Append(transform.name)
                .Append(':').Append(transform.gameObject.activeSelf ? '1' : '0');
            foreach (var component in transform.GetComponents<Component>())
            {
                target.Append(':').Append(component == null ? "missing" : component.GetType().FullName);
            }
            foreach (Transform child in transform) AppendHierarchy(target, child);
        }
    }
}
