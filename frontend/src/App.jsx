import { useState, useEffect, useRef } from "react";

const API_URL = "https://truckingonboarding-production.up.railway.app";

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "12px",
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "#1a3a5c", display: "flex",
          alignItems: "center", justifyContent: "center",
          marginRight: 8, flexShrink: 0, marginTop: 4,
        }}>
          <span style={{ color: "white", fontSize: 14 }}>🚛</span>
        </div>
      )}
      <div style={{
        maxWidth: "75%",
        background: isUser ? "#1a3a5c" : "#f4f6f9",
        color: isUser ? "white" : "#1a1a1a",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "12px 16px",
        fontSize: 14,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
      }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `Welcome to our Logistics Onboarding! 🚛\n\nI will help get you set up quickly. This should take about 10-15 minutes.\n\nAre you joining us as a:\n1. Shipper (you have freight that needs to be moved)\n2. Carrier (you are a truck driver or fleet looking for loads)\n\nPlease reply with 1 or 2 to get started!`
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [profile, setProfile] = useState("");
  const bottomRef = useRef(null);

  // Start conversation on load

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Detect user type from first response
    let detectedType = userType;
    if (!userType) {
      const lower = input.toLowerCase();
      if (lower.includes("1") || lower.includes("shipper")) detectedType = "shipper";
      if (lower.includes("2") || lower.includes("carrier")) detectedType = "carrier";
      if (detectedType) setUserType(detectedType);
    }

    try {
      // Filter out the initial hardcoded welcome message before sending to API
      const apiMessages = newMessages.filter((m, index) => {
        if (index === 0 && m.role === "assistant") return false;
        return true;
      });
      
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages.map(m => ({ role: m.role, content: m.content })),
          userType: detectedType,
        }),
      });
      const data = await res.json();
      const assistantMessage = { role: "assistant", content: data.message };
      setMessages(prev => [...prev, assistantMessage]);

      if (data.isComplete) {
        setIsComplete(true);
        setProfile(data.message);
        // Save profile
        await fetch(`${API_URL}/api/save-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: data.message,
            type: detectedType,
            timestamp: new Date().toISOString(),
          }),
        });
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please try again.",
      }]);
    }
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function copyProfile() {
    navigator.clipboard.writeText(profile);
    alert("Profile copied to clipboard!");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0f4f8",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "Georgia, serif",
    }}>
      {/* Header */}
      <div style={{
        width: "100%",
        background: "#1a3a5c",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>🚛</span>
        <div>
          <p style={{ color: "white", fontWeight: 600, margin: 0, fontSize: 16 }}>
            Logistics Onboarding
          </p>
          <p style={{ color: "#a8c4e0", margin: 0, fontSize: 12 }}>
            {userType ? `${userType.charAt(0).toUpperCase() + userType.slice(1)} onboarding in progress` : "Getting started"}
          </p>
        </div>
        {userType && (
          <div style={{
            marginLeft: "auto",
            background: userType === "shipper" ? "#2563eb" : "#16a34a",
            color: "white",
            fontSize: 12,
            padding: "4px 12px",
            borderRadius: 20,
          }}>
            {userType === "shipper" ? "📦 Shipper" : "🚚 Carrier"}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        width: "100%",
        maxWidth: 680,
        padding: "24px 16px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#1a3a5c", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 14 }}>🚛</span>
            </div>
            <div style={{
              background: "#f4f6f9", borderRadius: "18px 18px 18px 4px",
              padding: "12px 16px", display: "flex", gap: 4,
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#94a3b8",
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {isComplete && (
          <div style={{
            background: "#dcfce7",
            border: "1px solid #16a34a",
            borderRadius: 12,
            padding: "16px",
            marginTop: 16,
            textAlign: "center",
          }}>
            <p style={{ color: "#15803d", fontWeight: 600, margin: "0 0 8px" }}>
              ✅ Onboarding Complete!
            </p>
            <p style={{ color: "#166534", fontSize: 13, margin: "0 0 12px" }}>
              Profile has been saved. Our team will be in touch within 24 hours.
            </p>
            <button onClick={copyProfile} style={{
              background: "#16a34a", color: "white",
              border: "none", borderRadius: 8,
              padding: "8px 20px", cursor: "pointer", fontSize: 13,
            }}>
              Copy Profile
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      {!isComplete && (
        <div style={{
          width: "100%",
          maxWidth: 680,
          padding: "12px 16px 24px",
          display: "flex",
          gap: 8,
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here..."
            rows={2}
            style={{
              flex: 1,
              border: "1px solid #cbd5e1",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 14,
              resize: "none",
              fontFamily: "Georgia, serif",
              outline: "none",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? "#94a3b8" : "#1a3a5c",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "0 20px",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: 18,
            }}
          >
            ➤
          </button>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
