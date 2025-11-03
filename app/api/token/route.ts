import { NextResponse } from "next/server";

export async function GET() {
  const agentId = process.env.AGENT_ID;
  const apiKey = process.env.XI_API_KEY;

  if (!agentId || !apiKey) {
    return NextResponse.json(
      { error: "Missing AGENT_ID or XI_API_KEY in environment variables" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      {
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to get conversation token from ElevenLabs" },
        { status: 502 }
      );
    }

    const { token } = await response.json();
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error fetching conversation token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
