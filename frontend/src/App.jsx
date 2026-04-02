import { useState, useEffect } from "react";
import Chat from "./pages/Chat";
import Journal from "./pages/Journal";
import Dashboard from "./pages/Dashboard";
import {
  getAuthenticatedEmail,
  isAuthenticated,
  login,
  logout,
  signup,
} from "./services/api";

const NAV_ITEMS = [
  { id: "chat", label: "Chat" },
  { id: "journal", label: "Journal" },
  { id: "dashboard", label: "Dashboard" },
];

const THEMES = [
  { id: "forest", label: "🌲 Forest (Calm)" },
  { id: "ocean", label: "🌊 Ocean (Relaxed)" },
  { id: "sunset", label: "🌅 Sunset (Warm)" },
  { id: "amethyst", label: "🔮 Amethyst (Deep)" },
];

export default function App() {
  const [active, setActive] = useState("chat");
  const [authed, setAuthed] = useState(isAuthenticated());
  const [userEmail, setUserEmail] = useState(getAuthenticatedEmail());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  // Default to forest theme
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("moodTheme") || "forest";
  });

  useEffect(() => {
    // Apply the active theme as a data attribute to the root HTML element
    document.documentElement.setAttribute('data-theme', currentTheme);
    // Keep 'dark' class permanently enabled for Tailwind class compatibilities if any
    document.documentElement.classList.add('dark');
    localStorage.setItem("moodTheme", currentTheme);
  }, [currentTheme]);

  const toggleTheme = () => {
    const currentIndex = THEMES.findIndex(t => t.id === currentTheme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setCurrentTheme(THEMES[nextIndex].id);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setAuthError("Please enter both email and password.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      const data = await login(email.trim(), password);
      setAuthed(true);
      setUserEmail(data.email || email.trim());
      setActive("chat");
    } catch (err) {
      setAuthError(err.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password) {
      setAuthError("Please enter both email and password.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      const data = await signup(email.trim(), password);
      setAuthed(true);
      setUserEmail(data.email || email.trim());
      setActive("chat");
    } catch (err) {
      setAuthError(err.message || "Signup failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setAuthed(false);
    setUserEmail("");
    setActive("chat");
  };

  if (!authed) {
    return (
      <div className="min-h-screen px-4 py-6 md:px-8 md:py-8">
        <header className="mx-auto mb-6 w-full max-w-6xl rounded-2xl border border-lagoon/20 bg-surface/70 shadow-sm p-4 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-ink md:text-3xl">
              Pneuma
            </h1>
            <p className="text-sm text-ink/70 mt-1">Login or create an account to access your private data.</p>
          </div>
          <button
            onClick={toggleTheme}
            title="Toggle Mood Theme"
            className="flex items-center gap-2 rounded-full border border-lagoon/30 bg-surface px-4 py-2 hover:bg-mist cursor-pointer transition-colors shadow-sm active:scale-95"
          >
            <span className="text-sm font-medium text-ink">Theme</span>
          </button>
        </header>

        <main className="mx-auto w-full max-w-md animate-rise">
          <div className="glass rounded-2xl p-6 md:p-8 shadow-lg shadow-lagoon/5">
            <h2 className="font-heading text-xl font-semibold text-ink">Welcome</h2>
            <p className="mt-1 text-sm text-ink/70">Your chats, journals, and mood dashboard are securely saved.</p>

            <div className="mt-6 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-lagoon/20 bg-surface/90 px-4 py-3 text-sm text-ink transition-all outline-none focus:border-lagoon focus:ring-2 focus:ring-lagoon/10"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-lagoon/20 bg-surface/90 px-4 py-3 text-sm text-ink transition-all outline-none focus:border-lagoon focus:ring-2 focus:ring-lagoon/10"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleLogin}
                disabled={authLoading}
                className="flex-1 rounded-xl bg-lagoon px-4 py-3 text-sm font-semibold text-white shadow-md shadow-lagoon/20 transition-transform active:scale-95 disabled:opacity-50"
              >
                {authLoading ? "Please wait..." : "Login"}
              </button>
              <button
                type="button"
                onClick={handleSignup}
                disabled={authLoading}
                className="flex-1 rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-ink shadow-sm ring-1 ring-lagoon/20 transition-transform active:scale-95 disabled:opacity-50 hover:bg-mist"
              >
                Signup
              </button>
            </div>

            {authError && <p className="mt-4 text-sm font-medium text-roseleaf text-center">{authError}</p>}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-8 text-ink">
      <header className="mx-auto mb-6 flex w-full max-w-6xl flex-col gap-4 rounded-2xl border border-lagoon/20 bg-surface/70 shadow-sm p-4 md:p-6 md:flex-row md:items-center md:justify-between animate-rise">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink md:text-3xl">
            Pneuma
          </h1>
          <p className="text-sm text-ink/70 mt-2">
            Emotion-aware support, reflection, and trend tracking in one safe space.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2 items-center">
          <button
            onClick={toggleTheme}
            title="Toggle Mood Theme"
            className="flex items-center gap-2 rounded-full border border-lagoon/30 bg-surface px-4 py-2 hover:bg-mist cursor-pointer transition-colors shadow-sm active:scale-95 mr-2"
          >
            <span className="text-sm font-medium text-ink">Theme</span>
          </button>
          <span className="self-center rounded-xl bg-mist px-3 py-2 text-xs font-medium text-ink/80 ring-1 ring-lagoon/10">
            {userEmail ? `Logged in as ${userEmail}` : "Logged in"}
          </span>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                active === item.id
                  ? "bg-lagoon text-white shadow-md shadow-lagoon/20 scale-105"
                  : "bg-transparent text-ink hover:bg-lagoon/10 hover:text-lagoon"
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="w-px h-6 bg-lagoon/20 mx-2 hidden md:block"></div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-roseleaf ring-1 ring-roseleaf/20 hover:bg-roseleaf/10 transition-colors duration-200"
          >
            Logout
          </button>
        </nav>
      </header>

      <main>
        {active === "chat" && <Chat />}
        {active === "journal" && <Journal />}
        {active === "dashboard" && <Dashboard />}
      </main>
    </div>
  );
}
