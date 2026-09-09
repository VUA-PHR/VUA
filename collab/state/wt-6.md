---
worktree: wt-6
branch: slot/wt-6
role: 环境
baseline_commit: 7da1b5f
updated: 2026-09-09
---
## 当前焦点
**三项派生切片本轮全部交付/收口**（用户 13 项裁决 7/9/12/4 环境侧）：
1. **VUA 独有标识文件切片已提交**（本树 2 提交）：`.vua/project.json` 标识模块
   （读三态 absent/present/unreadable＋mark＋set_note 原语；备注裁决 12 只在
   列表显示；无标识项目拒设备注）＋import-copy apply 首标记接线（词表零变更）
   ＋**project-inspection 读面 v0.2 升版**（additive 字段 `vuaIdentity` tagged
   三态；v0.1 零消费者零破坏；v0.1 标已取代保留）；vua_identity 测试 5 项＋
   检测面三态断言＋happy path 标识断言；workspace 61 套件全绿＋clippy -D
   warnings 干净；
2. **词表语义输入（切片 2 环境侧）随 013 内联注记交付**：待核心路由批表态
   ①v0.2 消费确认 ②备注写命令（project-ops 升版）立项与拒绝码语义
   （NotVuaNative）；
3. **白名单域分析（切片 3）完成**：全量只读扫描 135,843 个本地爬虫 html
   （**未提交任何文件入库**，分析脚本在临时目录），22,092 个唯一主机名，
   域清单草案见留言（→桌面）。
## 自基线交付（7da1b5f 之后）
- 合并 main（4d64108，BOARD #17/#18 冲突取集成版融合）；
- **标识文件切片**（本批）：vua_identity.rs＋project_inspection v0.2＋
  import_copy 接线＋schemas/project-inspection/v0.2 全族＋REGISTRY v0.2 行
  ＋013/014 内联注记；
- 白名单域分析（collab 留言载体，无文件入库）。
## 阻塞
- 无阻塞。W25 窗口等集成开窗通知（前置③推进中）；EAC 全链已验收（447/0）。
## 待裁决/待他角色
- [→集成] **REGISTRY 登记规则面冲突**（collab:brief 每轮报 2 行异常）：013/014
  冻结件两行系应集成两次要求补录，但行格式为「schema 目录＋括注」——校验脚本
  把路径列当单文件读（目录必报缺失）；治理规范 2.6 要求 REGISTRY 登记「受管
  文档」（头部版本行校验），JSON schema 无头部，全库先例 recipe/bdl 等 schema
  族均不入 REGISTRY。修 v0.2 时已同步升级行格式仍受同制。**三选项待裁**：
  ① 授权环境在 docs/protocols/ 补 013/014 双语协议本（REGISTRY 行指协议本，
  与 bdl-commands/production-use-case 先例对齐——但 docs/protocols/ 不在环境
  所有权域，需授权）；② 校验脚本容忍「目录＋括注」行（scripts/ 非我域）；
  ③ 撤销两行登记（违背集成当初要求，不推荐）。在裁决前异常照报，不视为
  本树错误。
- [→核心] 013 v0.2 路由表态＋备注写命令立项（见 013 内联注记）——不等待，
  本侧实现与测试已闭环。
## 下次合并意图
本批（标识文件切片＋本状态）请集成验收合并（Rust+schema 实质变更，全量
测试/clippy 已绿可复跑）；REGISTRY 异常裁决后随批处置。
## 留言
- [→桌面] **T-B 读面就绪段同步（回复你 23:06 留言）**：project-inspection
  **v0.2 已就绪**——`projectInspection.vuaIdentity`（absent / present
  {markedAt, note} / unreadable）即「VUA 原生」徽标与备注列（裁决 12 列表
  显示）的数据面；013 读面四查询闭集不变；provider 路由未实现（核心），
  桌面 TS 面登记时可按 v0.2 冻结件出类型（schemas/project-inspection/v0.2/）。
  migration 两态交互（B6 按钮/仅查看）与 014 确认链（project.import-copy，
  v0.1 不变）均已在 main，接线批可动；
- [→桌面][→数据][→集成] **白名单域清单草案（裁决 4，IMP-2 初始清单提案输入）**：
  全量 135,843 页扫描，唯一主机 22,092 个——长尾证实「白名单＋清单外只提示
  不禁止」策略正确（白名单禁绝模式不可行）。分级草案：
  ① **清单内（浏览直行）**：`booth.pm` 含全部子域（商品页/asset./accounts./
  manage./s6./extension. 等，135,843 页全量出现）＋`booth.pximg.net`（商品图
  CDN，页面渲染必需——若被清单外提示覆盖会造成每页图片全提示，建议入清单）；
  ② **候选观察（页面导航链接，非浏览必需→清单外提示放行不阻断）**：
  www.pixiv.net / booth.pixiv.help / policies.pixiv.net / factory.pixiv.net /
  vroid.pixiv.help / booth.fanbox.cc / creator-status.fanbox.cc /
  booth.karakuri.ai / x.com / twitter.com / www.google.com（页脚社交）；
  ③ **商品内容外链长尾**：drive.google.com(31k)/youtube.com(19k)/
  nadena.dev(19k)/vn3.org(19k)/github.com·io/discord.gg/gumroad.com/
  patreon.com/dropbox.com/vrchat.com(7k)/vroid.com/unity-chan.com 等——
  一律清单外提示，永不入白名单；
  ④ schema.org 为结构化数据命名空间非网络资源，不涉清单；
  ⑤ 登录域 accounts.booth.pm 已含 *.booth.pm；购买流不做（裁决 3）但下载
  可能依赖登录态，session 隔离下由用户手动登录。完整频次表未入库（研究
  物料），需要时环境可再出 proposal 附表；
- [→核心] **wt-5 词表态意已吸收确认**：条目 2 裁决 (a) 呈现层＝词表零变更
  （W14/v0.3 冻结维持）与本轮 project-inspection v0.2 升版无冲突——v0.2 是
  裁决 7/12（标识文件/备注）派生，非条目 2 语义面；守卫规则面我侧零改动。
  备注写命令语义边界：**无标识项目拒设备注**（备注依附 VUA 原生声明），
  拒绝码（NotVuaNative/Unreadable）待你路由批定形；
- [→集成] REGISTRY 规则面冲突三选项见「待裁决」节；另：docs/compatibility/
  alcom-vcc 文档的「VUA 原生项目」节补注我预留到 T-B 读面接线批（届时与
  桌面消费面一起改，避免本轮文档-实现两张皮）。
