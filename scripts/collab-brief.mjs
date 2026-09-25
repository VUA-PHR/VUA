#!/usr/bin/env node
/**
 * collab-brief.mjs — VUA collab/ 开工简报（零依赖，Node >= 18，ESM）
 *
 * 原理：所有工作树共享同一个 .git 对象库；git show <branch>:<path> 可在任意工作树
 * 读取其它分支已提交的 collab/state 状态文件。本脚本把各工作树状态、指向本树/角色
 * 的阻塞与留言、分叉统计、REGISTRY 一致性汇总成一屏简报。
 *
 * 用法：pnpm collab:brief（或 node scripts/collab-brief.mjs），在任意 VUA 工作树内运行。
 * 所有 git 调用均用 execFileSync，cwd = 仓库根；任何单点失败降级为提示行，不中断。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const WT_BY_DIR = { VUA: 'wt-main', 'VUA-2': 'wt-2', 'VUA-3': 'wt-3', 'VUA-4': 'wt-4', 'VUA-5': 'wt-5', 'VUA-6': 'wt-6' };
// 角色以各状态文件 front-matter 的 role: 字段为准（六角色制）；本表仅作旧文件兜底
const ROLE_FALLBACK = { 'wt-main': '集成', 'wt-2': '核心', 'wt-3': '桌面', 'wt-4': '产线', 'wt-5': '数据', 'wt-6': '环境' };
const STALE_LIMIT = 10; // baseline_commit 落后分支尖超过该提交数视为失鲜
const STATE_DIR = 'collab/state/';

const cwdRoot = runGit(['rev-parse', '--show-toplevel'], process.cwd());
if (!cwdRoot) {
  console.error('collab:brief：无法定位仓库根（git rev-parse --show-toplevel 失败）');
  process.exit(1);
}
const repoRoot = cwdRoot;

function runGit(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd: cwd ?? repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

const now = new Date();
// 某分支上某文件的最后变更时间（epoch 秒）；用于选取状态文件的最新副本
const fileEpoch = (b, f) => {
  const t = runGit(['log', '-1', '--format=%ct', b, '--', f]);
  const n = Number(t);
  return t && Number.isFinite(n) ? n : 0;
};
const pad = (n) => String(n).padStart(2, '0');
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

function frontMeta(content) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  const meta = {};
  if (!m) return meta;
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return meta;
}

// 按 ## 节收集条目式内容（- 开头），供阻塞/留言路由解析
function sectionBullets(content) {
  const map = {};
  let cur = null;
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      cur = line.slice(3).trim();
      map[cur] = map[cur] ?? [];
    } else if (cur && /^- /.test(line)) {
      map[cur].push(line.slice(2));
    }
  }
  return map;
}

const line = (s = '') => console.log(s);

// ---------- 分支清单与元信息 ----------
const branchMeta = {};
for (const row of (runGit(['for-each-ref', '--format=%(refname:short)%09%(objectname:short)%09%(committerdate:unix)%09%(committerdate:short)', 'refs/heads']) ?? '').split('\n')) {
  const [name, short, epoch, date] = row.split('\t');
  if (name) branchMeta[name] = { short, epoch: Number(epoch) || 0, date: date ?? '' };
}
const branchList = ['main', ...Object.keys(branchMeta).filter((b) => b !== 'main')];

// ---------- 收集各分支的 collab/state 文件（git 对象库即消息总线） ----------
const entries = []; // { wt, branch, file, content }
for (const b of branchList) {
  const listing = runGit(['ls-tree', '--name-only', b, STATE_DIR]);
  if (listing === null) {
    line(`提示：分支 ${b} 读取失败（ls-tree），跳过。`);
    continue;
  }
  const files = listing
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => /^collab\/state\/wt-[^/]+\.md$/.test(s));
  if (files.length === 0) continue; // 分支尚未接入 collab：静默跳过，② 尾部统一提示
  for (const f of files) {
    const content = runGit(['show', `${b}:${f}`]);
    if (content === null) {
      line(`提示：分支 ${b} 的 ${f} 读取失败（git show），跳过。`);
      continue;
    }
    entries.push({
      wt: f.replace(/^collab\/state\//, '').replace(/\.md$/, ''),
      branch: b,
      file: f,
      content,
      epoch: fileEpoch(b, f),
    });
  }
}

// 同 wt 去重：取该文件在各分支上最后变更时间最新的那份。
// 不做 main 优先——main 上的副本可能只是尚未回流的旧状态（2026-09-07 教训）
const bestOf = new Map();
for (const e of entries) {
  const prev = bestOf.get(e.wt);
  if (!prev || e.epoch > prev.epoch) bestOf.set(e.wt, e);
}
const states = [...bestOf.values()].sort((a, b) => {
  const rank = (wt) => (wt === 'wt-main' ? 0 : /^wt-(\d+)$/.test(wt) ? 1 + Number(/^wt-(\d+)$/.exec(wt)[1]) : 99);
  return rank(a.wt) - rank(b.wt) || (a.wt < b.wt ? -1 : 1);
});

// ---------- 当前工作树识别：目录 basename -> wt；未知时按检出分支反推 ----------
let currentWt = WT_BY_DIR[path.basename(repoRoot)] ?? null;
let wtNote = path.basename(repoRoot);
if (!currentWt) {
  const cur = runGit(['branch', '--show-current']);
  const byBranch = states.filter((s) => frontMeta(s.content).branch === cur);
  if (byBranch.length === 1) {
    currentWt = byBranch[0].wt;
    wtNote = `${wtNote}（检出分支 ${cur} -> ${currentWt}）`;
  } else if (cur) {
    wtNote = `${wtNote}（检出分支 ${cur}，无对应状态登记）`;
  }
}
const currentRole = (() => {
  const own = states.find((s) => s.wt === currentWt);
  const fromMeta = own ? frontMeta(own.content).role : null;
  return fromMeta || ROLE_FALLBACK[currentWt] || null;
})();

// ---------- ① 解析：指向当前 wt/角色的阻塞与留言；失鲜检查 ----------
const targets = new Set([currentWt]);
if (currentRole) targets.add(currentRole);
const routed = [];
for (const s of states) {
  const meta = frontMeta(s.content);
  const src = `${s.wt}（front-matter branch: ${meta.branch ?? '?'}）`;
  const bullets = sectionBullets(s.content);
  for (const sec of ['阻塞', '留言']) {
    for (const b of bullets[sec] ?? []) {
      const m = /^\[→([^\]]+)\]\s*/.exec(b);
      if (m && targets.has(m[1].trim())) routed.push({ src, sec, text: b });
    }
  }
}
const stale = [];
for (const s of states) {
  const meta = frontMeta(s.content);
  const base = meta.baseline_commit;
  const declared = meta.branch;
  if (!base) continue;
  // “其分支尖”取 front-matter 声明分支（失鲜=登记方未随自己分支推进刷新）；
  // 声明分支缺失时退回文件所在分支。
  const tipBranch = declared && branchMeta[declared] ? declared : branchMeta[s.branch] ? s.branch : null;
  if (!tipBranch) continue;
  // 失鲜只按非 collab/ 实质提交计：纯状态/协调提交不算推进（防空转反馈环）
  const n = runGit(['rev-list', '--count', `${base}..${tipBranch}`, '--', '.', ':(exclude)collab/']);
  if (n === null || n === '') continue;
  const count = Number(n);
  if (Number.isFinite(count) && count > STALE_LIMIT) {
    stale.push({ wt: s.wt, branch: tipBranch, count });
  }
}
const noCollab = branchList.filter((b) => !entries.some((e) => e.branch === b));

