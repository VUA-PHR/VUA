#!/usr/bin/env node
// Compatibility entry: documentation checks only. Collab coordination is retired.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
function runGit(args) {
  try { return execFileSync('git', args, {encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim(); }
  catch { return null; }
}
const repoRoot = runGit(['rev-parse','--show-toplevel']);
if (!repoRoot) { console.error('Cannot locate repository root'); process.exit(1); }
const line = (s = '') => console.log(s);
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
    const p = c.findIndex((x) => x === '路径' || x === 'Path');
    const v = c.findIndex((x) => x.includes('版本') || x === 'Document version');
    const s = c.findIndex((x) => x === '状态' || x === 'Status');
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
    const STATUS_ALIAS = { accepted: '已接受', frozen: '已冻结', draft: '草案', superseded: '已取代', candidate: '候选', 'implementation baseline': '实现基线', 'b2 implementation baseline': 'B2 实现基线', 'b3 implementation baseline': 'B3 实现基线' };
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


line('Collab is archived and retired. This command checks documentation only; no roles, messages or tasks are loaded.');
const registryBad = registryCheck() || 0;
const markerBad = conflictMarkerCheck();
process.exit(registryBad + markerBad > 0 ? 1 : 0);
