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
    <div className="relative mt-1">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="h-12 w-12 rounded-[1rem] border border-lagoon/20 bg-surface/90 text-lg hover:bg-mist transition-colors shadow-sm active:scale-95 flex items-center justify-center"
          title="Add emoji"
        >
          😊
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Share what is on your mind..."
          className="h-12 flex-1 rounded-[1rem] border border-lagoon/20 bg-surface/90 px-5 text-sm text-ink outline-none transition-all focus:border-lagoon focus:ring-2 focus:ring-lagoon/10 shadow-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-[1rem] bg-lagoon px-6 text-sm font-semibold text-white transition-all shadow-md shadow-lagoon/20 hover:bg-lagoon/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>

      {showEmojiPicker && (
        <div className="absolute bottom-16 left-0 z-50 rounded-xl bg-surface border border-lagoon/20 shadow-lg p-3 grid grid-cols-8 gap-2 w-72">
          {EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                insertEmoji(emoji);
                setShowEmojiPicker(false);
              }}
              className="text-2xl hover:bg-mist rounded-lg p-2 transition-colors active:scale-95 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
