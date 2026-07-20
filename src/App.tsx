import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import WordList from "./components/WordList";
import ReviewSession from "./components/ReviewSession";
import Auth from "./components/Auth";
import Profile from "./components/Profile";
import FootballRules from "./components/FootballRules";
import LearningPlans from "./components/LearningPlans";
import { BookOpen, GraduationCap, RefreshCw, AlertCircle, Calendar } from "lucide-react";
import { getTranslation } from "./lib/translations";
import { LearningPlan, LearningTask, TaskType } from "./types";

interface Word {
  id: string;
  spelling: string;
  phonetic?: string;
  definition: string;
  example?: string;
  exampleTranslation?: string;
  mnemonic?: string;
  audioUrl?: string | null;
  createdAt: string;
  reviewStage: number;
  consecutiveCorrect: number;
  lastResetAt: string;
  nextReviewAt: string;
}

interface Stats {
  totalWords: number;
  dueTodayCount: number;
  masteredCount: number;
  stageDistribution: number[];
  systemOffsetDays: number;
  virtualTime: string;
  currentStreak?: number;
  maxStreak?: number;
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("ebbinghaus_token"));
  const [user, setUser] = useState<any | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem("ebbinghaus_selected_language") || "All";
  });
  const [useTargetUi, setUseTargetUi] = useState<boolean>(() => {
    return localStorage.getItem("ebbinghaus_use_target_ui") === "true";
  });
  
  const [currentView, setCurrentView] = useState<"dashboard" | "review" | "library" | "profile" | "rules" | "plans">("dashboard");
  const [customReviewWords, setCustomReviewWords] = useState<Word[] | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [allWords, setAllWords] = useState<Word[]>([]);
  // 当从周计划中触发复习时，保存任务上下文，复习完成后自动把对应任务标记为已完成
  const [customReviewMetadata, setCustomReviewMetadata] = useState<{ taskId: string; dayOfWeek: number; planId: string } | null>(null);
  // v1.9: 周计划数据从后端加载(取代 localStorage)
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [dueWords, setDueWords] = useState<Word[]>([]);
  const [histories, setHistories] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalWords: 0,
    dueTodayCount: 0,
    masteredCount: 0,
    stageDistribution: [0, 0, 0, 0, 0, 0, 0],
    systemOffsetDays: 0,
    virtualTime: new Date().toISOString(),
    currentStreak: 0,
    maxStreak: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  
  const trans = getTranslation(selectedLanguage, useTargetUi);

  // Load data when language changes
  useEffect(() => {
    localStorage.setItem("ebbinghaus_selected_language", selectedLanguage);
    if (token) {
      fetchMe(selectedLanguage);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    localStorage.setItem("ebbinghaus_use_target_ui", String(useTargetUi));
  }, [useTargetUi]);

  // Verification and loading on startup
  useEffect(() => {
    if (token) {
      fetchMe(selectedLanguage);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchMe = async (lang = selectedLanguage) => {
    setIsLoading(true);
    setErrorText("");
    try {
      const res = await fetch(`/api/auth/me?language=${encodeURIComponent(lang)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        await loadAllData(token, userData, lang);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setErrorText("加载用户信息失败，请检查网络或后端服务器状态。");
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem("ebbinghaus_token", newToken);
    setToken(newToken);
    setUser(newUser);
    setCurrentView("dashboard");
    loadAllData(newToken, newUser, selectedLanguage);
  };

  const handleLogout = () => {
    // Notify server to clean session
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      }).catch(() => {});
    }
    localStorage.removeItem("ebbinghaus_token");
    setToken(null);
    setUser(null);
    setWords([]);
    setDueWords([]);
    setHistories([]);
    setCurrentView("dashboard");
    setIsLoading(false);
  };

  const loadAllData = async (activeToken?: string | null, loadedUser?: any, activeLang?: string) => {
    const t = activeToken !== undefined ? activeToken : token;
    if (!t) return;

    const lang = activeLang !== undefined ? activeLang : selectedLanguage;
    setIsLoading(true);
    setErrorText("");
    try {
      // 1. Fetch current data from local backend server
      const fetchStatsPromise = fetchStats(t, lang);
      const fetchWordsPromise = fetchWords(t, lang);
      const fetchDueWordsPromise = fetchDueWords(t, lang);
      const fetchHistoriesPromise = fetchHistories(t, lang);
      const fetchPlansPromise = fetchPlansAndTypes(t);
      await Promise.all([fetchStatsPromise, fetchWordsPromise, fetchDueWordsPromise, fetchHistoriesPromise, fetchPlansPromise]);

      // Unlock UI immediately as local-server data loaded successfully
      setIsLoading(false);
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setErrorText("加载数据失败: " + (err.message || err));
      setIsLoading(false);
    }
  };

  const fetchStats = async (activeToken?: string | null, activeLang?: string) => {
    const t = activeToken || token;
    const lang = activeLang !== undefined ? activeLang : selectedLanguage;
    const res = await fetch(`/api/system/stats?language=${encodeURIComponent(lang)}`, {
      headers: { "Authorization": `Bearer ${t}` }
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "获取系统统计数据失败");
    }
    const data = await res.json();
    setStats(data);
  };

  const fetchWords = async (activeToken?: string | null, activeLang?: string) => {
    const t = activeToken || token;
    const lang = activeLang !== undefined ? activeLang : selectedLanguage;
    const res = await fetch(`/api/words?language=${encodeURIComponent(lang)}`, {
      headers: { "Authorization": `Bearer ${t}` }
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "获取词库失败");
    }
    const data = await res.json();
    setWords(data);

    // 周计划模块关联词库时需要跨语言检索所有单词，这里同步维护 allWords 快照
    if (lang === "All") {
      setAllWords(data);
    } else {
      try {
        const resAll = await fetch(`/api/words?language=All`, {
          headers: { "Authorization": `Bearer ${t}` }
        });
        if (resAll.ok) {
          const dataAll = await resAll.json();
          setAllWords(dataAll);
        }
      } catch (err) {
        console.error("Failed to fetch all words in fetchWords fallback:", err);
      }
    }
  };

  const fetchDueWords = async (activeToken?: string | null, activeLang?: string) => {
    const t = activeToken || token;
    const lang = activeLang !== undefined ? activeLang : selectedLanguage;
    const res = await fetch(`/api/words/due?language=${encodeURIComponent(lang)}`, {
      headers: { "Authorization": `Bearer ${t}` }
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "获取待复习单词失败");
    }
    const data = await res.json();
    setDueWords(data);
  };

  const fetchHistories = async (activeToken?: string | null, activeLang?: string) => {
    const t = activeToken || token;
    const lang = activeLang !== undefined ? activeLang : selectedLanguage;
    const res = await fetch(`/api/histories?language=${encodeURIComponent(lang)}`, {
      headers: { "Authorization": `Bearer ${t}` }
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "获取复习记录失败");
    }
    const data = await res.json();
    setHistories(data);
  };

  // ===== v1.9 周计划相关 =====

  // 一次性迁移: 首次登录后把 localStorage 的老数据搬到数据库,然后清空
  const migrateLocalPlansIfNeeded = async (t: string) => {
    const migratedFlag = localStorage.getItem("ebbinghaus_plans_migrated");
    if (migratedFlag === "true") return;
    const localPlans = localStorage.getItem("ebbinghaus_learning_plans");
    const localTypes = localStorage.getItem("ebbinghaus_task_types");
    if (!localPlans && !localTypes) {
      // 没有老数据直接打标
      localStorage.setItem("ebbinghaus_plans_migrated", "true");
      return;
    }
    try {
      const plans = localPlans ? JSON.parse(localPlans) : [];
      const taskTypes = localTypes ? JSON.parse(localTypes) : [];
      const res = await fetch("/api/plans/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${t}` },
        body: JSON.stringify({ plans, taskTypes })
      });
      if (res.ok) {
        const result = await res.json();
        console.log(`[Plans] Migrated ${result.migratedPlans} plans, ${result.migratedTasks} tasks`);
        // 迁移成功清空 localStorage
        localStorage.removeItem("ebbinghaus_learning_plans");
        localStorage.removeItem("ebbinghaus_task_types");
      }
    } catch (err) {
      console.warn("[Plans] Migration failed, will retry next time:", err);
      return; // 不打标,下次启动再试
    }
    localStorage.setItem("ebbinghaus_plans_migrated", "true");
  };

  // 加载周计划 + 任务类型
  const fetchPlansAndTypes = async (t?: string | null) => {
    const activeToken = t || token;
    if (!activeToken) return;
    // 先尝试迁移 localStorage 老数据(幂等)
    await migrateLocalPlansIfNeeded(activeToken);
    try {
      const [plansRes, typesRes] = await Promise.all([
        fetch("/api/plans", { headers: { "Authorization": `Bearer ${activeToken}` } }),
        fetch("/api/user/task-types", { headers: { "Authorization": `Bearer ${activeToken}` } })
      ]);
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData);
      }
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setTaskTypes(typesData);
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    }
  };

  // 创建周计划(含初始 8 天空结构)
  const handleCreatePlan = async (plan: LearningPlan): Promise<LearningPlan | null> => {
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(plan)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "创建计划失败");
      }
      const created = await res.json();
      await fetchPlansAndTypes();
      return created;
    } catch (err) {
      console.error("Failed to create plan:", err);
      return null;
    }
  };

  // 更新计划元信息
  const handleUpdatePlan = async (planId: string, updates: Partial<LearningPlan>): Promise<void> => {
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
      if (res.ok) await fetchPlansAndTypes();
    } catch (err) {
      console.error("Failed to update plan:", err);
    }
  };

  // 删除计划
  const handleDeletePlan = async (planId: string): Promise<void> => {
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) await fetchPlansAndTypes();
    } catch (err) {
      console.error("Failed to delete plan:", err);
    }
  };

  // 新增/更新任务(到某天)
  const handleSaveTask = async (
    planId: string,
    task: LearningTask,
    dayOfWeek: number,
    sortOrder = 0
  ): Promise<void> => {
    try {
      const res = await fetch(`/api/plans/${planId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ task, dayOfWeek, sortOrder })
      });
      if (res.ok) await fetchPlansAndTypes();
    } catch (err) {
      console.error("Failed to save task:", err);
    }
  };

  // 删除任务
  const handleDeleteTask = async (planId: string, taskId: string): Promise<void> => {
    try {
      const res = await fetch(`/api/plans/${planId}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) await fetchPlansAndTypes();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // 更新某天的元信息(休息日 / 整日打卡)
  const handleUpdateDayMeta = async (
    planId: string,
    dayOfWeek: number,
    meta: { isRestDay?: boolean; completed?: boolean }
  ): Promise<void> => {
    try {
      const res = await fetch(`/api/plans/${planId}/days/${dayOfWeek}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(meta)
      });
      if (res.ok) await fetchPlansAndTypes();
    } catch (err) {
      console.error("Failed to update day meta:", err);
    }
  };

  // 全量替换任务类型配置
  const handleSaveTaskTypes = async (types: any[]): Promise<void> => {
    const res = await fetch("/api/user/task-types", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(types)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    // 写入成功后再刷新一次,让 props 回流最新数据
    await fetchPlansAndTypes();
  };

  // 1. Add word
  const handleAddWord = async (spelling: string): Promise<boolean> => {
    try {
      const wordLang = selectedLanguage === "All" ? "English" : selectedLanguage;
      const res = await fetch("/api/words/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ spelling, language: wordLang }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "添加单词失败");
      }

      await Promise.all([
        fetchStats(token, selectedLanguage),
        fetchWords(token, selectedLanguage),
        fetchDueWords(token, selectedLanguage)
      ]);
      return true;
    } catch (err: any) {
      console.error("Failed to create word:", err);
      throw err; // 往上抛，让 WordList 显示具体错误
    }
  };

  // 2. Delete word
  const handleDeleteWord = async (id: string) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/words/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        await Promise.all([
          fetchStats(token, selectedLanguage),
          fetchWords(token, selectedLanguage),
          fetchDueWords(token, selectedLanguage)
        ]);
      }
    } catch (err) {
      console.error("Failed to delete word:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Update word
  const handleUpdateWord = async (id: string, updatedFields: Partial<Word>) => {
    try {
      const res = await fetch(`/api/words/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        await Promise.all([
          fetchStats(token, selectedLanguage),
          fetchWords(token, selectedLanguage),
          fetchDueWords(token, selectedLanguage)
        ]);
      }
    } catch (err) {
      console.error("Failed to update word:", err);
    }
  };

  // 3.5 AI Regenerate word details
  const handleRegenerateWord = async (id: string): Promise<Word> => {
    const res = await fetch(`/api/words/${id}/regenerate`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "AI 重新生成失败");
    }
    const updatedWord = await res.json();
    await Promise.all([
      fetchStats(token, selectedLanguage),
      fetchWords(token, selectedLanguage),
      fetchDueWords(token, selectedLanguage)
    ]);
    return updatedWord;
  };

  // 3.8 Batch Import Words（逐个调用 /api/words/create，支持进度回调）
  const handleImportWords = async (
    spellings: string[],
    onProgress?: (done: number, total: number, current: string) => void,
    mode: "fast" | "quality" = "fast"
  ): Promise<{
    successCount: number;
    addedWords: string[];
    errors: { spelling: string; error: string }[];
  }> => {
    const wordLang = selectedLanguage === "All" ? "English" : selectedLanguage;
    const total = spellings.length;
    // 模拟进度(后端并发处理无法精确回调每个词)
    onProgress?.(0, total, mode === "quality" ? "GLM 5.2" : "Gemini Lite");

    try {
      const res = await fetch("/api/words/import-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ spellings, language: wordLang, mode }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      onProgress?.(total, total, "");

      // 刷新数据
      await Promise.all([
        fetchStats(token, selectedLanguage),
        fetchWords(token, selectedLanguage),
        fetchDueWords(token, selectedLanguage)
      ]);

      return {
        successCount: result.successCount,
        addedWords: result.addedWords,
        errors: result.errors || []
      };
    } catch (err: any) {
      onProgress?.(total, total, "");
      throw err;
    }
  };

  // 4. Submit review session results
  const handleSubmitReview = async (results: { wordId: string; firstTryCorrect: boolean }[]) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/review/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ results }),
      });
      if (res.ok) {
        await Promise.all([
          fetchStats(token, selectedLanguage),
          fetchWords(token, selectedLanguage),
          fetchDueWords(token, selectedLanguage)
        ]);

        // 闭环：若复习从「周计划」中拉起，完成后自动把对应任务标记为已完成，并更新当日整体打卡状态
        if (customReviewMetadata) {
          try {
            await fetch(`/api/plans/${customReviewMetadata.planId}/tasks/${customReviewMetadata.taskId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
              body: JSON.stringify({ completed: true })
            });
            // 重新拉取最新数据,让前端看到打卡状态更新
            await fetchPlansAndTypes();
          } catch (err) {
            console.error("Failed to auto-complete task after review:", err);
          }
          setCustomReviewMetadata(null);
        }

        // 从周计划触发的复习结束后回到周计划页，否则回首页
        setCurrentView(customReviewWords ? "plans" : "dashboard");
        setCustomReviewWords(null);
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4.5 从周计划中拉起一次自定义复习会话（关联单词的子集）
  const handleStartCustomReview = (wordIds: string[], taskId?: string, dayOfWeek?: number, planId?: string) => {
    const pool = allWords.length > 0 ? allWords : words;
    const selectedWords = pool.filter(w => wordIds.includes(w.id));
    if (selectedWords.length > 0) {
      setCustomReviewWords(selectedWords);
      if (taskId && dayOfWeek !== undefined && planId) {
        setCustomReviewMetadata({ taskId, dayOfWeek, planId });
      } else {
        setCustomReviewMetadata(null);
      }
      setCurrentView("review");
    }
  };

  // 5. Advance time (Time Travel)
  const handleAdvanceTime = async (days: number) => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/system/time-travel", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ days }),
      });
      if (res.ok) {
        await Promise.all([
          fetchStats(token, selectedLanguage),
          fetchWords(token, selectedLanguage),
          fetchDueWords(token, selectedLanguage)
        ]);
      }
    } catch (err) {
      console.error("Failed to advance time:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 6. Reset Time Offset
  const handleResetTime = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/system/reset", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ fullReset: false }),
      });
      if (res.ok) {
        await Promise.all([
          fetchStats(token, selectedLanguage),
          fetchWords(token, selectedLanguage),
          fetchDueWords(token, selectedLanguage)
        ]);
      }
    } catch (err) {
      console.error("Failed to reset time:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 7. Reset entire DB to seed
  const handleResetDb = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/system/reset", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ fullReset: true, language: selectedLanguage === "All" ? undefined : selectedLanguage }),
      });
      if (res.ok) {
        await Promise.all([
          fetchStats(token, selectedLanguage),
          fetchWords(token, selectedLanguage),
          fetchDueWords(token, selectedLanguage)
        ]);
        setCurrentView("dashboard");
      }
    } catch (err) {
      console.error("Failed to reset database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render Auth screen if not logged in
  if (!token || !user) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider">{trans.loadingSecureSpace}</p>
        </div>
      );
    }
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      
      {/* Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        dueCount={dueWords.length}
        virtualTime={stats.virtualTime}
        onResetTime={handleResetTime}
        user={user}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        useTargetUi={useTargetUi}
        setUseTargetUi={setUseTargetUi}
      />

      {/* Main Content Arena */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider">{trans.loadingTemporalData}</p>
          </div>
        ) : errorText ? (
          <div className="max-w-md mx-auto bg-white border border-rose-100 p-6 rounded-2xl text-center space-y-4 my-12 shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="font-display font-bold text-slate-900 text-lg">数据库连接受阻</h3>
            <p className="text-xs text-slate-500 font-light">{errorText}</p>
            <button
              onClick={() => loadAllData()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重新尝试连接
            </button>
          </div>
        ) : (
          <>
            {/* View Switching Router */}
            {currentView === "dashboard" && (
              <Dashboard
                stats={stats}
                histories={histories}
                onAdvanceTime={handleAdvanceTime}
                onResetTime={handleResetTime}
                onResetDb={handleResetDb}
                onStartReview={() => setCurrentView("review")}
                onNavigateWords={() => setCurrentView("library")}
                onViewRules={() => setCurrentView("rules")}
                onViewPlans={() => setCurrentView("plans")}
                selectedLanguage={selectedLanguage}
                useTargetUi={useTargetUi}
                user={user}
              />
            )}

            {currentView === "review" && (
              <div className="space-y-6">
                {(customReviewWords || dueWords).length > 0 ? (
                  <ReviewSession
                    dueWords={customReviewWords || dueWords}
                    onSubmitReview={handleSubmitReview}
                    onClose={() => {
                      setCustomReviewWords(null);
                      setCustomReviewMetadata(null);
                      setCurrentView(customReviewWords ? "plans" : "dashboard");
                    }}
                    selectedLanguage={selectedLanguage}
                    useTargetUi={useTargetUi}
                  />
                ) : (
                  <div className="max-w-md mx-auto text-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4 my-12">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-bold text-slate-900 text-lg">
                      {trans.reviewCleanTitle}
                    </h3>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      {trans.reviewCleanDesc}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                      <button
                        id="btn-goto-dashboard"
                        onClick={() => setCurrentView("dashboard")}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        {trans.goToDashboard}
                      </button>
                      <button
                        onClick={() => setCurrentView("plans")}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {useTargetUi ? "Plan My Week" : "定制专属周计划"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentView === "library" && (
              <WordList
                words={words}
                onAddWord={handleAddWord}
                onDeleteWord={handleDeleteWord}
                onUpdateWord={handleUpdateWord}
                onRegenerateWord={handleRegenerateWord}
                onImportWords={handleImportWords}
                selectedLanguage={selectedLanguage}
                useTargetUi={useTargetUi}
                onViewPlans={() => setCurrentView("plans")}
              />
            )}

            {currentView === "profile" && (
              <Profile
                user={user}
                token={token!}
                stats={stats}
                onProfileUpdate={(updated) => setUser(updated)}
                onLogout={handleLogout}
                selectedLanguage={selectedLanguage}
                useTargetUi={useTargetUi}
              />
            )}

            {currentView === "rules" && (
              <FootballRules
                onBackToDashboard={() => setCurrentView("dashboard")}
                selectedLanguage={selectedLanguage}
                useTargetUi={useTargetUi}
              />
            )}

            {currentView === "plans" && (
              <LearningPlans
                words={allWords}
                plans={plans}
                taskTypes={taskTypes}
                onCreatePlan={handleCreatePlan}
                onUpdatePlan={handleUpdatePlan}
                onDeletePlan={handleDeletePlan}
                onSaveTask={handleSaveTask}
                onDeleteTask={handleDeleteTask}
                onUpdateDayMeta={handleUpdateDayMeta}
                onSaveTaskTypes={handleSaveTaskTypes}
                onStartCustomReview={handleStartCustomReview}
                onBack={() => setCurrentView("dashboard")}
                selectedLanguage={selectedLanguage}
                useTargetUi={useTargetUi}
              />
            )}
          </>
        )}
      </main>

      {/* Mini indicator for simulated clock */}
      {stats.systemOffsetDays > 0 && !isLoading && (
        <div className="bg-amber-500 text-white text-[11px] font-bold py-1.5 px-4 text-center select-none sticky bottom-0 z-30 flex items-center justify-center gap-2">
          <span>{trans.timeTravelWarning.replace("{days}", String(stats.systemOffsetDays))}</span>
          <button
            onClick={handleResetTime}
            className="underline hover:text-amber-100 transition-colors cursor-pointer"
          >
            {trans.resetRealTime}
          </button>
        </div>
      )}
    </div>
  );
}
