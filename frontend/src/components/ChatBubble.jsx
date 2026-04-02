const EMOJI_BY_EMOTION = {
  // Positive emotions
  joy: "😊",
  love: "❤️",
  gratitude: "🙏",
  admiration: "😍",
  approval: "👍",
  excitement: "🤩",
  amusement: "😄",
  optimism: "🌟",
  pride: "🦁",
  relief: "😌",
  caring: "🤝",
  
  // Negative/Challenging emotions
  sadness: "😢",
  disappointment: "😞",
  grief: "💔",
  remorse: "😔",
  embarrassment: "😳",
  anger: "😠",
  annoyance: "😤",
  disapproval: "👎",
  disgust: "🤢",
  fear: "😨",
  nervousness: "😰",
  
  // Neutral/Other emotions
  confusion: "😕",
  curiosity: "🤔",
  realization: "💡",
  surprise: "😲",
  anticipation: "⏳",
  shame: "🙁",
  
  // Fallback
  neutral: "🫶",
};

export default function ChatBubble({ role, message, emotion }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-rise mb-2`}>
      <div
        className={`max-w-[85%] rounded-[1.5rem] px-5 py-4 shadow-sm md:max-w-[75%] ${
          isUser
            ? "bg-lagoon text-white rounded-br-sm shadow-md shadow-lagoon/10"
            : "glass text-ink rounded-bl-sm border border-lagoon/5 bg-surface/70"
        }`}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap tracking-wide">{message}</p>
        <div className={`mt-3 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 ${isUser ? 'text-white/70' : 'text-lagoon/70'}`}>
          <span>{EMOJI_BY_EMOTION[emotion] || "🫶"}</span>
          <span>{emotion || "unknown"}</span>
        </div>
      </div>
    </div>
  );
}
