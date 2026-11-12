"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, SalonSnapshot } from "@/lib/types";
import { getGoogleConnectUrl } from "@/lib/config";

const POLL_MS = 2500;

export function ChatClient({
  initial,
  email,
}: {
  initial: SalonSnapshot;
  email?: string | null;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const messages = snapshot.messages ?? [];

  const pendingCiba = snapshot.appointments.some(
    (a) => a.status === "cancel_pending" || a.cancelCibaStatus === "pending",
  );

  const refresh = useCallback(async () => {
    const res = await fetch("/api/salon", { cache: "no-store" });
    if (!res.ok) return;
    const next = (await res.json()) as SalonSnapshot;
    setSnapshot(next);
  }, []);

  useEffect(() => {
    if (!pendingCiba) return;
    const timer = setInterval(() => {
      refresh().catch(() => undefined);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [pendingCiba, refresh]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    setSending(true);
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      meta: null,
      createdAt: new Date().toISOString(),
    };
    setSnapshot((prev) => ({
      ...prev,
      messages: [...(prev.messages ?? []), optimistic],
    }));
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const next = (await res.json()) as SalonSnapshot;
      if (res.ok) setSnapshot(next);
      else await refresh();
    } catch {
      await refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-shell">
      <section className="card card-pad">
        <p className="badge">Front desk</p>
        <h2 className="card-title" style={{ marginTop: 10 }}>
          Book with the assistant
        </h2>
        <p className="muted">
          Same dogs and visits as the classic form — gathered in conversation.
          Calendar and cancel each pause for a human.
        </p>

        <div className="chat-log" style={{ marginTop: 18 }}>
          {messages.length === 0 ? (
            <div className="empty">
              Try: “Book Barnaby for a full groom tomorrow at 10.”
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id}>
                <div className={`bubble ${message.role}`}>
                  {message.content}
                </div>
                {message.meta?.kind === "token_vault" ? (
                  <TokenVaultPause
                    connectUrl={message.meta.connectUrl ?? getGoogleConnectUrl("/chat")}
                  />
                ) : null}
                {message.meta?.kind === "ciba_pending" ? (
                  <CibaPause bindingMessage={message.meta.bindingMessage} />
                ) : null}
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        <form
          className="chat-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask to book, add to calendar, or cancel…"
            disabled={sending}
            aria-label="Message Anna's assistant"
          />
          <button className="btn btn-primary" type="submit" disabled={sending}>
            {sending ? "Thinking…" : "Send"}
          </button>
        </form>
      </section>

      <aside className="stack">
        <div className={`card card-pad ${snapshot.googleConnected ? "card-sage" : "card-amber"}`}>
          <p className={snapshot.googleConnected ? "badge badge-sage" : "badge badge-terracotta"}>
            {snapshot.googleConnected ? "Token Vault ready" : "Calendar locked"}
          </p>
          <h2 className="card-title" style={{ marginTop: 10 }}>
            Google Calendar
          </h2>
          <p className="muted">
            {snapshot.googleConnected
              ? "The assistant can write an event after you say yes."
              : "The assistant must pause and ask before Token Vault expands Calendar scopes."}
          </p>
          {email ? <p className="faint">Hint: {email}</p> : null}
          <a className="btn btn-primary" href={getGoogleConnectUrl("/chat")}>
            {snapshot.googleConnected ? "Reconnect" : "Connect Google Calendar"}
          </a>
        </div>

        <div className="card card-pad">
          <p className="badge">On the book</p>
          <h2 className="card-title" style={{ marginTop: 10 }}>
            {snapshot.appointments.length} upcoming
          </h2>
          {snapshot.appointments.length === 0 ? (
            <p className="faint">Nothing booked yet.</p>
          ) : (
            <div className="stack">
              {snapshot.appointments.map((a) => (
                <div key={a.id} className="appt-card">
                  <strong>
                    {a.dogName} · {a.serviceId}
                  </strong>
                  <span className="muted">
                    {a.visitDate} at {a.visitTime}
                  </span>
                  {a.status === "cancel_pending" ? (
                    <span className="badge badge-terracotta">CIBA pending</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function TokenVaultPause({ connectUrl }: { connectUrl: string }) {
  return (
    <div className="card card-pad card-amber" style={{ marginTop: 10, maxWidth: "85%" }}>
      <p className="badge badge-terracotta">Human in the loop · Token Vault</p>
      <h3 className="card-title" style={{ marginTop: 10 }}>
        Extra Google Calendar permission
      </h3>
      <p className="muted">
        The assistant paused. Login did not include Calendar scopes. Connect
        Google Calendar through Auth0 Connected Accounts so Token Vault can
        hold the Google token — this app never stores it.
      </p>
      <a className="btn btn-primary" href={connectUrl}>
        Connect Google Calendar
      </a>
    </div>
  );
}

function CibaPause({ bindingMessage }: { bindingMessage?: string }) {
  return (
    <div className="card card-pad card-danger" style={{ marginTop: 10, maxWidth: "85%" }}>
      <p className="badge badge-danger">Human in the loop · CIBA</p>
      <h3 className="card-title" style={{ marginTop: 10 }}>
        Check your email to confirm cancellation
      </h3>
      <p className="muted">
        Auth0 sent a Client-Initiated Backchannel Authentication request.
        The appointment stays on the book until you Accept in that email.
        {bindingMessage ? (
          <>
            {" "}
            Binding message: <span className="mono">{bindingMessage}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
