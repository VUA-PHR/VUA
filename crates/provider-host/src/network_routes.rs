//! Closed, read-only network query. The service owns route selection; the adapter owns IO.
use crate::provider_host::{application_error, application_success, FrameOutcome};
use serde::Deserialize;
use serde_json::{json, Value};
use vua_orchestrator::network::{NetworkIntent, NetworkService};

pub(crate) fn request(
    service: Option<&NetworkService>,
    request: &Value,
    id: &str,
    correlation: &str,
) -> FrameOutcome {
    let reject = |code, category| {
        FrameOutcome::Response(application_error(
            id,
            correlation,
            code,
            "errors.network.failed",
            category,
        ))
    };
    #[derive(Deserialize)]
    #[serde(deny_unknown_fields)]
    struct Params {
        intent: NetworkIntent,
    }
    let expected = [
        "contractVersion",
        "requestId",
        "correlationId",
        "kind",
        "method",
        "params",
    ];
    if request
        .as_object()
        .is_none_or(|v| v.len() != expected.len() || expected.iter().any(|k| !v.contains_key(*k)))
        || request["kind"] != "query"
        || request
            .get("requestId")
            .and_then(Value::as_str)
            .is_none_or(str::is_empty)
        || request
            .get("correlationId")
            .and_then(Value::as_str)
            .is_none_or(str::is_empty)
    {
        return reject("vua.network.invalid_intent", "validation");
    }
    let Ok(params) = serde_json::from_value::<Params>(request["params"].clone()) else {
        return reject("vua.network.invalid_intent", "validation");
    };
    let Some(service) = service else {
        return reject("vua.network.unavailable", "unavailable");
    };
    FrameOutcome::Response(application_success(
        id,
        json!({"networkReport": service.check(params.intent)}),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_before_absence_and_never_accepts_a_url_or_cookie() {
        let query = json!({"contractVersion":"0.1", "requestId":"n", "correlationId":"n", "kind":"query", "method":"environment.checkNetwork", "params":{"intent":{"route":"desktop_play", "region":"auto"}}});
        let code = |q: &Value| match request(None, q, "n", "n") {
            FrameOutcome::Response(v) => v["error"]["code"].as_str().unwrap().to_owned(),
            _ => panic!("query must return a response"),
        };
        assert_eq!(code(&query), "vua.network.unavailable");
        for (key, value) in [
            ("url", json!("http://localhost")),
            ("cookie", json!("private")),
        ] {
            let mut invalid = query.clone();
            invalid["params"][key] = value;
            assert_eq!(code(&invalid), "vua.network.invalid_intent");
        }
        let mut invalid = query.clone();
        invalid["kind"] = json!("command");
        assert_eq!(code(&invalid), "vua.network.invalid_intent");
    }
}
