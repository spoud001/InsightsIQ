import React, { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatSidebarProps {
  datasetId: number | string;
  isPrepared: boolean;
  onPrepare: () => Promise<void>;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ datasetId, isPrepared, onPrepare }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  const handlePrepare = async () => {
    setPreparing(true);
    setError(null);
    try {
      await onPrepare();
    } catch (e: any) {
      setError(e.message || "Failed to prepare dataset for Q&A.");
    } finally {
      setPreparing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setMessages((msgs) => [...msgs, { role: "user", content: input }]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/data/datasets/${datasetId}/ask_question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ question: input }),
        credentials: "include",
      });
      let data;
      try {
        if (res.headers.get("content-type")?.includes("application/json")) {
          data = await res.json();
        } else {
          throw new Error("Server error: Non-JSON response");
        }
      } catch (jsonErr) {
        throw new Error("Server error: Invalid or empty response");
      }
      if (!res.ok) throw new Error(data?.detail || "Error from server");
      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: data.answer }
      ]);
    } catch (e: any) {
      setError(e.message || "Failed to get answer.");
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="card animate-fade flex flex-col min-h-screen max-h-screen w-full">
      <h3 className="text-lg font-bold mb-2 text-primary">AI Q&A Assistant</h3>
      {!isPrepared ? (
        <button className="btn-primary mb-2" onClick={handlePrepare} disabled={preparing}>
          {preparing ? "Preparing..." : "Enable Deep Q&A"}
        </button>
      ) : null}
      {/* Chat area grows to fill available space, scrolls if needed */}
      <div className="flex-1 overflow-y-auto bg-bg rounded-lg p-2 mb-2 border border-border">
        {messages.length === 0 && (
          <div className="text-subtext text-sm text-center mt-8">Ask questions about your dataset here!</div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <span className={`inline-block px-3 py-2 rounded-lg ${msg.role === "user" ? "bg-primary text-white" : "bg-card border border-border text-secondary"}`}>
              {msg.content}
            </span>
          </div>
        ))}
        {loading && <div className="pulse text-subtext text-sm">Thinking...</div>}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 border border-border rounded-lg px-3 py-2 focus:border-primary"
          type="text"
          placeholder="Ask a question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
          disabled={!isPrepared || loading}
        />
        <button className="btn-primary" onClick={handleSend} disabled={!isPrepared || loading || !input.trim()}>
          Send
        </button>
      </div>
      {error && <div className="alert-danger mt-2">{error}</div>}
    </div>
  );
};

export default ChatSidebar;
