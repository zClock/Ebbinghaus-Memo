import { useState, useEffect, FormEvent, ChangeEvent, DragEvent } from "react";
import { 
  Plus, 
  Search, 
  Volume2, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  HelpCircle, 
  Sparkles, 
  BookOpen, 
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileText,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

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

interface WordListProps {
  words: Word[];
  onAddWord: (spelling: string) => Promise<boolean>;
  onDeleteWord: (id: string) => void;
  onUpdateWord: (id: string, updatedFields: Partial<Word>) => void;
  onRegenerateWord: (id: string) => Promise<Word>;
  onImportWords?: (spellings: string[]) => Promise<{
    successCount: number;
    addedWords: string[];
    errors: { spelling: string; error: string }[];
  }>;
}

export default function WordList({
  words,
  onAddWord,
  onDeleteWord,
  onUpdateWord,
  onRegenerateWord,
  onImportWords,
}: WordListProps) {
  const [newSpelling, setNewSpelling] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Batch import states
  const [addMode, setAddMode] = useState<"single" | "batch">("single");
  const [batchText, setBatchText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    addedWords: string[];
    errors: { spelling: string; error: string }[];
  } | null>(null);
  const [importError, setImportError] = useState("");

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenError, setRegenError] = useState("");
  const [regenSuccess, setRegenSuccess] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "due" | "mastered" | "learning">("all");
  const [stageFilter, setStageFilter] = useState<string>("all"); // "all", "0", "1", "2", "3", "4", "5", "6"
  const [sortBy, setSortBy] = useState<string>("newest"); // "newest", "oldest", "nextReviewAsc", "nextReviewDesc", "spellingAsc", "spellingDesc", "stageAsc", "stageDesc"
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15); // Items per page

  // Reset pagination to first page when filters/sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMode, stageFilter, sortBy, pageSize]);
  
  // Detail Modal & Edit state
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDefinition, setEditDefinition] = useState("");
  const [editPhonetic, setEditPhonetic] = useState("");
  const [editExample, setEditExample] = useState("");
  const [editExampleTrans, setEditExampleTrans] = useState("");
  const [editMnemonic, setEditMnemonic] = useState("");

  // Speech Synthesis fallback function
  const playSound = (word: Word) => {
    if (word.audioUrl) {
      const audio = new Audio(word.audioUrl);
      audio.play().catch(err => {
        console.warn("HTML5 Audio failed, falling back to Web Speech Synthesis:", err);
        speakFallback(word.spelling);
      });
    } else {
      speakFallback(word.spelling);
    }
  };

  const speakFallback = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSpelling.trim()) return;

    setIsAdding(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const success = await onAddWord(newSpelling);
      if (success) {
        setSuccessMsg(`成功录入单词 "${newSpelling.trim().toLowerCase()}"！系统已智能匹配音标、翻译与记忆联想。`);
        setNewSpelling("");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg("录入失败：该单词可能已在词库中，或无法联网获取解析。");
      }
    } catch (err) {
      setErrorMsg("发生意外错误。");
    } finally {
      setIsAdding(false);
    }
  };

  // Helper to parse text into clean English word/phrase strings
  const parseWords = (text: string): string[] => {
    return text
      .split(/[\n,;，；\s]+/)
      .map(w => w.replace(/[^a-zA-Z\s-]/g, "").trim()) // clean up punctuation except hyphens/spaces
      .filter(w => w.length > 0);
  };

  const readAndSetFile = (file: File) => {
    if (file.type !== "text/plain" && !file.name.endsWith(".txt")) {
      setImportError("只支持导入 .txt 文本文件");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setBatchText(text);
        setImportError("");
        setImportResult(null);
      }
    };
    reader.onerror = () => {
      setImportError("读取文件失败");
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readAndSetFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readAndSetFile(file);
    }
  };

  const handleBatchImportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseWords(batchText);
    if (parsed.length === 0) {
      setImportError("没有识别到任何有效的英文单词，请检查输入或TXT内容。");
      return;
    }

    setIsImporting(true);
    setImportError("");
    setImportResult(null);

    try {
      if (onImportWords) {
        const result = await onImportWords(parsed);
        setImportResult(result);
        if (result.successCount > 0) {
          setBatchText(""); // Clear on success
        }
      } else {
        setImportError("导入接口不可用");
      }
    } catch (err: any) {
      setImportError(err.message || "导入过程中发生错误。");
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenDetails = (word: Word) => {
    setSelectedWord(word);
    setIsEditing(false);
    setEditDefinition(word.definition || "");
    setEditPhonetic(word.phonetic || "");
    setEditExample(word.example || "");
    setEditExampleTrans(word.exampleTranslation || "");
    setEditMnemonic(word.mnemonic || "");
    setRegenError("");
    setRegenSuccess("");
  };

  const handleRegenerate = async () => {
    if (!selectedWord) return;
    setIsRegenerating(true);
    setRegenError("");
    setRegenSuccess("");
    try {
      const updatedWord = await onRegenerateWord(selectedWord.id);
      setSelectedWord(updatedWord);
      
      // Update form state fields
      setEditDefinition(updatedWord.definition || "");
      setEditPhonetic(updatedWord.phonetic || "");
      setEditExample(updatedWord.example || "");
      setEditExampleTrans(updatedWord.exampleTranslation || "");
      setEditMnemonic(updatedWord.mnemonic || "");
      
      setRegenSuccess("AI 智能润色成功！已重构并升级释义、例句与记忆窍门 ✨");
      // Clear success notification after some time
      setTimeout(() => setRegenSuccess(""), 5000);
    } catch (err: any) {
      console.error(err);
      setRegenError(err.message || "AI 重新润色失败，请稍后重试。");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedWord) return;

    const updated = {
      definition: editDefinition,
      phonetic: editPhonetic,
      example: editExample,
      exampleTranslation: editExampleTrans,
      mnemonic: editMnemonic,
    };

    onUpdateWord(selectedWord.id, updated);
    
    // Update active modal view with newly edited values
    setSelectedWord({
      ...selectedWord,
      ...updated
    });
    setIsEditing(false);
  };

  // Filtering, sorting and paging logic
  const filteredWords = words.filter(w => {
    const matchesSearch = 
      w.spelling.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.example && w.example.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.mnemonic && w.mnemonic.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (filterMode === "due") {
      return new Date(w.nextReviewAt).getTime() <= Date.now() && w.reviewStage < 6;
    }
    if (filterMode === "mastered") {
      return w.reviewStage >= 5 || w.consecutiveCorrect >= 3;
    }
    if (filterMode === "learning") {
      // Stage is between 1 and 4, not yet mastered
      return w.reviewStage > 0 && w.reviewStage < 5 && w.consecutiveCorrect < 3;
    }
    return true;
  }).filter(w => {
    if (stageFilter !== "all") {
      return w.reviewStage === parseInt(stageFilter, 10);
    }
    return true;
  });

  const sortedWords = [...filteredWords].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    if (sortBy === "nextReviewAsc") {
      return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime();
    }
    if (sortBy === "nextReviewDesc") {
      return new Date(b.nextReviewAt).getTime() - new Date(a.nextReviewAt).getTime();
    }
    if (sortBy === "spellingAsc") {
      return a.spelling.localeCompare(b.spelling);
    }
    if (sortBy === "spellingDesc") {
      return b.spelling.localeCompare(a.spelling);
    }
    if (sortBy === "stageAsc") {
      return a.reviewStage - b.reviewStage;
    }
    if (sortBy === "stageDesc") {
      return b.reviewStage - a.reviewStage;
    }
    return 0;
  });

  // Pagination calculation
  const totalItems = sortedWords.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const paginatedWords = sortedWords.slice((activePage - 1) * pageSize, activePage * pageSize);

  const getStageColor = (stage: number) => {
    if (stage >= 5) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (stage >= 3) return "bg-indigo-50 text-indigo-700 border-indigo-100";
    return "bg-slate-50 text-slate-600 border-slate-100";
  };

  const getNextReviewTimeDisplay = (word: Word) => {
    if (word.reviewStage >= 6) return "已完全掌握";
    const dueTime = new Date(word.nextReviewAt).getTime();
    const nowTime = Date.now();
    const diffHours = (dueTime - nowTime) / (1000 * 60 * 60);

    if (diffHours <= 0) {
      return "待复习 (已到期)";
    } else if (diffHours < 24) {
      return `约 ${Math.round(diffHours)} 小时后复习`;
    } else {
      return `${Math.round(diffHours / 24)} 天后复习`;
    }
  };

  // Statistics and Stage Distribution calculations
  const totalCount = words.length;
  const dueCount = words.filter(w => new Date(w.nextReviewAt).getTime() <= Date.now() && w.reviewStage < 6).length;
  const learningCount = words.filter(w => w.reviewStage > 0 && w.reviewStage < 5 && w.consecutiveCorrect < 3).length;
  const masteredCount = words.filter(w => w.reviewStage >= 5 || w.consecutiveCorrect >= 3).length;
  
  const stageCounts = Array.from({ length: 7 }, (_, stageNum) => {
    const count = words.filter(w => w.reviewStage === stageNum).length;
    const labels = [
      "阶段0 (新词)",
      "阶段1 (20m)",
      "阶段2 (1h)",
      "阶段3 (12h)",
      "阶段4 (1d)",
      "阶段5 (2d)",
      "阶段6 (掌握)"
    ];
    return {
      name: labels[stageNum] || `阶段 ${stageNum}`,
      stage: stageNum,
      count: count,
    };
  });

  const stageColors = [
    "#64748b", // slate-500
    "#38bdf8", // sky-400
    "#06b6d4", // cyan-500
    "#a78bfa", // violet-400
    "#6366f1", // indigo-500
    "#10b981", // emerald-500
    "#0d9488"  // teal-600
  ];

  const masteryRate = totalCount ? Math.round((masteredCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Visual Learning Statistics Dashboard */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg">记忆曲线与词库分布</h3>
              <p className="text-xs text-slate-400 mt-0.5">实时跟踪您的艾宾浩斯记忆阶段与词汇掌握情况</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">综合掌握率</span>
              <span className="text-sm font-bold text-emerald-600 font-mono">{masteryRate}%</span>
            </div>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${masteryRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Metrics Panel */}
          <div className="grid grid-cols-2 lg:grid-cols-1 lg:col-span-3 gap-3">
            <div className="p-4 bg-slate-50/50 border border-slate-100/80 rounded-2xl hover:bg-slate-50 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-400">词库总量</span>
                <span className="text-[10px] bg-slate-200/50 text-slate-600 font-bold px-2 py-0.5 rounded-full font-mono">Total</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-1 font-mono">{totalCount}</p>
            </div>

            <div className="p-4 bg-rose-50/40 border border-rose-100/50 rounded-2xl hover:bg-rose-50/60 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-rose-500">到期复习</span>
                <span className="text-[10px] bg-rose-100/50 text-rose-600 font-bold px-2 py-0.5 rounded-full font-mono">Due</span>
              </div>
              <p className="text-2xl font-bold text-rose-600 mt-1 font-mono">{dueCount}</p>
            </div>

            <div className="p-4 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl hover:bg-indigo-50/60 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-indigo-500">复习中</span>
                <span className="text-[10px] bg-indigo-100/50 text-indigo-600 font-bold px-2 py-0.5 rounded-full font-mono">Active</span>
              </div>
              <p className="text-2xl font-bold text-indigo-600 mt-1 font-mono">{learningCount}</p>
            </div>

            <div className="p-4 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl hover:bg-emerald-50/60 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-emerald-600">完全掌握</span>
                <span className="text-[10px] bg-emerald-100/50 text-emerald-600 font-bold px-2 py-0.5 rounded-full font-mono">Mastered</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{masteredCount}</p>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="lg:col-span-9">
            {totalCount === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center border border-dashed border-slate-200 bg-slate-50/30 rounded-2xl p-6 text-center">
                <BookOpen className="w-8 h-8 text-slate-300 mb-2.5 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-500">暂无单词数据</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                  在下方录入首个单词，系统将自动开始计算艾宾浩斯复习周期并在此生成阶段分布图
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageCounts} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #f1f5f9",
                          borderRadius: "16px",
                          fontSize: "12px",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
                          padding: "10px 14px",
                        }}
                        labelStyle={{ fontWeight: "bold", color: "#1e293b", marginBottom: "4px" }}
                        cursor={{ fill: "#f8fafc", radius: 8 }}
                        formatter={(value: any) => [`${value} 个单词`, "当前数量"]}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                        {stageCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={stageColors[index % stageColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom Color Legend Footnotes */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center pt-2 border-t border-slate-50">
                  {stageCounts.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <span 
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                        style={{ backgroundColor: stageColors[idx] }}
                      ></span>
                      <span>{s.name} ({s.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Add New Word Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form: Add Word */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-5 h-fit">
          {/* Tabs for Add Mode */}
          <div className="flex border-b border-slate-100 mb-5">
            <button
              onClick={() => {
                setAddMode("single");
                setImportResult(null);
                setImportError("");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                addMode === "single"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>单个录入</span>
            </button>
            <button
              onClick={() => {
                setAddMode("batch");
                setImportResult(null);
                setImportError("");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                addMode === "batch"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>批量导入</span>
            </button>
          </div>

          {addMode === "single" ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-display font-bold text-slate-900 text-lg">录入新单词</h3>
              </div>
              
              <p className="text-xs text-slate-400 font-light leading-relaxed mb-2">
                输入任何英文单词或词组。系统将自动向<b>词典接口</b>发送解析请求。如果检测到 AI 密钥，还会智能补充<b>音标、中文释释、语境例句以及艾宾浩斯记忆联想</b>！
              </p>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">英文单词</label>
                  <div className="flex gap-2">
                    <input
                      id="input-add-spelling"
                      type="text"
                      placeholder="例如: ephemeral"
                      value={newSpelling}
                      onChange={(e) => setNewSpelling(e.target.value)}
                      disabled={isAdding}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm placeholder:text-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                    />
                    <button
                      id="btn-add-word-submit"
                      type="submit"
                      disabled={isAdding}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center disabled:bg-slate-300 disabled:shadow-none min-w-[70px]"
                    >
                      {isAdding ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        "录入"
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 leading-relaxed">
                    {errorMsg}
                  </div>
                )}

                {/* Success Message */}
                {successMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <Upload className="w-5 h-5 text-indigo-600" />
                <h3 className="font-display font-bold text-slate-900 text-lg">批量导入单词</h3>
              </div>
              
              <p className="text-xs text-slate-400 font-light leading-relaxed mb-2">
                可以在文本框直接粘贴多个英文单词（逗号或空格隔开，亦可一行一个），或直接拖入 <b>.txt 文本文件</b> 自动解析读取！
              </p>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50/40"
                    : "border-slate-200 hover:border-indigo-200 bg-slate-50/40 hover:bg-slate-50/80"
                }`}
                onClick={() => document.getElementById("file-import-input")?.click()}
              >
                <input
                  id="file-import-input"
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-600 block">点击或将 TXT 文件拖拽至此导入</span>
                <span className="text-[10px] text-slate-400 font-light block mt-1">支持纯文本文件 / 自动清洗提取</span>
              </div>

              {/* Textarea for previewing / copy-pasting */}
              <form onSubmit={handleBatchImportSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      编辑或粘贴单词文本
                    </label>
                    {batchText.trim() && (
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-mono">
                        已识别 {parseWords(batchText).length} 个
                      </span>
                    )}
                  </div>
                  <textarea
                    placeholder="例：&#10;ephemeral&#10;lucid, serendipity&#10;conspicuous"
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    disabled={isImporting}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isImporting || !batchText.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none text-white font-semibold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isImporting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>正在智能解析与导入词库... (单次最多30词)</span>
                    </>
                  ) : (
                    <>
                      <span>确认并开始导入</span>
                    </>
                  )}
                </button>
              </form>

              {/* Import status block */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 flex items-start gap-1.5 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{importError}</span>
                </div>
              )}

              {importResult && (
                <div className="space-y-2 animate-fade-in text-left">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 flex items-start gap-1.5 leading-relaxed">
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                    <div>
                      <p className="font-semibold">成功导入 {importResult.successCount} 个单词！</p>
                      {importResult.addedWords.length > 0 && (
                        <p className="text-[10px] text-emerald-600 mt-1 font-mono break-all leading-relaxed">
                          已添加：{importResult.addedWords.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {importResult.errors.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex items-start gap-1.5 leading-relaxed">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                      <div>
                        <p className="font-semibold">跳过或失败 {importResult.errors.length} 个单词：</p>
                        <ul className="text-[10px] text-amber-600 list-disc list-inside mt-1 font-mono space-y-0.5">
                          {importResult.errors.slice(0, 4).map((e, idx) => (
                            <li key={idx} className="truncate max-w-[260px]">
                              {e.spelling}: {e.error}
                            </li>
                          ))}
                          {importResult.errors.length > 4 && (
                            <li>以及其余 {importResult.errors.length - 4} 个单词...</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick learning card banner */}
          <div className="mt-5 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/30 flex gap-3 items-start">
            <BookOpen className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-slate-800">首个周期即刻生成</h4>
              <p className="text-[11px] text-slate-500 font-light mt-0.5 leading-relaxed">
                新词录入后，系统默认置于“阶段 0”，预设下次复习在 24 小时后。今天您可以安心录入，明天他们就会精准按时出现在您的“复习列表”中！
              </p>
            </div>
          </div>
        </div>

        {/* Right Library: Vocabulary List */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-7">
          {/* Top Info & Basic Filters */}
          <div className="flex flex-col gap-4 mb-5 pb-5 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-lg">我的艾宾词库</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  累计词库: <span className="font-semibold text-indigo-600 font-mono">{words.length}</span> 个
                  {filteredWords.length !== words.length && (
                    <>
                      {" | "}过滤结果: <span className="font-semibold text-amber-600 font-mono">{filteredWords.length}</span> 个
                    </>
                  )}
                </p>
              </div>

              {/* Memory State Filter Tab Row */}
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100/80 shrink-0 self-start lg:self-auto overflow-x-auto max-w-full">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filterMode === "all" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  全部 ({words.length})
                </button>
                <button
                  id="btn-filter-due"
                  onClick={() => setFilterMode("due")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filterMode === "due" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  待复习 ({words.filter(w => new Date(w.nextReviewAt).getTime() <= Date.now() && w.reviewStage < 6).length})
                </button>
                <button
                  onClick={() => setFilterMode("learning")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filterMode === "learning" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  复习中 ({words.filter(w => w.reviewStage > 0 && w.reviewStage < 5 && w.consecutiveCorrect < 3).length})
                </button>
                <button
                  onClick={() => setFilterMode("mastered")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filterMode === "mastered" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  已掌握 ({words.filter(w => w.reviewStage >= 5 || w.consecutiveCorrect >= 3).length})
                </button>
              </div>
            </div>

            {/* Sub Filters & Sorters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
              {/* Stage filter dropdown */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  过滤记忆阶段
                </label>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value="all">🔍 全部阶段</option>
                  <option value="0">阶段 0 (新生词/未开始)</option>
                  <option value="1">阶段 1 (复习1次 / 20分后)</option>
                  <option value="2">阶段 2 (复习2次 / 1时后)</option>
                  <option value="3">阶段 3 (复习3次 / 12时后)</option>
                  <option value="4">阶段 4 (复习4次 / 1天后)</option>
                  <option value="5">阶段 5 (复习5次 / 2天后)</option>
                  <option value="6">阶段 6 (完全掌握)</option>
                </select>
              </div>

              {/* Sort By selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  词库排列顺序
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value="newest">🕒 录入时间: 从新到旧</option>
                  <option value="oldest">🕒 录入时间: 从旧到新</option>
                  <option value="nextReviewAsc">⏳ 复习时间: 待复习优先</option>
                  <option value="nextReviewDesc">⏳ 复习时间: 晚复习优先</option>
                  <option value="spellingAsc">🔤 字母排序: A 至 Z</option>
                  <option value="spellingDesc">🔤 字母排序: Z 至 A</option>
                  <option value="stageAsc">📈 记忆阶段: 从低到高</option>
                  <option value="stageDesc">📉 记忆阶段: 从高到低</option>
                </select>
              </div>

              {/* Items Per Page */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  每页显示词数
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value={10}>📄 10 个 / 页</option>
                  <option value={15}>📄 15 个 / 页</option>
                  <option value={20}>📄 20 个 / 页</option>
                  <option value={30}>📄 30 个 / 页</option>
                  <option value={50}>📄 50 个 / 页</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="搜索拼写、中文释义、例句或助记窍门..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm placeholder:text-slate-400 text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 p-0.5 rounded-full text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-all cursor-pointer"
                title="清除搜索"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Table / Cards List */}
          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredWords.length > 0 ? (
              paginatedWords.map((word) => {
                const isMastered = word.reviewStage >= 5 || word.consecutiveCorrect >= 3;
                const isDue = new Date(word.nextReviewAt).getTime() <= Date.now() && word.reviewStage < 6;

                return (
                  <div
                    key={word.id}
                    onClick={() => handleOpenDetails(word)}
                    className="flex justify-between items-center p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow transition-all cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {word.spelling}
                        </span>
                        
                        <span className="text-xs text-slate-400 font-mono">
                          {word.phonetic}
                        </span>

                        {isMastered && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                            已掌握
                          </span>
                        )}
                        {isDue && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full animate-pulse">
                            今日待复习
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-500 line-clamp-1 max-w-sm sm:max-w-md">
                        {word.definition}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-0.5 border text-[10px] font-bold rounded-full ${getStageColor(word.reviewStage)}`}>
                          阶段 {word.reviewStage}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          {getNextReviewTimeDisplay(word)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-400">词库内没有找到匹配词汇</p>
                <p className="text-xs text-slate-400 mt-1">请尝试更换筛选条件、搜索关键词或录入新词</p>
              </div>
            )}
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 mt-4 border-t border-slate-100 gap-3">
              <span className="text-xs text-slate-400 font-medium">
                显示第 <span className="font-semibold text-slate-700 font-mono">{(activePage - 1) * pageSize + 1}</span> 到{" "}
                <span className="font-semibold text-slate-700 font-mono">
                  {Math.min(activePage * pageSize, totalItems)}
                </span>{" "}
                个，共 <span className="font-semibold text-indigo-600 font-mono">{totalItems}</span> 个词汇
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={activePage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent disabled:border-slate-100 disabled:text-slate-300 transition-all cursor-pointer"
                  title="上一页"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers with elegant ellipsis */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - activePage) <= 1
                      );
                    })
                    .map((page, idx, array) => {
                      const prevPage = array[idx - 1];
                      const showEllipsisBefore = prevPage && page - prevPage > 1;

                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsisBefore && (
                            <span className="text-xs text-slate-300 px-1 select-none font-mono">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                              activePage === page
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent hover:border-slate-200/80"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={activePage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent disabled:border-slate-100 disabled:text-slate-300 transition-all cursor-pointer"
                  title="下一页"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Word Detail Modal Overlay */}
      {selectedWord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-100 flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="font-display font-extrabold text-2xl text-slate-900 leading-none">
                    {selectedWord.spelling}
                  </h2>
                  <button
                    onClick={() => playSound(selectedWord)}
                    title="播放发音"
                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-sm text-slate-400 font-mono">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editPhonetic}
                      onChange={(e) => setEditPhonetic(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-600"
                    />
                  ) : (
                    selectedWord.phonetic || "/-/"
                  )}
                </p>
              </div>

              <button
                onClick={() => setSelectedWord(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* AI Regen Success/Error indicators */}
              {regenSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 animate-bounce">
                  <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{regenSuccess}</span>
                </div>
              )}
              {regenError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-2">
                  <span className="shrink-0 text-rose-500 font-bold">⚠️</span>
                  <span>{regenError}</span>
                </div>
              )}

              {/* Definition */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">中文释义</label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={editDefinition}
                    onChange={(e) => setEditDefinition(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:bg-white"
                  />
                ) : (
                  <p className="text-base text-slate-800 font-medium">
                    {selectedWord.definition}
                  </p>
                )}
              </div>

              {/* Example sentence */}
              <div className="space-y-1.5 border-t border-slate-50 pt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">双语例句</label>
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      placeholder="英文例句"
                      value={editExample}
                      onChange={(e) => setEditExample(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:outline-none focus:bg-white"
                    />
                    <textarea
                      rows={2}
                      placeholder="例句中文翻译"
                      value={editExampleTrans}
                      onChange={(e) => setEditExampleTrans(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:bg-white"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                    <p className="text-sm font-serif italic text-slate-800 leading-relaxed">
                      "{selectedWord.example}"
                    </p>
                    <p className="text-xs text-slate-500 font-light pl-2 border-l border-indigo-200">
                      {selectedWord.exampleTranslation}
                    </p>
                  </div>
                )}
              </div>

              {/* Mnemonic helper */}
              <div className="space-y-1.5 border-t border-slate-50 pt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  艾宾记忆联想 / 助记窍门
                </label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={editMnemonic}
                    onChange={(e) => setEditMnemonic(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:bg-white"
                  />
                ) : (
                  <p className="text-xs text-slate-600 bg-amber-50/30 border border-amber-100/50 p-4 rounded-2xl leading-relaxed">
                    {selectedWord.mnemonic || "暂无智能助记方案。输入联想来加强脑部皮层和词根的神经关联吧！"}
                  </p>
                )}
              </div>

              {/* Ebbinghaus Parameters Details */}
              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">复习阶段</span>
                  <span className="text-sm font-semibold text-slate-700 font-mono">阶段 {selectedWord.reviewStage}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">连胜纪录</span>
                  <span className="text-sm font-semibold text-slate-700 font-mono">{selectedWord.consecutiveCorrect} / 3</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">上期基准</span>
                  <span className="text-sm font-semibold text-slate-700 font-mono">
                    {new Date(selectedWord.lastResetAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">下期预排</span>
                  <span className="text-sm font-semibold text-slate-700 font-mono">
                    {new Date(selectedWord.nextReviewAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                  </span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between shrink-0">
              <button
                onClick={() => {
                  if (confirm(`⚠️ 确定要从词库中删除单词 "${selectedWord.spelling}" 吗？这会抹除其历史学习记录！`)) {
                    onDeleteWord(selectedWord.id);
                    setSelectedWord(null);
                  }
                }}
                className="px-4 py-2 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除单词
              </button>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      保存编辑
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                      {isRegenerating ? "AI正在生成..." : "AI 智能重新润色"}
                    </button>
                    
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      修改释义/例句
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
