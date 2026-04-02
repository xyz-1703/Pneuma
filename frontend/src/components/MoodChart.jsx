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

const COLORS = ["#6B9080", "#F6BD60", "#E5989B", "#84A59D", "#F28482"];

export default function MoodChart({ timeline, distribution }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="glass rounded-2xl p-4">
        <h3 className="mb-3 font-heading text-base font-semibold">Mood Over Time</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EFEA" />
              <XAxis dataKey="date" stroke="#2C3E50" />
              <YAxis domain={[1, 5]} stroke="#2C3E50" />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="mood_score"
                stroke="#6B9080"
                strokeWidth={3}
                dot={{ r: 4, fill: "#6B9080" }}
                name="Mood score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <h3 className="mb-3 font-heading text-base font-semibold">Emotion Distribution</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {distribution.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
