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
      happy: "from-amber-50 to-amber-100/50",
      sad: "from-blue-50 to-blue-100/50",
      angry: "from-red-50 to-red-100/50",
      calm: "from-emerald-50 to-emerald-100/50",
      anxious: "from-purple-50 to-purple-100/50",
      neutral: "from-slate-50 to-slate-100/50",
    };
    return colors[emotion?.toLowerCase()] || "from-slate-50 to-slate-100/50";
  };

  const getEmotionBadge = (emotion) => {
    const colors = {
      happy: "bg-amber-100 text-amber-700",
      sad: "bg-blue-100 text-blue-700",
      angry: "bg-red-100 text-red-700",
      calm: "bg-emerald-100 text-emerald-700",
      anxious: "bg-purple-100 text-purple-700",
      neutral: "bg-slate-100 text-slate-700",
    };
    return colors[emotion?.toLowerCase()] || "bg-slate-100 text-slate-700";
  };

  if (!entries || entries.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-lagoon/20 p-12">
        <div className="text-center">
          <p className="text-lg font-semibold text-ink/70 mb-2">No journal entries yet</p>
          <p className="text-sm text-ink/50">Start by writing your first entry above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`bg-gradient-to-br ${getEmotionBgColor(entry.emotion)} rounded-2xl p-5 md:p-6 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md border border-lagoon/5 hover:border-lagoon/20 group animate-rise ${
            selectedEntry?.id === entry.id ? "ring-2 ring-lagoon shadow-lg" : ""
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className={`${getEmotionBadge(entry.emotion)} rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide flex-shrink-0`}>
              {entry.emotion}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick?.(entry.id);
                }}
                className="p-1.5 rounded-lg bg-roseleaf/10 hover:bg-roseleaf/20 text-roseleaf transition-all active:scale-95"
                title="Delete entry"
              >
                🗑
              </button>
            </div>
            <span className="text-xs text-ink/50 flex-shrink-0 whitespace-nowrap">
              {formatDate(entry.date)}
            </span>
          </div>

          {/* Entry Text */}
          <p
            onClick={() => onSelectEntry(entry)}
            className="text-sm leading-relaxed text-ink/80 mb-3 line-clamp-4 break-words"
          >
            {entry.text}
          </p>

          {/* Summary */}
          <div
            onClick={() => onSelectEntry(entry)}
            className="bg-white/40 backdrop-blur-sm rounded-lg p-2.5 mb-3 border border-lagoon/10 cursor-pointer"
          >
            <p className="text-xs font-semibold text-lagoon/80 uppercase tracking-wider mb-1">Summary</p>
            <p className="text-xs leading-relaxed text-ink/70 line-clamp-2">
              {entry.summary}
            </p>
          </div>

          {/* View Details Button */}
          <button
            onClick={() => onSelectEntry(entry)}
            className="w-full mt-2 px-3 py-2 rounded-lg bg-white/60 hover:bg-white text-ink text-xs font-semibold uppercase tracking-wide transition-all opacity-0 group-hover:opacity-100 active:scale-95"
          >
            View Details →
          </button>
        </div>
      ))}
    </div>
  );
}
