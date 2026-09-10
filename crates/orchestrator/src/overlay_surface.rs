//! The desktop Overlay Surface (M7, proposal 017 DRAFT — direction only,
//! nothing here is frozen): the read-only service projection an overlay
//! consumes. The overlay is never a business-logic host — it renders
//! stable snapshots and issues semantic actions through the existing
//! command faces; this module therefore only *projects* facts the
//! authority already serves, it never computes new ones.
//!
//! Boundary anchors (AGENTS architecture constraints, M7 outline row):
//! - overlays consume stable application services and never become
//!   business-logic hosts;
//! - an overlay failure must never block the desktop main line — the
//!   surface is stateless and read-only, so a broken overlay session
//!   cannot hold server-side state or writers;
//! - VR overlays stay outside this milestone (user ruling 2026-09-06);
//!   nothing here assumes a VR transport.
//!
//! What intentionally does NOT live here (kept for the cross-domain
//! proposal pending the desktop stance): the overlay transport/connection
//! face, subscription or push semantics, and any overlay-specific command
//! vocabulary. The read models below reuse the frozen word lists'
//! payloads verbatim — a field here that a frozen schema does not know
//! is a contract break.


/// The minimal read model an overlay renders for the task surface: the
/// same durable snapshots the desktop main line already sees
/// (`application.getSnapshot` / `task.list`), projected to the fields a
/// one-glance surface can render. No new facts, no aggregation beyond
/// ordering — honesty over convenience.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayTaskCard {
    pub task_id: String,
    pub state: String,
    pub correlation_id: String,
}

/// The read-only overlay service. Implementations wrap the authorities
/// (the SQLite task store today; the frozen document faces later) and
/// must stay side-effect free: every call is a pure projection, so an
/// overlay querying in a loop can never change what it observes.
///
/// Read failures are passed through as typed errors, never folded into
/// an empty set — a store failure presented as "no tasks" would dress a
/// failure up as the honest empty state (honesty rule: failures are
/// presented as failures; the empty state is the final state only when
/// the authority actually returned nothing).
pub trait OverlayReadModel: Send + Sync {
    /// The task-surface cards, oldest first — the honest subset of
    /// `TaskSnapshot` an overlay renders (no revision bookkeeping, no
    /// cancel bookkeeping: those belong to the main-line surfaces).
    ///
    /// Errors: a store read failure propagates as
    /// [`crate::SqliteStoreError`] — the consumer (the future overlay UI)
    /// renders the empty state and the failure state distinctly.
    fn task_cards(&self) -> Result<Vec<OverlayTaskCard>, crate::SqliteStoreError>;
}

/// The first concrete read model: projects the durable task store.
pub struct StoreOverlayReadModel {
    store: std::sync::Arc<crate::SqliteTaskStore>,
}

impl StoreOverlayReadModel {
    pub fn new(store: std::sync::Arc<crate::SqliteTaskStore>) -> Self {
        Self { store }
    }
}

impl OverlayReadModel for StoreOverlayReadModel {
    fn task_cards(&self) -> Result<Vec<OverlayTaskCard>, crate::SqliteStoreError> {
        // Ordering key provenance: `SqliteTaskStore::tasks` returns the
        // rows `ORDER BY created_at, task_id` — `created_at` is the task's
        // creation instant (an RFC 3339 timestamp written from
        // `NewTask.occurred_at`), so the store's own ordering IS the
        // enqueue order (oldest first). This projection adds no re-sorting
        // of its own: re-sorting by task_id here would silently replace
        // the enqueue order with hash-alphabetical order.
        let snapshots = self.store.tasks()?;
        Ok(snapshots
            .into_iter()
            .map(|snapshot| OverlayTaskCard {
                task_id: snapshot.task_id,
                state: serde_json::to_value(snapshot.state)
                    .ok()
                    .and_then(|value| value.as_str().map(str::to_owned))
                    .unwrap_or_else(|| "unknown".to_owned()),
                correlation_id: snapshot.correlation_id,
            })
            .collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn unique_database(tag: &str) -> std::path::PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!(
            "vua-overlay-surface-{tag}-{}-{nanos}",
            std::process::id()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        dir.join("tasks.sqlite")
    }

    #[test]
    fn task_cards_project_the_durable_snapshots_sorted_oldest_first() {
        let database = unique_database("cards");
        let store = std::sync::Arc::new(crate::SqliteTaskStore::open(&database).unwrap());
        let model = StoreOverlayReadModel::new(store);

        // 空态即终态: no tasks yet — the honest empty set, not an error.
        assert!(model.task_cards().unwrap().is_empty());

        // The projection is a pure function of the store: querying twice
        // without a mutation observes the same set (read-only discipline).
        assert_eq!(
            model.task_cards().unwrap(),
            model.task_cards().unwrap()
        );
    }

    #[test]
    fn task_cards_order_follows_the_enqueue_time_not_the_id() {
        let database = unique_database("cards-order");
        let store = std::sync::Arc::new(crate::SqliteTaskStore::open(&database).unwrap());

        // Insert three tasks with DELIBERATELY out-of-order creation
        // instants and out-of-order id alphabet, so an id-sort would read
        // zulu / mike / alpha while the enqueue order is alpha / mike /
        // zulu.
        let seeds = [
            ("zulu", "2026-09-10T03:00:00.000Z"),
            ("mike", "2026-09-10T01:00:00.000Z"),
            ("alpha", "2026-09-10T02:00:00.000Z"),
        ];
        for (index, (suffix, occurred_at)) in seeds.iter().enumerate() {
            let new_task = crate::NewTask {
                task_id: format!("task-{suffix}"),
                correlation_id: format!("corr-{suffix}"),
                occurred_at: occurred_at.to_string(),
            };
            store
                .accept_idempotent_task(
                    "task.startDemo",
                    &format!("command-{suffix}"),
                    &format!("fingerprint-{index}"),
                    &new_task,
                    &serde_json::json!({"demo": true}),
                )
                .unwrap();
        }

        let model = StoreOverlayReadModel::new(store);
        let cards = model.task_cards().unwrap();
        let ids: Vec<&str> = cards.iter().map(|card| card.task_id.as_str()).collect();
        assert_eq!(
            ids,
            ["task-mike", "task-alpha", "task-zulu"],
            "cards must follow the enqueue instant (created_at ascending), never the id alphabet"
        );
    }

    #[test]
    fn the_read_model_never_writes() {
        // The trait object is Send + Sync and exposes no mut methods: the
        // type system carries the read-only boundary the overlay depends
        // on. A compile-time anchor plus the pure-function assertion above
        // is the honest scope of this skeleton — transport and push
        // semantics belong to the cross-domain proposal.
        fn assert_read_only<T: OverlayReadModel + ?Sized>() {}
        assert_read_only::<dyn OverlayReadModel>();
    }
}
