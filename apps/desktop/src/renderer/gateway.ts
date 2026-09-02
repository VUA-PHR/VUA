import type { AppSnapshotV1, DesktopGatewayRequestV1 } from "@vua/contracts";

const browserSnapshot: AppSnapshotV1 = {
  schemaVersion: 1,
  productVersion: "0.4.0-dev",
  runtime: "electron",
  platform: "win32",
  capabilities: { gateway: true, tasks: false, remoteBrowser: false },
};

export async function loadAppSnapshot(): Promise<AppSnapshotV1> {
  if (!window.vua) return browserSnapshot;
  const request: DesktopGatewayRequestV1 = {
    schemaVersion: 1,
    requestId: crypto.randomUUID(),
    method: "app.snapshot",
    params: {},
  };
  const response = await window.vua.gateway.invoke(request);
  if (!response.ok) throw new Error(response.error.code);
  return response.value;
}
