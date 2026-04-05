import { useState } from "react";

export default function JournalForm({ onSubmit, loading }) {
  const [text, setText] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  return (
    <form onSubmit={submit} className="glass rounded-[2.5rem] p-6 shadow-glass hover:shadow-glass-hover transition-shadow duration-300 md:p-8 animate-scaleUp">
      <label className="mb-4 block font-heading text-2xl font-bold text-ink">
        How was your day?
      </label>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={8}
        placeholder="Write freely. Your reflection stays private in your workspace database..."
        className="w-full rounded-2xl border border-ink/10 bg-surface/50 hover:bg-surface/80 p-5 text-[15px] font-medium text-ink outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/10 focus:bg-surface shadow-sm resize-none placeholder:text-ink/40"
      />
      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="rounded-xl bg-accent px-8 py-3 text-[15px] font-bold tracking-wide text-white transition-all shadow-lg shadow-accent/20 hover:bg-accent/90 hover:shadow-accent/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
        >
          {loading ? "Analyzing..." : "Get AI Insight"}
        </button>
      </div>
    </form>
  );
}
