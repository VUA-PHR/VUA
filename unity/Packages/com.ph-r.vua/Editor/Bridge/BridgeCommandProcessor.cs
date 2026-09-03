using System;
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
                    default:
                        return BridgeResult.Reject(command, "bridge.operation_not_allowed", "该操作不在允许列表中。");
                }

                if (result.status == "succeeded" && IsMutating(command.operation))
                {
                    AssetDatabase.SaveAssets();
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
                return BridgeResult.Fail(command, "bridge.unhandled", exception.GetType().Name + "：操作未完成。");
            }
        }

        private static bool IsMutating(string operation)
        {
            return operation == "import_unity_package" || operation == "create_local_vpm_package" ||
                   operation == "install_outfit" || operation == "create_toggle";
        }

        private static BridgeResult ImportUnityPackage(BridgeCommand command)
        {
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

            Directory.CreateDirectory(Path.Combine(ProjectRoot(), packageRoot, "Runtime"));
            AssetDatabase.Refresh();
            var topLevel = AssetDatabase.GetAllAssetPaths()
                .Where(path => path.StartsWith("Assets/", StringComparison.Ordinal) &&
                               path.IndexOf('/', "Assets/".Length) < 0)
                .OrderBy(path => path, StringComparer.Ordinal)
                .ToList();
            var changed = new List<string>();
            foreach (var source in topLevel)
            {
                var name = source.Substring("Assets/".Length);
                var section = string.Equals(name, "Editor", StringComparison.OrdinalIgnoreCase) ? "Editor" : "Runtime";
                var destination = section == "Editor" ? packageRoot + "/Editor" : packageRoot + "/Runtime/" + name;
                var moveError = AssetDatabase.MoveAsset(source, destination);
                if (!string.IsNullOrEmpty(moveError))
                {
                    return BridgeResult.Fail(command, "vpm.asset_move_failed", "素材无法移动到本地 VPM 包结构。");
                }
                changed.Add(destination);
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
                return BridgeResult.Reject(command, "validation.asset_load_failed", "至少一个计划素材无法由 AssetDatabase 加载。");
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
                   "  \"dependencies\": {" + string.Join(",", entries) + "}\n" +
                   "}\n";
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

        private static BridgeResult ValidateEnvelope(BridgeCommand command)
        {
            if (command == null) return BridgeResult.Reject(null, "bridge.invalid_json", "命令 JSON 无法解析。");
            if (command.schemaVersion != 1) return BridgeResult.Reject(command, "bridge.unsupported_schema", "不支持该协议版本。");
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
                   operation == "create_local_vpm_package" ||
                   operation == "validate_asset_paths" ||
                   operation == "identify_assets" ||
                   operation == "install_outfit" ||
                   operation == "create_toggle" ||
                   operation == "validate_avatar" ||
                   operation == "analyze_performance";
        }

        private static bool TryResolve(string serializedId, out GameObject gameObject)
        {
            gameObject = null;
            if (string.IsNullOrWhiteSpace(serializedId) || !GlobalObjectId.TryParse(serializedId, out var id)) return false;
            gameObject = GlobalObjectId.GlobalObjectIdentifierToObjectSlow(id) as GameObject;
            return gameObject != null;
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
