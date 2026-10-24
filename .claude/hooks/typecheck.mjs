// PostToolUse hook: type-check after Claude edits a .ts/.tsx file.
// Exit 2 feeds tsc errors back to Claude.
import { spawnSync } from "node:child_process";

let input = "";
for await (const chunk of process.stdin) input += chunk;

const file = JSON.parse(input || "{}").tool_input?.file_path ?? "";
if (!/\.tsx?$/.test(file)) process.exit(0);

const r = spawnSync("npx", ["tsc", "--noEmit", "--pretty", "false"], {
  cwd: process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
  encoding: "utf8",
  shell: true,
});

if (r.status !== 0) {
  process.stderr.write((r.stdout + r.stderr).split("\n").slice(0, 30).join("\n"));
  process.exit(2);
}
