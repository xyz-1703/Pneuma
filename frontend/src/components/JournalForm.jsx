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
    <form onSubmit={submit} className="glass rounded-[2rem] p-6 shadow-lg shadow-lagoon/5 md:p-8 animate-rise">
      <label className="mb-4 block font-heading text-xl font-bold text-ink">
        How was your day?
      </label>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={8}
        placeholder="Write freely. Your reflection stays private in your workspace database..."
        className="w-full rounded-2xl border border-lagoon/20 bg-surface/90 p-4 text-sm text-ink outline-none transition-all focus:border-lagoon focus:ring-2 focus:ring-lagoon/10 shadow-inner resize-none"
      />
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-lagoon px-6 py-3 text-sm font-semibold text-white transition-all shadow-md shadow-lagoon/20 hover:bg-lagoon/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          {loading ? "Analyzing..." : "Get AI Insight"}
        </button>
      </div>
    </form>
  );
}
