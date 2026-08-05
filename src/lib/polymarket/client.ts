import { PolymarketError } from "./errors";

export interface RequestOptions {
  method?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

interface CircuitState {
  failures: number;
  openUntil: number;
}

const circuits = new Map<string, CircuitState>();
const inflight = new Map<string, Promise<unknown>>();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildUrl(base: string, path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path.replace(/^\//, ""), base.endsWith("/") ? base : `${base}/`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function getCircuit(key: string): CircuitState {
  let s = circuits.get(key);
  if (!s) {
    s = { failures: 0, openUntil: 0 };
    circuits.set(key, s);
  }
  return s;
}

export async function polymarketFetch<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const hostKey = new URL(baseUrl).host;
  const circuit = getCircuit(hostKey);
  const now = Date.now();
  if (circuit.openUntil > now) {
    throw new PolymarketError("CIRCUIT_OPEN", `Circuit open for ${hostKey}`, 503);
  }

  const url = buildUrl(baseUrl, path, options.query);
  const dedupeKey = `${options.method ?? "GET"}:${url}`;
  if ((options.method ?? "GET") === "GET" && inflight.has(dedupeKey)) {
    return inflight.get(dedupeKey) as Promise<T>;
  }

  const run = (async () => {
    const retries = options.retries ?? 3;
    let attempt = 0;
    let lastError: unknown;
    while (attempt <= retries) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);
      const onAbort = () => controller.abort();
      options.signal?.addEventListener("abort", onAbort);
      try {
        const res = await fetch(url, {
          method: options.method ?? "GET",
          headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
          next: { revalidate: 60 },
        } as RequestInit);

        if (res.status === 429 || res.status >= 500) {
          throw new PolymarketError("HTTP_RETRYABLE", `HTTP ${res.status}`, res.status);
        }
        if (!res.ok) {
          throw new PolymarketError("HTTP_ERROR", `HTTP ${res.status}`, res.status);
        }
        const data = (await res.json()) as T;
        circuit.failures = 0;
        return data;
      } catch (err) {
        lastError = err;
        attempt += 1;
        circuit.failures += 1;
        if (circuit.failures >= 5) {
          circuit.openUntil = Date.now() + 30_000;
        }
        if (attempt > retries) break;
        const backoff = Math.min(8_000, 300 * 2 ** attempt) + Math.floor(Math.random() * 200);
        await sleep(backoff);
      } finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener("abort", onAbort);
      }
    }
    if (lastError instanceof PolymarketError) throw lastError;
    throw new PolymarketError(
      "NETWORK",
      lastError instanceof Error ? lastError.message : "Network error",
      0,
    );
  })();

  if ((options.method ?? "GET") === "GET") {
    inflight.set(dedupeKey, run);
    try {
      return await run;
    } finally {
      inflight.delete(dedupeKey);
    }
  }
  return run;
}
