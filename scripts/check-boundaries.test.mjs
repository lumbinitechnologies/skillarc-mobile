import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("rejects web/server imports and service keys in mobile source", () => {
  const root = mkdtempSync(join(tmpdir(), "skillarc-boundary-"));
  try {
    mkdirSync(join(root, "src"));
    const file = join(root, "src", "screen.tsx");
    writeFileSync(
      file,
      'import { Text } from "react-native"; export const label = Text;',
    );
    const good = spawnSync(process.execPath, ["scripts/check-boundaries.mjs"], {
      cwd: process.cwd(),
      env: { ...process.env, CHECK_BOUNDARY_ROOT: root },
      encoding: "utf8",
    });
    assert.equal(good.status, 0, good.stderr);
    writeFileSync(
      file,
      'import Link from "next/link"; const key = "SUPABASE_SERVICE_ROLE_KEY";',
    );
    const bad = spawnSync(process.execPath, ["scripts/check-boundaries.mjs"], {
      cwd: process.cwd(),
      env: { ...process.env, CHECK_BOUNDARY_ROOT: root },
      encoding: "utf8",
    });
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /forbidden import next\/link/);
    assert.match(bad.stderr, /server credential name/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
