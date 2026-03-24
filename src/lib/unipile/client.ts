/* ── Unipile API Client ── */

import type {
  UnipileSearchResponse,
  UnipileProfile,
  UnipileAccount,
  UnipileInviteResponse,
  UnipileChat,
  UnipileMessage,
} from "./types";

export class UnipileClient {
  private baseUrl: string;
  private apiKey: string;
  private lastRequestAt = 0;

  constructor(dsn: string, apiKey: string) {
    // Normalize DSN: strip duplicate protocols, ensure https://
    let base = dsn.trim().replace(/\/$/, "");
    // Remove duplicate https:// prefixes
    base = base.replace(/^(https?:\/\/)+/i, "");
    base = `https://${base}`;
    this.baseUrl = base;
    this.apiKey = apiKey;
  }

  /* ── Rate Limiting (1 req/sec) ── */

  private async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (elapsed < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - elapsed));
    }
    this.lastRequestAt = Date.now();
  }

  /* ── Core Request ── */

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    await this.throttle();

    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[Unipile] ${res.status} ${path} body:`, body);
      let message = `Unipile API error: ${res.status}`;

      if (res.status === 401) message = "Ungültiger Unipile API Key";
      else if (res.status === 422) message = "LinkedIn-Limit erreicht oder ungültige Anfrage";
      else if (res.status === 429) message = "Rate-Limit erreicht. Bitte warte einen Moment.";
      else if (body) {
        try {
          const parsed = JSON.parse(body);
          message = parsed.message || parsed.error || message;
        } catch {
          message = `${message}: ${body.substring(0, 200)}`;
        }
      }

      const error = new Error(message) as Error & { status: number };
      error.status = res.status;
      throw error;
    }

    return res.json() as Promise<T>;
  }

  /* ── Accounts ── */

  async getAccounts(): Promise<UnipileAccount[]> {
    const data = await this.request<{ items: UnipileAccount[] }>("/api/v1/accounts");
    return data.items ?? [];
  }

  /* ── LinkedIn Search Parameters (resolve location/industry names → IDs) ── */

  async searchParameters(
    accountId: string,
    type: "LOCATION" | "INDUSTRY" | "COMPANY" | "SCHOOL",
    keywords: string,
    limit = 10,
  ): Promise<{ id: string; title: string }[]> {
    const params = new URLSearchParams({
      account_id: accountId,
      type,
      keywords,
      limit: String(limit),
    });
    const data = await this.request<{
      items: { id: string; title: string }[];
    }>(`/api/v1/linkedin/search/parameters?${params.toString()}`);
    return data.items ?? [];
  }

  /* ── LinkedIn Search ── */

  async searchLinkedIn(
    accountId: string,
    query: string,
    options?: {
      category?: string;
      locationIds?: string[];
      cursor?: string;
      limit?: number;
      api?: string;
    },
  ): Promise<UnipileSearchResponse> {
    const params = new URLSearchParams({ account_id: accountId });

    const apiType = options?.api ?? "classic";

    // Unipile search is POST with JSON body
    const body: Record<string, unknown> = {
      api: apiType,
      category: options?.category ?? "people",
      keywords: query,
    };
    if (options?.cursor) body.cursor = options.cursor;
    if (options?.limit) body.limit = options.limit;
    if (options?.locationIds?.length) body.location = options.locationIds;

    return this.request<UnipileSearchResponse>(
      `/api/v1/linkedin/search?${params.toString()}`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  }

  /* ── Profile ── */

  async getProfile(
    accountId: string,
    identifier: string,
  ): Promise<UnipileProfile> {
    const params = new URLSearchParams({
      account_id: accountId,
      linkedin_sections: "*",
    });
    return this.request<UnipileProfile>(
      `/api/v1/users/${encodeURIComponent(identifier)}?${params.toString()}`,
    );
  }

  /* ── Invitations ── */

  async sendInvitation(
    accountId: string,
    identifier: string,
    message?: string,
  ): Promise<UnipileInviteResponse> {
    return this.request<UnipileInviteResponse>("/api/v1/users/invite", {
      method: "POST",
      body: JSON.stringify({
        account_id: accountId,
        provider_id: identifier,
        message: message || undefined,
      }),
    });
  }

  /* ── Messaging ── */

  async getChats(accountId: string): Promise<UnipileChat[]> {
    const params = new URLSearchParams({ account_id: accountId });
    const data = await this.request<{ items: UnipileChat[] }>(
      `/api/v1/chats?${params.toString()}`,
    );
    return data.items ?? [];
  }

  async sendMessage(
    chatId: string,
    text: string,
  ): Promise<UnipileMessage> {
    return this.request<UnipileMessage>(
      `/api/v1/chats/${encodeURIComponent(chatId)}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ text }),
      },
    );
  }

  async sendNewMessage(
    accountId: string,
    recipientProviderId: string,
    text: string,
  ): Promise<UnipileMessage> {
    return this.request<UnipileMessage>("/api/v1/chats/messages", {
      method: "POST",
      body: JSON.stringify({
        account_id: accountId,
        attendees_provider_id: [recipientProviderId],
        text,
      }),
    });
  }
}

/* ── Factory helper ── */
export function createUnipileClient(dsn: string, apiKey: string): UnipileClient {
  return new UnipileClient(dsn, apiKey);
}
