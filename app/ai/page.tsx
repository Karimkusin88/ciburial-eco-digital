"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(45,90,64,0.1);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.88em;color:#2d5a40">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1em;font-weight:700;margin:12px 0 4px;color:#1a3a28">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.1em;font-weight:700;margin:14px 0 6px;color:#1a3a28">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.2em;font-weight:700;margin:16px 0 8px;color:#1a3a28">$1</h1>')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0;padding-left:4px">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:8px 0">$&</ul>')
    .replace(/\n\n/g, '</p><p style="margin:8px 0">')
    .replace(/\n/g, '<br/>');
}

// Logo SVG — daun + chip/sirkuit (eco-tech)
function CiburialLogo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Background */}
      <rect width="40" height="40" rx="10" fill="#2d5a40"/>
      {/* Sirkuit kiri */}
      <line x1="6" y1="20" x2="11" y2="20" stroke="#7aad8a" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="6" y1="15" x2="6" y2="20" stroke="#7aad8a" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6" cy="14" r="1.5" fill="#4a8c5c"/>
      {/* Sirkuit kanan */}
      <line x1="34" y1="20" x2="29" y2="20" stroke="#7aad8a" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="34" y1="25" x2="34" y2="20" stroke="#7aad8a" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="34" cy="26" r="1.5" fill="#4a8c5c"/>
      {/* Sirkuit bawah */}
      <line x1="20" y1="34" x2="20" y2="29" stroke="#7aad8a" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="15" y1="34" x2="20" y2="34" stroke="#7aad8a" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="14" cy="34" r="1.5" fill="#4a8c5c"/>
      {/* Daun utama */}
      <path
        d="M20 8 C20 8, 28 12, 28 20 C28 25, 24 28, 20 28 C20 28, 20 18, 14 14 C17 11, 20 8, 20 8Z"
        fill="#4a8c5c"
      />
      <path
        d="M20 8 C20 8, 14 13, 13 20 C12.5 24, 15 27, 20 28 C20 28, 18 20, 20 8Z"
        fill="#7aad8a"
        opacity="0.7"
      />
      {/* Tulang daun */}
      <line x1="20" y1="10" x2="20" y2="27" stroke="#2d5a40" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      <line x1="20" y1="16" x2="24" y2="13" stroke="#2d5a40" strokeWidth="0.8" strokeLinecap="round" opacity="0.4"/>
      <line x1="20" y1="20" x2="25" y2="18" stroke="#2d5a40" strokeWidth="0.8" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

