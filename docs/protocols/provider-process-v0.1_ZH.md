# 受监督 Provider 进程协议 v0.1

[English](provider-process-v0.1_EN.md) | [简体中文](provider-process-v0.1_ZH.md)

> 状态：B2 实现基线
> 所有者：Electron Kernel 与 Orchestrator Provider 适配器
> 更新：2026-09-02
> 封帧版本：`0.1`

## 边界与制品

生产托管形态是由 Electron Main 监督的独立 Rust 可执行文件
`vua-orchestrator-provider.exe`。Renderer 不得直接启动或访问它。启动参数只包含
`--database <绝对路径>`；不使用 shell，工作目录固定为可执行文件目录，子进程只继承
`SystemRoot/WINDIR/TEMP/TMP`。开发构建已验证为单一 EXE 制品；正式发行签名、精确依赖清单和安装包
固定由 B10/M10 使用发行证书完成，B2 不声称开发二进制已经签名。

Provider 在 Windows 启动后把自身加入带 `KILL_ON_JOB_CLOSE` 的 Job Object，使其未来派生的进程随
Provider 异常退出一并回收。同一数据库旁的 `.provider.lock` 持有排他操作系统文件锁；第二个
Provider 必须启动失败，不得形成双权威写入者。锁文件可以保留，权威性来自活动文件锁而非文件存在。

## 传输与握手

stdin/stdout 使用 UTF-8 JSON Lines，一行一帧，每帧最多 1 MiB。stdout 只允许协议帧，诊断写入
stderr；监督端最多保留 64 KiB stderr。双方按 `frameVersion: "0.1"`、非空 `frameId`、`kind` 与
`payload` 封帧。请求/响应复用 `frameId`，事件使用独立 ID。未知或非法封帧被明确拒绝。

监督端启动后必须先完成 `handshake`，核对应用契约 `0.1` 和支持版本，之后才开放调用。应用请求和
事件内容遵循[应用契约 v0.1](application-contract-v0.1_ZH.md)，传输不得暴露 Rust 私有类型。意外退出
使 Provider 进入 `failed` 并拒绝待处理调用；只允许由上层显式重启，不进行无界自动重启。

## 恢复与关闭

每次启动生成新的 `providerInstanceId`。SQLite 中属于旧实例且仍活动的项目租约一律标为
`recovery_required`，不得按时间自动接管；非终态任务保持最后真实状态并报告
`inspect_required`。

关闭按以下顺序执行：

1. 监督端停止接收新调用，并发送带正整数 `timeoutMs` 的 `prepare_shutdown`；
2. Provider 在时限内等待当前实例的项目修改租约释放；无阻塞任务时 checkpoint 并返回
   `safe_to_stop` 后退出；
3. 超时后返回 `needs_user_choice` 和阻塞任务的 `taskId/revision/state`，进程保持活动；
4. 用户选择继续等待时，以新时限重复检查；用户强制退出时必须携带非空 `userDecisionId`；
5. 强制退出先把当前实例租约标为需要恢复，返回 `forced` 及受影响任务，再 checkpoint 和退出。

因此强制退出不会把未知项目状态伪装成成功、失败或可立即重试。下一次修改必须先执行 Inspect，再以
更高 generation 显式接管。
