using System;
using System.Diagnostics;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace Vua.Editor.Bridge
{
    /// <summary>
    /// 编辑器握手（proposal 023 交接实现域）：工程加载完成后由桥包主动写入
    /// 确定性就绪信号，供产线进程/窗口面 port 等待（完成判定＝handshake 到
    /// 达，「进程已启动」绝不作为完成事实）。
    ///
    /// 这是编辑器进程生命周期信号面，不是 Bridge 命令面：BridgeCommandProcessor
    /// 的 v3 命令词表零增操作（023 产线表态①）。载荷形状见
    /// schemas/unity-bridge/handshake/v1/（闭集四键，additionalProperties
    /// false——上传状态或工程明文路径永不进握手事实，诚实纪律 1/2）。
    /// 写入尽力而为：任何失败都吞掉，绝不打断编辑器；等待方将如实超时。
    /// </summary>
    internal static class EditorHandshake
    {
        /// <summary>握手载荷 schema 版本（与 Rust 读取端同一常量语义）。</summary>
        internal const string SchemaVersion = "1.0";

        [InitializeOnLoadMethod]
        private static void InstallHandshakeOnLoad()
        {
            WriteHandshake();
        }

        /// <summary>写入握手（internal 供 EditMode 测试与真实加载共用同一形状路径）。</summary>
        internal static void WriteHandshake()
        {
            try
            {
                var payload = new HandshakePayload
                {
                    schemaVersion = SchemaVersion,
                    pid = Process.GetCurrentProcess().Id,
                    editorVersion = Application.unityVersion,
                    occurredAt = DateTime.UtcNow.ToString("o")
                };
                WriteAtomically(TargetPath(), JsonUtility.ToJson(payload, true));
            }
            catch (Exception)
            {
                // 握手是踪迹不是义务：写失败不打断编辑器，等待方如实超时。
            }
        }

        internal static string TargetPath()
        {
            var project = Path.GetFullPath(Path.Combine(Application.dataPath, ".."));
            return Path.Combine(project, ".vua", "bridge", "handshake.json");
        }

        /// <summary>暴露给 EditMode 测试的载荷构造（形状单一事实源）。</summary>
        internal static string BuildPayloadJson(int pid, string editorVersion, string occurredAt)
        {
            return JsonUtility.ToJson(new HandshakePayload
            {
                schemaVersion = SchemaVersion,
                pid = pid,
                editorVersion = editorVersion,
                occurredAt = occurredAt
            }, true);
        }

        private static void WriteAtomically(string target, string json)
        {
            var directory = Path.GetDirectoryName(target);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }
            var temporaryPath = target + ".tmp";
            File.WriteAllText(temporaryPath, json);
            if (File.Exists(target))
            {
                File.Replace(temporaryPath, target, null);
            }
            else
            {
                File.Move(temporaryPath, target);
            }
        }

        [Serializable]
        internal class HandshakePayload
        {
            public string schemaVersion;
            public int pid;
            public string editorVersion;
            public string occurredAt;
        }
    }
}
