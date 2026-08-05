/**
 * Managed singleton WebSocket client for Polymarket CLOB market channel.
 * Use one connection for the app; never open a socket per market card.
 */

export type WsStatus = "idle" | "connecting" | "open" | "closed" | "error";
export type WsListener = (payload: unknown) => void;
export type WsStatusListener = (status: WsStatus) => void;

export class PolymarketWsManager {
  private static instance: PolymarketWsManager | null = null;
  private ws: WebSocket | null = null;
  private listeners = new Set<WsListener>();
  private statusListeners = new Set<WsStatusListener>();
  private subscribed = new Set<string>();
  private intentionalClose = false;
  private attempt = 0;
  private url: string;
  status: WsStatus = "idle";

  private constructor(url: string) {
    this.url = url;
  }

  static get(url: string): PolymarketWsManager {
    if (!PolymarketWsManager.instance) {
      PolymarketWsManager.instance = new PolymarketWsManager(url);
    }
    return PolymarketWsManager.instance;
  }

  static resetForTests() {
    PolymarketWsManager.instance?.disconnect();
    PolymarketWsManager.instance = null;
  }

  onStatus(listener: WsStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  subscribe(assetIds: string[], listener: WsListener): () => void {
    this.listeners.add(listener);
    for (const id of assetIds) this.subscribed.add(id);
    this.ensureConnected();
    this.sendSubscribe([...this.subscribed]);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.disconnect();
    };
  }

  private setStatus(status: WsStatus) {
    this.status = status;
    for (const l of this.statusListeners) l(status);
  }

  private ensureConnected() {
    if (typeof WebSocket === "undefined") return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    this.intentionalClose = false;
    this.setStatus("connecting");
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      this.attempt = 0;
      this.setStatus("open");
      this.sendSubscribe([...this.subscribed]);
    };
    this.ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data));
        for (const l of this.listeners) l(data);
      } catch {
        for (const l of this.listeners) l(ev.data);
      }
    };
    this.ws.onerror = () => this.setStatus("error");
    this.ws.onclose = () => {
      this.setStatus("closed");
      this.ws = null;
      if (!this.intentionalClose) this.reconnect();
    };
  }

  private reconnect() {
    this.attempt += 1;
    const delay = Math.min(30_000, 500 * 2 ** this.attempt);
    setTimeout(() => this.ensureConnected(), delay);
  }

  private sendSubscribe(assets: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: "market",
        assets_ids: assets,
      }),
    );
  }

  disconnect() {
    this.intentionalClose = true;
    this.ws?.close();
    this.ws = null;
    this.subscribed.clear();
    this.listeners.clear();
    this.setStatus("closed");
  }
}

export function getPolymarketWs(url: string) {
  return PolymarketWsManager.get(url);
}

export function resetPolymarketWsForTests() {
  PolymarketWsManager.resetForTests();
}
