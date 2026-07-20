import { useState } from "react";
import { BookOpen, Calendar, GraduationCap, LayoutDashboard, RefreshCw, User as UserIcon, Languages, Globe, Trophy, CalendarRange, ChevronDown, Grid } from "lucide-react";
import { getTranslation } from "../lib/translations";

interface NavbarProps {
  currentView: "dashboard" | "review" | "library" | "profile" | "rules" | "plans";
  setCurrentView: (view: "dashboard" | "review" | "library" | "profile" | "rules" | "plans") => void;
  dueCount: number;
  virtualTime: string;
  onResetTime: () => void;
  user: {
    name: string;
  } | null;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  useTargetUi: boolean;
  setUseTargetUi: (val: boolean) => void;
}

export default function Navbar({
  currentView,
  setCurrentView,
  dueCount,
  virtualTime,
  onResetTime,
  user,
  selectedLanguage,
  setSelectedLanguage,
  useTargetUi,
  setUseTargetUi,
}: NavbarProps) {
  const [isAppHubOpen, setIsAppHubOpen] = useState(false);
  const t = getTranslation(selectedLanguage, useTargetUi);

  // 「拓展应用」标签的多语言翻译
  const getAppHubLabel = () => {
    if (!useTargetUi) return "拓展应用";
    const targetLang = selectedLanguage === "All" ? "English" : selectedLanguage;
    if (targetLang === "Japanese") return "アプリ";
    if (targetLang === "Spanish") return "Aplicaciones";
    if (targetLang === "French") return "Applications";
    if (targetLang === "Portuguese") return "Aplicações";
    return "App Hub";
  };

  const getRulesLabel = () => {
    if (!useTargetUi) return "规则讲堂";
    const targetLang = selectedLanguage === "All" ? "English" : selectedLanguage;
    if (targetLang === "Japanese") return "ルール";
    if (targetLang === "Spanish") return "Reglas";
    if (targetLang === "French") return "Règles";
    if (targetLang === "Portuguese") return "Regras";
    return "Rules";
  };

  const getPlansLabel = () => {
    if (!useTargetUi) return "周计划";
    const targetLang = selectedLanguage === "All" ? "English" : selectedLanguage;
    if (targetLang === "Japanese") return "学習計画";
    if (targetLang === "Spanish") return "Planes";
    if (targetLang === "French") return "Plans";
    if (targetLang === "Portuguese") return "Planos";
    return "Plans";
  };

  const formattedTime = () => {
    if (!virtualTime) return "";
    const date = new Date(virtualTime);
    return date.toLocaleDateString(useTargetUi && selectedLanguage !== "All" ? (
      selectedLanguage === "Japanese" ? "ja-JP" :
      selectedLanguage === "Spanish" ? "es-ES" :
      selectedLanguage === "French" ? "fr-FR" :
      selectedLanguage === "Portuguese" ? "pt-PT" : "en-US"
    ) : "zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case "English": return "English";
      case "Japanese": return "日本語";
      case "Spanish": return "Español";
      case "French": return "Français";
      case "Portuguese": return "Português";
      default: return "English";
    }
  };

  const getLanguageOptionLabel = (langCode: string) => {
    if (!useTargetUi) {
      switch (langCode) {
        case "All": return "全部语言";
        case "English": return "英语 (EN)";
        case "Japanese": return "日语 (JA)";
        case "Spanish": return "西班牙语 (ES)";
        case "French": return "法语 (FR)";
        case "Portuguese": return "葡萄牙语 (PT)";
        default: return langCode;
      }
    }
    const targetLang = selectedLanguage === "All" ? "English" : selectedLanguage;
    if (targetLang === "Japanese") {
      switch (langCode) {
        case "All": return "すべての言語";
        case "English": return "英語 (EN)";
        case "Japanese": return "日本語 (JA)";
        case "Spanish": return "スペイン語 (ES)";
        case "French": return "フランス語 (FR)";
        case "Portuguese": return "ポルトガル語 (PT)";
        default: return langCode;
      }
    } else if (targetLang === "Spanish") {
      switch (langCode) {
        case "All": return "Todos los idiomas";
        case "English": return "Inglés (EN)";
        case "Japanese": return "Japonés (JA)";
        case "Spanish": return "Español (ES)";
        case "French": return "Francés (FR)";
        case "Portuguese": return "Português (PT)";
        default: return langCode;
      }
    } else if (targetLang === "French") {
      switch (langCode) {
        case "All": return "Toutes les langues";
        case "English": return "Anglais (EN)";
        case "Japanese": return "Japonais (JA)";
        case "Spanish": return "Espagnol (ES)";
        case "French": return "Français (FR)";
        case "Portuguese": return "Portugais (PT)";
        default: return langCode;
      }
    } else if (targetLang === "Portuguese") {
      switch (langCode) {
        case "All": return "Todos os idiomas";
        case "English": return "Inglês (EN)";
        case "Japanese": return "Japonês (JA)";
        case "Spanish": return "Espanhol (ES)";
        case "French": return "Francês (FR)";
        case "Portuguese": return "Português (PT)";
        default: return langCode;
      }
    } else {
      switch (langCode) {
        case "All": return "All Languages";
        case "English": return "English (EN)";
        case "Japanese": return "Japanese (JA)";
        case "Spanish": return "Spanish (ES)";
        case "French": return "French (FR)";
        case "Portuguese": return "Portuguese (PT)";
        default: return langCode;
      }
    }
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
              <span className="text-[10px] font-mono text-indigo-600 block -mt-1 font-semibold tracking-wider">
                {useTargetUi ? "Smart SRS" : "智能词库"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="btn-nav-dashboard"
              onClick={() => setCurrentView("dashboard")}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                currentView === "dashboard"
                  ? "bg-slate-50 text-indigo-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t.dashboard}</span>
            </button>

            <button
              id="btn-nav-review"
              onClick={() => setCurrentView("review")}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-medium transition-all relative cursor-pointer whitespace-nowrap ${
                currentView === "review"
                  ? "bg-slate-50 text-indigo-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t.review}</span>
              {dueCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                  {dueCount}
                </span>
              )}
            </button>

            <button
              id="btn-nav-library"
              onClick={() => setCurrentView("library")}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                currentView === "library"
                  ? "bg-slate-50 text-indigo-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t.library}</span>
            </button>

            {/* 🌟 拓展应用 / App Hub Dropdown（整合所有应用模块） */}
            <div className="relative">
              <button
                id="btn-nav-apphub"
                onClick={() => setIsAppHubOpen(!isAppHubOpen)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap border ${
                  currentView === "plans" || currentView === "rules"
                    ? "bg-indigo-50/70 text-indigo-600 font-semibold border-indigo-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent"
                }`}
              >
                <Grid className="w-4 h-4 shrink-0 text-indigo-500" />
                <span className="hidden sm:inline">{getAppHubLabel()}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isAppHubOpen ? "rotate-180" : ""}`} />
              </button>

              {isAppHubOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setIsAppHubOpen(false)}
                  />
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-2 z-40 animate-fade-in space-y-1">
                    <div className="px-2.5 py-1.5 mb-1 border-b border-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {useTargetUi ? "Applications" : "拓展应用中心"}
                      </span>
                    </div>

                    {/* 周计划 Option */}
                    <button
                      id="btn-nav-plans"
                      onClick={() => {
                        setCurrentView("plans");
                        setIsAppHubOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer whitespace-nowrap ${
                        currentView === "plans"
                          ? "bg-indigo-50/70 text-indigo-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        currentView === "plans" ? "bg-indigo-100 text-indigo-700" : "bg-indigo-50 text-indigo-600"
                      }`}>
                        <CalendarRange className="w-4 h-4" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold leading-none text-slate-800">
                          {getPlansLabel()}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-light truncate">
                          {useTargetUi ? "Weekly plans & habits" : "日程打卡与生词关联"}
                        </p>
                      </div>
                    </button>

                    {/* 规则讲堂 Option */}
                    <button
                      id="btn-nav-rules"
                      onClick={() => {
                        setCurrentView("rules");
                        setIsAppHubOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer whitespace-nowrap ${
                        currentView === "rules"
                          ? "bg-emerald-50/70 text-emerald-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        currentView === "rules" ? "bg-emerald-100 text-emerald-700" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold leading-none text-slate-800">
                          {getRulesLabel()}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-light truncate">
                          {useTargetUi ? "FIFA football rules" : "最新足球官方规则检索"}
                        </p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {user && (
              <button
                id="btn-nav-profile"
                onClick={() => setCurrentView("profile")}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
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

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* UI Display Language Selector */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 sm:px-2.5 text-xs">
              <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <select
                value={useTargetUi ? "target" : "zh"}
                onChange={(e) => setUseTargetUi(e.target.value === "target")}
                className="bg-transparent font-medium text-slate-700 outline-none border-none pr-1 cursor-pointer focus:ring-0 text-[11px] sm:text-xs"
                id="select-ui-lang"
              >
                <option value="zh">中文</option>
                <option value="target">
                  {selectedLanguage === "All" ? "English" : getLanguageLabel(selectedLanguage)}
                </option>
              </select>
            </div>

            {/* Target Learning Language Selector */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 sm:px-2.5 text-xs">
              <Languages className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none border-none pr-1 cursor-pointer focus:ring-0 text-[11px] sm:text-xs"
                id="select-language"
              >
                <option value="All">{getLanguageOptionLabel("All")}</option>
                <option value="English">{getLanguageOptionLabel("English")}</option>
                <option value="Japanese">{getLanguageOptionLabel("Japanese")}</option>
                <option value="Spanish">{getLanguageOptionLabel("Spanish")}</option>
                <option value="French">{getLanguageOptionLabel("French")}</option>
                <option value="Portuguese">{getLanguageOptionLabel("Portuguese")}</option>
              </select>
            </div>

            {/* Virtual Time Clock with Reset */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700 block sm:inline">{formattedTime()}</span>
              </div>
              <button
                onClick={onResetTime}
                title={t.resetToToday}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                id="btn-reset-time"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
