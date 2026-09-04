/**
 * guide-content 模型校验(G6):
 * - 五页各自的教程在内容包内(注入真实内容包 JSON 校验);
 * - strings 引用的媒体 id 全部有登记资产;
 * - 未登记媒体 id 解析为 null(诚实缺省)。
 */
import assert from "node:assert/strict";
import { test } from "vitest";
import { contentPack } from "../../app/tutorial-content-pack.ts";
import {
  GUIDE_MEDIA,
  GUIDE_PAGE_IDS,
  GUIDE_PAGE_TUTORIAL,
  resolveGuideMedia,
  validateGuideContent,
} from "./guide-content.ts";

test("五页结构校验通过(真实内容包)", () => {
  assert.doesNotThrow(() => validateGuideContent(contentPack));
});

test("每页教程 id 与页 id 同名且在内容包内", () => {
  const pack = contentPack;
  const ids = new Set(pack.tutorials.map((t) => t.id));
  for (const page of GUIDE_PAGE_IDS) {
    assert.equal(GUIDE_PAGE_TUTORIAL[page], page);
    assert.ok(ids.has(page), `内容包缺教程 ${page}`);
  }
});

test("媒体解析:登记 id 有资产,未登记 id 为 null", () => {
  for (const id of Object.keys(GUIDE_MEDIA)) {
    const media = resolveGuideMedia(id);
    assert.ok(media && media.src.length > 0 && media.alt.length > 0, `${id} 资产缺省`);
  }
  assert.equal(resolveGuideMedia("no-such-media"), null);
});
