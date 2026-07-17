import { useState } from "react";
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  Database, 
  Flame, 
  HelpCircle, 
  Info, 
  RotateCcw, 
  Sparkles, 
  TrendingUp, 
  Trophy 
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

import { getTranslation } from "../lib/translations";

interface DashboardProps {
  stats: {
    totalWords: number;
    dueTodayCount: number;
    masteredCount: number;
    stageDistribution: number[];
    systemOffsetDays: number;
    virtualTime: string;
  };
  histories?: any[];
  onAdvanceTime: (days: number) => void;
  onResetTime: () => void;
  onResetDb: () => void;
  onStartReview: () => void;
  onNavigateWords?: () => void;
  selectedLanguage: string;
  useTargetUi: boolean;
}

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label, t }: any) => {
  if (active && payload && payload.length) {
    const accuracy = payload[0]?.payload?.accuracy ?? 0;
    const correct = payload.find((p: any) => p.dataKey === "correct")?.value ?? 0;
    const wrong = payload.find((p: any) => p.dataKey === "wrong")?.value ?? 0;
    const total = correct + wrong;

    return (
      <div className="bg-slate-900/95 text-white p-4 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md text-xs font-mono">
        <p className="font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
          <span>📅 {label}</span>
          {total > 0 && (
            <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
              {t.firstTryAccuracy}: {accuracy}%
            </span>
          )}
        </p>
        {total > 0 ? (
          <div className="space-y-1">
            <p className="flex justify-between gap-6">
              <span className="text-slate-400">{t.totalReviewed}:</span>
              <span className="font-bold text-slate-200">{total}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-emerald-400">{t.firstTryCorrect}:</span>
              <span className="font-bold text-emerald-300">{correct}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-rose-400">{t.failedWordsScheduled}:</span>
              <span className="font-bold text-rose-300">{wrong}</span>
            </p>
          </div>
        ) : (
          <p className="text-slate-500 italic">{t.noReviewsFound}</p>
        )}
      </div>
    );
  }
  return null;
};

