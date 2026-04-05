export default function JournalHistory({ entries, selectedEntry, onSelectEntry, onDeleteClick }) {
  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (date1, date2) =>
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();

    const timeFormat = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    if (isSameDay(d, today)) {
      return `Today at ${timeFormat}`;
    } else if (isSameDay(d, yesterday)) {
      return `Yesterday at ${timeFormat}`;
    } else {
      return d.toLocaleString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    }
  };

  const getEmotionBgColor = (emotion) => {
    const colors = {
      happy: "from-sunrise/20 to-sunrise/5 border-sunrise/20",
      sad: "from-lagoon/20 to-lagoon/5 border-lagoon/20",
      angry: "from-roseleaf/20 to-roseleaf/5 border-roseleaf/20",
      calm: "from-accent/20 to-accent/5 border-accent/20",
      anxious: "from-roseleaf/10 to-roseleaf/5 border-roseleaf/10",
      neutral: "from-ink/10 to-ink/5 border-ink/10",
    };
    return colors[emotion?.toLowerCase()] || "from-ink/10 to-ink/5 border-ink/10";
  };

  const getEmotionBadge = (emotion) => {
    const colors = {
      happy: "bg-sunrise/20 text-sunrise",
      sad: "bg-lagoon/20 text-lagoon",
      angry: "bg-roseleaf/20 text-roseleaf",
      calm: "bg-accent/20 text-accent",
      anxious: "bg-roseleaf/10 text-roseleaf",
      neutral: "bg-ink/10 text-ink",
    };
    return colors[emotion?.toLowerCase()] || "bg-ink/10 text-ink";
  };

  if (!entries || entries.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-[2rem] border-2 border-dashed border-ink/10 p-12 animate-rise">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-ink/5 text-3xl mb-4">📝</div>
          <p className="text-lg font-bold text-ink/80 mb-2">No journal entries yet</p>
          <p className="text-sm font-medium text-ink/50">Start by writing your first entry above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-max">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`bg-gradient-to-br glass ${getEmotionBgColor(entry.emotion)} rounded-[2rem] p-5 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-glass-hover hover:-translate-y-1 group animate-scaleUp ${
            selectedEntry?.id === entry.id ? "ring-2 ring-accent shadow-glass-hover scale-[1.02]" : "shadow-glass"
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <span className={`${getEmotionBadge(entry.emotion)} rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide flex-shrink-0 border border-current`}>
              {entry.emotion || "neutral"}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick?.(entry.id);
                }}
                className="p-1.5 rounded-lg bg-roseleaf/10 hover:bg-roseleaf hover:text-white text-roseleaf transition-all active:scale-95 border border-transparent hover:border-transparent"
                title="Delete entry"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
          
          <div className="mb-3 text-xs font-semibold text-ink/50 flex items-center justify-between">
            <span>{formatDate(entry.date)}</span>
          </div>

          {/* Entry Text */}
          <p
            onClick={() => onSelectEntry(entry)}
            className="text-[15px] leading-relaxed font-medium text-ink/90 mb-4 line-clamp-4 break-words"
          >
            {entry.text}
          </p>

          {/* Summary */}
          {entry.summary && (
            <div
              onClick={() => onSelectEntry(entry)}
              className="bg-surface/50 rounded-xl p-3 mb-4 border border-ink/5 cursor-pointer hover:bg-surface transition-colors"
            >
              <p className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-1.5">Overview</p>
              <p className="text-xs font-medium leading-relaxed text-ink/80 line-clamp-2">
                {entry.summary}
              </p>
            </div>
          )}

          {/* View Details Button */}
          <button
            onClick={() => onSelectEntry(entry)}
            className="w-full mt-2 py-2.5 rounded-xl bg-surface hover:bg-ink text-ink hover:text-surface text-[11px] font-bold uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100 active:scale-95 border border-ink/10"
          >
            Read Analysis ➔
          </button>
        </div>
      ))}
    </div>
  );
}
