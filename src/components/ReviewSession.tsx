import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  HelpCircle, 
  RotateCcw, 
  BookOpen, 
  Award, 
  Sparkles, 
  ChevronLeft,
  ChevronRight, 
  GraduationCap, 
  FileText, 
  Compass,
  AlertCircle
} from "lucide-react";
import { getTranslation } from "../lib/translations";
import { usePronunciation } from "../lib/usePronunciation";
import { markIncorrect, markCorrect } from "../lib/reviewQueue";

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

interface ReviewSessionProps {
  dueWords: Word[];
  onSubmitReview: (results: { wordId: string; firstTryCorrect: boolean }[]) => void;
  onClose: () => void;
  selectedLanguage: string;
  useTargetUi: boolean;
}

export default function ReviewSession({
  dueWords,
  onSubmitReview,
  onClose,
  selectedLanguage,
  useTargetUi,
}: ReviewSessionProps) {
  const t = getTranslation(selectedLanguage, useTargetUi);

  // Config states
  const [reviewMode, setReviewMode] = useState<"flashcard" | "spelling">("flashcard");
  const [isSessionStarted, setIsSessionStarted] = useState(false);

  // Queue states
  const [activeQueue, setActiveQueue] = useState<Word[]>([]);
  const [incorrectQueue, setIncorrectQueue] = useState<Word[]>([]);
  // ref 同步追踪 incorrectQueue 最新值，解决 setState 异步导致 handleAdvance 读取旧闭包的 bug
  const incorrectQueueRef = useRef<Word[]>([]);
  const [firstTryFailures, setFirstTryFailures] = useState<Set<string>>(new Set());
  const [alreadyReviewedIds, setAlreadyReviewedIds] = useState<Set<string>>(new Set());

  // Navigation index inside active round
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  // Card interaction states
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isSpellingSubmitted, setIsSpellingSubmitted] = useState(false);
  const [isSpellingCorrect, setIsSpellingCorrect] = useState(false);

  const spellingInputRef = useRef<HTMLInputElement>(null);

  // Initialize Session
  const handleStartSession = () => {
    if (dueWords.length === 0) return;
    setActiveQueue([...dueWords]);
    setIncorrectQueue([]);
    incorrectQueueRef.current = [];
    setFirstTryFailures(new Set());
    setAlreadyReviewedIds(new Set());
    setCurrentIndex(0);
    setRoundNumber(1);
    setIsSessionStarted(true);
    setIsSessionFinished(false);
    setIsAnswerRevealed(false);
    setTypedAnswer("");
    setIsSpellingSubmitted(false);
  };

  const currentWord = activeQueue[currentIndex];

  // 包一层 setter：先同步更新 ref（基于当前 ref 值算 next），再 enqueue state
  // —— 关键：ref 必须在调用瞬间更新，不能放在 setIncorrectQueue 的 updater 内部
  //    （React 18+ 批处理会推迟 updater 执行，handleAdvance 读到的仍是旧值）
  const updateIncorrectQueue = (updater: (prev: Word[]) => Word[]) => {
    const next = updater(incorrectQueueRef.current);
    incorrectQueueRef.current = next;
    setIncorrectQueue(next);
  };

  // Auto focus input in spelling mode
  useEffect(() => {
    if (isSessionStarted && reviewMode === "spelling" && currentWord && !isSpellingSubmitted) {
      setTimeout(() => {
        spellingInputRef.current?.focus();
      }, 100);
    }
  }, [isSessionStarted, reviewMode, currentIndex, roundNumber, isSpellingSubmitted]);

  // 发音：800ms 内同一单词的连续点击视为一次（避免快速连点重复发音）
  const { play: playSound } = usePronunciation(selectedLanguage);

  // Play audio automatically when a card appears (excellent user experience)
  useEffect(() => {
    if (isSessionStarted && currentWord && !isSessionFinished) {
      if (reviewMode === "flashcard") {
        playSound(currentWord.spelling, { audioUrl: currentWord.audioUrl });
      }
    }
  }, [currentIndex, roundNumber, isSessionStarted]);

  // FLASHCARD: Submit decision
  const handleFlashcardDecision = (remembered: boolean) => {
    const wordId = currentWord.id;

    if (!remembered) {
      // 首次作答错误：记入 firstTryFailures
      if (!alreadyReviewedIds.has(wordId)) {
        setFirstTryFailures(prev => {
          const next = new Set(prev);
          next.add(wordId);
          return next;
        });
      }
      // 同一轮内避免重复 push，防止重考队列里出现重复词
      updateIncorrectQueue(prev => markIncorrect(prev, currentWord));
    } else {
      // 答对时若该词在本轮已被标错，从 incorrectQueue 移除（可能上一轮答错、本轮答对）
      updateIncorrectQueue(prev => markCorrect(prev, wordId));
    }

    setAlreadyReviewedIds(prev => {
      const next = new Set(prev);
      next.add(wordId);
      return next;
    });

    handleAdvance();
  };

  // SPELLING: Submit typed answer
  const handleSpellingSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!typedAnswer.trim() || isSpellingSubmitted) return;

    const correctSpelling = currentWord.spelling.trim().toLowerCase();
    const userSpelling = typedAnswer.trim().toLowerCase();
    const isCorrect = userSpelling === correctSpelling;

    setIsSpellingCorrect(isCorrect);
    setIsSpellingSubmitted(true);
    setIsAnswerRevealed(true);
    playSound(currentWord.spelling, { audioUrl: currentWord.audioUrl });

    const wordId = currentWord.id;

    if (!isCorrect) {
      if (!alreadyReviewedIds.has(wordId)) {
        setFirstTryFailures(prev => {
          const next = new Set(prev);
          next.add(wordId);
          return next;
        });
      }
      // 同一轮内避免重复 push，防止重考队列里出现重复词
      updateIncorrectQueue(prev => markIncorrect(prev, currentWord));
    } else {
      // 答对时若该词在本轮已被标错，从 incorrectQueue 移除（可能上一轮答错、本轮答对）
      updateIncorrectQueue(prev => markCorrect(prev, wordId));
    }

    setAlreadyReviewedIds(prev => {
      const next = new Set(prev);
      next.add(wordId);
      return next;
    });
  };

  // Move forward in active round
  const handleAdvance = () => {
    setIsAnswerRevealed(false);
    setTypedAnswer("");
    setIsSpellingSubmitted(false);

    if (currentIndex < activeQueue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 本轮走完：读取 ref（同步值），决定是开新一轮还是会话结束
      const currentIncorrect = incorrectQueueRef.current;
      if (currentIncorrect.length > 0) {
        // 用错词队列作为新一轮的 activeQueue
        setActiveQueue([...currentIncorrect]);
        updateIncorrectQueue(() => []);
        setCurrentIndex(0);
        setRoundNumber(roundNumber + 1);
      } else {
        // 所有词都答对，会话结束
        setIsSessionFinished(true);
      }
    }
  };

  // Submit session results to backend
  const handleFinishAndSubmit = () => {
    const submitPayload = dueWords.map(word => {
      const isFailed = firstTryFailures.has(word.id);
      return {
        wordId: word.id,
        firstTryCorrect: !isFailed
      };
    });

    onSubmitReview(submitPayload);
  };

  // Generates masked word placeholder for spelling mode helper, e.g. "c_______"
  const getMaskedSpelling = (spelling: string) => {
    if (!spelling) return "";
    return spelling[0] + "_".repeat(spelling.length - 1);
  };

  // Stats calculation for the summary page
  const totalDueCount = dueWords.length;
  const firstTryCorrectCount = totalDueCount - firstTryFailures.size;
  const firstTryCorrectPercentage = Math.round((firstTryCorrectCount / totalDueCount) * 100);

  return (
    <div className="bg-slate-50 min-h-[500px] rounded-3xl p-6 sm:p-8 border border-slate-100 flex flex-col justify-between relative overflow-hidden shadow-inner">
      
      {/* Background decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* 1. START PANEL (Configuration) */}
      {!isSessionStarted && (
        <div className="max-w-md mx-auto text-center py-10 space-y-6 relative z-10 my-auto animate-fade-in">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <BookOpen className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              {t.studyModeSelection}
            </h2>
            <p className="text-sm text-slate-500 font-light">
              {t.readyForReinforcement.replace("{count}", String(dueWords.length))}
            </p>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-4">
            {/* Mode A: Flashcard */}
            <button
              onClick={() => setReviewMode("flashcard")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                reviewMode === "flashcard"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <FileText className={`w-5 h-5 mb-2 ${reviewMode === "flashcard" ? "text-indigo-200" : "text-slate-400"}`} />
              <p className="text-xs font-bold uppercase tracking-wide">
                {t.flashcardMode}
              </p>
              <p className={`text-[10px] mt-1 font-light leading-relaxed ${reviewMode === "flashcard" ? "text-indigo-100" : "text-slate-400"}`}>
                {t.flashcardModeDesc}
              </p>
            </button>

            {/* Mode B: Spelling */}
            <button
              id="btn-mode-spelling"
              onClick={() => setReviewMode("spelling")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                reviewMode === "spelling"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Compass className={`w-5 h-5 mb-2 ${reviewMode === "spelling" ? "text-indigo-200" : "text-slate-400"}`} />
              <p className="text-xs font-bold uppercase tracking-wide">
                {t.spellingQuiz}
              </p>
              <p className={`text-[10px] mt-1 font-light leading-relaxed ${reviewMode === "spelling" ? "text-indigo-100" : "text-slate-400"}`}>
                {t.spellingQuizDesc}
              </p>
            </button>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              id="btn-start-review-session"
              onClick={handleStartSession}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer w-full"
            >
              {t.launchSession}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              {t.back}
            </button>
          </div>
        </div>
      )}

      {/* 2. CARD REVIEW INTERACTION */}
      {isSessionStarted && !isSessionFinished && currentWord && (
        <div className="flex-1 flex flex-col justify-between relative z-10 animate-fade-in">
          
          {/* Header Indicators */}
          <div className="flex justify-between items-center shrink-0 border-b border-slate-100/50 pb-4 mb-6">
            <div>
              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/50 uppercase">
                {t.roundNumber.replace("{round}", String(roundNumber))}
              </span>
              {incorrectQueue.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100/50 ml-2">
                  {t.recycledCount.replace("{count}", String(incorrectQueue.length))}
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-600 font-mono">
                {currentIndex + 1} / {activeQueue.length}
              </span>
              <span className="text-[10px] text-slate-400 block font-light">
                {t.roundProgress}
              </span>
            </div>
          </div>

          {/* Core Interactive Card Container */}
          <div className="flex-1 flex flex-col justify-start pt-4 sm:pt-6 max-w-3xl mx-auto w-full pb-4">
            <div className="flex items-center gap-4 w-full">
              
              {/* Previous Button (Desktop) */}
              {reviewMode === "flashcard" && (
                <button
                  onClick={() => {
                    if (currentIndex > 0) {
                      setCurrentIndex(currentIndex - 1);
                      setIsAnswerRevealed(false);
                    }
                  }}
                  disabled={currentIndex === 0}
                  className="hidden md:flex w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-white text-slate-600 items-center justify-center transition-all shadow-sm shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  title={t.prevWord}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Card Container */}
              <div 
                onClick={(e) => {
                  if (reviewMode === "flashcard") {
                    if (
                      (e.target as HTMLElement).closest('button') || 
                      (e.target as HTMLElement).closest('input') || 
                      (e.target as HTMLElement).closest('a')
                    ) {
                      return;
                    }
                    setIsAnswerRevealed(!isAnswerRevealed);
                  }
                }}
                className={`flex-1 bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm hover:shadow transition-all space-y-6 min-h-[340px] flex flex-col justify-between select-none relative group ${
                  reviewMode === "flashcard" ? "cursor-pointer hover:border-indigo-100" : ""
                }`}
              >
                {reviewMode === "flashcard" && (
                  <div className="absolute top-3 right-4 text-[10px] text-slate-400 font-light pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.clickToToggle}
                  </div>
                )}
                
                {/* Question Zone */}
                <div className="space-y-4 text-center pt-2 pb-1 flex-1 flex flex-col justify-start">
                  {/* 1. Flashcard Mode Display */}
                  {reviewMode === "flashcard" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <h3 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
                          {currentWord.spelling}
                        </h3>
                        <button
                          onClick={() => playSound(currentWord.spelling, { audioUrl: currentWord.audioUrl })}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-sm font-mono text-slate-400 font-semibold">{currentWord.phonetic || "/-/"}</p>
                      
                      {!isAnswerRevealed ? (
                        <div className="pt-6">
                          <button
                            id="btn-reveal-answer"
                            onClick={() => setIsAnswerRevealed(true)}
                            className="px-6 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all uppercase cursor-pointer"
                          >
                            {t.revealTranslation}
                          </button>
                          <p className="text-[10px] text-slate-400 font-light mt-3">
                            {t.orClickAnywhere}
                          </p>
                        </div>
                      ) : (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="pt-4 space-y-4 border-t border-slate-50 text-left animate-fade-in"
                        >
                          <div>
                            <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide block">
                              {t.definitionLabel}
                            </label>
                            <p className="text-base font-semibold text-slate-800">{currentWord.definition}</p>
                          </div>

                          {currentWord.example && (
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                                {t.contextExample}
                              </label>
                              <p className="text-xs font-serif italic text-slate-700">"{currentWord.example}"</p>
                              <p className="text-[11px] text-slate-500 mt-1">{currentWord.exampleTranslation}</p>
                            </div>
                          )}

                          {currentWord.mnemonic && (
                            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/30">
                              <label className="text-[10px] font-bold text-amber-600 uppercase tracking-wide block">
                                {t.ebbinghausMnemonic}
                              </label>
                              <p className="text-xs text-amber-800 mt-1 font-light leading-relaxed">{currentWord.mnemonic}</p>
                            </div>
                          )}
                          
                          <p className="text-[10px] text-slate-400 font-light text-center pt-1 block">
                            {t.clickAgainToFold}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Spelling Mode Display */}
                  {reviewMode === "spelling" && (
                    <div className="space-y-4 text-left animate-fade-in">
                      {/* Header hints */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {t.phoneticHint}
                            </span>
                            <span className="text-sm font-mono font-bold text-slate-500">{currentWord.phonetic || "/-/"}</span>
                          </div>
                          <button
                            onClick={() => playSound(currentWord.spelling, { audioUrl: currentWord.audioUrl })}
                            title={t.listenPronunciation}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-base font-bold text-slate-800">{currentWord.definition}</p>
                      </div>

                      {/* Masked sentence context */}
                      {currentWord.example && (
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {t.fillBlanks}
                          </span>
                          <p className="text-xs font-serif text-slate-800 leading-relaxed italic">
                            "{(() => {
                              // 用 split/join 替代 \b 正则，支持 Unicode（日语/中文等）
                              const ex = currentWord.example;
                              const sp = currentWord.spelling;
                              const masked = getMaskedSpelling(sp);
                              // case-insensitive 替换：保留非目标片段的大小写
                              const lower = ex.toLowerCase();
                              const target = sp.toLowerCase();
                              let result = "";
                              let i = 0;
                              while (i < ex.length) {
                                if (lower.substring(i, i + target.length) === target) {
                                  result += masked;
                                  i += target.length;
                                } else {
                                  result += ex[i];
                                  i++;
                                }
                              }
                              return result;
                            })()}"
                          </p>
                          <p className="text-[11px] text-slate-500 font-light pl-2 border-l border-indigo-100">
                            {currentWord.exampleTranslation}
                          </p>
                        </div>
                      )}

                      {/* Input interaction */}
                      <form onSubmit={handleSpellingSubmit} className="space-y-3 pt-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {t.typeSpelling}
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="input-spelling-answer"
                            ref={spellingInputRef}
                            type="text"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck="false"
                            placeholder={t.spellingPlaceholder.replace("{char}", currentWord.spelling[0])}
                            value={typedAnswer}
                            onChange={(e) => setTypedAnswer(e.target.value)}
                            disabled={isSpellingSubmitted}
                            className={`flex-1 px-4 py-2.5 border rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:bg-white transition-all ${
                              isSpellingSubmitted
                                ? isSpellingCorrect
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                    : "bg-rose-50 border-rose-300 text-rose-800"
                                : "bg-slate-50 border-slate-200 focus:border-indigo-500"
                            }`}
                          />
                          {!isSpellingSubmitted && (
                            <button
                              id="btn-spelling-submit"
                              type="submit"
                              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                            >
                              {t.checkBtn}
                            </button>
                          )}
                        </div>

                        {/* Incorrect message prompt */}
                        {isSpellingSubmitted && !isSpellingCorrect && (
                          <div className="flex gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700 items-start">
                            <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                            <div>
                              <span className="font-semibold block">
                                {t.spellingIncorrect}
                              </span>
                              <span className="font-mono text-sm font-bold block mt-0.5 text-rose-800 select-all">{currentWord.spelling}</span>
                            </div>
                          </div>
                        )}

                        {/* Correct message prompt */}
                        {isSpellingSubmitted && isSpellingCorrect && (
                          <div className="flex gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-700 items-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="font-semibold">{t.spellingCorrect}</span>
                          </div>
                        )}
                      </form>

                      {/* Mnemonic helper on answer revealed */}
                      {isAnswerRevealed && currentWord.mnemonic && (
                        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/30 text-xs text-amber-800 animate-fade-in">
                          <span className="font-semibold block">{t.ebbinghausMnemonic}</span>
                          <p className="mt-0.5 font-light leading-relaxed">{currentWord.mnemonic}</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Action Decision buttons */}
                <div className="border-t border-slate-50 pt-4 shrink-0">
                  {/* A: Flashcard action bar */}
                  {reviewMode === "flashcard" && isAnswerRevealed && (
                    <div className="flex gap-3.5">
                      <button
                        id="btn-flashcard-correct"
                        onClick={() => handleFlashcardDecision(true)}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {t.rememberedBtn}
                      </button>
                      <button
                        id="btn-flashcard-incorrect"
                        onClick={() => handleFlashcardDecision(false)}
                        className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-semibold rounded-xl text-sm transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        {t.forgotBtn}
                      </button>
                    </div>
                  )}

                  {/* B: Spelling action bar */}
                  {reviewMode === "spelling" && isSpellingSubmitted && (
                    <button
                      id="btn-spelling-next"
                      onClick={handleAdvance}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{t.nextBtn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>

              {/* Next Button (Desktop) */}
              {reviewMode === "flashcard" && (
                <button
                  onClick={() => {
                    if (currentIndex < activeQueue.length - 1) {
                      setCurrentIndex(currentIndex + 1);
                      setIsAnswerRevealed(false);
                    }
                  }}
                  disabled={currentIndex === activeQueue.length - 1}
                  className="hidden md:flex w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-white text-slate-600 items-center justify-center transition-all shadow-sm shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  title={t.nextWord}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

            </div>

            {/* Previous / Next Row (Mobile) */}
            {reviewMode === "flashcard" && (
              <div className="flex md:hidden justify-between items-center mt-4 px-2">
                <button
                  onClick={() => {
                    if (currentIndex > 0) {
                      setCurrentIndex(currentIndex - 1);
                      setIsAnswerRevealed(false);
                    }
                  }}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {useTargetUi ? "Prev" : "上一个"}
                </button>
                <button
                  onClick={() => {
                    if (currentIndex < activeQueue.length - 1) {
                      setCurrentIndex(currentIndex + 1);
                      setIsAnswerRevealed(false);
                    }
                  }}
                  disabled={currentIndex === activeQueue.length - 1}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {useTargetUi ? "Next" : "下一个"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Progress Bottom Bar */}
          <div className="mt-4 shrink-0">
            <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${((currentIndex) / activeQueue.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-light mt-1.5">
              <span>{t.reviewedWordsCount.replace("{count}", String(currentIndex))}</span>
              <span>{t.wordsRemainingCount.replace("{count}", String(activeQueue.length - currentIndex))}</span>
            </div>
          </div>

        </div>
      )}

      {/* 3. SESSION FINISHED (Summary & Sync) */}
      {isSessionFinished && (
        <div className="max-w-md mx-auto text-center py-6 space-y-6 relative z-10 my-auto animate-fade-in">
          
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-100">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              {t.reviewComplete}
            </h2>
            <p className="text-xs text-slate-400 font-light px-2">
              {t.consolidatedInfo}
            </p>
          </div>

          {/* Stats Summary Panel */}
          <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
            <div className="flex justify-around items-center">
              <div>
                <span className="text-3xl font-display font-black text-slate-800 block">{totalDueCount}</span>
                <span className="text-[10px] text-slate-400 font-light">{t.totalReviewed}</span>
              </div>
              <div className="h-8 w-px bg-slate-100"></div>
              <div>
                <span className="text-3xl font-display font-black text-indigo-600 block">{firstTryCorrectCount}</span>
                <span className="text-[10px] text-indigo-400 font-semibold block">{t.firstTryCorrect}</span>
              </div>
              <div className="h-8 w-px bg-slate-100"></div>
              <div>
                <span className={`text-3xl font-display font-black block ${firstTryCorrectPercentage >= 80 ? "text-emerald-500" : "text-slate-700"}`}>
                  {firstTryCorrectPercentage}%
                </span>
                <span className="text-[10px] text-slate-400 font-light">{t.firstTryAccuracy}</span>
              </div>
            </div>

            {/* AI congratulation or advice */}
            <p className="text-[11px] text-slate-500 leading-relaxed font-light border-t border-slate-50 pt-3 text-left">
              {firstTryCorrectPercentage >= 80 ? t.aiStaggeringStamina : t.aiForgettingNatural}
            </p>
          </div>

          {/* First Try Failures list */}
          {firstTryFailures.size > 0 && (
            <div className="bg-rose-50/50 rounded-2xl border border-rose-100/40 p-4 text-left space-y-2">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {t.failedWordsScheduled}
              </span>
              <div className="flex flex-wrap gap-2">
                {Array.from(firstTryFailures).map(id => {
                  const item = dueWords.find(w => w.id === id);
                  if (!item) return null;
                  return (
                    <span key={id} className="text-xs font-mono font-bold bg-white text-rose-700 px-2.5 py-1 rounded-lg border border-rose-100 shadow-sm">
                      {item.spelling}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              id="btn-sync-review-results"
              onClick={handleFinishAndSubmit}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-100 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{t.syncAndEnd}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
