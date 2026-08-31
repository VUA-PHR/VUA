//! Capability discovery v0 (ORC-ADP-007): every adapter honestly reports
//! whether it is ready. Missing engines surface as `unavailable` with a
//! typed reason instead of failing deep in a call path; the frontend renders
//! its honest not-connected states from these reports.
//!
//! # 中文逐段讲解（E-S0 审阅）
//!
//! 这是"诚实空态"纪律的引擎侧开关。前端有一套七态 Capability 发现机制；
//! 引擎这边的对应物就是：每个适配器自报家门——ready 还是 unavailable
//! （unavailable 必须携带一个类型化的 AppErrorV1 理由，不是裸字符串）。
//!
//! `CapabilityState::Ready` —— 真实引擎已接上（如 E-PKG 后的 vpm-engine）。
//! `Unavailable { reason }` —— 引擎还没接：前端据此**不渲染入口按钮**
//! （§2.6：入口出现与否由 Capability 决定，而不是渲染一个点了报错的
//! 灰按钮）。reason 里的错误码（如 `vua.capability.engine_missing`）
//! 让诊断页能说清"为什么没有这个功能"。
//! `CapabilityRegistry` —— 聚合器：所有来源的报告按名字排序后吐出
//! （排序保证前端渲染稳定，不因注册顺序抖动）。`is_ready(name)` 是
//! 前端门控的直接依据。
//! `UnavailableSource` —— 还没接入的引擎的便捷占位：注册时就给死
//! 理由，例如 vpm 引擎接真前的 `vua.capability.engine_missing`。

use crate::contracts::AppErrorV1;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "state", rename_all = "snake_case")]
pub enum CapabilityState {
    Ready,
    /// The engine exists but its real backend is not wired yet (E-S0 engines
    /// report this until their slice lands).
    Unavailable {
        reason: AppErrorV1,
    },
}

impl CapabilityState {
    pub fn is_ready(&self) -> bool {
        matches!(self, Self::Ready)
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityReport {
    /// Stable capability name, e.g. `vpm-engine`, `env-detect`, `tutorial`.
    pub name: String,
    pub state: CapabilityState,
}

/// One adapter's view of itself.
pub trait CapabilitySource: Send + Sync {
    fn report(&self) -> CapabilityReport;
}

/// Aggregates adapter reports for the frontend capability gate.
#[derive(Default)]
pub struct CapabilityRegistry {
    sources: Vec<Box<dyn CapabilitySource>>,
}

impl CapabilityRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register(&mut self, source: Box<dyn CapabilitySource>) {
        self.sources.push(source);
    }

    /// Snapshot of all registered capabilities, sorted by name for stable
    /// rendering.
    pub fn snapshot(&self) -> Vec<CapabilityReport> {
        let mut reports: Vec<CapabilityReport> =
            self.sources.iter().map(|source| source.report()).collect();
        reports.sort_by(|left, right| left.name.cmp(&right.name));
        reports
    }

    pub fn is_ready(&self, name: &str) -> bool {
        self.sources
            .iter()
            .any(|source| source.report().name == name && source.report().state.is_ready())
    }
}

/// Convenience source for engines that are not wired yet.
pub struct UnavailableSource {
    name: String,
    reason: AppErrorV1,
}

impl UnavailableSource {
    pub fn new(name: impl Into<String>, reason: AppErrorV1) -> Self {
        Self {
            name: name.into(),
            reason,
        }
    }
}

impl CapabilitySource for UnavailableSource {
    fn report(&self) -> CapabilityReport {
        CapabilityReport {
            name: self.name.clone(),
            state: CapabilityState::Unavailable {
                reason: self.reason.clone(),
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::contracts::ErrorCategory;

    struct ReadySource {
        name: String,
    }

    impl CapabilitySource for ReadySource {
        fn report(&self) -> CapabilityReport {
            CapabilityReport {
                name: self.name.clone(),
                state: CapabilityState::Ready,
            }
        }
    }

    #[test]
    fn orc_adp_007_registry_aggregates_sorted_reports_and_honest_unavailable() {
        let mut registry = CapabilityRegistry::new();
        registry.register(Box::new(ReadySource {
            name: "tutorial".into(),
        }));
        registry.register(Box::new(UnavailableSource::new(
            "vpm-engine",
            AppErrorV1::new(
                "vua.capability.engine_missing",
                ErrorCategory::Unavailable,
                "errors.capability.engineMissing",
                "corr-capability-test",
            ),
        )));

        let snapshot = registry.snapshot();
        assert_eq!(
            snapshot
                .iter()
                .map(|report| report.name.as_str())
                .collect::<Vec<_>>(),
            vec!["tutorial", "vpm-engine"],
            "reports are sorted by name"
        );
        assert!(registry.is_ready("tutorial"));
        assert!(!registry.is_ready("vpm-engine"));
        assert!(!registry.is_ready("unknown"));
        match &snapshot[1].state {
            CapabilityState::Unavailable { reason } => {
                assert_eq!(reason.category, ErrorCategory::Unavailable);
                assert_eq!(reason.code, "vua.capability.engine_missing");
            }
            CapabilityState::Ready => panic!("vpm-engine must be unavailable"),
        }
    }
}
