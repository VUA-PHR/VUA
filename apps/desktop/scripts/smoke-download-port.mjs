// F4-3 下载端口冒烟(在 Electron Main 进程内执行):
// 真实分区 Session + 本地 HTTP fixture,验证冻结词表的事件规范化——
// 1. 完整下载:started(storedPath 在暂存根)→ progress → completed(字节数
//    与文件长度一致);
// 2. 未知长度:无 content-length 的下载 → expectedBytes null;
// 3. 策略拒绝:允许清单外来源在文件创建前 failed/policy(storedPath 空);
// 4. 弃件(abandon 意图):cancelled 事件 + 部分文件弃除;同 URL 重发起
//    重绑原 downloadId 且 attempt 递增。
// 范围注记:interrupted(可续传中断)在 Chromium 中默认被静默自动续传,
// 真实网络下的浮现时机不可控——该路径的状态机逻辑由单元测试覆盖
// (假 DownloadItem 驱动),真实网络中断归 I-1 真机矩阵。
// 每个事件都过 isDownloadEventV01 守卫(deny-unknown-fields 镜像)。
// 证据写入 _local_m4/v<版本>/download-port-smoke.json(.gitignore 排除)。
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, session } from "electron";
import { DownloadPort } from "../dist/electron/download-port.js";
import { isDownloadEventV01 } from "../../../packages/contracts/dist/index.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../../..");
const desktopPackage = JSON.parse(readFileSync(path.resolve(scriptDirectory, "../package.json"), "utf8"));
const productVersion = desktopPackage.version;
const evidenceDirectory = path.join(repositoryRoot, "_local_m4", `v${productVersion}`);
const evidencePath = path.join(evidenceDirectory, "download-port-smoke.json");
const rawLogPath = path.join(evidenceDirectory, "download-port-smoke.log");
const logLines = [];

