"use client";

function extractErrorMessage(text: string, fallback: string) {
  const stripped = text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!stripped) {
    return fallback;
  }

  if (stripped.includes("This page could not be found")) {
    return "That route is unavailable right now. Refresh and try again.";
  }

  return stripped.slice(0, 220);
}

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

  const rawText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const expectsJson = contentType.includes("application/json");

  if (!expectsJson) {
    const fallbackMessage = response.ok
      ? "The server returned an unexpected response."
      : `Request failed (${response.status})`;

    throw new Error(extractErrorMessage(rawText, fallbackMessage));
  }

  let payload: (TResponse & { error?: string }) | null = null;

  try {
    payload = rawText
      ? (JSON.parse(rawText) as TResponse & { error?: string })
      : ({} as TResponse & { error?: string });
  } catch {
    throw new Error(extractErrorMessage(rawText, "The server returned invalid JSON."));
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }

  return payload as TResponse;
}
