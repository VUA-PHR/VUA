import { currentStrings as strings } from "./current-table.ts";
import type { Strings } from "./strings.en.ts";

/** Map only stable, known codes. Evidence and unknown upstream messages remain unmodified. */
export function diagnosticMessage(code: string, copy: Strings["diagnostics"] = strings.diagnostics): string {
  switch (code) {
    case "inspect_required": return copy.inspectRequired;
    case "project.ready": return copy.projectReady;
    case "validation.passed": return copy.validationPassed;
    case "performance.estimated": return copy.performanceEstimated;
    case "references.missing_mesh": return copy.missingMesh;
    case "references.missing_material": return copy.missingMaterial;
    case "references.missing_script": return copy.missingScript;
    case "references.clean": return copy.referencesClean;
    case "lighting.realtime_lights_present": return copy.realtimeLights;
    case "lighting.baked_only": return copy.bakedLights;
    case "lighting.clean": return copy.noLights;
    case "upload_readiness.sdk_absent": return copy.sdkAbsent;
    case "upload_readiness.descriptor_missing": return copy.descriptorMissing;
    case "upload_readiness.pipeline_missing": return copy.pipelineMissing;
    case "upload_readiness.clean": return copy.uploadComponentsPresent;
    case "upload_readiness.build_target": return copy.buildTarget;
    default: return copy.unknown;
  }
}

export function taskErrorMessage(code: string, copy: Strings["diagnostics"] = strings.diagnostics): string {
  return code === "inspect_required" ? copy.inspectRequired : copy.taskFailed;
}
