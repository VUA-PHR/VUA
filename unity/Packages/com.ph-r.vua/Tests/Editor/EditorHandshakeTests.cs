using System;
using System.Diagnostics;
using System.IO;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using Vua.Editor.Bridge;

namespace Vua.Editor.Bridge.Tests
{
    /// <summary>
    /// 桥握手写入端消费测试（proposal 023 产线实现域切片）。Rust 读取端
    /// （crates/unity-bridge handoff port）与本测试是握手 schema v1 的两端
    /// 消费。断言：写入形状符合 schemas/unity-bridge/handshake/v1/ 闭集、
    /// 无工程明文路径、进程身份与当前编辑器一致、重复加载幂等。
    /// </summary>
    internal sealed class EditorHandshakeTests
    {
        [Test]
        public void WriteHandshakeLandsClosedSetPayloadInProjectBridgeDirectory()
        {
            EditorHandshake.WriteHandshake();

            var target = EditorHandshake.TargetPath();
            Assert.IsTrue(File.Exists(target), "握手文件应落在工程 .vua/bridge 内：{0}", target);

            var json = File.ReadAllText(target);
            var payload = JsonUtility.FromJson<EditorHandshake.HandshakePayload>(json);

            Assert.AreEqual("1.0", payload.schemaVersion, "schemaVersion 应为常量 1.0");
            Assert.AreEqual(Process.GetCurrentProcess().Id, payload.pid, "pid 应为当前编辑器进程");
            Assert.AreEqual(Application.unityVersion, payload.editorVersion, "editorVersion 应为当前编辑器版本");
            Assert.IsNotEmpty(payload.occurredAt, "occurredAt 必须存在");
            Assert.DoesNotThrow(
                () => DateTime.Parse(payload.occurredAt, null, System.Globalization.DateTimeStyles.RoundtripKind),
                "occurredAt 应可按 RFC 3339 解析");
        }

        [Test]
        public void HandshakePayloadCarriesNoPathAndNoUploadState()
        {
            var json = EditorHandshake.BuildPayloadJson(4212, "2022.3.22f1", "2026-09-16T03:30:00.000Z");

            StringAssert.DoesNotContain("projectPath", json, "工程明文路径永不进握手事实（位置绑定工程，隐私边界）");
            StringAssert.DoesNotContain("upload", json, "上传状态永不进握手事实（诚实纪律：形状钉死，想猜也无从猜起）");
            StringAssert.DoesNotContain("progress", json, "进度语义永不进握手事实");

            var payload = JsonUtility.FromJson<EditorHandshake.HandshakePayload>(json);
            Assert.AreEqual("1.0", payload.schemaVersion);
            Assert.AreEqual(4212, payload.pid);
            Assert.AreEqual("2022.3.22f1", payload.editorVersion);
        }

        [Test]
        public void WriteHandshakeIsIdempotentAcrossReloads()
        {
            EditorHandshake.WriteHandshake();
            var first = JsonUtility.FromJson<EditorHandshake.HandshakePayload>(File.ReadAllText(EditorHandshake.TargetPath()));

            EditorHandshake.WriteHandshake();
            var second = JsonUtility.FromJson<EditorHandshake.HandshakePayload>(File.ReadAllText(EditorHandshake.TargetPath()));

            Assert.AreEqual(first.schemaVersion, second.schemaVersion, "重复加载写入应保持 schema 版本幂等");
            Assert.AreEqual(first.pid, second.pid, "同一编辑器会话进程身份不变");
            Assert.AreEqual(first.editorVersion, second.editorVersion, "同一编辑器会话版本不变");
            Assert.GreaterOrEqual(
                DateTime.Parse(second.occurredAt, null, System.Globalization.DateTimeStyles.RoundtripKind),
                DateTime.Parse(first.occurredAt, null, System.Globalization.DateTimeStyles.RoundtripKind),
                "occurredAt 随重写单调演进（最新踪迹胜出）");
        }
    }
}
