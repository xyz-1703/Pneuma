import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = [
  "rgb(var(--accent))",
  "rgb(var(--lagoon))",
  "rgb(var(--sunrise))",
  "rgb(var(--roseleaf))",
  "rgba(var(--ink), 0.5)"
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface/90 backdrop-blur-md border border-ink/10 p-3 rounded-xl shadow-lg">
        <p className="text-[13px] font-bold text-ink mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-[14px] font-bold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MoodChart({ timeline, distribution }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="glass rounded-[2.5rem] p-6 shadow-glass border border-ink/5 hover:shadow-glass-hover transition-all animate-scaleUp" style={{ animationDelay: '0.1s' }}>
        <h3 className="mb-6 font-heading text-xl font-bold text-ink">Mood Over Time</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--ink), 0.1)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="rgba(var(--ink), 0.5)" 
                fontSize={12} 
                tickMargin={10} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                domain={[1, 5]} 
                stroke="rgba(var(--ink), 0.5)" 
                fontSize={12} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
              <Line
                type="monotone"
                dataKey="mood_score"
                stroke="rgb(var(--accent))"
                strokeWidth={4}
                dot={{ r: 5, fill: "rgb(var(--accent))", strokeWidth: 0 }}
                activeDot={{ r: 7, strokeWidth: 0 }}
                name="Mood score"
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-[2.5rem] p-6 shadow-glass border border-ink/5 hover:shadow-glass-hover transition-all animate-scaleUp" style={{ animationDelay: '0.2s' }}>
        <h3 className="mb-6 font-heading text-xl font-bold text-ink">Emotion Distribution</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                paddingAngle={5}
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                animationDuration={1500}
              >
                {distribution.map((entry, index) => (
                  <Cell 
                    key={entry.name} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="rgba(var(--surface), 0.5)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "10px" }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
