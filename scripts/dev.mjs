import { spawn } from "node:child_process";
const children = [spawn("npm", ["run", "dev:server"], { stdio: "inherit" }), spawn("npm", ["run", "dev:web"], { stdio: "inherit" })];
const stop = () => children.forEach((child) => child.kill("SIGTERM"));
process.on("SIGINT", stop); process.on("SIGTERM", stop);
for (const child of children) child.on("exit", (code) => { if (code && code !== 0) { stop(); process.exitCode = code; } });
