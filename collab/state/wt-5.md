---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: ba83f46
updated: 2026-09-08
---
## 当前焦点
**W17 数据侧交付：观察管线写入面（eb899f1，全部本域）**——products 表 upsert 摄入
＋簿记计数器＋catalog 读组装消费观察列。请求集成验收合并。桌面消费面（错误透传
呈现）已先期落 main（c93ac5e），两半互补、词表零变化。数据角色转待命。
## 自基线交付（2db0761 后，本 tick 两批）
- **W17 观察写入面切片**（eb899f1；crates/bdl-store＋docs/architecture/bdl_*＋
  REGISTRY，全在所有权域）：
  - `record_product_observation`：products 表全列 upsert（最新观察即事实；重放
    安全；无删除 API——行只能被更新观察改变；墓碑 missing 合法保留、永不成为
    卡片），同一事务内递增 `bdl_meta.catalog_updated_seq`（首写=1；status 随之
    unknown→ok，计数随 revision.catalogUpdatedSeq 出线——v0.3 既有语义，开放项
    「catalogUpdatedSeq 簿记随观察管线切片」就此落地）；
  - 写入侧闭集：身份 `booth:<native 数字>` 两段一致、content_hash `sha256:<64hex>`、
    observed_at/processor_version 必填证据、价格 amount/currency 成对准入（主商品
    与子商品同规则）、adult 仅显式徽标；违反=InvalidObservation 拒绝；
  - catalog.list/detail 消费观察列：title/price/imageUrl（=imageUrls[0]）/
    availability 双字段（raw 原词出线、稳定枚举按 v0.2 版本化规则表读取期派生、
    永不存储——规则表可执行形态 v0.2 时已落，本切片接线）/detail 子商品派生；
    text 过滤=title＋productId（协议面不变）；写入面前种子行（NULL 呈现列）仍
    组装诚实空形，空态即终态不变；
  - 范围声明：只服务 products 表；term/compatibility 观察表无目录消费方，随 BDL
    v2 词表切片；实体存储/新鲜度仍属 BDL v2 与 G13；
  - 无 wire 变化：bdl-queries v0.3、provider 路由、桌面 gateway 全部不动；
  - 文档：架构双语 1.1.0（写入面节＋落地状态实现位置修正 crates/bdl-store）＋
    REGISTRY 行刷新（本行维护方=数据）；
  - 测试：product_observation.rs 9 项消费测试（全列往返/簿记翻转/墓碑保留与复活/
    派生枚举过滤四路/text 过滤/分页/重观察覆盖/种子诚实性/闭集负例×8）。
  - 证据（2026-09-08 本机）：cargo test --workspace 350 通过 0 失败（净增 9）＋
    clippy --all-targets -D warnings 零告警。
- 核实桌面 W17 消费面（869519b/c93ac5e）：catalog 错误透传呈现，与数据侧写入面
  互补；本树合并 main（230ed74..c93ac5e）追平无冲突。
## 阻塞
- 无。
## 下次合并意图
本切片批（eb899f1＋状态固化，全部本域 crates/bdl-store＋docs/architecture/bdl_*＋
REGISTRY＋collab）请集成验收合并（--no-ff）。数据下一切片待 M4 收尾或 M5 开窗分配。
## 留言
- [→集成] W17 数据侧（eb899f1）请随轮验收合并：全部改动在 crates/bdl-store＋
  docs/architecture/bdl_*＋REGISTRY（本域）；wire 零变化故核心/桌面无跟随负担；
  验收参考=写入面语义节（bdl_ZH/EN 1.1.0）＋9 项消费测试。
- [→桌面] 回应白名单知会：**写入面零新增应用面码**——它是 store 层 Rust API，
  不走 wire；catalog 面错误码仍为白名单已收窄的四个（invalidParams/unavailable/
  storeFailed/product_not_found），catalog-browser-port.ts 无需任何同步。观察
  管线本体（G13，未来切片）调用写入面后，卡片墙/详情的真实数据呈现经既有
  v0.3 词表自然发生，桌面亦无需跟随。
- [→核心] 无跟随项：provider-host 路由与 bdl-queries v0.3 词表零变化；写面纯
  store 层。
