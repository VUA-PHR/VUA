using System;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace Vua.Editor.Bridge
{
    internal static class BridgeEntryPoint
    {
        public static void Run()
        {
            var command = new BridgeCommand();
            BridgeResult result;
            string resultPath = null;
            try
            {
                var requestPath = SafeBridgePath(Argument("-vuaRequest"));
                resultPath = SafeBridgePath(Argument("-vuaResult"));
                result = ReadAndProcess(requestPath, BridgeCommandProcessor.Process);
            }
            catch (Exception exception)
            {
                result = BridgeResult.Fail(command, "bridge.entry_failed", exception.GetType().Name + "：无法执行 Unity 命令。");
            }

            if (!string.IsNullOrWhiteSpace(resultPath))
            {
                WriteResultAtomically(resultPath, BridgeResultJson.Serialize(result));
            }
            if (Application.isBatchMode) EditorApplication.Exit(result.status == "succeeded" ? 0 : 1);
        }

        internal static BridgeResult ReadAndProcess(string requestPath, Func<BridgeCommand, BridgeResult> process)
        {
            BridgeCommand command = null;
            try
            {
                command = JsonUtility.FromJson<BridgeCommand>(File.ReadAllText(requestPath));
                return process(command);
            }
            catch (Exception exception)
            {
                return BridgeResult.Fail(command, "bridge.entry_failed", exception.GetType().Name + "：无法执行 Unity 命令。");
            }
        }

        private static string Argument(string name)
        {
            var arguments = Environment.GetCommandLineArgs();
            var index = Array.IndexOf(arguments, name);
            if (index < 0 || index + 1 >= arguments.Length) throw new ArgumentException("缺少桥接文件参数。");
            return arguments[index + 1];
        }

        internal static string SafeBridgePath(string candidate)
        {
            var project = Path.GetFullPath(Path.Combine(Application.dataPath, ".."));
            var bridgeRoot = Path.GetFullPath(Path.Combine(project, ".vua", "bridge"));
            var fullPath = Path.GetFullPath(candidate);
            if (!fullPath.StartsWith(bridgeRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("桥接文件必须位于当前项目的 .vua/bridge 目录中。");
            }
            return fullPath;
        }

        private static void WriteResultAtomically(string resultPath, string json)
        {
            var directory = Path.GetDirectoryName(resultPath) ?? throw new InvalidOperationException("结果路径缺少父目录。");
            Directory.CreateDirectory(directory);
            var temporaryPath = resultPath + ".tmp";
            File.WriteAllText(temporaryPath, json);
            if (File.Exists(resultPath))
            {
                File.Replace(temporaryPath, resultPath, null);
            }
            else
            {
                File.Move(temporaryPath, resultPath);
            }
        }
    }
}
