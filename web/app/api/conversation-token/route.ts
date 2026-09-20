import { NextResponse, type NextRequest } from "next/server";
import { ElevenLabsClient, ElevenLabsError } from "@elevenlabs/elevenlabs-js";

// One ElevenLabs agent per flow. Guidance falls back to the original
// single-agent variable so an existing deploy keeps working.
const FLOWS = {
  guidance: ["ELEVENLABS_AGENT_ID_GUIDANCE", "ELEVENLABS_AGENT_ID"],
  onboarding: ["ELEVENLABS_AGENT_ID_ONBOARDING"],
} as const;

export type Flow = keyof typeof FLOWS;

function isFlow(value: string): value is Flow {
  return value in FLOWS;
}

function requireApiKey(): string | null {
  const key = process.env.ELEVENLABS_API_KEY;
  return key?.trim() ? key : null;
}

function agentIdFor(flow: Flow): string | null {
  for (const envVar of FLOWS[flow]) {
    const id = process.env[envVar]?.trim();
    if (id) return id;
  }
  return null;
}

function apiErrorMessage(err: unknown): string {
  if (err instanceof ElevenLabsError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "An unexpected error occurred.";
}

export async function GET(request: NextRequest) {
  const apiKey = requireApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ELEVENLABS_API_KEY. Add it to your environment." },
      { status: 500 }
    );
  }

  const flow = request.nextUrl.searchParams.get("flow") ?? "guidance";
  if (!isFlow(flow)) {
    return NextResponse.json(
      { error: `Unknown flow "${flow}". Use one of: ${Object.keys(FLOWS).join(", ")}.` },
      { status: 400 }
    );
  }

  const agentId = agentIdFor(flow);
  if (!agentId) {
    return NextResponse.json(
      { error: `Missing ${FLOWS[flow][0]}. Add it to your environment.` },
      { status: 500 }
    );
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    const res = await client.conversationalAi.conversations.getWebrtcToken({
      agentId,
    });
    return NextResponse.json({ token: res.token });
  } catch (err) {
    const status =
      err instanceof ElevenLabsError && err.statusCode ? err.statusCode : 502;
    return NextResponse.json(
      { error: apiErrorMessage(err) },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