// ---------- ④ REGISTRY 校验 ----------
function registryCheck() {
  const regPath = path.join(repoRoot, 'docs', 'REGISTRY.md');
  if (!existsSync(regPath)) {
    line('REGISTRY 尚未建立（docs/REGISTRY.md 缺失），跳过登记表校验。');
    return;
  }
  const cells = (l) =>
    l
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
  const rows = readFileSync(regPath, 'utf8').split(/\r?\n/);
  // 表头行识别：某格恰为“路径”、某格含“版本”（列名可能是“文档版本”）、某格恰为“状态”。
  // 注意这里是数组元素级比较：c.includes('版本') 会把 '文档版本' 元素判为不匹配，故用 findIndex。
  let headIdx = -1;
  let col = null;
  for (let i = 0; i < rows.length; i += 1) {
    const c = cells(rows[i]);
    const p = c.findIndex((x) => x === '路径');
    const v = c.findIndex((x) => x.includes('版本'));
    const s = c.findIndex((x) => x === '状态');
    if (p >= 0 && v >= 0 && s >= 0) {
      headIdx = i;
      col = { p, v, s };
      break;
    }
  }
  if (headIdx === -1) {
    line('REGISTRY 表头未找到（需含 路径/版本/状态 列的表格），跳过校验。');
    return;
  }
  const normVer = (v) => String(v).trim().replace(/^[vV]/, '');
  const normStatus = (s) => String(s).trim().replace(/^[vV]/, '');
  // Patch 级漂移容忍：REGISTRY 只随 Minor/Major 更新（治理规范 §2.3），故按 major.minor 比较
  const majMin = (x) => normVer(x).split('.').slice(0, 2).join('.');
  const ok = [];
  const bad = [];
  let total = 0;
  for (const l of rows.slice(headIdx + 1)) {
    const c = cells(l);
    const need = Math.max(col.p, col.v, col.s);
    if (c.length > 0 && c.every((x) => /^:?-{2,}:?$/.test(x))) continue; // 分隔行
    // 表格数据行必以「|」开头；正文行/空行不参与登记表校验。
    if (!l.trim().startsWith('|')) continue;
    // BG-21：表格行结构校验。旧逻辑把列数不足的行静默 continue——截断行被整行
    // 吞掉（行计数漂移无检测、坏行绕过版本/状态校验，畸形负例曾报「45/45 全一致
    // exit 0」）。列数不足或必填格（路径/版本/状态）为空都计异常，不再静默。
    if (c.length <= need) {
      total += 1;
      bad.push(`✗ REGISTRY 畸形行（列数 ${c.length}，需 ≥${need + 1}）：${l.trim().slice(0, 80)}`);
      continue;
    }
    const emptyRequired = [col.p, col.v, col.s].filter((i) => !c[i]).length;
    if (emptyRequired > 0) {
      total += 1;
      bad.push(`✗ REGISTRY 畸形行（必填格空 ${emptyRequired} 处）：${l.trim().slice(0, 80)}`);
      continue;
    }
    const regPath0 = c[col.p].replace(/^\[([^\]]+)\]\(([^)]+)\)$/, '$2').replace(/^`|`$/g, '');
    const regVer = c[col.v];
    const regStatus = c[col.s];
    if (!regPath0 || regPath0 === '---') continue;
    total += 1;
    const full = path.join(repoRoot, regPath0);
    // T2 Schema 目录行（schemas/<name>/<semVer>/）：版本载体＝路径尾段目录名
    // （治理规范 §1 T2「各自独立版本」）；JSON 无 markdown 文档头，头部校验不适用，
    // 改校验目录存在＋目录版本与 REGISTRY 版本 major.minor 一致。
    if (regPath0.startsWith('schemas/')) {
      const dirExists = existsSync(full);
      // 尾段接受 v<整数> / vX.Y / vX.Y.Z——unity-bridge 命令面自带整数版本
      // 惯例（schemas/unity-bridge/v4，schemaVersion 常量即 4），其「版本载体
      // ＝路径尾段目录名且须与登记版本 major.minor 一致」的校验强度不变
      //（2026-09-21 集成第 141 批随 VUA-8 并线登记扩展）。
      const m = regPath0.match(/\/v(\d+(?:\.\d+){0,2})\/?$/);
      const dirVer = m ? m[1] : null;
      const dirVerOk = dirVer !== null && majMin(dirVer) === majMin(regVer);
      if (dirExists && dirVerOk) {
        ok.push(regPath0);
      } else {
        const bits = [];
        if (!dirExists) bits.push('目录缺失');
        else if (!dirVerOk) bits.push(`版本 REGISTRY=${normVer(regVer)} vs 目录=${dirVer ?? '（路径尾段无 vX.Y）'}`);
        bad.push(`✗ ${regPath0}：${bits.join('；')}`);
      }
      continue;
    }
    let head = '';
    try {
      head = readFileSync(full, 'utf8').split(/\r?\n/).slice(0, 16).join('\n');
    } catch {
      bad.push(`✗ ${regPath0}：文件缺失`);
      continue;
    }
    const v = head.match(/^>\s*(?:文档版本|Document version)[:：]\s*(.+?)\s*$/im);
    const st = head.match(/^>\s*(?:状态|Status)[:：]\s*(.+?)\s*$/im);
    const docVer = v ? normVer(v[1]) : null;
    // 状态比较取“（/→”之前的词干，容忍两侧括注写法不同；英文头部键按同义词归一
    const STATUS_ALIAS = { accepted: '已接受', frozen: '已冻结', draft: '草案', superseded: '已取代', candidate: '候选', 'b2 implementation baseline': 'B2 实现基线', 'b3 implementation baseline': 'B3 实现基线' };
    const stem = (x) => {
      const s0 = normStatus(x).replace(/\*+/g, '').split(/[（(→—]|--/)[0].trim();
      return STATUS_ALIAS[s0.toLowerCase()] ?? s0;
    };
    const docStem = st ? stem(st[1]) : null;
    const regStem = stem(regStatus);
    // Patch 级漂移容忍：比较逻辑用 majMin（定义见上）
    const verOk = docVer !== null && majMin(docVer) === majMin(regVer);
    const statusOk = docStem !== null && docStem === regStem;
    if (verOk && statusOk) {
      ok.push(regPath0);
    } else {
      const bits = [];
      if (!verOk) bits.push(`版本 REGISTRY=${normVer(regVer)} vs 头部=${docVer ?? '（缺 文档版本 行）'}`);
      if (!statusOk) bits.push(`状态 REGISTRY=${regStem} vs 头部=${docStem ?? '（缺 状态 行）'}`);
      bad.push(`✗ ${regPath0}：${bits.join('；')}`);
    }
  }
  for (const b of bad) line(b);
  line(`登记表校验：一致 ${ok.length} 项 / 异常 ${bad.length} 项（共 ${total} 行）。`);

  // ---------- 反向盲区检查（BG-8b）：schemas/ 词表族漏登记检测 ----------
  // 正向校验只核对已存在的 REGISTRY 行，结构上发现不了「目录存在但未登记」；
  // 此段反向扫描 schemas/ 目录补上该盲区。
  // 豁免：spike 探索目录（治理不强制登记）；orchestrator（子目录
  // 为 envelope-v1/provider-frame-v0.1 非标准版本形态，由 provider-process
  // 协议本行覆盖）；orchestrator-task-store（由 task-store 协议本行覆盖，
  // 目录名与词表行名不同缀）。editor-verify 豁免行已随 021 冻结批验收移除
  // （2026-09-13，反向盲区检查由 schemas/editor-verify/v0.1 登记行兜住）。
  const SCHEMA_EXEMPT = new Set([
    'bdl-spike',
    'environment-spike',
    'vpm-package-spike',
    'orchestrator',
    'orchestrator-task-store',
  ]);
  try {
    const schemasDir = path.join(repoRoot, 'schemas');
    const registryText = rows.join('\n');
    const missed = [];
    for (const fam of readdirSync(schemasDir)) {
      if (SCHEMA_EXEMPT.has(fam)) continue;
      // 已登记判定：REGISTRY 任一行提及 schemas/<fam> 路径、
      // docs/protocols/<fam> 协议本、或「| <fam>（」括号路径形态。
      const mentioned =
        registryText.includes(`schemas/${fam}`) ||
        registryText.includes(`docs/protocols/${fam}`) ||
        registryText.includes(`| ${fam}（`);
      if (!mentioned) missed.push(`schemas/${fam}/：目录存在但 REGISTRY 未登记（漏登记）`);
    }
    // 反向发现在正向打印循环之后，此处补打印（计入 bad 计数与退出码）
    for (const m of missed) {
      line(`✗ ${m}`);
      bad.push(m);
    }
  } catch {
    // schemas/ 目录读取失败不阻断正向校验结果
  }
  return bad.length;
}

