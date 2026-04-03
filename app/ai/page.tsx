"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Simple markdown renderer
function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(45,90,64,0.15);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1em;font-weight:700;margin:12px 0 4px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.1em;font-weight:700;margin:14px 0 6px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.2em;font-weight:700;margin:16px 0 8px">$1</h1>')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0;padding-left:4px">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:8px 0">$&</ul>')
    .replace(/\n\n/g, '</p><p style="margin:8px 0">')
    .replace(/\n/g, '<br/>');
}

const SUGGESTIONS = [
  "Apa itu Kampung Ciburial?",
  "Bantu gw belajar Python",
  "Cara kerja panel surya",
  "Jelaskan apa itu stunting",
  "Buat contoh surat resmi",
  "Tips berkebun organik",
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;
    setError("");

    const userMsg: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan");
        return;
      }

      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Koneksi bermasalah. Coba lagi ya!");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setMessages([]);
    setError("");
    inputRef.current?.focus();
  }

  const isEmpty = messages.length === 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f1f14 0%, #1a3320 50%, #0f1f14 100%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#e8f0ea",
    }}>
      {/* Header */}
      <header style={{
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{
            color: "rgba(255,255,255,0.5)",
            textDecoration: "none",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>← Beranda</a>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32,
              background: "linear-gradient(135deg, #2d5a40, #4a8c5c)",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>🤖</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Ciburial AI</div>
              <div style={{ fontSize: 11, color: "#7aad8a", lineHeight: 1.2 }}>Asisten Digital Kampung</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(74,140,92,0.2)",
            border: "1px solid rgba(74,140,92,0.3)",
            borderRadius: 20, padding: "4px 10px",
            fontSize: 12, color: "#7aad8a",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#4a8c5c",
              boxShadow: "0 0 6px #4a8c5c",
              animation: "pulse 2s infinite",
            }}/>
            Online
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "6px 12px",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer", fontSize: 12,
            }}>🗑️ Clear</button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 16px",
        maxWidth: 800,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>
        {/* Welcome Screen */}
        {isEmpty && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            minHeight: "60vh", textAlign: "center", gap: 24,
          }}>
            <div style={{
              width: 80, height: 80,
              background: "linear-gradient(135deg, #2d5a40, #4a8c5c)",
              borderRadius: 24,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36,
              boxShadow: "0 0 40px rgba(74,140,92,0.3)",
            }}>🌿</div>
            <div>
              <h1 style={{
                fontSize: "clamp(22px, 4vw, 32px)",
                fontWeight: 800, margin: "0 0 8px",
                background: "linear-gradient(135deg, #7aad8a, #4a8c5c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>Ciburial AI</h1>
              <p style={{
                color: "rgba(255,255,255,0.5)", margin: 0,
                fontSize: 15, maxWidth: 400,
              }}>
                Asisten AI cerdas untuk belajar, bertanya, coding, dan apapun yang kamu butuhkan!
              </p>
            </div>

            {/* Suggestion chips */}
            <div style={{
              display: "flex", flexWrap: "wrap",
              gap: 8, justifyContent: "center",
              maxWidth: 560,
            }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 20, padding: "8px 16px",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer", fontSize: 13,
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => {
                    (e.target as HTMLElement).style.background = "rgba(74,140,92,0.2)";
                    (e.target as HTMLElement).style.borderColor = "rgba(74,140,92,0.4)";
                    (e.target as HTMLElement).style.color = "#7aad8a";
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                    (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                    (e.target as HTMLElement).style.color = "rgba(255,255,255,0.7)";
                  }}
                >{s}</button>
              ))}
            </div>

            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
              🔒 Percakapan bersifat pribadi & tidak disimpan di server
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 16,
            animation: "fadeIn 0.3s ease",
          }}>
            {msg.role === "assistant" && (
              <div style={{
                width: 32, height: 32, flexShrink: 0,
                background: "linear-gradient(135deg, #2d5a40, #4a8c5c)",
                borderRadius: 10, marginRight: 10,
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 14,
                alignSelf: "flex-start", marginTop: 2,
              }}>🌿</div>
            )}

            <div style={{
              maxWidth: "80%",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #2d5a40, #3d7a54)"
                : "rgba(255,255,255,0.06)",
              borderRadius: msg.role === "user"
                ? "18px 18px 4px 18px"
                : "18px 18px 18px 4px",
              padding: "12px 16px",
              fontSize: 14, lineHeight: 1.6,
              border: msg.role === "assistant"
                ? "1px solid rgba(255,255,255,0.08)"
                : "none",
              boxShadow: msg.role === "user"
                ? "0 2px 12px rgba(45,90,64,0.4)"
                : "none",
            }}>
              {msg.role === "assistant" ? (
                <div dangerouslySetInnerHTML={{
                  __html: `<p style="margin:0">${renderMarkdown(msg.content)}</p>`
                }}/>
              ) : (
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div style={{
            display: "flex", alignItems: "flex-start",
            gap: 10, marginBottom: 16,
          }}>
            <div style={{
              width: 32, height: 32,
              background: "linear-gradient(135deg, #2d5a40, #4a8c5c)",
              borderRadius: 10,
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 14,
            }}>🌿</div>
            <div style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px 18px 18px 4px",
              padding: "14px 18px",
              display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7,
                  borderRadius: "50%",
                  background: "#4a8c5c",
                  animation: `bounce 1.2s ${i * 0.2}s infinite`,
                }}/>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(220,53,69,0.15)",
            border: "1px solid rgba(220,53,69,0.3)",
            borderRadius: 12, padding: "12px 16px",
            color: "#ff8a9a", fontSize: 14,
            marginBottom: 16, textAlign: "center",
          }}>⚠️ {error}</div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Input Area */}
      <div style={{
        padding: "12px 16px 20px",
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: 800, margin: "0 auto",
          display: "flex", gap: 10, alignItems: "flex-end",
        }}>
          <div style={{
            flex: 1,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            padding: "12px 16px",
            transition: "border-color 0.2s",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya apapun... (Enter untuk kirim, Shift+Enter untuk baris baru)"
              rows={1}
              style={{
                width: "100%", background: "none",
                border: "none", outline: "none",
                color: "#e8f0ea", fontSize: 14,
                resize: "none", fontFamily: "inherit",
                lineHeight: 1.5,
                maxHeight: 120, overflowY: "auto",
              }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 48, height: 48, flexShrink: 0,
              background: input.trim() && !loading
                ? "linear-gradient(135deg, #2d5a40, #4a8c5c)"
                : "rgba(255,255,255,0.05)",
              border: "none", borderRadius: 14,
              color: input.trim() && !loading ? "white" : "rgba(255,255,255,0.25)",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              fontSize: 20, transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: input.trim() && !loading
                ? "0 2px 12px rgba(45,90,64,0.4)" : "none",
            }}
          >↑</button>
        </div>
        <p style={{
          textAlign: "center", fontSize: 11,
          color: "rgba(255,255,255,0.2)", margin: "8px 0 0",
        }}>
          AI bisa salah. Verifikasi info penting ya!
        </p>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        pre { background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:14px; overflow-x:auto; margin:10px 0; }
        pre code { background:none!important; padding:0!important; font-size:13px; color:#7aad8a; font-family:monospace; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
        textarea::placeholder { color:rgba(255,255,255,0.25); }
      `}</style>
    </div>
  );
}