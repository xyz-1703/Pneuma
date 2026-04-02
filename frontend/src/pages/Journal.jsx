import { useState } from "react";
import JournalForm from "../components/JournalForm";
import { submitJournal } from "../services/api";

export default function Journal() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (text) => {
    setLoading(true);
    setError("");

    try {
      const data = await submitJournal(text);
      setResult(data);
    } catch (err) {
      setError("Could not process your journal entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl animate-rise">
      <div className="mb-4 pl-2">
        <h2 className="font-heading text-2xl font-bold text-ink">Journal With AI Insight</h2>
        <p className="text-sm text-ink/70">
          Reflect on your day and receive concise emotional insights.
        </p>
      </div>

      <JournalForm onSubmit={handleSubmit} loading={loading} />

      {error && <p className="mt-4 text-sm font-medium text-center text-roseleaf">{error}</p>}

      {result && (
        <div className="glass mt-6 rounded-[2rem] p-6 md:p-8 shadow-lg shadow-lagoon/5">
          <div className="mb-4 flex items-center justify-between border-b border-lagoon/10 pb-4">
            <h3 className="font-heading text-lg font-bold text-ink">AI Insight</h3>
            <span className="rounded-full bg-lagoon/10 px-3 py-1 text-xs font-semibold text-lagoon uppercase tracking-wide">
              {result.emotion}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="bg-surface/60 rounded-2xl p-4 border border-lagoon/5">
              <h4 className="text-xs font-bold text-lagoon uppercase tracking-wider mb-1">Summary</h4>
              <p className="text-sm leading-relaxed text-ink/80">{result.summary}</p>
            </div>
            
            <div className="bg-surface/60 rounded-2xl p-4 border border-lagoon/5">
              <h4 className="text-xs font-bold text-lagoon uppercase tracking-wider mb-1">Insight</h4>
              <p className="text-sm leading-relaxed text-ink/80">{result.insight}</p>
            </div>
            
            <div className="bg-surface/60 rounded-2xl p-4 border border-lagoon/5">
              <h4 className="text-xs font-bold text-lagoon uppercase tracking-wider mb-1">Suggestion</h4>
              <p className="text-sm leading-relaxed text-ink/80">{result.suggestion}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