function log(event, detail = {}) {
  const entry = { at: new Date().toISOString(), event, ...detail };
  logLines.push(JSON.stringify(entry));
  console.log(JSON.stringify(entry));
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitFor(predicate, label, timeoutMs = 8_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await delay(25);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function closeServer(server) {
  if (!server.listening) return Promise.resolve();
  return new Promise((resolve) => server.close(() => resolve()));
}

/** unknown-size 路由不回 content-length(unknown size 语义) */
function createServer() {
  return http.createServer((request, response) => {
    if (request.url === "/unknown-size.bin") {
      response.writeHead(200, { "content-type": "application/octet-stream" });
      response.end(Buffer.alloc(512, 5));
      return;
    }
    response.writeHead(200, {
      "content-type": "application/octet-stream",
      "content-length": String(1024),
    });
    response.end(Buffer.alloc(1024, 7));
  });
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("smoke server did not bind");
  return `http://127.0.0.1:${address.port}`;
}

let evidence = {
  schemaVersion: 1,
  productVersion,
  status: "failed",
  evidencePath,
  rawLogPath,
};

async function run() {
  const servers = [];
  try {
    log("process.start", { electronVersion: process.versions.electron });
    await app.whenReady();

    const allowedServer = createServer();
    const blockedServer = createServer();
    servers.push(allowedServer, blockedServer);
    const allowedOrigin = await listen(allowedServer);
    const blockedOrigin = await listen(blockedServer);
    log("server.ready", { allowedOrigin, blockedOrigin });

    const events = [];
    const stagingRoot = path.join(app.getPath("temp"), `vua-download-smoke-${process.pid}`);
    const port = new DownloadPort({
      stagingRoot,
      allowedOrigins: [allowedOrigin],
      progressIntervalMs: 0,
      sink: {
        emit: (event) => {
          assert.equal(isDownloadEventV01(event), true, `event failed the frozen guard: ${JSON.stringify(event)}`);
          events.push(event);
          log("download.event", {
            kind: event.kind,
            downloadId: event.downloadId,
            attempt: event.attempt,
            receivedBytes: event.receivedBytes,
            expectedBytes: event.expectedBytes,
          });
        },
      },
    });

    const downloadSession = session.fromPartition(`vua-download-smoke-${process.pid}`);
    downloadSession.on("will-download", (event, item, webContents) => {
      port.handleWillDownload(event, item, webContents);
    });

    // 1. 完整下载
    downloadSession.downloadURL(`${allowedOrigin}/full.bin`);
    await waitFor(() => events.some((event) => event.kind === "download.completed"), "completed download");
    const started = events.find((event) => event.kind === "download.started");
    const completed = events.find((event) => event.kind === "download.completed");
    assert.ok(started && completed);
    assert.ok(completed.storedPath.startsWith(stagingRoot));
    assert.equal(completed.receivedBytes, 1024);
    assert.equal(readFileSync(completed.storedPath).length, 1024);
    log("happy.path.passed", { storedPath: completed.storedPath });

    // 2. 未知长度:expectedBytes 如实 null(不以 0 注水)
    events.length = 0;
    downloadSession.downloadURL(`${allowedOrigin}/unknown-size.bin`);
    await waitFor(() => events.some((event) => event.kind === "download.completed"), "unknown-size download");
    const unknownStarted = events.find((event) => event.kind === "download.started");
    assert.equal(unknownStarted.expectedBytes, null);
    log("unknown.size.passed");

    // 3. 策略拒绝:允许清单外来源,文件创建前 failed/policy
    events.length = 0;
    downloadSession.downloadURL(`${blockedOrigin}/blocked.bin`);
    await waitFor(() => events.some((event) => event.kind === "download.failed"), "policy rejection");
    const rejected = events.find((event) => event.kind === "download.failed");
    assert.equal(rejected.failureKind, "policy");
    assert.equal(rejected.storedPath, null);
    log("policy.rejection.passed");

    // 4. 弃件:abandon 意图 → 部分文件弃除(不 Emit cancelled——弃件不是
    //    终态,downloadId 以 attempt+1 延续);同 URL 重发起重绑原 downloadId
    events.length = 0;
    downloadSession.downloadURL(`${allowedOrigin}/abandon.bin`);
    await waitFor(() => events.some((event) => event.kind === "download.started"), "abandon download started");
    const abandonStarted = events.find((event) => event.kind === "download.started");
    assert.ok(existsSync(abandonStarted.storedPath));
    port.applyIntent(abandonStarted.downloadId, "abandon");
    await waitFor(() => !existsSync(abandonStarted.storedPath), "partial file discarded");
    assert.equal(events.some((event) => event.kind === "download.cancelled"), false, "abandon is not terminal");

    events.length = 0;
    downloadSession.downloadURL(`${allowedOrigin}/abandon.bin`);
    await waitFor(() => events.some((event) => event.kind === "download.started"), "rebound download started");
    const rebound = events.find((event) => event.kind === "download.started");
    assert.equal(rebound.downloadId, abandonStarted.downloadId, "downloadId stable across restart");
    assert.equal(rebound.attempt, 2, "fresh-from-zero restart increments attempt");
    port.applyIntent(rebound.downloadId, "abandon");
    log("abandon.rebind.passed");

    evidence = {
      schemaVersion: 1,
      productVersion,
      status: "passed",
      electronVersion: process.versions.electron,
      stagingRoot,
      eventKinds: [...new Set(events.map((event) => event.kind))],
      evidencePath,
      rawLogPath,
    };
  } catch (error) {
    evidence = {
      ...evidence,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error),
    };
    process.exitCode = 1;
    log("smoke.failed", { error: evidence.error });
  } finally {
    for (const server of servers) await closeServer(server);
    await mkdir(evidenceDirectory, { recursive: true });
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    await writeFile(rawLogPath, `${logLines.join("\n")}\n`, "utf8");
    console.log(`Evidence: ${evidencePath}`);
    console.log(`Raw log: ${rawLogPath}`);
    app.quit();
  }
}

void run();
