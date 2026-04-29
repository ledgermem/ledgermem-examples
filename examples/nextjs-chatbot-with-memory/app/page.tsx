"use client";

import { useChat } from "@ai-sdk/react";

export function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 16px 120px",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Mnemo Chatbot</h1>
      <p style={{ color: "#9ca3af", marginTop: 0 }}>
        Tell me about yourself. I will remember it across sessions.
      </p>

      <ol style={{ listStyle: "none", padding: 0 }}>
        {messages.map((m) => (
          <li
            key={m.id}
            style={{
              padding: "12px 16px",
              margin: "12px 0",
              borderRadius: 8,
              background: m.role === "user" ? "#1f2937" : "#111827",
              border: "1px solid #1f2a37",
            }}
          >
            <strong style={{ color: m.role === "user" ? "#60a5fa" : "#34d399" }}>
              {m.role === "user" ? "You" : "Bot"}
            </strong>
            <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{m.content}</div>
          </li>
        ))}
      </ol>

      <form
        onSubmit={handleSubmit}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          background: "#0b0f17",
          borderTop: "1px solid #1f2a37",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Say something..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid #1f2a37",
              background: "#111827",
              color: "#e6edf3",
              fontSize: 16,
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "12px 20px",
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      </form>
    </main>
  );
}

export default ChatPage;
