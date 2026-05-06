"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, Lock, AlertCircle, Trash2, ArrowLeft } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(45,90,64,0.1);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.88em;color:#2F8F4E">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1.1em;font-weight:800;margin:12px 0 4px;color:#1C3A2B">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.2em;font-weight:800;margin:14px 0 6px;color:#1C3A2B">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.4em;font-weight:800;margin:16px 0 8px;color:#1C3A2B">$1</h1>')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0;padding-left:4px">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:8px 0;color:#5A4A40">$&</ul>')
    .replace(/\n\n/g, '</p><p style="margin:8px 0">')
    .replace(/\n/g, '<br/>');
}

function CiburialLogo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ai-bg-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1C3A2B" />
          <stop offset="100%" stopColor="#2F8F4E" />
        </linearGradient>
        <linearGradient id="star-grad-1" x1="20" y1="0" x2="40" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4AC5A" />
          <stop offset="100%" stopColor="#B8943F" />
        </linearGradient>
        <linearGradient id="star-grad-2" x1="20" y1="0" x2="40" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF" />
          <stop offset="100%" stopColor="#4FBF7E" />
        </linearGradient>
      </defs>
      
      {/* Box Container */}
      <rect x="4" y="10" width="26" height="26" rx="8" fill="url(#ai-bg-grad)" />
      <rect x="4" y="10" width="26" height="26" rx="8" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      
      {/* Inner Highlight */}
      <rect x="5" y="11" width="24" height="24" rx="7" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      
      {/* AI Text */}
      <text x="17" y="29.5" fill="#FFFFFF" fontSize="15" fontWeight="900" fontFamily="system-ui, sans-serif" textAnchor="middle" letterSpacing="0.08em">AI</text>
      
      {/* Main Gold Sparkle (Top Right) */}
      <path d="M 33 2 Q 33 10 41 10 Q 33 10 33 18 Q 33 10 25 10 Q 33 10 33 2 Z" fill="url(#star-grad-1)" />
      
      {/* Secondary Green/White Sparkle */}
      <path d="M 23 2 Q 23 5 26 5 Q 23 5 23 8 Q 23 5 20 5 Q 23 5 23 2 Z" fill="url(#star-grad-2)" />
      
      {/* Tiny Gold Sparkle */}
      <path d="M 38 18 Q 38 20 40 20 Q 38 20 38 22 Q 38 20 36 20 Q 38 20 38 18 Z" fill="#D4AC5A" opacity="0.9" />
    </svg>
  );
}

