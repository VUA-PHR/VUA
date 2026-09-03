# BOOTH 商品页抽取规范

[English](booth-product-extraction_EN.md) | [简体中文](booth-product-extraction_ZH.md)

> 状态:已接受——约束识别管线重写
> 规范版本:0.2(0.1 经黄金锚定祖先链追踪修正)
> 范围:BOOTH 商品页(静态存档)抽取,服务 BDL
> 更新:2026-09-04
> 规范效力:BDL v1 识别管线的抽取规则;管线本身按本规范从零重写

规则源自本地语料中的真实商品 HTML;黄金锚定商品为 4431242 与 5986971(完整存档保留在
本地,永不入库)。以下每条规则都在该观测 HTML 上验证过,包括"负知识"一节的踩坑记录。

## 页面结构

```text
<main>
└─ #items                         商品根节点
   ├─ #js-item                    前端挂载点——静态 HTML 中通常为空
   ├─ article
   │  ├─ .summary                 商品概要区
   │  ├─ .primary-image-area      商品图库
   │  └─ .main-info-column        正文及附加说明
   └─ aside                       关联商品/关联店铺——不属于当前商品
```

## 抽取规则

| 数据 | HTML 实际位置 | 抽取规则 |
| --- | --- | --- |
| 商品 ID | `#items[data-product-id]` | 取 BOOTH 原生商品 ID。 |
| BOOTH 分类 | `#items[data-shop-tracking-product-category]` | 直接取(如 `3D Characters`);`data-product-category` 是数字分类代码。 |
| 分类备用位置 | `#js-item-category-breadcrumbs` | 仅在根节点没有分类时使用;不自行推断分类。 |
| 标题 | `article .summary h2` | 取页面显示的完整标题。 |
| 标题备用位置 | `script[type="application/ld+json"]` 中 Product 的 `name` | `data-product-name` 已观测到截断(Nemesis),不能作为唯一标题来源。 |
| 作者/店铺名 | `article .shop-name`(位于 `section.shop-items` 块内:`.shop-info` → `.shop-name`) | 取页面显示名称。v0.1 首版定位在 `.summary` 下;黄金锚定 4431242 的祖先链追踪显示店铺块是 `.summary` 之外的独立 section。 |
| 作者主页 | JSON-LD Product 的 `brand.url`,或店铺链接 | 只记录作者/店铺本身,不作为正文链接。 |
| 成人标记 | `.summary [class~="bg-primary700"]`,文本为 `Adult` | 只认 BOOTH 明确显示的 Adult,不根据标题猜测。 |
| 点赞数 | `#js-item-wishlist-button` | 浏览器渲染后,数量位于按钮内部文字节点(通常 `.typography-14`);静态存档中可能为空。 |
| 商品发布时间 | `#js-item-published-date` | 渲染后的文本,如 `商品公開日時:2024年8月11日 20時22分`。 |
| 商品更新时间 | 无稳定来源字段 | 既定决策:保留 `null`。 |
| 单一商品价格 | `#items[data-product-price]` 或 JSON-LD `offers.price` | 仅适合没有复杂选项的商品。 |
| 商品整体可售状态 | JSON-LD `offers.availability` | `InStock`、`OutOfStock` 等。 |
| 售罄状态 | `li.variation-item.sold-out` 或禁用的购买按钮 | 记录为不可用,不删除商品记录。 |
| 商品已下架 | HTTP 404/410 | 记录为 deleted/墓碑状态。 |
| 子商品 | `#variations > li.variation-item` | 每个 li 代表一个公开销售选项。 |
| 子商品名称 | `li .variation-name` | 取原文;不能用语义分类替换。 |
| 子商品价格 | `li .variation-price` | 取金额和币种。 |
| 子商品 ID | `data-product-variant` 或隐藏字段 `input[name="cart_item[variation_id]"]` | 购物车按钮和礼物按钮可能重复,需按 ID 去重。 |
| 子商品顺序/数量 | `li.variation-item` 的数量和 DOM 顺序 | 页面没有统一的"库存数量"字段;只能统计选项数量并保存展示顺序。 |
| 正文 | `.js-market-item-detail-description.description` | 提取可见正文文本。 |
| 附加正文段落 | 同一商品 article 内的 `section.shop__text` | 按 DOM 顺序追加到正文。 |
| 搜索投影 | 正文、标题、作者、子商品名称、来源分类 | 拼接为字符串;链接保留在正文中。 |
| 商品图片 | `.primary-image-area .market-item-detail-item-image` 的 `data-origin` | 优先原图;`src`/`data-lazy` 只作备用。 |
| 正文内图片 | 正文中的 `<img>`、`<picture><source>` | 仅在确认属于当前商品时进入 `image_urls`。 |
| 视频 | `<video src>`、`<video><source>`、明确的 YouTube/Vimeo `<iframe>` | 普通下载链接、试用页链接不进入 `video_urls`。 |
| 发现页缩略图 | `li.item-card[data-product-id]` 下的 `.item-card__thumbnail` | 属于发现页数据;不作为商品正文投影。 |

## 负知识(踩坑记录)

1. `#js-item` 是前端挂载点,保存的原始 HTML 中经常为**空**;实际详情应以 `#items` 下的
   `article` 为主。
2. 正文中的 VRChat 试用页、关联商品、作者主页、Discord、Google Drive 等链接都保留在正文
   搜索字符串中,但不会自动变成图片或视频。
3. `favorites_count` 与 `source_published_at` 在静态存档中暂时返回 `null`;
   `source_updated_at` 为空是既定决策。上述位置仍是已确认的抽取位置。
4. `created_at`、`updated_at`、`observed_at` 是管线时间,不是 BOOTH 商品发布时间。

## 管线契约

- 任何 BOOTH HTML/图片重验任务的抓取节奏:**每请求 6 秒**,沿用旧爬虫实测规则;同时抓取并
  哈希 `robots.txt`(`robots_url` + `robots_sha256`)。
- 抽取产物写入 `schemas/bdl-spike/v0.1/schema.sql`(`products` 各列);每行携带
  `content_hash`、`observed_at`、`run_id`、`processor_version`,使信任可追溯到产出管线。
- 识别管线按本规范从零重写:黄金断言跑在本地两个锚定商品存档上;CI 只用结构等价的合成
  夹具。

## 开放项

- 条款观测(VN3/ToS)抽取规则——待 Google Docs/Drive 自动访问政策调研;v1 仅人工提取。
- 正文与子商品名称中的兼容性/依赖抽取规则——同一方法:先真实 HTML,后成规则。

## 变更记录

- 0.2(2026-09-04):修正作者/店铺名的位置——店铺块是 `.summary` 之外的独立
  `section.shop-items`;由首次识别管线运行时的黄金锚定祖先链追踪发现
  (Meiyun 4431242 在 v0.1 规则下 `shop_name` 缺失)。
- 0.1(2026-09-04):基于商品 4431242 与 5986971 的真实 HTML 初始规则。
