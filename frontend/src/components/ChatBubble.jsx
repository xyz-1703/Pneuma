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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slideIn mb-4`} style={{ animationDuration: '0.3s' }}>
      <div
        className={`max-w-[85%] rounded-[1.5rem] px-5 py-4 shadow-sm md:max-w-[75%] transition-all duration-300 hover:shadow-md ${
          isUser
            ? "bg-accent text-white rounded-br-sm shadow-md shadow-accent/20 hover:shadow-accent/30 hover:-translate-y-0.5"
            : "glass text-ink rounded-bl-sm border border-ink/5 hover:-translate-y-0.5"
        }`}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap tracking-wide">{message}</p>
      </div>
    </div>
  );
}
