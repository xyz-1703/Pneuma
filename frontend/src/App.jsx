import { useState, useEffect } from "react";
import Chat from "./pages/Chat";
import Journal from "./pages/Journal";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./components/AuthPage";
import CrisisModal from "./components/CrisisModal";
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
  { id: "midnight", label: "Midnight Gold" },
  { id: "ocean", label: "Ocean Glow" },
  { id: "sunset", label: "Sunset Aura" },
  { id: "aurora", label: "Aurora Neon" },
];

export default function App() {
  const [active, setActive] = useState("chat");
  const [authed, setAuthed] = useState(isAuthenticated());
  const [userEmail, setUserEmail] = useState(getAuthenticatedEmail());
  const [isCrisisModalOpen, setCrisisModalOpen] = useState(false);
  
  // Default to midnight theme
  const [currentTheme, setCurrentTheme] = useState(() => {
    let saved = localStorage.getItem("moodTheme");
    if (saved === "zen") saved = "midnight"; // Migrate old users
    return saved || "midnight";
  });

  useEffect(() => {
    // Apply the active theme as a data attribute to the root HTML element
    if (currentTheme === "midnight") {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
    document.documentElement.classList.add("dark");
    localStorage.setItem("moodTheme", currentTheme);
  }, [currentTheme]);

  const toggleTheme = () => {
    const currentIndex = THEMES.findIndex(t => t.id === currentTheme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setCurrentTheme(THEMES[nextIndex].id);
  };

  const handleAuthSuccess = (data) => {
    setAuthed(true);
    setUserEmail(data.user?.email || data.email || "");
    setActive("chat");
  };

  const handleLogout = () => {
    logout();
    setAuthed(false);
    setUserEmail("");
    setActive("chat");
  };

  if (!authed) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  const currentThemeLabel = THEMES.find(t => t.id === currentTheme)?.label || "Theme";

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 text-ink">
      <header className="glass mx-auto mb-8 flex w-full max-w-6xl flex-col gap-6 rounded-[2rem] p-6 md:flex-row md:items-center md:justify-between animate-rise">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-accent to-roseleaf bg-clip-text text-transparent">
            Pneuma
          </h1>
          <p className="text-sm font-medium text-ink/60">
            A safe space for emotion-aware reflection.
          </p>
        </div>

        <nav className="flex flex-wrap gap-3 items-center">
          <button
            onClick={toggleTheme}
            title={currentThemeLabel}
            className="group flex items-center gap-2 rounded-full border border-ink/10 bg-surface/50 hover:bg-surface px-5 py-2 hover:shadow-glass cursor-pointer transition-all active:scale-95 duration-300"
          >
            <span className="text-sm font-bold tracking-wide uppercase text-ink/80 group-hover:text-ink transition-colors">Theme</span>
          </button>
          
          <div className="flex gap-2 bg-surface/50 backdrop-blur-xl shadow-glass p-1 rounded-2xl border border-ink/5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={`rounded-xl px-5 py-2 text-sm font-bold transition-all duration-300 ease-out ${
                  active === item.id
                    ? "bg-accent text-white shadow-lg shadow-accent/30 scale-[1.02]"
                    : "bg-transparent text-ink/70 hover:text-ink hover:bg-ink/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-ink/10 mx-2 hidden md:block"></div>
          
          <button
            type="button"
            onClick={() => setCrisisModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-roseleaf/10 px-4 py-2 text-sm font-bold text-roseleaf border border-roseleaf/30 hover:bg-roseleaf hover:text-white hover:shadow-lg hover:shadow-roseleaf/20 transition-all duration-300 active:scale-95"
          >
            <span className="text-lg leading-none">❤️</span> Crisis Help
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-surface/50 px-4 py-2 text-sm font-semibold text-ink/70 border border-ink/10 hover:bg-ink/5 transition-all duration-300 active:scale-95"
          >
            Logout
          </button>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl">
        {active === "chat" && <Chat />}
        {active === "journal" && <Journal />}
        {active === "dashboard" && <Dashboard />}
      </main>

      <CrisisModal isOpen={isCrisisModalOpen} onClose={() => setCrisisModalOpen(false)} />
    </div>
  );
}
