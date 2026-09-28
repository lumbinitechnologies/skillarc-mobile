import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const root = process.env.CHECK_BOUNDARY_ROOT || process.cwd();
const sourceRoot = join(root, "src");
const forbiddenImports =
  /^(?:next(?:\/|$)|react-dom(?:\/|$)|node:|@\/server(?:\/|$)|@\/lib\/supabase-admin(?:\/|$)|(?:fs|path|child_process|worker_threads|net|tls|http|https|crypto|os|process)(?:\/|$))/;
const forbiddenSecrets =
  /\b(?:SUPABASE_SERVICE_ROLE_KEY|GROQ_API_KEY|RESEND_API_KEY|JAAS_PRIVATE_KEY|CRON_SECRET)\b/;
const findings = [];

function scan(file) {
  const content = readFileSync(file, "utf8");
  const source = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
  );
  const name = relative(root, file);
  if (forbiddenSecrets.test(content))
    findings.push(`${name}: server credential name`);
  function visit(node) {
    let specifier;
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifier = node.moduleSpecifier.text;
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      if (
        node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require")
      )
        specifier = node.arguments[0].text;
    }
    if (specifier && forbiddenImports.test(specifier))
      findings.push(`${name}: forbidden import ${specifier}`);
    ts.forEachChild(node, visit);
  }
  visit(source);
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && /\.[jt]sx?$/.test(entry.name)) scan(file);
  }
}
if (!existsSync(sourceRoot)) findings.push("src/ is missing");
else walk(sourceRoot);
if (findings.length) {
  for (const finding of findings) console.error(finding);
  process.exitCode = 1;
} else console.log("Mobile source boundary passed");
