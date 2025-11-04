"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";

const MIN_DURATION_SECONDS = 360; // 6 minutes
const TYPEFORM_URL = "https://forms.pelagohealth.com/to/HeWbfjHj";

export default function Page() {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [lines, setLines] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const conversation = useConversation({
    onMessage: (message) => {
      if (message?.message) {
        setLines((prev) => [...prev, `${message.source}: ${message.message}`]);
      }
    },
    onConnect: () => {
      setStatus("connected");
      // Start tracking elapsed time
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(elapsed);
        }
      }, 1000);
    },
    onDisconnect: () => {
      setStatus("disconnected");
      stopMic();
      stopTimer();
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      setStatus("disconnected");
      stopMic();
      stopTimer();
    },
  });

  const requestMic = useCallback(async () => {
    // Always clean up old stream before requesting new one
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      console.error("Microphone permission denied:", error);
      throw error;
    }
  }, []);

  const stopMic = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleStart = useCallback(async () => {
    // Clean up any existing state first
    stopTimer();
    stopMic();

    setErrorMessage(null);
    setShowCompletion(false);
    setLines([]);
    setElapsedSeconds(0);
    setStatus("connecting");

    try {
      await requestMic();

      const tokenResponse = await fetch("/api/token", { cache: "no-store" });
      if (!tokenResponse.ok) {
        throw new Error("Failed to get conversation token");
      }
      const { token } = await tokenResponse.json();

      await conversation.startSession({
        conversationToken: token,
        connectionType: "webrtc",
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setStatus("disconnected");
      stopMic();
      setErrorMessage("Failed to start the conversation. Please try again.");
    }
  }, [conversation, requestMic, stopTimer, stopMic]);

  const handleEnd = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error("Error ending session:", error);
    } finally {
      stopTimer();
      stopMic();

      // Check if conversation lasted at least 6 minutes
      if (elapsedSeconds >= MIN_DURATION_SECONDS) {
        setShowCompletion(true);
        setErrorMessage(null);
        // Auto-redirect to Typeform after 2 seconds
        setTimeout(() => {
          window.location.href = TYPEFORM_URL;
        }, 2000);
      } else {
        const minutesElapsed = Math.floor(elapsedSeconds / 60);
        const secondsElapsed = elapsedSeconds % 60;
        setErrorMessage(
          `Conversation must be at least 6 minutes long. You talked for ${minutesElapsed}m ${secondsElapsed}s.`
        );
        setShowCompletion(false);
      }
    }
  }, [conversation, elapsedSeconds, stopTimer, stopMic]);

  useEffect(() => {
    // Clear any stale browser storage on mount
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn('Could not clear storage:', e);
      }
    }

    return () => {
      stopTimer();
      stopMic();
    };
  }, [stopTimer, stopMic]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <main style={{ maxWidth: 680, margin: "2rem auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>Voice Study</h1>
      <p style={{ color: "#666" }}>
        Press Start to begin the conversation. Your microphone will remain off until you click Start. Press End & Submit after your conversation to continue to a survey.
      </p>

      <div style={{ display: "flex", gap: 8, margin: "12px 0", alignItems: "center" }}>
        <button
          onClick={handleStart}
          disabled={status === "connecting" || status === "connected"}
          style={{
            padding: "8px 16px",
            fontSize: "16px",
            cursor: status === "connecting" || status === "connected" ? "not-allowed" : "pointer",
            opacity: status === "connecting" || status === "connected" ? 0.6 : 1,
          }}
        >
          {status === "connecting" ? "Connecting..." : "Start"}
        </button>
        <button
          onClick={handleEnd}
          disabled={status !== "connected"}
          style={{
            padding: "8px 16px",
            fontSize: "16px",
            cursor: status !== "connected" ? "not-allowed" : "pointer",
            opacity: status !== "connected" ? 0.6 : 1,
          }}
        >
          End & Submit
        </button>
        {status === "connected" && (
          <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: "18px" }}>
            ⏱ {formatTime(elapsedSeconds)}
          </span>
        )}
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          padding: 12,
          minHeight: 160,
          maxHeight: 400,
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        {lines.length === 0 ? (
          <em style={{ color: "#999" }}>Captions will appear here during the conversation...</em>
        ) : (
          lines.map((line, i) => (
            <div key={i} style={{ whiteSpace: "pre-wrap", marginBottom: 8 }}>
              {line}
            </div>
          ))
        )}
      </div>

      {errorMessage && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #c00",
            background: "#fff0f0",
            color: "#c00",
          }}
        >
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {showCompletion && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            border: "1px solid #0a0",
            background: "#f6fff6",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "18px", marginBottom: 8 }}>
            <strong>Thank you for completing the conversation!</strong>
          </p>
          <p style={{ color: "#666" }}>Redirecting you to the survey...</p>
        </div>
      )}
    </main>
  );
}