// ---------- 冲突标记扫描（7918790 REGISTRY 残留事故守卫） ----------
// 背景：合并 7918790 的 docs/REGISTRY.md 冲突解决留下一条 `>>>>>>> slot/wt-5`
// 残留行，三代提交（7918790/a2cc12e/168f48b）期间 registry-only 校验与
// collab-registry CI 均未察觉——两类校验都不扫描冲突标记。本扫描对全部受管
// 文本文件检查未解决合并冲突标记，fail-loud：发现即非零退出。
function conflictMarkerCheck() {
  const files = runGit(['ls-files', '-z']);
  if (files === null) {
    line('提示：git ls-files 失败，冲突标记扫描跳过（不计异常）。');
    return 0;
  }
  const textExt =
    /\.(md|markdown|txt|ts|tsx|js|cjs|mjs|rs|json|yml|yaml|toml|css|scss|html|sh|ps1|cmd|bat)$/i;
  const hit = (l) => /^<{7} |^>{7} |^\|{7} |^={7}$/.test(l);
  const bad = [];
  const tracked = files.split('\0').filter(Boolean);
  for (const f of tracked) {
    if (/(^|\/)(package-lock\.json|pnpm-lock\.yaml)$/.test(f)) continue;
    if (!textExt.test(f)) continue;
    let content;
    try {
      content = readFileSync(path.join(repoRoot, f), 'utf8');
    } catch {
      continue; // 索引在而工作区缺文件等，跳过
    }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      if (hit(lines[i])) {
        bad.push(`✗ ${f}:${i + 1}：${lines[i].trim().slice(0, 60)}`);
        break; // 每文件报首处即可
      }
    }
  }
  if (bad.length === 0) {
    line(`冲突标记扫描：受管文本文件 ${tracked.length} 个中 0 处未解决冲突标记。`);
  } else {
    line(`冲突标记扫描：${bad.length} 个文件含未解决冲突标记：`);
    bad.forEach((x) => line(`  ${x}`));
  }
  return bad.length;
}

