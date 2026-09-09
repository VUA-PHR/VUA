#!/usr/bin/env node
// Provider lifecycle spike (BG-6, M8 front-running exploration).
//
//   SPIKE — NOT A DELIVERABLE. Exploration only: this script is not part
//   of the product, carries no contract authority, and its findings are
//   recorded in README.md as boundary notes for the M8 performance-baseline
//   work. Time-boxed per the BG-6 ticket discipline (one tick, no scope
//   growth).
//
// What it exercises, against the real supervised provider process:
//   A. baseline session   — handshake + N application.getSnapshot rounds,
//                           latency percentiles (the read-path floor);
//   B. interrupted restart — a running task, hard-kill, re-spawn on the
//                           same database: the recovery discipline says a
//                           non-terminal task must surface for explicit
//                           inspection and never implicitly resume; the
//                           spike observes whether that holds under a
//                           kill the process did not expect.
//
// Prerequisites: `cargo build -p vua-provider-host --bin vua-orchestrator-provider`.
// Usage: node scripts/spikes/provider-lifecycle/spike.mjs [--rounds 20]

import { spawn, execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import readline from "node:readline";

const args = process.argv.slice(2);
const rounds = Number(args[args.indexOf("--rounds") + 1] ?? 20) || 20;
const workspace = new URL("../../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const binary = join(workspace, "target", "debug", "vua-orchestrator-provider.exe");

const percentiles = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
  return { p50: pick(50), p95: pick(95), max: sorted[sorted.length - 1], n: sorted.length };
};

class ProviderSession {
  constructor(databasePath) {
    this.databasePath = databasePath;
    this.nextId = 0;
    this.pending = new Map();
    this.buffer = "";
    this.exitCode = null;
  }

  start() {
    this.startedAt = Date.now();
    this.process = spawn(binary, ["--database", this.databasePath], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.process.once("exit", (code) => { this.exitCode = code; });
    const reader = readline.createInterface({ input: this.process.stdout });
    reader.on("line", (line) => {
      if (!line.trim()) return;
      let frame;
      try { frame = JSON.parse(line); } catch { return; }
      const pending = this.pending.get(frame.frameId);
      if (pending) {
        this.pending.delete(frame.frameId);
        pending(frame);
      }
    });
    this.process.stderr.on("data", (chunk) => {
      this.stderrTail = String(this.stderrTail ?? "").slice(-2000) + chunk;
    });
    return this.handshake();
  }

  request(method, params = {}, kind = "command", extra = {}) {
    const frameId = `spike-${++this.nextId}`;
    const frame = {
      frameVersion: "0.1",
      frameId,
      kind: "request",
      payload: {
        contractVersion: "0.1",
        requestId: frameId,
        correlationId: `corr-${frameId}`,
        kind,
        method,
        params,
        ...extra,
      },
    };
    const reply = new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(frame.frameId);
        resolve({ timeout: true });
      }, 15000);
      this.pending.set(frame.frameId, (response) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
    this.process.stdin.write(JSON.stringify(frame) + "\n");
    return reply;
  }

  async handshake() {
    const frameId = `spike-hello-${++this.nextId}`;
    const reply = new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ timeout: true }), 15000);
      this.pending.set(frameId, (response) => { clearTimeout(timer); resolve(response); });
    });
    this.process.stdin.write(
      JSON.stringify({ frameVersion: "0.1", frameId, kind: "handshake", payload: null }) + "\n",
    );
    const started = Date.now();
    const response = await reply;
    return { handshakeOk: !response.timeout && response.kind === "response", handshakeMs: Date.now() - started };
  }

  kill() {
    // A hard kill the process did not expect: the spike's reason to exist.
    this.process.kill("SIGKILL");
  }

  async close() {
    this.process.stdin.end();
    await new Promise((resolve) => {
      if (this.exitCode !== null) return resolve();
      this.process.once("exit", resolve);
      setTimeout(resolve, 5000);
    });
  }
}

const session = { provider: null, database: null, stderrTail: "" };

async function spawnOn(database) {
  const provider = new ProviderSession(database);
  const hello = await provider.start();
  if (!hello.handshakeOk) {
    throw new Error(`handshake failed (stderr: ${provider.stderrTail ?? ""})`);
  }
  return { provider, hello };
}

// --- Scenario A: baseline read-path latency ---
async function baseline() {
  session.database = mkdtempSync(join(tmpdir(), "vua-lifecycle-spike-"));
  const database = join(session.database, "tasks.sqlite");
  const { provider, hello } = await spawnOn(database);
  session.provider = provider;
  console.log(`[A] handshake ok in ${hello.handshakeMs} ms`);

  const latencies = [];
  for (let index = 0; index < rounds; index += 1) {
    const started = performance.now();
    const response = await provider.request("application.getSnapshot", {});
    const elapsed = performance.now() - started;
    if (response.timeout || !response.payload?.ok) throw new Error("getSnapshot timed out or errored");
    latencies.push(elapsed);
  }
  console.log(`[A] application.getSnapshot x${rounds}:`, percentiles(latencies));
  await provider.close();
}

// --- Scenario B: hard kill with a non-terminal task, then re-spawn ---
async function interruptedRestart() {
  const database = join(session.database, "tasks.sqlite");
  const first = await spawnOn(database);
  // A long-running task (we kill long before it finishes). The demo
  // command carries its idempotency commandId at the frame's top level.
  const commandId = `spike-${Date.now()}`;
  const accepted = await first.provider.request(
    "task.startDemo",
    {},
    "command",
    { commandId },
  );
  const taskId = accepted.payload?.value?.task?.taskId;
  console.log(`[B] demo task accepted: ${taskId}`);
  await new Promise((resolve) => setTimeout(resolve, 300));

  first.provider.kill();
  await first.provider.close();
  console.log("[B] provider hard-killed with the task non-terminal");

  const second = await spawnOn(database);
  const list = await second.provider.request("task.list", {});
  const tasks = list.payload?.value?.tasks ?? [];
  const observed = tasks.find((task) => task.taskId === taskId);
  const state = observed?.state ?? "(absent from the snapshot)";
  console.log(`[B] after restart the interrupted task reads: ${state}`);
  console.log(
    "[B] recovery discipline check: a non-terminal task must surface for an",
  );
  console.log(
    "[B] explicit decision and never implicitly resume — the observed state",
  );
  console.log(`[B] above is the spike's boundary finding (README.md).`);
  await second.provider.close();
}

try {
  execSync(`cargo build -q -p vua-provider-host --bin vua-orchestrator-provider`, {
    cwd: workspace,
    stdio: "inherit",
  });
  await baseline();
  await interruptedRestart();
  console.log("[spike] complete — findings go to README.md (SPIKE, not a deliverable)");
} finally {
  if (session.database) rmSync(session.database, { recursive: true, force: true });
}
