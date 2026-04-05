import { useState, useRef } from "react";

const EMOJIS = [
  "😊", "😢", "😡", "😨", "😍", "🤗", "😌", "😴",
  "🎉", "❤️", "💔", "💪", "🙌", "👍", "✨", "🌟",
  "🔥", "💯", "😂", "🤔", "😎", "😘", "🥺", "😤",
  "💜", "💙", "💚", "⚡", "🌈", "🌸", "🎨", "🎵"
];

export default function MessageInput({ onSend, loading }) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setText("");
    setShowEmojiPicker(false);
  };

  const insertEmoji = (emoji) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);

    // Move cursor after the emoji
    setTimeout(() => {
      input.selectionStart = input.selectionEnd = start + emoji.length;
      input.focus();
    }, 0);
  };

  return (
    <div className="relative mt-2">
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-0 z-50 rounded-2xl glass p-3 grid grid-cols-8 gap-2 w-72 animate-slideIn" style={{ animationDuration: '0.2s', animationTimingFunction: 'ease-out' }}>
          {EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                insertEmoji(emoji);
                setShowEmojiPicker(false);
              }}
              className="text-2xl hover:bg-ink/5 rounded-xl p-2 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`h-14 w-14 rounded-2xl border ${showEmojiPicker ? 'border-accent bg-accent/10' : 'border-ink/10 bg-surface/50'} text-xl hover:bg-surface transition-all shadow-sm active:scale-95 flex items-center justify-center`}
          title="Add emoji"
        >
          {showEmojiPicker ? '✨' : '😊'}
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Share what is on your mind..."
          className="h-14 flex-1 rounded-2xl border border-ink/10 bg-surface/50 px-6 text-[15px] font-medium text-ink outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/10 focus:bg-surface shadow-sm placeholder:text-ink/40"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="h-14 rounded-2xl bg-accent px-8 text-[15px] font-bold tracking-wide text-white transition-all shadow-lg shadow-accent/20 hover:bg-accent/90 hover:shadow-accent/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
