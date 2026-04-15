"use client";

export async function postJson<TResponse>(
  url: string,
  body?: unknown,
  init?: RequestInit,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });

  const payload = (await response.json()) as TResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}
