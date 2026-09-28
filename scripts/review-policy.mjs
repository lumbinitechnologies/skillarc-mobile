import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const KEY = /\bSCRUM-\d+\b/i;
const GROUPS = new Set([
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
  "G7",
  "G8",
  "SOLO",
  "MAINTAINER",
]);
const allowed = {
  G1: [
    /^src\/features\/shell\//,
    /^src\/navigation\//,
    /^src\/app\/(?:_layout|index)\.tsx$/,
  ],
  G2: [
    /^src\/features\/student-academics\//,
    /^src\/app\/\(student\)\/(?:index\.tsx|courses\/|timetable\/|todo\/)/,
  ],
  G3: [
    /^src\/features\/assignments\//,
    /^src\/app\/\((?:student|faculty)\)\/assignments\//,
  ],
  G4: [
    /^src\/features\/faculty-content\//,
    /^src\/app\/\(faculty\)\/(?:courses|resources|announcements)\//,
  ],
  G5: [
    /^src\/features\/attendance-leave\//,
    /^src\/app\/\((?:student|faculty)\)\/(?:attendance|leave)\//,
  ],
  G6: [
    /^src\/features\/grades\//,
    /^src\/app\/\(student\)\/grades\//,
    /^src\/app\/\(faculty\)\/gradebook\//,
  ],
  G7: [/^src\/features\/parent\//, /^src\/app\/\(parent\)\//],
  G8: [/^src\/theme\//, /^src\/ui\//, /^e2e\//, /^tests\/device\//],
  SOLO: [/^src\/integration\//, /^src\/features\/integration\//],
};
const groupLabel = (group) =>
  group === "MAINTAINER"
    ? "mobile-maintainer"
    : group === "SOLO"
      ? "mobile-solo"
      : `mobile-${group.toLowerCase()}`;

export function evaluate({ author, title, body, issue, files, reviews }) {
  const errors = [];
  if (author === "dependabot[bot]") {
    for (const file of files)
      if (
        !/^(?:package(?:-lock)?\.json|\.github\/workflows\/[^/]+\.ya?ml)$/.test(
          file,
        )
      )
        errors.push(`${file} is outside Dependabot's dependency files`);
    const latest = new Map();
    for (const review of reviews) latest.set(review.user?.login, review.state);
    if (latest.get("keanesc") !== "APPROVED")
      errors.push("Approval from @keanesc is required");
    return errors;
  }
  const key = title.match(KEY)?.[0]?.toUpperCase();
  const issueKey = issue?.title?.match(KEY)?.[0]?.toUpperCase();
  if (!key) errors.push("PR title needs a SCRUM key");
  if (!issue || !issueKey || issueKey !== key)
    errors.push("Linked GitHub issue must use the same SCRUM key");
  const group = body
    .match(/^\s*-?\s*Group:\s*(G[1-8]|SOLO|MAINTAINER)\b/im)?.[1]
    ?.toUpperCase();
  if (!group || !GROUPS.has(group))
    errors.push("PR body needs Group: G1–G8, SOLO, or MAINTAINER");
  else {
    const labels = new Set(
      (issue?.labels || []).map((label) =>
        typeof label === "string" ? label : label.name,
      ),
    );
    if (!labels.has(groupLabel(group)))
      errors.push(`Linked issue must have ${groupLabel(group)} label`);
    if (
      group === "MAINTAINER" &&
      !["keanesc", "lumbinitechnologies"].includes(author)
    )
      errors.push("Only maintainers may use MAINTAINER");
    else if (group !== "MAINTAINER") {
      const paths = allowed[group] || [];
      for (const file of files)
        if (!paths.some((pattern) => pattern.test(file)))
          errors.push(`${file} is outside ${group} ownership`);
    }
  }
  const requiredReviewer =
    author === "keanesc" ? "lumbinitechnologies" : "keanesc";
  const latest = new Map();
  for (const review of reviews) latest.set(review.user?.login, review.state);
  if (latest.get(requiredReviewer) !== "APPROVED")
    errors.push(`Approval from @${requiredReviewer} is required`);
  return errors;
}

async function request(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} on ${path}`);
  return response.json();
}

async function pages(path, token) {
  const items = [];
  for (let page = 1; ; page++) {
    const part = await request(
      `${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
      token,
    );
    items.push(...part);
    if (part.length < 100) return items;
  }
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!token || !repository || !eventPath)
    throw new Error("Missing GitHub Actions context");
  const event = JSON.parse(readFileSync(eventPath, "utf8"));
  const pr = event.pull_request;
  if (!pr) throw new Error("Review event has no pull request");
  const base = `/repos/${repository}`;
  let errors;
  try {
    const issueNumber = Number(
      pr.body?.match(/^\s*-?\s*GitHub issue:\s*#(\d+)/im)?.[1],
    );
    const issue = issueNumber
      ? await request(`${base}/issues/${issueNumber}`, token)
      : null;
    const [fileRecords, reviews] = await Promise.all([
      pages(`${base}/pulls/${pr.number}/files`, token),
      pages(`${base}/pulls/${pr.number}/reviews`, token),
    ]);
    errors = evaluate({
      author: pr.user.login,
      title: pr.title,
      body: pr.body || "",
      issue,
      files: fileRecords.map((file) => file.filename),
      reviews,
    });
  } catch (error) {
    errors = [String(error)];
  }
  const state = errors.length ? "failure" : "success";
  const description = errors.length
    ? errors[0].slice(0, 130)
    : "Issue, paths, and human reviewer approved";
  const response = await fetch(
    `https://api.github.com${base}/statuses/${pr.head.sha}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        state,
        context: "governance/review-policy",
        description,
      }),
    },
  );
  if (!response.ok)
    throw new Error(
      `Cannot publish review-policy status: ${response.status} ${await response.text()}`,
    );
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else console.log("Review policy passed");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