// ---------- registry-only 模式（BG-5 CI 入口）----------
// 仅跑登记表校验与冲突标记扫描并以其结果为退出码；不影响无参数时的完整简报行为。
if (process.argv.includes('--registry-only')) {
  line('【④ 登记表】（registry-only：docs/REGISTRY.md 与文档头部一致性）');
  const registryBad = registryCheck() || 0;
  line();
  line('【⑤ 冲突标记】（registry-only：全树未解决合并冲突标记扫描）');
  const markerBad = conflictMarkerCheck();
  process.exit(registryBad + markerBad > 0 ? 1 : 0);
}

// ---------- 输出 ----------
const rule = '='.repeat(72);
line(rule);
line(`collab:brief — ${today} ${clock}`);
line(`工作树：${currentWt ?? 'unknown'}（${wtNote}）${currentRole ? ` · 角色：${currentRole}` : ''}`);
line(`仓库：${repoRoot}`);
line(rule);

line();
line('【① 注意】—— 指向本树/角色的阻塞与留言');
if (routed.length === 0) {
  line('（无指向本树或本角色的阻塞/留言）');
} else {
  for (const r of routed) line(`· [${r.src}·${r.sec}] ${r.text}`);
}
const staleLines = stale.map((s) => `失鲜：${s.wt} 的 baseline 落后其分支 ${s.branch} 尖 ${s.count} 提交（>${STALE_LIMIT}）`);
if (staleLines.length) {
  line();
  line('失鲜工作树（状态文件未随分支推进刷新）：');
  staleLines.forEach((x) => line(`  ${x}`));
} else {
  line('失鲜工作树：（无）');
}

