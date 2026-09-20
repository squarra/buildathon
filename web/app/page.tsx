"use client";

import {
  ConversationProvider,
  useConversationControls,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import { type RefObject, useCallback, useRef, useState } from "react";

type TranscriptLine = {
  id: string;
  role: "user" | "agent";
  text: string;
  tentative: boolean;
};

type VoiceAgentPageProps = {
  lines: TranscriptLine[];
  sessionError: string | null;
  setLines: (value: TranscriptLine[]) => void;
  setSessionError: (value: string | null) => void;
  setStarting: (value: boolean) => void;
  starting: boolean;
  nextLineIdRef: RefObject<number>;
  flow: Flow;
  setFlow: (value: Flow) => void;
};

type Flow = "guidance" | "onboarding";

const FLOW_LABEL: Record<Flow, string> = {
  guidance: "Mitarbeiter-Anleitung",
  onboarding: "Onboarding (Inhaber)",
};

type ConversationMessage = {
  source: "user" | "ai";
  message: unknown;
};

type UiState = "idle" | "connecting" | "listening" | "speaking" | "error";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractMessageText(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.message === "string") {
    return value.message;
  }

  if (typeof value.text === "string") {
    return value.text;
  }

  return null;
}

function isConversationMessage(value: unknown): value is ConversationMessage {
  if (!isRecord(value)) {
    return false;
  }

  if (value.source !== "user" && value.source !== "ai") {
    return false;
  }

  return extractMessageText(value.message) !== null;
}

const STATE_LABEL: Record<UiState, string> = {
  idle: "Bereit",
  connecting: "Verbinde…",
  listening: "Ich höre zu",
  speaking: "Spricht",
  error: "Fehler",
};

const RING_CLASS: Record<UiState, string> = {
  idle: "border-neutral-700 bg-neutral-900",
  connecting: "border-neutral-500 bg-neutral-900 animate-pulse",
  listening: "border-neutral-300 bg-neutral-800 animate-pulse",
  speaking:
    "border-emerald-400 bg-emerald-500/20 shadow-[0_0_60px_rgba(52,211,153,0.45)] animate-pulse",
  error: "border-red-500 bg-red-500/10",
};

