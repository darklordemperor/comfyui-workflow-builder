import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createStore } from "./store.ts";
import { createWorkflowService } from "./workflow-service.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const store = createStore(join(root, "data"));
const service = createWorkflowService(store);
const readBody = async (request: any) => { const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(chunk); return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; };
const send = (response: any, status: number, data: unknown) => { response.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "http://127.0.0.1:5173" }); response.end(JSON.stringify(data)); };
createServer(async (request, response) => {
  if (request.method === "OPTIONS") return send(response, 204, {});
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (request.method === "GET" && url.pathname === "/api/bootstrap") return send(response, 200, { ok: true, data: await service.bootstrap() });
    if (request.method === "PUT" && url.pathname === "/api/settings") { await store.writeSettings(await readBody(request)); return send(response, 200, { ok: true }); }
    const preset = url.pathname.match(/^\/api\/presets\/(characters|styles|poses)$/);
    if (request.method === "PUT" && preset) { await store.writePresetDocument(preset[1] as any, await readBody(request)); return send(response, 200, { ok: true }); }
    const action = url.pathname.match(/^\/api\/workflows\/(generate|save|queue)$/);
    if (request.method === "POST" && action) { const { request: generationRequest } = await readBody(request); const actionName = action[1]! as "generate" | "save" | "queue"; const data = await service[actionName](generationRequest); return send(response, 200, { ok: true, data }); }
    return send(response, 404, { ok: false, error: { code: "NOT_FOUND", message: "Route not found" } });
  } catch (error) { return send(response, 400, { ok: false, error: { code: "REQUEST_FAILED", message: error instanceof Error ? error.message : "Request failed" } }); }
}).listen(4174, "127.0.0.1", () => console.log("Workflow Builder API http://127.0.0.1:4174"));