function CiburialLogoBig() {
  return (
    <div style={{ position: "relative", width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: -10, background: "linear-gradient(135deg, rgba(47,143,78,0.4), rgba(79,191,126,0.1))", borderRadius: "50%", filter: "blur(12px)", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <CiburialLogo size={72} />
      </div>
    </div>
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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
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
      background: "linear-gradient(135deg,rgba(250,248,243,.5) 0%,rgba(255,254,249,.8) 100%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: "#1C3A2B",
    }}>
      {/* Header HEROIC */}
      <header style={{
        padding: "16px 24px",
        background: "rgba(255,254,249,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1.5px solid rgba(47,143,78,0.12)",
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{
            color: "#2F8F4E", textDecoration: "none",
            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#1C3A2B"}
          onMouseLeave={e => e.currentTarget.style.color = "#2F8F4E"}
          >
            <ArrowLeft size={16} strokeWidth={2} /> Beranda
          </a>
          <div style={{ width: 1.5, height: 24, background: "rgba(47,143,78,0.15)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CiburialLogo size={34} />
            <div>
              <div style={{
                fontWeight: 900, fontSize: 16,
                background: "linear-gradient(135deg,#1C3A2B,#2F8F4E)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                lineHeight: 1.2, letterSpacing: "-0.02em"
              }}>Ciburial AI</div>
              <div style={{
                fontSize: 10, color: "#6B7C6D",
                letterSpacing: "0.1em", fontWeight: 700,
                textTransform: "uppercase", lineHeight: 1.2,
              }}>Asisten Digital Kampung</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(47,143,78,0.08)",
            border: "1.5px solid rgba(47,143,78,0.15)",
            borderRadius: 99, padding: "6px 14px",
            fontSize: 11, fontWeight: 800, color: "#2F8F4E",
            letterSpacing: "0.06em",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#2F8F4E",
              animation: "pulse-glow 2s infinite",
            }}/>
            ONLINE
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{
              background: "white",
              border: "1.5px solid rgba(184,71,47,0.2)",
              borderRadius: 99, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6,
              color: "#B8472F", cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(184,71,47,0.05)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "white" }}
            >
              <Trash2 size={14} /> Hapus
            </button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "32px 20px",
        maxWidth: 840, width: "100%",
        margin: "0 auto", boxSizing: "border-box",
      }}>

        {/* Welcome Screen - Heroic Edition */}
        {isEmpty && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            minHeight: "65vh", textAlign: "center", gap: 32,
            animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
          }}>
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 20,
            }}>
              <CiburialLogoBig />
              <div>
                <h1 className="fnt" style={{
                  fontSize: "clamp(36px, 6vw, 48px)",
                  fontWeight: 300, 
                  background: "linear-gradient(135deg,#1C3A2B,#2F8F4E)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 8px 0"
                }}>Ciburial AI</h1>
                <div style={{
                  fontSize: 12, color: "#4FBF7E",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase", fontWeight: 800,
                }}>Eco-Digital Assistant</div>
              </div>
            </div>

            <p style={{
              color: "#5A4A40", margin: 0,
              fontSize: 16, maxWidth: 440, lineHeight: 1.7, fontWeight: 500
            }}>
              Tanya apapun — belajar, coding, info kampung, atau sekedar ngobrol seputar inovasi!
            </p>

            <div style={{
              display: "flex", flexWrap: "wrap",
              gap: 12, justifyContent: "center", maxWidth: 600,
            }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  background: "white",
                  border: "1.5px solid rgba(47,143,78,0.15)",
                  borderRadius: 99, padding: "10px 20px",
                  color: "#1C3A2B", cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  transition: "all 0.3s cubic-bezier(.22,1,.36,1)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                }}
                  onMouseEnter={e => {
                    const el = e.target as HTMLElement;
                    el.style.background = "linear-gradient(135deg,#2F8F4E,#4FBF7E)";
                    el.style.color = "white";
                    el.style.transform = "translateY(-2px)";
                    el.style.boxShadow = "0 8px 20px rgba(47,143,78,.2)";
                    el.style.borderColor = "transparent";
                  }}
                  onMouseLeave={e => {
                    const el = e.target as HTMLElement;
                    el.style.background = "white";
                    el.style.color = "#1C3A2B";
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
                    el.style.borderColor = "rgba(47,143,78,0.15)";
                  }}
                >{s}</button>
              ))}
            </div>

            {/* Voice hint */}
            {voiceSupported && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(47,143,78,0.06)",
                border: "1.5px solid rgba(47,143,78,0.15)",
                borderRadius: 99, padding: "8px 18px",
                fontSize: 12, color: "#2F8F4E", fontWeight: 700
              }}>
                <Mic size={14} /> Tap ikon mic untuk input suara (Bahasa Indonesia)
              </div>
            )}

            <p style={{
              fontSize: 12, color: "#9A8C85", fontWeight: 600,
              margin: 0, letterSpacing: "0.02em", display: "flex", alignItems: "center", gap: 6, justifyContent: "center"
            }}>
              <Lock size={14} /> Percakapan tidak disimpan di server kami
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 24,
            animation: "fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          }}>
            {msg.role === "assistant" && (
              <div style={{
                flexShrink: 0, marginRight: 16,
                alignSelf: "flex-start", marginTop: 4,
              }}>
                <CiburialLogo size={36} />
              </div>
            )}
            <div style={{
              maxWidth: "82%",
              background: msg.role === "user" ? "linear-gradient(135deg,#1C3A2B,#2F8F4E)" : "white",
              borderRadius: msg.role === "user"
                ? "24px 24px 6px 24px"
                : "24px 24px 24px 6px",
              padding: "16px 24px",
              fontSize: 15, lineHeight: 1.7,
              color: msg.role === "user" ? "white" : "#1C3A2B",
              border: msg.role === "assistant" ? "1.5px solid rgba(47,143,78,0.1)" : "none",
              boxShadow: msg.role === "user"
                ? "0 12px 24px rgba(47,143,78,0.2)"
                : "0 8px 24px rgba(0,0,0,0.04)",
              fontWeight: 500
            }}>
              {msg.role === "assistant" ? (
                <div className="md-content" dangerouslySetInnerHTML={{
                  __html: `<p style="margin:0">${renderMarkdown(msg.content)}</p>`
                }}/>
              ) : (
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
              )}
            </div>
          </div>
        ))}

        {/* Skeleton Loading - Refined */}
        {loading && (
          <div style={{
            display: "flex", alignItems: "flex-start",
            gap: 16, marginBottom: 24,
          }}>
            <CiburialLogo size={36} />
            <div style={{
              background: "white",
              border: "1.5px solid rgba(47,143,78,0.1)",
              borderRadius: "24px 24px 24px 6px",
              padding: "20px 24px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
              display: "flex", flexDirection: "column",
              gap: 12, minWidth: 220,
            }}>
              {[100, 80, 60].map((w, i) => (
                <div key={i} style={{
                  height: 12, borderRadius: 6,
                  width: `${w}%`,
                  background: "linear-gradient(90deg,rgba(47,143,78,0.05) 25%,rgba(47,143,78,0.1) 50%,rgba(47,143,78,0.05) 75%)",
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
            background: "rgba(184,71,47,0.06)",
            border: "1.5px solid rgba(184,71,47,0.2)",
            borderRadius: 16, padding: "16px 20px",
            color: "#B8472F", fontSize: 14, fontWeight: 600,
            marginBottom: 24, display: "flex", alignItems: "center", gap: 8,
            justifyContent: "center", maxWidth: 500, margin: "0 auto"
          }}>
            <AlertCircle size={18} strokeWidth={2} /> {error}
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Input Area HEROIC */}
      <div style={{
        padding: "16px 24px 32px",
        background: "linear-gradient(to top, rgba(255,254,249,1) 60%, rgba(255,254,249,0.8))",
        borderTop: "1.5px solid rgba(47,143,78,0.1)",
        backdropFilter: "blur(12px)"
      }}>
        {/* Voice indicator */}
        {listening && (
          <div style={{
            maxWidth: 840, margin: "0 auto 12px",
            display: "flex", alignItems: "center",
            gap: 10, padding: "10px 18px",
            background: "rgba(220,38,38,0.08)",
            border: "1.5px solid rgba(220,38,38,0.2)",
            borderRadius: 12,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: "#DC2626",
              animation: "pulse-glow-red 1.5s infinite",
              boxShadow: "0 0 12px rgba(220,38,38,0.4)"
            }}/>
            <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 700 }}>
              Mendengarkan suara Anda...
            </span>
            <span style={{ fontSize: 12, color: "#9A8C85", marginLeft: "auto", fontWeight: 600 }}>
              Tap mic lagi untuk stop
            </span>
          </div>
        )}

        <div style={{
          maxWidth: 840, margin: "0 auto",
          display: "flex", gap: 12, alignItems: "flex-end",
        }}>
          {/* Voice button */}
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              title={listening ? "Stop" : "Input suara"}
              style={{
                width: 54, height: 54, flexShrink: 0,
                background: listening ? "rgba(220,38,38,0.1)" : "white",
                border: listening ? "1.5px solid rgba(220,38,38,0.4)" : "1.5px solid rgba(47,143,78,0.2)",
                borderRadius: 16,
                color: listening ? "#DC2626" : "#2F8F4E",
                cursor: "pointer", 
                transition: "all 0.25s cubic-bezier(.22,1,.36,1)",
                display: "flex", alignItems: "center",
                justifyContent: "center",
                boxShadow: listening ? "0 4px 16px rgba(220,38,38,0.15)" : "0 4px 12px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={e => {
                if (!listening) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(47,143,78,0.1)";
                }
              }}
              onMouseLeave={e => {
                if (!listening) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.04)";
                }
              }}
            >
              {listening ? <Square size={20} fill="currentColor" /> : <Mic size={22} strokeWidth={2} />}
            </button>
          )}

          {/* Text input */}
          <div style={{
            flex: 1, background: "white",
            border: "1.5px solid rgba(47,143,78,0.2)",
            borderRadius: 20, padding: "14px 20px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            transition: "all 0.3s",
            display: "flex", alignItems: "center"
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening
                ? "Bicara sekarang..."
                : "Tanya apapun tentang Ciburial, coding, atau pertanian..."
              }
              rows={1}
              style={{
                width: "100%", background: "none",
                border: "none", outline: "none",
                color: "#1C3A2B", fontSize: 15,
                resize: "none", fontFamily: "inherit",
                lineHeight: 1.6, maxHeight: 150,
                overflowY: "auto", fontWeight: 500
              }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 150) + "px";
              }}
              onFocus={e => e.target.parentElement!.style.borderColor = "#2F8F4E"}
              onBlur={e => e.target.parentElement!.style.borderColor = "rgba(47,143,78,0.2)"}
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 54, height: 54, flexShrink: 0,
              background: input.trim() && !loading ? "linear-gradient(135deg,#1C3A2B,#2F8F4E)" : "rgba(47,143,78,0.1)",
              border: "none", borderRadius: 16,
              color: input.trim() && !loading ? "white" : "rgba(47,143,78,0.4)",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              transition: "all 0.3s cubic-bezier(.22,1,.36,1)",
              display: "flex", alignItems: "center",
              justifyContent: "center",
              boxShadow: input.trim() && !loading
                ? "0 8px 24px rgba(47,143,78,0.3)" : "none",
            }}
            onMouseEnter={e => {
              if (input.trim() && !loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(47,143,78,0.4)";
              }
            }}
            onMouseLeave={e => {
              if (input.trim() && !loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(47,143,78,0.3)";
              }
            }}
          >
            <Send size={20} strokeWidth={2.5} style={{ marginLeft: 2 }} />
          </button>
        </div>

        <p style={{
          textAlign: "center", fontSize: 12, fontWeight: 600,
          color: "#9A8C85", margin: "14px 0 0", letterSpacing: "0.02em"
        }}>
          AI Ciburial dapat membuat kesalahan. Harap verifikasi informasi penting secara mandiri.
        </p>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 12px rgba(47,143,78,0.6); }
          50% { opacity: 0.5; box-shadow: none; }
        }
        @keyframes pulse-glow-red {
          0%, 100% { opacity: 1; box-shadow: 0 0 12px rgba(220,38,38,0.6); }
          50% { opacity: 0.5; box-shadow: none; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px) }
          to { opacity: 1; transform: translateY(0) }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        .md-content pre {
          background: rgba(47,143,78,0.04);
          border: 1.5px solid rgba(47,143,78,0.15);
          border-radius: 12px;
          padding: 16px;
          overflow-x: auto;
          margin: 12px 0;
        }
        .md-content pre code {
          background: none !important;
          padding: 0 !important;
          font-size: 13.5px;
          color: #1C3A2B;
          font-family: 'Consolas', 'Monaco', monospace;
          font-weight: 600;
        }
        .md-content p { margin: 0 0 12px 0; }
        .md-content p:last-child { margin-bottom: 0; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(47,143,78,0.2); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(47,143,78,0.4); }
        textarea::placeholder { color: #A0C2A8; font-weight: 500; }
      `}</style>
    </div>
  );
}