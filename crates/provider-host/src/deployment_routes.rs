//! Thin JSONL boundary for deployment v0.1. Decode a closed request, delegate the use case,
//! and encode its facts. No planning rules, vendor arguments or installation IO belong here.
use crate::provider_host::{application_error, application_success, FrameOutcome};
use serde::Deserialize;
use serde_json::{json, Value};
use vua_orchestrator::deployment::{DeploymentIntent, DeploymentService, DEPLOYMENT_SCHEMA};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ExecuteParams {
    intent: DeploymentIntent,
    confirmed_digest: String,
}

pub(crate) fn request(
    service: Option<&DeploymentService>,
    method: &str,
    request: &Value,
    request_id: &str,
    correlation: &str,
) -> FrameOutcome {
    let reject = |code, category| {
        FrameOutcome::Response(application_error(
            request_id,
            correlation,
            code,
            "errors.deployment.failed",
            category,
        ))
    };
    let execute = method == "environment.executeDeployment";
    let expected = if execute {
        vec![
            "contractVersion",
            "requestId",
            "correlationId",
            "kind",
            "method",
            "commandId",
            "params",
        ]
    } else {
        vec![
            "contractVersion",
            "requestId",
            "correlationId",
            "kind",
            "method",
            "params",
        ]
    };
    if request
        .as_object()
        .is_none_or(|v| v.len() != expected.len() || expected.iter().any(|k| !v.contains_key(*k)))
        || request["kind"] != if execute { "command" } else { "query" }
        || request
            .get("requestId")
            .and_then(Value::as_str)
            .is_none_or(str::is_empty)
        || request
            .get("correlationId")
            .and_then(Value::as_str)
            .is_none_or(str::is_empty)
    {
        return reject("vua.deployment.invalid_intent", "validation");
    }
    let Some(service) = service else {
        return reject("vua.deployment.unavailable", "unavailable");
    };
    let Some(params) = request.get("params") else {
        return reject("vua.deployment.invalid_intent", "validation");
    };
    if method == "environment.planDeployment" {
        #[derive(Deserialize)]
        #[serde(deny_unknown_fields)]
        struct PlanParams {
            intent: DeploymentIntent,
        }
        let Ok(params) = serde_json::from_value::<PlanParams>(params.clone()) else {
            return reject("vua.deployment.invalid_intent", "validation");
        };
        return match service.plan(&params.intent) {
            Ok(plan) => FrameOutcome::Response(application_success(
                request_id,
                json!({"deploymentPlan": plan}),
            )),
            Err(code) => reject(code, "validation"),
        };
    }
    let Ok(params) = serde_json::from_value::<ExecuteParams>(params.clone()) else {
        return reject("vua.deployment.invalid_intent", "validation");
    };
    let Some(command) = request
        .get("commandId")
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty() && s.len() <= 128 && !s.chars().any(char::is_control))
    else {
        return reject("vua.deployment.invalid_confirmation", "validation");
    };
    match service.execute(
        params.intent,
        &params.confirmed_digest,
        command,
        correlation,
    ) {
        Ok(accepted) => FrameOutcome::Response(application_success(
            request_id,
            json!({
            "schemaVersion": DEPLOYMENT_SCHEMA, "operation": "environment.executeDeployment",
            "correlationId": service.runtime.snapshot(&accepted.task_id).map(|s| s.correlation_id).unwrap_or_else(|| correlation.to_owned()),
            "taskId": accepted.task_id }),
        )),
        Err(error) => FrameOutcome::Response(
            json!({"contractVersion":"0.1", "requestId":request_id, "ok":false, "error":error}),
        ),
    }
}
