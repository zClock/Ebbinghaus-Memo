import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import WordList from "./components/WordList";
import ReviewSession from "./components/ReviewSession";
import Auth from "./components/Auth";
import Profile from "./components/Profile";
import { BookOpen, GraduationCap, RefreshCw, AlertCircle } from "lucide-react";
import { getTranslation } from "./lib/translations";
import { 
  loadUserDataFromFirestore, 
  saveWordToFirestore, 
  deleteWordFromFirestore, 
  saveHistoryToFirestore, 
  uploadFullDataToFirestore 
} from "./lib/firestoreSync";
import { isFirebaseConfigured } from "./lib/firebase";

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
  
  const [currentView, setCurrentView] = useState<"dashboard" | "review" | "library" | "profile">("dashboard");
  const [words, setWords] = useState<Word[]>([]);
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
      await Promise.all([fetchStatsPromise, fetchWordsPromise, fetchDueWordsPromise, fetchHistoriesPromise]);

      // Unlock UI immediately as local-server data loaded successfully
      setIsLoading(false);

      const currentUser = loadedUser || user;
      
      // 2. Perform Firestore background sync if configured
      if (isFirebaseConfigured && currentUser) {
        (async () => {
          try {
            console.log(`[Sync] Performing background Firestore sync check for user: ${currentUser.id}`);
            
            // Helper to wrap a promise with a timeout
            async function withTimeout<T>(promise: Promise<T>, ms: number, errMsg: string): Promise<T> {
              return Promise.race([
                promise,
                new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errMsg)), ms))
              ]);
            }

            const cloudData = await withTimeout(
              loadUserDataFromFirestore(currentUser.id),
              5000,
              "Firestore sync load timed out"
            );
            
            if (cloudData && (cloudData.words.length > 0 || cloudData.histories.length > 0)) {
              console.log(`[Sync] Found ${cloudData.words.length} words in Firestore. Overwriting local storage...`);
              const pullRes = await fetch("/api/sync/pull", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${t}`
                },
                body: JSON.stringify({ words: cloudData.words, histories: cloudData.histories })
              });
              
              if (pullRes.ok) {
                console.log("[Sync] Local database updated with Firestore cloud backup. Refreshing cache.");
                await Promise.all([fetchStats(t, lang), fetchWords(t, lang), fetchDueWords(t, lang), fetchHistories(t, lang)]);
              }
            } else {
              // If Firestore contains nothing, seed it with the current server words
              console.log("[Sync] Firestore is empty. Seeding Firestore with local server defaults...");
              const currentWordsRes = await fetch("/api/words", {
                headers: { "Authorization": `Bearer ${t}` }
              });
              if (currentWordsRes.ok) {
                const currentWords = await currentWordsRes.json();
                await withTimeout(
                  uploadFullDataToFirestore(currentUser.id, currentWords, []),
                  5000,
                  "Firestore sync upload timed out"
                );
              }
            }
          } catch (syncErr) {
            console.warn("[Sync] Background Firestore sync failed or timed out:", syncErr);
          }
        })();
      }
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

  // Helper to sync latest data snapshot to Firestore cloud
  const syncChangesToCloud = async () => {
    if (!isFirebaseConfigured || !user) return;
    try {
      console.log("[Sync] Snapshotting latest words and histories to Firestore...");
      const [wordsRes, historiesRes] = await Promise.all([
        fetch("/api/words", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/histories", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      if (wordsRes.ok && historiesRes.ok) {
        const [latestWords, latestHistories] = await Promise.all([
          wordsRes.json(),
          historiesRes.json()
        ]);
        await uploadFullDataToFirestore(user.id, latestWords, latestHistories);
      }
    } catch (err) {
      console.error("[Sync] Firestore snapshot failed:", err);
    }
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
      if (!res.ok) return false;
      
      await Promise.all([
        fetchStats(token, selectedLanguage),
        fetchWords(token, selectedLanguage),
        fetchDueWords(token, selectedLanguage)
      ]);
      syncChangesToCloud(); // Push snapshot to cloud
      return true;
    } catch (err) {
      console.error("Failed to create word:", err);
      return false;
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
        syncChangesToCloud(); // Push snapshot to cloud
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
        syncChangesToCloud(); // Push snapshot to cloud
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
    syncChangesToCloud(); // Push snapshot to cloud
    return updatedWord;
  };

  // 3.8 Batch Import Words
  const handleImportWords = async (spellings: string[]): Promise<{
    successCount: number;
    addedWords: string[];
    errors: { spelling: string; error: string }[];
  }> => {
    const wordLang = selectedLanguage === "All" ? "English" : selectedLanguage;
    const res = await fetch("/api/words/import-batch", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ spellings, language: wordLang }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "批量导入失败");
    }
    const data = await res.json();
    await Promise.all([
      fetchStats(token, selectedLanguage),
      fetchWords(token, selectedLanguage),
      fetchDueWords(token, selectedLanguage)
    ]);
    syncChangesToCloud(); // Push snapshot to cloud
    return data;
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
        setCurrentView("dashboard");
        syncChangesToCloud(); // Push snapshot to cloud
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setIsLoading(false);
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
        body: JSON.stringify({ fullReset: true }),
      });
      if (res.ok) {
        await Promise.all([
          fetchStats(token, selectedLanguage),
          fetchWords(token, selectedLanguage),
          fetchDueWords(token, selectedLanguage)
        ]);
        setCurrentView("dashboard");
        syncChangesToCloud(); // Push snapshot to cloud
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
                selectedLanguage={selectedLanguage}
                useTargetUi={useTargetUi}
              />
            )}

            {currentView === "review" && (
              <div className="space-y-6">
                {dueWords.length > 0 ? (
                  <ReviewSession
                    dueWords={dueWords}
                    onSubmitReview={handleSubmitReview}
                    onClose={() => setCurrentView("dashboard")}
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
                    <button
                      id="btn-goto-dashboard"
                      onClick={() => setCurrentView("dashboard")}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      {trans.goToDashboard}
                    </button>
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
