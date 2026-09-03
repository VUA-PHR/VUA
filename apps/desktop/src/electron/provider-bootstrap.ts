import {
  MockOrchestratorProviderV01,
  type OrchestratorProviderV01,
} from "@vua/orchestrator-provider";

export function createDesktopOrchestratorProvider(): OrchestratorProviderV01 {
  return new MockOrchestratorProviderV01({
    providerBuildId: "desktop-m1-controlled-mock",
    providerInstanceId: "desktop-main",
    capabilities: [],
  });
}
