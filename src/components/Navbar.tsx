import { BookOpen, Calendar, GraduationCap, LayoutDashboard, RefreshCw, User as UserIcon } from "lucide-react";

interface NavbarProps {
  currentView: "dashboard" | "review" | "library" | "profile";
  setCurrentView: (view: "dashboard" | "review" | "library" | "profile") => void;
  dueCount: number;
  virtualTime: string;
  onResetTime: () => void;
  user: {
    name: string;
  } | null;
}

export default function Navbar({
  currentView,
  setCurrentView,
  dueCount,
  virtualTime,
  onResetTime,
  user,
}: NavbarProps) {
  const formattedTime = () => {
    if (!virtualTime) return "";
    const date = new Date(virtualTime);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-2 sm:gap-4">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => setCurrentView("dashboard")}
            id="nav-logo"
          >
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-md shadow-indigo-100">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="hidden min-[420px]:block">
              <span className="font-display font-bold text-base sm:text-lg text-slate-900 tracking-tight block">Ebbinghaus Memo</span>
              <span className="text-[10px] font-mono text-indigo-600 block -mt-1 font-semibold tracking-wider">智能词库</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="btn-nav-dashboard"
              onClick={() => setCurrentView("dashboard")}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentView === "dashboard"
                  ? "bg-slate-50 text-indigo-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">控制面板</span>
            </button>

            <button
              id="btn-nav-review"
              onClick={() => setCurrentView("review")}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-medium transition-all relative cursor-pointer ${
                currentView === "review"
                  ? "bg-slate-50 text-indigo-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">今日复习</span>
              <span className="hidden min-[480px]:inline sm:hidden">复习</span>
              {dueCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                  {dueCount}
                </span>
              )}
            </button>

            <button
              id="btn-nav-library"
              onClick={() => setCurrentView("library")}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentView === "library"
                  ? "bg-slate-50 text-indigo-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">艾宾词库</span>
              <span className="hidden min-[480px]:inline sm:hidden">词库</span>
            </button>

            {user && (
              <button
                id="btn-nav-profile"
                onClick={() => setCurrentView("profile")}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  currentView === "profile"
                    ? "bg-slate-50 text-indigo-600 font-semibold"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <UserIcon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{user.name}</span>
              </button>
            )}
          </nav>

          {/* Virtual Time Clock with Reset */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-700 block sm:inline">{formattedTime()}</span>
            </div>
            <button
              onClick={onResetTime}
              title="重置时间为今天"
              className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
              id="btn-reset-time"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
