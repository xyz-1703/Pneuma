import { useEffect, useState } from "react";
import MoodChart from "../components/MoodChart";
import { getMoodData } from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState({ timeline: [], distribution: [], weekly_summary: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const mood = await getMoodData();
        setData(mood);
      } catch (err) {
        setError("Failed to load mood data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl animate-rise">
      <div className="mb-4 pl-2">
        <h2 className="font-heading text-2xl font-bold text-ink">Mood Dashboard</h2>
        <p className="text-sm text-ink/70">Track emotional trends from your chats and journal entries.</p>
      </div>

      {loading ? (
        <div className="glass rounded-[2rem] p-8 text-center text-sm font-medium text-lagoon animate-pulse shadow-lg shadow-lagoon/5">Loading mood analytics...</div>
      ) : error ? (
        <div className="glass rounded-[2rem] p-8 text-center text-sm font-medium text-roseleaf shadow-lg shadow-lagoon/5">{error}</div>
      ) : (
        <div className="space-y-6">
          <MoodChart timeline={data.timeline} distribution={data.distribution} />
          <div className="glass rounded-[2rem] p-6 shadow-lg shadow-lagoon/5">
            <h3 className="mb-3 font-heading text-lg font-bold text-ink">Weekly Summary</h3>
            <div className="bg-surface/60 p-4 rounded-2xl border border-lagoon/5 text-sm leading-relaxed text-ink/80">
              {data.weekly_summary}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
