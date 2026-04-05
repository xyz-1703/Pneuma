import { useEffect, useState } from "react";
import MoodChart from "../components/MoodChart";
import MoodWeekTracker from "../components/MoodWeekTracker";
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
      <div className="mb-8 pl-2">
        <h2 className="font-heading text-3xl font-bold text-ink mb-2">Mood Dashboard</h2>
        <p className="text-[15px] font-medium text-ink/60">Track emotional trends from your chats and journal entries.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse glass rounded-[2.5rem] shadow-glass border border-ink/5">
            <div className="w-12 h-12 rounded-full border-4 border-ink/10 border-t-accent animate-spin mb-4"></div>
            <p className="text-ink/60 font-semibold tracking-wide">Loading mood analytics...</p>
        </div>
      ) : error ? (
        <div className="glass rounded-[2.5rem] p-8 text-center text-[15px] font-bold text-roseleaf shadow-glass border border-roseleaf/20">{error}</div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 shrink-0 animate-scaleUp" style={{ animationDelay: '0.05s' }}>
              <MoodWeekTracker timeline={data.timeline} />
            </div>

            <div className="w-full md:w-2/3 glass rounded-[2.5rem] p-6 shadow-glass hover:shadow-glass-hover transition-all animate-scaleUp border border-ink/5 relative overflow-hidden group" style={{ animationDelay: '0.1s' }}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-accent/10 transition-colors"></div>
              <h3 className="mb-4 font-heading text-xl font-bold text-ink relative z-10 flex items-center gap-2">
                <span className="text-2xl">✨</span> Weekly Insight
              </h3>
              <div className="bg-surface/50 hover:bg-surface p-5 rounded-3xl border border-ink/5 text-[15px] font-medium leading-relaxed text-ink/80 transition-colors relative z-10 h-[calc(100%-3rem)] overflow-y-auto scroll-slim">
                {data.weekly_summary}
              </div>
            </div>
          </div>

          <MoodChart timeline={data.timeline} distribution={data.distribution} />
        </div>
      )}
    </section>
  );
}
