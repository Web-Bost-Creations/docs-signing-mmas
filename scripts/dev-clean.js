const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const nextDir = path.join(__dirname, "..", ".next");

try {
  fs.rmSync(nextDir, { recursive: true, force: true });
} catch {
  // ignore
}

const nextBin = path.join(
  __dirname,
  "..",
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

const child = spawn(process.execPath, [nextBin, "dev"], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});

child.on("exit", (code) => process.exit(code ?? 0));