export default function Dashboard({
  stats,
  histories = [],
  onAdvanceTime,
  onResetTime,
  onResetDb,
  onStartReview,
  selectedLanguage,
  useTargetUi,
}: DashboardProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const t = getTranslation(selectedLanguage, useTargetUi);

  const stageLabels = useTargetUi ? (
    selectedLanguage === "Japanese" ? [
      { name: "ステージ 0", desc: "初回補強", days: "1日" },
      { name: "ステージ 1", desc: "2日目復習", days: "2日" },
      { name: "ステージ 2", desc: "4日目定着", days: "4日" },
      { name: "ステージ 3", desc: "7日目強化", days: "7日" },
      { name: "ステージ 4", desc: "15日目習得", days: "15日" },
      { name: "ステージ 5", desc: "30日目定型", days: "30日" },
      { name: "ステージ 6 (習得)", desc: "完全定着", days: "習得済" },
    ] : selectedLanguage === "Spanish" ? [
      { name: "Fase 0", desc: "Primer refuerzo", days: "1d" },
      { name: "Fase 1", desc: "Repaso Día 2", days: "2d" },
      { name: "Fase 2", desc: "Consolidación Día 4", days: "4d" },
      { name: "Fase 3", desc: "Fortalecimiento Día 7", days: "7d" },
      { name: "Fase 4", desc: "Memorización Día 15", days: "15d" },
      { name: "Fase 5", desc: "Definitivo Día 30", days: "30d" },
      { name: "Fase 6 (Dominio)", desc: "Dominio absoluto", days: "Dominado" },
    ] : selectedLanguage === "French" ? [
      { name: "Étape 0", desc: "Premier renforcement", days: "1j" },
      { name: "Étape 1", desc: "Révision Jour 2", days: "2j" },
      { name: "Étape 2", desc: "Consolidation Jour 4", days: "4j" },
      { name: "Étape 3", desc: "Renforcement Jour 7", days: "7j" },
      { name: "Étape 4", desc: "Mémorisation Jour 15", days: "15j" },
      { name: "Étape 5", desc: "Finalisation Jour 30", days: "30j" },
      { name: "Étape 6 (Maîtrisé)", desc: "Maîtrise totale", days: "Maîtrisé" },
    ] : selectedLanguage === "Portuguese" ? [
      { name: "Estágio 0", desc: "Primeiro reforço", days: "1d" },
      { name: "Estágio 1", desc: "Revisão Dia 2", days: "2d" },
      { name: "Estágio 2", desc: "Consolidação Dia 4", days: "4d" },
      { name: "Estágio 3", desc: "Fortalecimento Dia 7", days: "7d" },
      { name: "Estágio 4", desc: "Memorização Dia 15", days: "15d" },
      { name: "Estágio 5", desc: "Definição Dia 30", days: "30d" },
      { name: "Estágio 6 (Dominado)", desc: "Domínio final", days: "Dominado" },
    ] : [
      { name: "Stage 0", desc: "First Reinforce", days: "1d" },
      { name: "Stage 1", desc: "Review Day 2", days: "2d" },
      { name: "Stage 2", desc: "Consolidate Day 4", days: "4d" },
      { name: "Stage 3", desc: "Strengthen Day 7", days: "7d" },
      { name: "Stage 4", desc: "Remember Day 15", days: "15d" },
      { name: "Stage 5", desc: "Finalize Day 30", days: "30d" },
      { name: "Stage 6 (Mastered)", desc: "Fully Mastered", days: "Mastered" },
    ]
  ) : [
    { name: "阶段 0", desc: "加深第 1 天", days: "1天" },
    { name: "阶段 1", desc: "复习第 2 天", days: "2天" },
    { name: "阶段 2", desc: "巩固第 4 天", days: "4天" },
    { name: "阶段 3", desc: "强化第 7 天", days: "7天" },
    { name: "阶段 4", desc: "熟记第 15 天", days: "15天" },
    { name: "阶段 5", desc: "定型第 30 天", days: "30天" },
    { name: "阶段 6 (掌握)", desc: "终期完全掌握", days: "已掌握" },
  ];

  const maxStageCount = Math.max(...stats.stageDistribution, 1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-200 mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>
              {t.srsActive}
            </span>
          </div>
          
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight leading-tight">
            {t.srsEngineTitle}
          </h1>
          <p className="text-indigo-100/90 text-sm mt-2 sm:text-base font-light">
            {t.srsEngineDesc}
          </p>

          <div className="flex flex-wrap gap-3.5 mt-6">
            {stats.dueTodayCount > 0 ? (
              <button
                id="btn-dashboard-start-review"
                onClick={onStartReview}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-900 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {t.startTodayReview} ({stats.dueTodayCount})
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : stats.totalWords === 0 ? (
              <button
                onClick={() => onNavigateWords && onNavigateWords()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-900 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span>{t.emptyLibraryCta || "去添加我的第一个单词"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm font-medium text-emerald-200 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>{t.noWordsDue}</span>
              </div>
            )}
            
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              {t.memoryCurveExplain}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Total Words */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.wordsLearned}</p>
              <h3 className="font-display font-bold text-3xl text-slate-800 mt-2">{stats.totalWords}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-light">
            {t.totalWordsDesc}
          </p>
        </div>

        {/* Card 2: Due Today */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.dueToday}</p>
              <h3 className="font-display font-bold text-3xl text-slate-800 mt-2">{stats.dueTodayCount}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.dueTodayCount > 0 ? "bg-rose-50 text-rose-500 animate-pulse" : "bg-slate-50 text-slate-400"}`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-light">
            {stats.dueTodayCount > 0 ? t.dueTodayKeepConsolidated : t.dueTodayDone}
          </p>
        </div>

        {/* Card 3: Mastered */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.fullyMastered}
              </p>
              <h3 className="font-display font-bold text-3xl text-slate-800 mt-2">{stats.masteredCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-light">
            {t.masteredDesc}
          </p>
        </div>
      </div>

      {/* Help Modal Explanation */}
      {showHelp && (
        <div className="bg-slate-50 border border-indigo-100 rounded-2xl p-6 relative animate-fade-in">
          <button 
            onClick={() => setShowHelp(false)} 
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-semibold text-sm cursor-pointer"
          >
            {t.close}
          </button>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-3 text-slate-600 text-sm">
              <h4 className="font-display font-bold text-slate-900 text-base">
                {t.algoRulesTitle}
              </h4>
              <p>
                <strong>{t.algoRule1Title}</strong> {t.algoRule1Desc}
                <span className="block pl-4 mt-1 text-slate-500 font-mono text-xs">
                  {t.algoRule1Stages}
                </span>
              </p>
              <p>
                <strong>{t.algoRule2Title}</strong> {t.algoRule2Desc}
              </p>
              <p>
                <strong>{t.algoRule3Title}</strong> {t.algoRule3Desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Progress Trend Chart */}
      {(() => {
        const getPastWeekData = () => {
          const virtualToday = new Date(stats.virtualTime);
          const dayMs = 24 * 60 * 60 * 1000;
          
          // Create last 7 days from oldest to newest (today)
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(virtualToday.getTime() - (6 - i) * dayMs);
            return d;
          });

          const formatDateKey = (d: Date) => {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          };

          const formatLabel = (d: Date) => {
            return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
          };

          return last7Days.map(date => {
            const key = formatDateKey(date);
            const label = formatLabel(date);
            
            // Filter user histories on this calendar day
            const dayHistories = (histories || []).filter(h => {
              const revDate = new Date(h.reviewedAt);
              return formatDateKey(revDate) === key;
            });

            const total = dayHistories.length;
            const correct = dayHistories.filter(h => h.isCorrect).length;
            const wrong = total - correct;
            const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

            return {
              key,
              dateLabel: label,
              total,
              correct,
              wrong,
              accuracy,
            };
          });
        };

        const pastWeekData = getPastWeekData();
        const totalReviewsPastWeek = pastWeekData.reduce((acc, d) => acc + d.total, 0);
        const totalCorrectPastWeek = pastWeekData.reduce((acc, d) => acc + d.correct, 0);
        const avgAccuracyPastWeek = totalReviewsPastWeek > 0 
          ? Math.round((totalCorrectPastWeek / totalReviewsPastWeek) * 100) 
          : 0;

        return (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-display font-bold text-slate-900 text-lg">
                    {t.weeklyTrendTitle}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {t.weeklyTrendDesc}
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                    {t.totalReviewsWeekly}
                  </span>
                  <span className="font-mono font-bold text-slate-700 text-lg">
                    {totalReviewsPastWeek} <span className="text-xs font-normal text-slate-400 font-sans">{t.times}</span>
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-100"></div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                    {t.avgAccuracyWeekly}
                  </span>
                  <span className="font-mono font-bold text-indigo-600 text-lg">
                    {totalReviewsPastWeek > 0 ? `${avgAccuracyPastWeek}%` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {totalReviewsPastWeek > 0 ? (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={pastWeekData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                       dataKey="dateLabel" 
                       tickLine={false} 
                       axisLine={false}
                       tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      allowDecimals={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      unit="%"
                    />
                    <Tooltip content={<CustomTooltip t={t} />} />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, color: '#475569' }}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="correct" 
                      name={t.firstTryCorrect} 
                      stackId="a" 
                      fill="#10b981" 
                      radius={[0, 0, 4, 4]} 
                      maxBarSize={32}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="wrong" 
                      name={t.failedWordsScheduled} 
                      stackId="a" 
                      fill="#f43f5e" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={32}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="accuracy" 
                      name={t.firstTryAccuracy} 
                      stroke="#4f46e5" 
                      strokeWidth={2.5}
                      dot={{ r: 4, stroke: '#4f46e5', strokeWidth: 1, fill: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 space-y-3">
                <TrendingUp className="w-8 h-8 text-slate-300" />
                <p className="text-slate-400 text-xs font-light">
                  {t.noReviewsFound}
                </p>
                <p className="text-slate-300 text-[10px] text-center px-4">
                  {t.noReviewsTip}
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Grid: Bar Chart & Time Machine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stage Distribution Chart (Custom Visual Component) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-7">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg">
                {t.memoryStagesTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.memoryStagesDesc}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-lg text-indigo-600 text-[11px] font-mono font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t.memoryStep}</span>
            </div>
          </div>

          <div className="space-y-4">
            {stats.stageDistribution.map((count, index) => {
              const label = stageLabels[index];
              const pct = (count / maxStageCount) * 100;
              
              return (
                <div key={index} className="flex items-center gap-3">
                  {/* Stage title */}
                  <div className="w-24 text-right">
                    <span className="text-xs font-semibold text-slate-700 block">{label.name}</span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5 font-light">{label.desc}</span>
                  </div>

                  {/* Visual Bar */}
                  <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden relative border border-slate-100/50 flex items-center px-2">
                    <div 
                      className={`h-full absolute left-0 top-0 transition-all duration-500 ${
                        index === 6 
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500" 
                          : index >= 4
                          ? "bg-gradient-to-r from-indigo-400 to-indigo-500"
                          : "bg-gradient-to-r from-slate-300 to-slate-400"
                      }`}
                      style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                    ></div>
                    
                    {/* Floating counts */}
                    <span className="relative z-10 text-xs font-mono font-bold text-slate-700 ml-1">
                      {count > 0 ? `${count} ${t.wordsCount}` : ""}
                    </span>
                  </div>

                  {/* Interval Flag */}
                  <div className="w-16">
                    <span className="text-xs font-mono font-bold text-indigo-600/80 bg-indigo-50/50 px-2 py-0.5 rounded-full border border-indigo-100/50 block text-center">
                      +{label.days}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-slate-50 pt-4 flex justify-between text-xs text-slate-400 font-light">
            <span>{t.stage6MasteryTip}</span>
            <span>{t.consecutiveCorrectTip}</span>
          </div>
        </div>

        {/* Right Column: Time Machine & System Operations */}
        <div className="space-y-6 lg:col-span-5">
          
          {/* Time Machine Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Calendar className="w-24 h-24 text-slate-800" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-indigo-500" />
              <h3 className="font-display font-bold text-slate-900 text-lg">
                {t.srsTimeMachine}
              </h3>
            </div>

            <p className="text-xs text-slate-500 font-light leading-relaxed">
              {t.timeMachineDesc}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                id="btn-time-travel-1"
                onClick={() => onAdvanceTime(1)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100 rounded-xl text-xs font-semibold font-mono text-center transition-all shadow-sm cursor-pointer"
              >
                {useTargetUi ? "+1 Day" : "快进 +1 天"}
              </button>
              <button
                id="btn-time-travel-3"
                onClick={() => onAdvanceTime(3)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100 rounded-xl text-xs font-semibold font-mono text-center transition-all shadow-sm cursor-pointer"
              >
                {useTargetUi ? "+3 Days" : "快进 +3 天"}
              </button>
              <button
                id="btn-time-travel-7"
                onClick={() => onAdvanceTime(7)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-semibold font-mono text-center transition-all shadow-sm cursor-pointer"
              >
                {useTargetUi ? "+7 Days" : "快进 +7 天"}
              </button>
              <button
                id="btn-time-travel-30"
                onClick={() => onAdvanceTime(30)}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-semibold font-mono text-center transition-all shadow-sm cursor-pointer"
              >
                {useTargetUi ? "+30 Days" : "快进 +30 天"}
              </button>
            </div>

            {stats.systemOffsetDays > 0 && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800 flex justify-between items-center">
                <span>
                  {t.timeMachineAddDays.replace("{days}", String(stats.systemOffsetDays))}
                </span>
                <button
                  onClick={onResetTime}
                  className="flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {useTargetUi ? "Reset" : "还原今天"}
                </button>
              </div>
            )}
          </div>

          {/* Database Control Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="font-display font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              {t.systemConfig}
            </h4>
            <p className="text-xs text-slate-400 font-light leading-relaxed mb-4">
              {t.systemConfigDesc}
            </p>

            {showConfirmReset ? (
              <div className="space-y-2 animate-fade-in">
                <p className="text-xs text-rose-500 font-semibold">
                  {t.resetConfirmText}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onResetDb}
                    className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    {t.resetConfirmBtn}
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 border border-slate-100 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t.resetSysDb}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
