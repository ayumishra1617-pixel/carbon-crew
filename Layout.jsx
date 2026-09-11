import React from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { Gamepad2, ListChecks, LineChart, Mic } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/components/LanguageProvider";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isHome = location.pathname === "/";
  const isNupurr = location.pathname === "/nupurr";

  const navItems = [
    { path: "/games", label: t("nav_games"), icon: Gamepad2 },
    { path: "/checklist", label: t("nav_checklist"), icon: ListChecks },
    { path: "/caretaker", label: t("nav_caretaker"), icon: LineChart },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between">
        <LanguageSelector />
        {!isHome && (
          <Link to="/" className="flex items-center gap-2 glass rounded-full px-4 py-2.5 min-h-[44px]">
            <span className="text-primary font-bold text-lg text-glow">{t("app_name")}</span>
          </Link>
        )}
      </header>

      <main className="flex-1 pt-16 pb-24">
        <Outlet />
      </main>

      {!isHome && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-white/5">
          <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-h-[56px] justify-center transition-all ${
                    active ? "text-primary glow-blue" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-7 h-7" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {!isHome && !isNupurr && (
        <button
          onClick={() => navigate("/nupurr")}
          className="fixed bottom-24 right-4 z-40 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center glow-blue-strong animate-pulse-glow"
          aria-label={t("nav_nupurr")}
        >
          <Mic className="w-7 h-7" />
        </button>
      )}
    </div>
  );
}