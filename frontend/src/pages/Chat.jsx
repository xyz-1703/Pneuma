import { useEffect, useRef, useState } from "react";
import ChatBubble from "../components/ChatBubble";
import MessageInput from "../components/MessageInput";
import { getChatHistory, sendChatMessage } from "../services/api";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getChatHistory();
        setMessages(data);
      } catch (err) {
        setError("Could not load chat history.");
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const onSend = async (text) => {
    setLoading(true);
    setError("");

    const optimisticUser = {
      role: "user",
      message: text,
      emotion: "neutral",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const data = await sendChatMessage(text);

      const optimisticAssistant = {
        role: "assistant",
        message: data.response,
        emotion: data.assistant_emotion || data.emotion,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticAssistant]);
    } catch (err) {
      setError("Unable to send message right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl animate-rise">
      <div className="mb-4 pl-2">
        <h2 className="font-heading text-2xl font-bold text-ink">Emotional Chat</h2>
        <p className="text-sm text-ink/70">
          Real-time supportive conversation with memory and emotion awareness.
        </p>
      </div>

      <div className="glass shadow-lg shadow-lagoon/5 h-[62vh] rounded-[2rem] p-4 md:p-6 flex flex-col">
        <div className="scroll-slim flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
          {messages.length === 0 ? (
            <div className="m-auto text-center text-ink/50 bg-surface/40 p-6 rounded-2xl border border-lagoon/10">
              <span className="text-2xl mb-2 block">✨</span>
              Start a conversation.<br/>Pneuma will respond with empathy.
            </div>
          ) : (
            messages.map((item, index) => (
              <ChatBubble
                key={`${item.timestamp}-${index}`}
                role={item.role}
                message={item.message}
                emotion={item.emotion}
              />
            ))
          )}

          {loading && (
            <div className="text-sm font-medium text-lagoon animate-pulse pl-2">Pneuma is reflecting...</div>
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-2 border-t border-lagoon/10 pt-4">
          <MessageInput onSend={onSend} loading={loading} />
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-center text-roseleaf">{error}</p>}
    </section>
  );
}
