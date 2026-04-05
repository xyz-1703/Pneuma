import React from 'react';

const MOOD_COLORS = {
  1: "bg-roseleaf",
  2: "bg-sunrise opacity-80",
  3: "bg-sunrise",
  4: "bg-accent opacity-80",
  5: "bg-accent",
};

const HEIGHTS = {
  1: "h-3",
  2: "h-4",
  3: "h-5",
  4: "h-6",
  5: "h-8",
};

export default function MoodWeekTracker({ timeline }) {
  // If timeline is empty or small, pad it up to 7 items with nulls
  const displayData = [];
  const limit = 7;
  
  if (timeline && timeline.length > 0) {
    const recent = timeline.slice(-limit);
    // Pad start if less than 7
    while (displayData.length < limit - recent.length) {
      displayData.push({ date: "", mood_score: null, dayLabel: "-" });
    }
    recent.forEach(t => {
      // try to extract day letter
      let dayL = "•";
      if (t.date) {
        try {
          // simple check if it's parsable, fallback to first char
          const d = new Date(t.date);
          if (!isNaN(d.getTime())) {
            dayL = d.toLocaleDateString("en-US", { weekday: ("short") })[0];
          } else {
             dayL = String(t.date).slice(0, 1);
          }
        } catch(e) {
          dayL = "•";
        }
      }
      
      displayData.push({
        date: t.date,
        mood_score: parseInt(t.mood_score, 10),
        dayLabel: dayL
      });
    });
  } else {
    for (let i=0; i<limit; i++) displayData.push({ date: "", mood_score: null, dayLabel: "-" });
  }

  return (
    <div className="flex flex-col gap-4 bg-surface/30 p-5 rounded-2xl border border-ink/5">
      <h3 className="text-xs font-bold tracking-widest text-ink/50 uppercase">Mood This Week</h3>
      <div className="flex gap-2.5 items-end h-[40px]">
        {displayData.map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <div 
                className={`w-full rounded-md transition-all duration-300 shadow-sm ${item.mood_score ? HEIGHTS[item.mood_score] : 'h-2'} ${item.mood_score ? MOOD_COLORS[item.mood_score] : 'bg-ink/10'}`}
                title={item.mood_score ? `Score: ${item.mood_score}` : 'No data'}
            ></div>
            <span className="text-[11px] font-bold text-ink/60">{item.dayLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
