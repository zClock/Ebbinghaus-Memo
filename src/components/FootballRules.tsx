import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Compass,
  Sparkles,
  Award,
  BookOpenCheck,
  Check
} from "lucide-react";
import { footballRulesData } from "../lib/footballRulesData";
import { getTranslation } from "../lib/translations";

interface FootballRulesProps {
  onBackToDashboard: () => void;
  selectedLanguage: string;
  useTargetUi: boolean;
}

export default function FootballRules({
  onBackToDashboard,
  selectedLanguage,
  useTargetUi
}: FootballRulesProps) {
  const t = getTranslation(selectedLanguage, useTargetUi);
  // 中文 UI（含默认 UI 即中文的情况）→ 中英双语对照；其他 UI 语言 → 仅英文
  // 因为规则数据本身只有中英文，其他语言（日/西/法/葡）统一回退到英文
  const isBilingual = !(useTargetUi && selectedLanguage !== "Chinese");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeLawId, setActiveLawId] = useState<number>(1);

  // Reader pane ref：切换章节时滚回顶部
  // 桌面端：右侧 reader pane 独立滚动；手机端：外层 grid 容器滚动
  const scrollContainerRef = useRef<HTMLDivElement>(null); // 手机端 grid 容器
  const readerPaneRef = useRef<HTMLDivElement>(null);      // 桌面端右侧 pane
  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    if (readerPaneRef.current) readerPaneRef.current.scrollTop = 0;
  }, [activeLawId]);

  // 分类标签跟随 UI 语言（已经通过 translations.ts 完成 6 语言本地化）
  const categories = useMemo(() => {
    return [
      { id: "All", label: t.footballCatAll },
      { id: "Field & Equipment", label: t.footballCatFieldEquip },
      { id: "Officials", label: t.footballCatOfficials },
      { id: "Time & Score", label: t.footballCatTimeScore },
      { id: "Offside & Misconduct", label: t.footballCatOffsideFouls },
      { id: "Restarts & Set Pieces", label: t.footballCatRestarts },
    ];
  }, [t]);

  // Filter & Search logic
  const filteredLaws = useMemo(() => {
    return footballRulesData.filter((law) => {
      // 1. Category Filter
      if (selectedCategory !== "All" && law.categoryEn !== selectedCategory) {
        return false;
      }

      // 2. Search Query Filter
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const matchesTitle =
        law.titleEn.toLowerCase().includes(query) ||
        law.titleZh.includes(query);

      const matchesSummary =
        law.summaryEn.toLowerCase().includes(query) ||
        law.summaryZh.includes(query);

      const matchesSections = law.sections.some(sec =>
        sec.subtitleEn.toLowerCase().includes(query) ||
        sec.subtitleZh.includes(query) ||
        sec.contentEn.toLowerCase().includes(query) ||
        sec.contentZh.includes(query)
      );

      return matchesTitle || matchesSummary || matchesSections;
    });
  }, [searchQuery, selectedCategory]);

  // Find active law
  const activeLaw = useMemo(() => {
    const law = footballRulesData.find(l => l.id === activeLawId);
    return law || footballRulesData[0];
  }, [activeLawId]);

  const handleNextLaw = () => {
    if (activeLawId < 17) {
      setActiveLawId(prev => prev + 1);
    }
  };

  const handlePrevLaw = () => {
    if (activeLawId > 1) {
      setActiveLawId(prev => prev - 1);
    }
  };

  // Helper to highlight searched terms
  const highlightText = (text: string, search: string) => {
    if (!search || !search.trim()) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase()
            ? <mark key={i} className="bg-amber-100 text-amber-950 font-semibold px-0.5 rounded">{part}</mark>
            : part
        )}
      </>
    );
  };

  // 将规则正文按换行拆段，识别 "- " 开头的行作为 bullet list 渲染
  // 解决：数据中 \n 被浏览器默认合并为空格，bullet 项挤成一行的问题
  const renderStructuredContent = (raw: string, search: string, variant: "zh" | "en") => {
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return null;

    // 分组：连续的 "- " 开头归一组渲染成 <ul>，其他渲染成 <p>
    const blocks: { type: "p" | "ul"; items: string[] }[] = [];
    for (const line of lines) {
      const isBullet = /^[-•]/.test(line);
      const last = blocks[blocks.length - 1];
      if (isBullet) {
        // 去掉行首 "- " 或 "• "
        const content = line.replace(/^[-•]\s*/, "");
        if (last && last.type === "ul") {
          last.items.push(content);
        } else {
          blocks.push({ type: "ul", items: [content] });
        }
      } else {
        if (last && last.type === "p") {
          last.items.push(line);
        } else {
          blocks.push({ type: "p", items: [line] });
        }
      }
    }

    return (
      <div className={variant === "en" ? "font-serif italic text-slate-500 space-y-2.5" : "text-slate-800 space-y-2.5"}>
        {blocks.map((blk, i) => {
          if (blk.type === "ul") {
            return (
              <ul key={i} className={`list-disc ${variant === "en" ? "pl-5" : "pl-5"} space-y-1 my-1`}>
                {blk.items.map((item, j) => (
                  <li key={j} className="leading-relaxed">{highlightText(item, search)}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i} className="leading-relaxed">
              {highlightText(blk.items.join(" "), search)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen rounded-3xl overflow-visible lg:overflow-hidden border border-slate-100 shadow-xl flex flex-col animate-fade-in">

      {/* Upper Pitch-green Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 relative overflow-hidden">
        {/* Abstract pitch line overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-4 left-4 w-12 h-12 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-white rounded-full"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-semibold text-emerald-200 border border-white/10">
              <Compass className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" />
              <span>{t.footballEntryBadge}</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight leading-tight">
              {t.footballHeaderTitle}
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl font-light leading-relaxed">
              {t.footballHeaderDesc}
            </p>
          </div>

          <button
            onClick={onBackToDashboard}
            className="self-start md:self-center px-4 py-2 bg-white/15 hover:bg-white/20 active:scale-95 border border-white/10 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            {t.footballExitBtn}
          </button>
        </div>
      </div>

      {/* Control Panel: Filters + Search */}
      <div className="bg-white border-b border-slate-100 p-4 sm:p-6 sticky top-[57px] z-30 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">

          {/* Smart Search Field */}
          <div className="relative flex-grow max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.footballSearchPlaceholder}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs sm:text-sm font-medium transition-all outline-none text-slate-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin pr-4 snap-x">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all border shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/60 shadow-sm font-semibold"
                    : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Sidebar Navigator on left, Live Reader Pane on right */}
      {/* 移动端：两段垂直堆叠，外层可滚动；桌面端：两栏并排，固定高度 */}
      <div ref={scrollContainerRef} className="flex-grow grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden h-[70vh] lg:h-[750px]">

        {/* Left Side: Chapter Navigation Index */}
        {/* 移动端：章节列表收缩成横向滚动条,占 12vh;桌面端：固定高度 + 独立滚动 */}
        <div className="lg:col-span-4 border-r border-slate-100 bg-white overflow-y-auto flex flex-col h-[12vh] lg:h-full shrink-0">
          <div className="p-3.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              {t.footballIndexTitle} ({filteredLaws.length})
            </span>
            {searchQuery && (
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">
                {t.footballIndexSearching}
              </span>
            )}
          </div>

          <div className="flex-grow divide-y divide-slate-50">
            {filteredLaws.length > 0 ? (
              filteredLaws.map((law) => {
                const isActive = law.id === activeLawId;
                return (
                  <button
                    key={law.id}
                    onClick={() => setActiveLawId(law.id)}
                    className={`w-full text-left p-4 transition-all flex items-start gap-3 hover:bg-slate-50/50 relative cursor-pointer ${
                      isActive
                        ? "bg-emerald-50/40 text-emerald-950"
                        : "text-slate-700"
                    }`}
                  >
                    {/* Active side indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-r-md"></div>
                    )}

                    <div className={`w-6 h-6 rounded-lg font-mono text-[11px] font-bold shrink-0 flex items-center justify-center border transition-all ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-500 border-slate-100"
                    }`}>
                      {law.id}
                    </div>

                    <div className="space-y-1 flex-grow">
                      <p className="font-semibold text-xs sm:text-sm line-clamp-1">
                        {isBilingual ? law.titleZh : law.titleEn}
                      </p>
                      {isBilingual && (
                        <p className="text-[11px] text-slate-400 font-light line-clamp-1">
                          {law.titleEn}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-light">
                        {isBilingual ? law.summaryZh : law.summaryEn}
                      </p>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 self-center transition-transform ${
                      isActive ? "translate-x-0.5 text-emerald-600" : "text-slate-300"
                    }`} />
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto border border-slate-100">
                  <HelpCircle className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-700 text-xs font-semibold">{t.footballNoMatchTitle}</p>
                <p className="text-slate-400 text-[11px] leading-relaxed max-w-xs mx-auto font-light">
                  {t.footballNoMatchDesc}
                </p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-all"
                >
                  {t.footballClearFilters}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Rules Reading Area */}
        {/* 移动端：右侧 pane 不再独立滚动，让外层 body 滚；桌面端保持原独立滚动 */}
        <div ref={readerPaneRef} className="lg:col-span-8 bg-slate-50/30 overflow-visible lg:overflow-y-auto flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">

          {activeLaw ? (
            <>
              {/* Header inside the reader pane */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 font-mono border border-slate-100">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    {t.footballLawBadge.replace("{id}", String(activeLaw.id))}
                  </span>

                  <span className="text-[11px] bg-emerald-50/50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-100/40 font-semibold">
                    {isBilingual ? activeLaw.categoryZh : activeLaw.categoryEn}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-black text-slate-800 text-lg sm:text-xl">
                    {isBilingual ? activeLaw.titleZh : activeLaw.titleEn}
                  </h2>
                  {isBilingual && (
                    <p className="text-xs text-slate-400 font-mono">
                      {activeLaw.titleEn}
                    </p>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100/50 text-xs text-slate-500 font-light leading-relaxed">
                  <strong className="text-slate-800 block mb-1 font-semibold">
                    {t.footballSummaryLabel}
                  </strong>
                  {highlightText(isBilingual ? activeLaw.summaryZh : activeLaw.summaryEn, searchQuery)}
                  {isBilingual && (
                    <p className="mt-1.5 pt-1.5 border-t border-slate-200/50 text-[11px] text-slate-400">
                      {activeLaw.summaryEn}
                    </p>
                  )}
                </div>
              </div>

              {/* Special 2026/2027 New Rules Alert Box if applicable */}
              {(activeLaw.id === 12 || activeLaw.id === 15 || activeLaw.id === 16) && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-amber-900 flex items-center gap-1">
                      {t.footballNewLawAlert}
                    </p>
                    <p className="text-amber-800/90 font-light leading-relaxed">
                      {activeLaw.id === 12 && t.footballAlertLaw12}
                      {activeLaw.id === 15 && t.footballAlertLaw15}
                      {activeLaw.id === 16 && t.footballAlertLaw16}
                    </p>
                  </div>
                </div>
              )}

              {/* Detailed Sub-sections */}
              <div className="space-y-6">
                {activeLaw.sections.map((sec, index) => (
                  <div key={index} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3.5 hover:shadow-md hover:border-slate-200/60 transition-all">

                    {/* Subsection subtitle */}
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
                      <div className="w-1.5 h-4 bg-emerald-600 rounded-full"></div>
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                        {isBilingual ? sec.subtitleZh : sec.subtitleEn}
                      </h3>
                      {isBilingual && (
                        <span className="text-[10px] text-slate-400 font-mono ml-2">
                          {sec.subtitleEn}
                        </span>
                      )}
                    </div>

                    {/* Subsection content rendering: bilingual 中英对照；其他仅英文 */}
                    {/* v1.8.1: 用 renderStructuredContent 解析 \n 换行和 bullet list，避免在手机上挤成一行 */}
                    <div className="text-sm sm:text-base leading-relaxed font-light space-y-4">
                      {/* 中文内容（仅中文 UI 显示） */}
                      {isBilingual && (
                        <div>
                          {renderStructuredContent(sec.contentZh, searchQuery, "zh")}
                        </div>
                      )}

                      {/* 分隔线 */}
                      {isBilingual && (
                        <div className="border-t border-dashed border-slate-100 my-2.5"></div>
                      )}

                      {/* 英文内容（所有 UI 语言都显示） */}
                      <div>
                        {renderStructuredContent(sec.contentEn, searchQuery, "en")}
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Footer Paging inside Reader Pane */}
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <button
                  onClick={handlePrevLaw}
                  disabled={activeLawId === 1}
                  className={`px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeLawId === 1 ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t.footballPrevBtn}
                </button>

                <span className="text-xs font-mono font-bold text-slate-400">
                  {activeLaw.id} / 17
                </span>

                <button
                  onClick={handleNextLaw}
                  disabled={activeLawId === 17}
                  className={`px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeLawId === 17 ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  {t.footballNextBtn}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-white rounded-2xl border border-slate-100">
              <BookOpenCheck className="w-12 h-12 text-slate-300" />
              <p className="text-slate-400 text-xs">{t.footballChapterHint}</p>
            </div>
          )}

        </div>

      </div>

      {/* Science Quick Facts Footer Bar */}
      <div className="bg-white border-t border-slate-100 p-4 text-center text-slate-400 text-[11px] font-light flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>⚽ FIFA Laws of the Game 2026/2027 — {t.footballEntryBadge}</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <Check className="w-3.5 h-3.5" /> {t.footballFooterLoaded}
          </span>
          <span className="w-px h-3.5 bg-slate-200"></span>
          <span>{t.footballFooterFeatures}</span>
        </div>
      </div>

    </div>
  );
}
