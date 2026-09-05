"use client";

import type { AnalyticsEnvelope, AnalyticsEventName, AnalyticsEvents } from "@stillmind/domain";

const ANONYMOUS_ID_KEY = "stillmind.analytics.anonymousId.v1";
function anonymousId(): string | undefined {
  try {
    const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
    if (existing) return existing;
    const next = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `web_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(ANONYMOUS_ID_KEY, next);
    return next;
  } catch { return undefined; }
}

/** HTTP 202 also covers an unconfigured sink. It must not be reported as persisted data. */
export async function eventWasAccepted(response: Response): Promise<boolean> {
  if (!response.ok) return false;
  try {
    const body: unknown = await response.json();
    return Boolean(body && typeof body === "object" && "accepted" in body && body.accepted === true);
  } catch { return false; }
}

// Callers must have consent for the event being sent. No retroactive start events on late consent.
export async function sendAnonymousEvent<Name extends AnalyticsEventName>(name: Name, payload: AnalyticsEvents[Name]): Promise<boolean> {
  const id = anonymousId();
  if (!id) return false;
  const envelope: AnalyticsEnvelope<Name> = { schemaVersion: 1, name, payload, anonymousId: id, platform: "web" };
  try {
    const response = await fetch("/api/events", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(envelope), keepalive: true,
    });
    return eventWasAccepted(response);
  } catch { return false; }
}