line();
line('【② 工作树状态】（git show 读取，全文见下；空行已压缩）');
if (states.length === 0) {
  line('（任何分支都未找到 collab/state，机制尚未就绪？）');
} else {
  for (const s of states) {
    line(`── ${s.wt}（读自 ${s.branch}:${s.file}）`);
    line(s.content.replace(/\n{3,}/g, '\n\n').trimEnd());
  }
}
if (noCollab.length) {
  line(`提示：以下分支尚无 collab/state，未接入机制：${noCollab.join('、')}`);
}

line();
line('【③ 分叉】（相对集成分支 main；落后 = main 独有提交，领先 = 分支独有提交；实质 = 非 collab/ 提交）');
for (const b of branchList) {
  const lr = runGit(['rev-list', '--left-right', '--count', `main...${b}`]);
  if (lr === null) {
    line(`main...${b}：（读取失败）`);
    continue;
  }
  const [behind, ahead] = lr.split(/\s+/).map(Number);
  const lrReal = runGit(['rev-list', '--left-right', '--count', `main...${b}`, '--', '.', ':(exclude)collab/']);
  const [behindR, aheadR] = lrReal ? lrReal.split(/\s+/).map(Number) : [null, null];
  const real = behindR === null ? '' : `｜实质 落后 ${behindR} / 领先 ${aheadR}`;
  const meta = branchMeta[b];
  line(`main...${b}${b === 'main' ? '（自身）' : ''}：落后 ${behind} / 领先 ${ahead}${real}${meta ? `   尖 ${meta.short}（${meta.date}）` : ''}`);
}

line();
line('【④ 登记表】（docs/REGISTRY.md 与文档头部 文档版本/状态 一致性）');
registryCheck();

line();
line('【⑤ 冲突标记】（全树未解决合并冲突标记扫描；7918790 REGISTRY 残留事故守卫）');
conflictMarkerCheck();
