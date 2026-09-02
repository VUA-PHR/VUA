import { rmSync } from "node:fs";
import { resolve } from "node:path";

const appRoot = resolve(import.meta.dirname, "..");
rmSync(resolve(appRoot, "dist", "electron"), { recursive: true, force: true });