function VoiceAgentPage({
  lines,
  nextLineIdRef,
  sessionError,
  setLines,
  setSessionError,
  setStarting,
  starting,
  flow,
  setFlow,
}: VoiceAgentPageProps) {
  const { startSession, endSession } = useConversationControls();
  const { status, message } = useConversationStatus();
  const { isSpeaking } = useConversationMode();

  const canStart = !starting;
  const sessionActive = status === "connected" || status === "connecting";

  const uiState: UiState = (() => {
    switch (status) {
      case "connected":
        return isSpeaking ? "speaking" : "listening";
      case "connecting":
        return "connecting";
      case "disconnected":
        return starting ? "connecting" : "idle";
      case "error":
        return "error";
      default: {
        const exhaustiveStatus: never = status;
        return exhaustiveStatus;
      }
    }
  })();

  const errorText =
    sessionError ??
    (status === "error" ? (message?.trim() ? message : "Verbindungsfehler") : null);

  async function handleToggleSession() {
    setSessionError(null);

    if (sessionActive) {
      endSession();
      setStarting(false);
      return;
    }

    setStarting(true);
    nextLineIdRef.current = 0;
    setLines([]);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setSessionError("Mikrofonzugriff wird benötigt, um zu sprechen.");
      setStarting(false);
      return;
    }

    try {
      const res = await fetch(`/api/conversation-token?flow=${flow}`);
      const data = await res.json();
      if (!res.ok) {
        setSessionError(
          typeof data.error === "string"
            ? data.error
            : "Konnte kein Gesprächs-Token holen."
        );
        setStarting(false);
        return;
      }
      const token = data.token as string;
      await startSession({
        conversationToken: token,
      });
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : String(error));
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-12 sm:py-16">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            Voice Assistant
          </h1>
          <p className="text-sm text-neutral-400">
            buildathon26 — Sprachassistent für Hotels &amp; Ferienwohnungen
          </p>
        </header>

        <div
          role="radiogroup"
          aria-label="Modus"
          className="mt-10 inline-flex rounded-full border border-neutral-800 bg-neutral-900 p-1 text-sm"
        >
          {(Object.keys(FLOW_LABEL) as Flow[]).map(f => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={flow === f}
              disabled={sessionActive || starting}
              onClick={() => setFlow(f)}
              className={`rounded-full px-4 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                flow === f
                  ? "bg-neutral-100 font-medium text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-100"
              }`}
            >
              {FLOW_LABEL[f]}
            </button>
          ))}
        </div>

        <section className="mt-8 flex flex-col items-center gap-6">
          <div
            className={`flex h-40 w-40 items-center justify-center rounded-full border-4 transition-all duration-300 ${RING_CLASS[uiState]}`}
            aria-hidden="true"
          >
            <div
              className={`h-16 w-16 rounded-full transition-colors duration-300 ${
                uiState === "speaking"
                  ? "bg-emerald-400"
                  : uiState === "listening"
                    ? "bg-neutral-200"
                    : "bg-neutral-700"
              }`}
            />
          </div>
          <p className="text-lg font-medium" aria-live="polite">
            {STATE_LABEL[uiState]}
          </p>

          <button
            type="button"
            className={`rounded-full px-8 py-3 text-base font-semibold transition-colors disabled:opacity-50 ${
              sessionActive
                ? "bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
                : "bg-neutral-100 text-neutral-900 hover:bg-white"
            }`}
            onClick={handleToggleSession}
            disabled={!canStart && !sessionActive}
          >
            {sessionActive ? "Stoppen" : starting ? "Starte…" : "Starten"}
          </button>

          {errorText ? (
            <div
              role="alert"
              className="w-full rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {errorText}
            </div>
          ) : null}
        </section>

        <section className="mt-12 w-full space-y-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Transkript
          </p>
          <div
            className="max-h-[min(24rem,50vh)] space-y-2 overflow-y-auto pt-1"
            aria-live="polite"
          >
            {lines.length === 0 ? (
              <p className="text-sm text-neutral-500">
                {sessionActive
                  ? "Sprich einfach los…"
                  : "Starte ein Gespräch, um das Transkript hier zu sehen."}
              </p>
            ) : (
              lines.map(line => (
                <div
                  key={line.id}
                  className={`flex ${
                    line.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <p
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      line.role === "user"
                        ? "bg-neutral-100 font-medium text-neutral-900"
                        : line.tentative
                          ? "bg-neutral-900 text-neutral-500 italic"
                          : "bg-neutral-800 text-neutral-100"
                    }`}
                  >
                    {line.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function Home() {
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [flow, setFlow] = useState<Flow>("guidance");

  const nextLineIdRef = useRef(0);

  const handleMessage = useCallback((event: unknown) => {
    if (!isConversationMessage(event)) {
      return;
    }

    const text = extractMessageText(event.message)?.trim();
    if (!text) {
      return;
    }

    setLines(prev => {
      const role = event.source === "ai" ? "agent" : "user";
      const last = prev[prev.length - 1];

      if (last?.role === role && last.tentative) {
        const copy = [...prev];
        copy[copy.length - 1] = { ...last, text, tentative: false };
        return copy;
      }

      if (last && last.role === role && last.text === text) {
        return prev;
      }

      nextLineIdRef.current += 1;
      return [
        ...prev,
        {
          id: `line-${nextLineIdRef.current}`,
          role,
          text,
          tentative: false,
        },
      ];
    });
  }, []);

  const handleDebug = useCallback((event: unknown) => {
    if (
      !isRecord(event) ||
      event.type !== "internal_tentative_agent_response"
    ) {
      return;
    }

    const payload = event.tentative_agent_response_internal_event;
    if (!isRecord(payload)) {
      return;
    }

    const text =
      typeof payload.tentative_agent_response === "string"
        ? payload.tentative_agent_response.trim()
        : "";

    if (!text) {
      return;
    }

    setLines(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === "agent" && last.tentative) {
        const copy = [...prev];
        copy[copy.length - 1] = { ...last, text };
        return copy;
      }

      nextLineIdRef.current += 1;
      return [
        ...prev,
        {
          id: `line-${nextLineIdRef.current}`,
          role: "agent",
          text,
          tentative: true,
        },
      ];
    });
  }, []);

  return (
    <ConversationProvider
      onConnect={() => setSessionError(null)}
      onDebug={handleDebug}
      onDisconnect={() => {
        setSessionError(null);
        setStarting(false);
      }}
      onError={(error: unknown) => {
        setSessionError(error instanceof Error ? error.message : String(error));
      }}
      onMessage={handleMessage}
    >
      <VoiceAgentPage
        lines={lines}
        nextLineIdRef={nextLineIdRef}
        sessionError={sessionError}
        setLines={setLines}
        setSessionError={setSessionError}
        setStarting={setStarting}
        starting={starting}
        flow={flow}
        setFlow={setFlow}
      />
    </ConversationProvider>
  );
}
