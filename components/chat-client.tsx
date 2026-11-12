"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMarkdown } from "@/components/chat-markdown";
import { getGoogleConnectUrl } from "@/lib/config";
import { formatVisitWhen } from "@/lib/pacific";
import type { ChatMessage, SalonSnapshot } from "@/lib/types";

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
  const [resetting, setResetting] = useState(false);
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

  async function startNewChat() {
    if (resetting || sending) return;
    setResetting(true);
    setDraft("");
    setSnapshot((prev) => ({ ...prev, messages: [] }));
    try {
      const res = await fetch("/api/chat", { method: "DELETE" });
      if (res.ok) {
        const next = (await res.json()) as SalonSnapshot;
        setSnapshot(next);
      } else {
        await refresh();
      }
    } catch {
      await refresh();
    } finally {
      setResetting(false);
    }
  }

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
        <div className="panel-head chat-card-head">
          <div>
            <p className="eyebrow">Front desk</p>
            <h2 className="card-title">Tell us who needs a bath</h2>
            <p className="muted">
              Pacific time. One small question at a time — say tomorrow at 11:30.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void startNewChat()}
            disabled={resetting || sending}
          >
            {resetting ? "Starting…" : "Start new chat"}
          </button>
        </div>

        <div className="chat-log" style={{ marginTop: 14 }}>
          {messages.length === 0 ? (
            <div className="empty">
              Try: “Book Barnaby tomorrow at 11:30.”
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id}>
                <div className={`bubble ${message.role}`}>
                  {message.role === "assistant" ? (
                    <ChatMarkdown text={message.content} />
                  ) : (
                    message.content
                  )}
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
            placeholder="Book a groom, add it to the calendar, or cancel…"
            disabled={sending || resetting}
            aria-label="Message Anna's assistant"
          />
          <button className="btn btn-primary" type="submit" disabled={sending || resetting}>
            {sending ? "Thinking…" : "Send"}
          </button>
        </form>
      </section>

      <aside className="stack">
        <div className={`card card-pad ${snapshot.googleConnected ? "card-sage" : "card-amber"}`}>
          <p className={snapshot.googleConnected ? "badge badge-sage" : "badge badge-terracotta"}>
            {snapshot.googleConnected ? "Calendar connected" : "Calendar locked"}
          </p>
          <h2 className="card-title" style={{ marginTop: 10 }}>
            Google Calendar
          </h2>
          <p className="muted">
            {snapshot.googleConnected
              ? "We can put the visit on your calendar after you say yes."
              : "We pause before asking Google for calendar access. Login never included it."}
          </p>
          {email ? <p className="faint">Connect as {email}</p> : null}
          <a className="btn btn-primary btn-block" href={getGoogleConnectUrl("/chat")}>
            {snapshot.googleConnected ? "Reconnect" : "Connect Google Calendar"}
          </a>
        </div>

        <div className="card card-pad">
          <p className="eyebrow">On the book</p>
          <h2 className="card-title">{snapshot.appointments.length} upcoming</h2>
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
                    {formatVisitWhen(a.visitDate, a.visitTime)}
                  </span>
                  {a.status === "cancel_pending" ? (
                    <span className="badge badge-terracotta">Waiting on email</span>
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
    <div className="hitl hitl-vault">
      <p className="badge badge-terracotta">Needs your say-so</p>
      <h3>Connect Google Calendar</h3>
      <p className="muted">
        Sign-in did not include calendar access. Connect Google Calendar so we
        can write the visit — this salon never stores that token.
      </p>
      <a className="btn btn-primary" href={connectUrl}>
        Connect Google Calendar
      </a>
    </div>
  );
}

function CibaPause({ bindingMessage }: { bindingMessage?: string }) {
  return (
    <div className="hitl hitl-ciba">
      <p className="badge badge-danger">Check your email</p>
      <h3>Confirm this cancellation</h3>
      <p className="muted">
        We emailed you to confirm. The appointment stays on the book until you
        accept in that email.
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