// Logo besar untuk welcome screen
function CiburialLogoBig() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <rect width="72" height="72" rx="20" fill="#2d5a40"/>
      {/* Sirkuit pojok kiri atas */}
      <line x1="8" y1="30" x2="16" y2="30" stroke="#7aad8a" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="22" x2="8" y2="30" stroke="#7aad8a" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="8" cy="21" r="2.5" fill="#4a8c5c"/>
      {/* Sirkuit pojok kanan */}
      <line x1="64" y1="36" x2="56" y2="36" stroke="#7aad8a" strokeWidth="2" strokeLinecap="round"/>
      <line x1="64" y1="44" x2="64" y2="36" stroke="#7aad8a" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="64" cy="45" r="2.5" fill="#4a8c5c"/>
      {/* Sirkuit bawah */}
      <line x1="36" y1="62" x2="36" y2="54" stroke="#7aad8a" strokeWidth="2" strokeLinecap="round"/>
      <line x1="26" y1="62" x2="36" y2="62" stroke="#7aad8a" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="25" cy="62" r="2.5" fill="#4a8c5c"/>
      {/* Daun besar */}
      <path
        d="M36 10 C36 10, 52 18, 52 34 C52 44, 45 50, 36 50 C36 50, 36 30, 22 24 C28 17, 36 10, 36 10Z"
        fill="#4a8c5c"
      />
      <path
        d="M36 10 C36 10, 22 20, 21 34 C20.5 42, 26 48, 36 50 C36 50, 32 33, 36 10Z"
        fill="#7aad8a"
        opacity="0.7"
      />
      {/* Tulang daun */}
      <line x1="36" y1="13" x2="36" y2="49" stroke="#2d5a40" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <line x1="36" y1="24" x2="44" y2="20" stroke="#2d5a40" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
      <line x1="36" y1="32" x2="46" y2="28" stroke="#2d5a40" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
      <line x1="36" y1="40" x2="44" y2="37" stroke="#2d5a40" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
    </svg>
  );
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
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Cek voice support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((r: any) => r[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.onerror = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function toggleVoice() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setListening(true);
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }
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
        setError(data.error || "Punten, sistemnya lagi ambil napas bentar. Coba lagi ya!");
        return;
      }
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Punten Kang, koneksinya lagi kurang stabil. Coba lagi ya!");
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
      background: "#f5f0e8",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#1a2e1f",
    }}>
      {/* Header */}
      <header style={{
        padding: "14px 20px",
        background: "#f5f0e8",
        borderBottom: "1px solid rgba(45,90,64,0.12)",
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/" style={{
            color: "#6b7c6d", textDecoration: "none",
            fontSize: 13, letterSpacing: "0.02em",
          }}>← Beranda</a>
          <span style={{ color: "#c8bfaa" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CiburialLogo size={34} />
            <div>
              <div style={{
                fontWeight: 800, fontSize: 15,
                color: "#1a2e1f", lineHeight: 1.2,
              }}>Ciburial AI</div>
              <div style={{
                fontSize: 10, color: "#7a9a7e",
                letterSpacing: "0.08em",
                textTransform: "uppercase", lineHeight: 1.2,
              }}>Asisten Digital Kampung</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(45,90,64,0.08)",
            border: "1px solid rgba(45,90,64,0.2)",
            borderRadius: 20, padding: "4px 10px",
            fontSize: 11, color: "#2d5a40",
            letterSpacing: "0.04em",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#2d5a40",
              animation: "pulse 2s infinite",
            }}/>
            ONLINE
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{
              background: "transparent",
              border: "1px solid rgba(45,90,64,0.2)",
              borderRadius: 8, padding: "5px 12px",
              color: "#6b7c6d", cursor: "pointer", fontSize: 12,
            }}>Hapus Chat</button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "24px 16px",
        maxWidth: 780, width: "100%",
        margin: "0 auto", boxSizing: "border-box",
      }}>

        {/* Welcome */}
        {isEmpty && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            minHeight: "62vh", textAlign: "center", gap: 28,
          }}>
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 14,
            }}>
              <CiburialLogoBig />
              <div>
                <div style={{
                  fontSize: "clamp(24px, 5vw, 34px)",
                  fontWeight: 900, color: "#1a2e1f",
                  letterSpacing: "-0.02em", lineHeight: 1.1,
                }}>Ciburial AI</div>
                <div style={{
                  fontSize: 11, color: "#7a9a7e",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase", fontWeight: 600,
                  marginTop: 4,
                }}>Eco-Digital Assistant</div>
              </div>
            </div>

            <p style={{
              color: "#6b7c6d", margin: 0,
              fontSize: 15, maxWidth: 380, lineHeight: 1.6,
            }}>
              Tanya apapun — belajar, coding, info kampung, atau sekedar ngobrol!
            </p>

            <div style={{
              display: "flex", flexWrap: "wrap",
              gap: 8, justifyContent: "center", maxWidth: 520,
            }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  background: "white",
                  border: "1px solid rgba(45,90,64,0.2)",
                  borderRadius: 20, padding: "8px 16px",
                  color: "#2d5a40", cursor: "pointer",
                  fontSize: 13, fontWeight: 500,
                  transition: "all 0.15s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
                  onMouseEnter={e => {
                    const el = e.target as HTMLElement;
                    el.style.background = "#2d5a40";
                    el.style.color = "white";
                  }}
                  onMouseLeave={e => {
                    const el = e.target as HTMLElement;
                    el.style.background = "white";
                    el.style.color = "#2d5a40";
                  }}
                >{s}</button>
              ))}
            </div>

            {/* Voice hint */}
            {voiceSupported && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(45,90,64,0.06)",
                border: "1px solid rgba(45,90,64,0.15)",
                borderRadius: 20, padding: "6px 14px",
                fontSize: 12, color: "#2d5a40",
              }}>
                🎤 Tap ikon mic untuk input suara (Bahasa Indonesia)
              </div>
            )}

            <p style={{
              fontSize: 11, color: "#a8b5a9",
              margin: 0, letterSpacing: "0.02em",
            }}>
              🔒 Percakapan tidak disimpan di server kami
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 14,
            animation: "fadeIn 0.25s ease",
          }}>
            {msg.role === "assistant" && (
              <div style={{
                flexShrink: 0, marginRight: 10,
                alignSelf: "flex-start", marginTop: 2,
              }}>
                <CiburialLogo size={30} />
              </div>
            )}
            <div style={{
              maxWidth: "78%",
              background: msg.role === "user" ? "#2d5a40" : "white",
              borderRadius: msg.role === "user"
                ? "18px 18px 4px 18px"
                : "18px 18px 18px 4px",
              padding: "12px 16px",
              fontSize: 14, lineHeight: 1.65,
              color: msg.role === "user" ? "white" : "#1a2e1f",
              border: msg.role === "assistant"
                ? "1px solid rgba(45,90,64,0.1)" : "none",
              boxShadow: msg.role === "user"
                ? "0 2px 10px rgba(45,90,64,0.25)"
                : "0 1px 6px rgba(0,0,0,0.05)",
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

        {/* Skeleton Loading */}
        {loading && (
          <div style={{
            display: "flex", alignItems: "flex-start",
            gap: 10, marginBottom: 14,
          }}>
            <CiburialLogo size={30} />
            <div style={{
              background: "white",
              border: "1px solid rgba(45,90,64,0.1)",
              borderRadius: "18px 18px 18px 4px",
              padding: "14px 18px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
              display: "flex", flexDirection: "column",
              gap: 8, minWidth: 180,
            }}>
              {[100, 72, 50].map((w, i) => (
                <div key={i} style={{
                  height: 10, borderRadius: 6,
                  width: `${w}%`,
                  background: "linear-gradient(90deg,#e8e3d8 25%,#f0ece4 50%,#e8e3d8 75%)",
                  backgroundSize: "200% 100%",
                  animation: `shimmer 1.5s ${i * 0.15}s infinite`,
                }}/>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "#fff8f0",
            border: "1px solid rgba(180,80,40,0.2)",
            borderRadius: 12, padding: "12px 16px",
            color: "#a0522d", fontSize: 13,
            marginBottom: 14, textAlign: "center",
          }}>🙏 {error}</div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Input Area */}
      <div style={{
        padding: "12px 16px 20px",
        background: "#f5f0e8",
        borderTop: "1px solid rgba(45,90,64,0.1)",
      }}>
        {/* Voice indicator */}
        {listening && (
          <div style={{
            maxWidth: 780, margin: "0 auto 8px",
            display: "flex", alignItems: "center",
            gap: 8, padding: "8px 14px",
            background: "rgba(220,40,40,0.08)",
            border: "1px solid rgba(220,40,40,0.2)",
            borderRadius: 12,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#dc2626",
              animation: "pulse 1s infinite",
            }}/>
            <span style={{ fontSize: 13, color: "#dc2626" }}>
              Sedang mendengarkan... Bicara sekarang!
            </span>
            <span style={{ fontSize: 12, color: "#a8b5a9", marginLeft: "auto" }}>
              Tap mic lagi untuk stop
            </span>
          </div>
        )}

        <div style={{
          maxWidth: 780, margin: "0 auto",
          display: "flex", gap: 8, alignItems: "flex-end",
        }}>
          {/* Voice button */}
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              title={listening ? "Stop" : "Input suara"}
              style={{
                width: 46, height: 46, flexShrink: 0,
                background: listening
                  ? "rgba(220,40,40,0.1)"
                  : "white",
                border: listening
                  ? "1.5px solid rgba(220,40,40,0.4)"
                  : "1.5px solid rgba(45,90,64,0.2)",
                borderRadius: 14,
                color: listening ? "#dc2626" : "#2d5a40",
                cursor: "pointer", fontSize: 18,
                transition: "all 0.2s",
                display: "flex", alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              {listening ? "⏹️" : "🎤"}
            </button>
          )}

          {/* Text input */}
          <div style={{
            flex: 1, background: "white",
            border: "1.5px solid rgba(45,90,64,0.2)",
            borderRadius: 16, padding: "11px 16px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening
                ? "Bicara sekarang, teks akan muncul di sini..."
                : "Tanya apapun... (Enter kirim, Shift+Enter baris baru)"
              }
              rows={1}
              style={{
                width: "100%", background: "none",
                border: "none", outline: "none",
                color: "#1a2e1f", fontSize: 14,
                resize: "none", fontFamily: "inherit",
                lineHeight: 1.5, maxHeight: 120,
                overflowY: "auto",
              }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 46, height: 46, flexShrink: 0,
              background: input.trim() && !loading ? "#2d5a40" : "#e0d9ce",
              border: "none", borderRadius: 14,
              color: input.trim() && !loading ? "white" : "#a8b5a9",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              fontSize: 18, transition: "all 0.2s",
              display: "flex", alignItems: "center",
              justifyContent: "center",
              boxShadow: input.trim() && !loading
                ? "0 2px 10px rgba(45,90,64,0.3)" : "none",
            }}
          >↑</button>
        </div>

        <p style={{
          textAlign: "center", fontSize: 11,
          color: "#a8b5a9", margin: "8px 0 0",
        }}>
          AI dapat membuat kesalahan. Verifikasi informasi penting ya!
        </p>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        pre{background:#f0ece4;border:1px solid rgba(45,90,64,0.15);border-radius:10px;padding:14px;overflow-x:auto;margin:10px 0;}
        pre code{background:none!important;padding:0!important;font-size:12.5px;color:#2d5a40;font-family:'Courier New',monospace;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(45,90,64,0.15);border-radius:4px;}
        textarea::placeholder{color:#b5c4b7;}
      `}</style>
    </div>
  );
}