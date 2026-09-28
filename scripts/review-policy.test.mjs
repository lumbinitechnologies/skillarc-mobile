import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate } from "./review-policy.mjs";

const base = {
  author: "intern",
  title: "[SCRUM-27] Student home",
  body: "- GitHub issue: #12\n- Group: G2",
  issue: { title: "[SCRUM-27] Student home", labels: [{ name: "mobile-g2" }] },
  files: ["src/features/student-academics/Home.tsx"],
  reviews: [{ user: { login: "keanesc" }, state: "APPROVED" }],
};
test("allows a group PR reviewed by Keane", () =>
  assert.deepEqual(evaluate(base), []));
test("blocks cross-group edits", () =>
  assert.match(
    evaluate({ ...base, files: ["src/features/grades/Report.tsx"] }).join(" "),
    /outside G2/,
  ));
test("blocks missing Keane approval", () =>
  assert.match(evaluate({ ...base, reviews: [] }).join(" "), /keanesc/));
test("requires independent owner on Keane PRs", () => {
  const pr = {
    ...base,
    author: "keanesc",
    title: "[SCRUM-44] Governance",
    body: "- GitHub issue: #9\n- Group: MAINTAINER",
    issue: { title: "[SCRUM-44] Governance", labels: ["mobile-maintainer"] },
    files: [".github/workflows/ci.yml"],
    reviews: [],
  };
  assert.match(evaluate(pr).join(" "), /lumbinitechnologies/);
  assert.deepEqual(
    evaluate({
      ...pr,
      reviews: [{ user: { login: "lumbinitechnologies" }, state: "APPROVED" }],
    }),
    [],
  );
});

test("allows Dependabot security updates only after Keane review", () => {
  const bot = {
    ...base,
    author: "dependabot[bot]",
    title: "Bump dependency",
    body: "",
    issue: null,
    files: ["package-lock.json"],
    reviews: [],
  };
  assert.match(evaluate(bot).join(" "), /keanesc/);
  assert.deepEqual(
    evaluate({
      ...bot,
      reviews: [{ user: { login: "keanesc" }, state: "APPROVED" }],
    }),
    [],
  );
  assert.match(
    evaluate({ ...bot, files: ["src/app/index.tsx"] }).join(" "),
    /outside Dependabot/,
  );
});
