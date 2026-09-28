import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

function snapshot(root) {
  const result = new Map();
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else result.set(relative(root, file), readFileSync(file, "utf8"));
    }
  }
  walk(root);
  return result;
}

const temporary = mkdtempSync(join(tmpdir(), "skillarc-openapi-"));
try {
  execFileSync(
    "./node_modules/.bin/openapi-ts",
    ["-i", "./contracts/mobile-v1.openapi.yaml", "-o", temporary],
    { stdio: "pipe" },
  );
  const expected = snapshot("src/api/generated");
  const actual = snapshot(temporary);
  const names = new Set([...expected.keys(), ...actual.keys()]);
  const changed = [...names].filter(
    (name) => expected.get(name) !== actual.get(name),
  );
  if (changed.length) {
    console.error(
      `Generated mobile API differs from the pinned contract: ${changed.join(", ")}. Run npm run api:generate.`,
    );
    process.exitCode = 1;
  } else console.log("Generated API matches the pinned contract");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
