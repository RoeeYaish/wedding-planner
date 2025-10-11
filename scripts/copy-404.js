// scripts/copy-404.js
import { cp, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
const src = resolve("dist/index.html");
const dst = resolve("dist/404.html");
const dir = dirname(dst);

async function main() {
  if (!existsSync(src)) {
    console.error("[copy-404] dist/index.html not found. Did build fail?");
    process.exit(1);
  }
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await cp(src, dst);
  console.log("[copy-404] Created dist/404.html");
}
main().catch((e) => {
  console.error("[copy-404] failed:", e);
  process.exit(1);
});
