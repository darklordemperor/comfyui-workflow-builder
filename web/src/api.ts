export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const body = await response.json();
  if (!response.ok || !body.ok) throw new Error(body.error?.message ?? "Request failed");
  return body.data as T;
}
export const putJson = (path: string, value: unknown) => api(path, { method: "PUT", body: JSON.stringify(value) });
export const postJson = <T,>(path: string, value: unknown) => api<T>(path, { method: "POST", body: JSON.stringify(value) });
