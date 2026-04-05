import { useEffect, useRef, useState } from "react";
import ChatBubble from "../components/ChatBubble";
import MessageInput from "../components/MessageInput";
import { getChatHistory, sendChatMessage, getGreeting, getAuthenticatedEmail } from "../services/api";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState("");
  const [greetingContext, setGreetingContext] = useState(null);
  const endRef = useRef(null);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const generateGreetingMessage = (context, lastEmotion, email) => {
    const timeGreeting = getTimeBasedGreeting();
    const firstName = email ? email.split("@")[0] : "there";
    const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    
    let secondLine = "";
    
    if (context === "new_user") {
      secondLine = "Pneuma is here whenever you're ready to talk.";
    } else if (context === "returning_after_break") {
      secondLine = "It's been a while — we missed you. No pressure, take your time.";
    } else if (context === "returning" && lastEmotion) {
      secondLine = `You were feeling ${lastEmotion.toLowerCase()} recently. How are you today?`;
    } else if (context === "returning") {
      secondLine = "Welcome back! How are you feeling today?";
    }
    
    return `${timeGreeting}, ${capitalizedFirstName}\n${secondLine}`;
  };

  useEffect(() => {
    const loadGreeting = async () => {
      try {
        const greetingData = await getGreeting();
        setGreetingContext(greetingData);
        
        const email = getAuthenticatedEmail();
        const message = generateGreetingMessage(
          greetingData.context,
          greetingData.last_emotion,
          email
        );
        setGreeting(message);
      } catch (err) {
        console.error("Could not load greeting:", err);
      }
    };

    const loadHistory = async () => {
      try {
        const data = await getChatHistory();
        setMessages(data);
      } catch (err) {
        setError("Could not load chat history.");
      }
    };

    loadGreeting();
    loadHistory();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, greeting]);

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
      <div className="mb-6 pl-2">
        <h2 className="font-heading text-3xl font-bold text-ink">Emotional Chat</h2>
        <p className="text-[15px] text-ink/60 mt-1">
          Real-time supportive conversation with memory and emotion awareness.
        </p>
      </div>

      <div className="glass shadow-glass h-[65vh] rounded-[2.5rem] p-5 md:p-8 flex flex-col">
        <div className="scroll-slim flex-1 flex flex-col gap-2 overflow-y-auto pr-3 pb-4">
          {greeting && (
            <div className="text-center py-6 px-6 mx-auto mb-6 bg-accent/5 rounded-2xl border border-accent/10 text-ink max-w-2xl w-full animate-scaleUp">
              {greeting.split("\n").map((line, idx) => (
                <p key={idx} className={idx === 0 ? "font-heading font-bold text-xl text-ink/90" : "text-[15px] font-medium text-ink/60 mt-2"}>
                  {line}
                </p>
              ))}
            </div>
          )}

          {messages.length === 0 && greeting ? (
            <div className="m-auto text-center animate-pulse mt-10">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-4xl mb-6 shadow-interior">✨</div>
              <h3 className="text-lg font-bold text-ink/80 mb-2">Share what's on your mind.</h3>
              <p className="text-sm font-medium text-ink/50 max-w-xs mx-auto">Pneuma will listen and respond with deep empathy.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="m-auto text-center animate-pulse mt-10">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-4xl mb-6 shadow-interior">✨</div>
              <h3 className="text-lg font-bold text-ink/80 mb-2">Start a conversation.</h3>
              <p className="text-sm font-medium text-ink/50 max-w-xs mx-auto">Pneuma will listen and respond with deep empathy.</p>
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
            <div className="flex justify-start animate-slideIn">
               <div className="glass px-6 py-4 rounded-2xl rounded-bl-sm border border-ink/5 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0s' }}></div>
                 <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                 <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.4s' }}></div>
               </div>
            </div>
          )}
          <div ref={endRef} className="h-4" />
        </div>

        <div className="mt-2 pt-4 border-t border-ink/5">
          <div className="flex flex-wrap gap-2 mb-4 animate-rise">
            <span className="text-xs tracking-wider uppercase text-ink/40 font-bold mr-2 self-center">Suggested</span>
            {[
              "Let's try a breathing exercise",
              "I want to talk about something else",
              "I'm feeling better, thanks"
            ].map((reply, i) => (
              <button 
                key={i}
                onClick={() => onSend(reply)}
                disabled={loading}
                className="bg-surface/50 hover:bg-surface px-4 py-1.5 rounded-full text-[13px] font-bold text-ink/70 hover:text-ink border border-ink/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm active:scale-95"
              >
                {reply}
              </button>
            ))}
          </div>
          <MessageInput onSend={onSend} loading={loading} />
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-semibold text-center text-roseleaf animate-rise">{error}</p>}
    </section>
  );
}
