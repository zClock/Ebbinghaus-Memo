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
}

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const accuracy = payload.find((p: any) => p.name === "正确率")?.value ?? 
                     (payload[0]?.payload?.accuracy ?? 0);
    const correct = payload.find((p: any) => p.dataKey === "correct")?.value ?? 0;
    const wrong = payload.find((p: any) => p.dataKey === "wrong")?.value ?? 0;
    const total = correct + wrong;

    return (
      <div className="bg-slate-900/95 text-white p-4 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md text-xs font-mono">
        <p className="font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1 flex items-center justify-between">
          <span>📅 {label}</span>
          {total > 0 && (
            <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
              正确率: {accuracy}%
            </span>
          )}
        </p>
        {total > 0 ? (
          <div className="space-y-1">
            <p className="flex justify-between gap-6">
              <span className="text-slate-400">复习总量:</span>
              <span className="font-bold text-slate-200">{total} 个</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-emerald-400">首通答对:</span>
              <span className="font-bold text-emerald-300">{correct} 个</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-rose-400">错词退回:</span>
              <span className="font-bold text-rose-300">{wrong} 个</span>
            </p>
          </div>
        ) : (
          <p className="text-slate-500 italic">当天无复习记录</p>
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
}: DashboardProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const stageLabels = [
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
            <span>艾宾浩斯智能记忆引擎已就绪</span>
          </div>
          
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight leading-tight">
            科学抗忘，高效突破单词瓶颈
          </h1>
          <p className="text-indigo-100/90 text-sm mt-2 sm:text-base font-light">
            本应用严格基于德国心理学家艾宾浩斯（Hermann Ebbinghaus）遗忘曲线规律，通过“错词会话内闭环”和“连胜3次快速晋级已掌握”两大机制，为您量身定制最省力的复习计划。
          </p>

          <div className="flex flex-wrap gap-3.5 mt-6">
            {stats.dueTodayCount > 0 ? (
              <button
                id="btn-dashboard-start-review"
                onClick={onStartReview}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-900 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                开始今日复习 ({stats.dueTodayCount} 个词)
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm font-medium text-emerald-200 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>太棒了！今日没有需要复习的单词。</span>
              </div>
            )}
            
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              记忆算法说明
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
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">词库总单词量</p>
              <h3 className="font-display font-bold text-3xl text-slate-800 mt-2">{stats.totalWords}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-light">包含已掌握和正在复习中的单词</p>
        </div>

        {/* Card 2: Due Today */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">今日待复习</p>
              <h3 className="font-display font-bold text-3xl text-slate-800 mt-2">{stats.dueTodayCount}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.dueTodayCount > 0 ? "bg-rose-50 text-rose-500 animate-pulse" : "bg-slate-50 text-slate-400"}`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-light">
            {stats.dueTodayCount > 0 ? "建议现在开始复习以强化记忆结构" : "复习任务已全部处理完毕"}
          </p>
        </div>

        {/* Card 3: Mastered */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">已牢固掌握</p>
              <h3 className="font-display font-bold text-3xl text-slate-800 mt-2">{stats.masteredCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-light">
            通过快速通道或升至阶段 5、6 的高熟练词汇
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
            收起 ✕
          </button>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-3 text-slate-600 text-sm">
              <h4 className="font-display font-bold text-slate-900 text-base">艾宾浩斯智能复习算法规则：</h4>
              <p>
                <strong>1. 遗忘曲线轮数复习时间：</strong>
                每个新单词初始进入<b>阶段 0</b>，下次复习在 <b>1天后</b>。随着每次正确复习，单词在各个阶段进阶：
                <span className="block pl-4 mt-1 text-slate-500 font-mono text-xs">
                  阶段 0 → 1 (+1天) | 阶段 1 → 2 (+2天) | 阶段 2 → 3 (+4天) | 阶段 3 → 4 (+7天) | 阶段 4 → 5 (+15天) | 阶段 5 → 6 (+30天最终全掌握)
                </span>
              </p>
              <p>
                <strong>2. “已掌握”快速晋级通道：</strong>
                在任何复习测试中，如果一个单词<b>连续 3 次</b>首轮作答一次性正确（即 <code>consecutiveCorrect ≥ 3</code>），系统会自动将其归类为“已掌握”状态，<b>强力跃迁至 阶段 5</b>，将下次复习定在 <b>30天后</b>。这样可以直接在中间跳过反复的7天和15天复习，大大提升记词效率！
              </p>
              <p>
                <strong>3. 重置惩罚：</strong>
                若单词在复习的第一轮尝试中失败，则直接退回至<b>阶段 0</b>，首通正确次数重置为 0，下次复习时间更新为<b>明天 (当天+1天)</b>。
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
                  <h3 className="font-display font-bold text-slate-900 text-lg">近一周复习进度与掌握趋势</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  追踪您在虚拟时间轴中过去 7 天的每日复习量、正确率，量化呈现记忆曲线跃迁轨迹
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">近一周复习总量</span>
                  <span className="font-mono font-bold text-slate-700 text-lg">
                    {totalReviewsPastWeek} <span className="text-xs font-normal text-slate-400 font-sans">次</span>
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-100"></div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">近一周平均正确率</span>
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
                    <Tooltip content={<CustomTooltip />} />
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
                      name="首通答对" 
                      stackId="a" 
                      fill="#10b981" 
                      radius={[0, 0, 4, 4]} 
                      maxBarSize={32}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="wrong" 
                      name="错词退回" 
                      stackId="a" 
                      fill="#f43f5e" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={32}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="accuracy" 
                      name="正确率" 
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
                <p className="text-slate-400 text-xs font-light">暂无这一时段的复习记录</p>
                <p className="text-slate-300 text-[10px]">
                  一旦您完成今日单词复习（或使用时光机快进并完成复习），进度趋势便会在此实时绘制
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
              <h3 className="font-display font-bold text-slate-900 text-lg">记忆阶段分布图</h3>
              <p className="text-xs text-slate-400 mt-0.5">展示各熟练度阶段的单词分布</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-lg text-indigo-600 text-[11px] font-mono font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>阶梯式记忆</span>
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
                      {count > 0 ? `${count} 个词` : ""}
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
            <span>💡 阶段 6 为终期掌握词汇。</span>
            <span>连续首通答对3次可瞬间跃迁！</span>
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
              <h3 className="font-display font-bold text-slate-900 text-lg">艾宾智能“时光机”</h3>
            </div>

            <p className="text-xs text-slate-500 font-light leading-relaxed">
              为了方便您立即体验和测试艾宾浩斯的动态复习机制，时光机支持<b>模拟快进时间</b>。快进后，系统会对应增加到期复习单词数，您可以无缝开启新复习会话！
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                id="btn-time-travel-1"
                onClick={() => onAdvanceTime(1)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100 rounded-xl text-xs font-semibold font-mono text-center transition-all shadow-sm cursor-pointer"
              >
                快进 +1 天
              </button>
              <button
                id="btn-time-travel-3"
                onClick={() => onAdvanceTime(3)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100 rounded-xl text-xs font-semibold font-mono text-center transition-all shadow-sm cursor-pointer"
              >
                快进 +3 天
              </button>
              <button
                id="btn-time-travel-7"
                onClick={() => onAdvanceTime(7)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-semibold font-mono text-center transition-all shadow-sm cursor-pointer"
              >
                快进 +7 天
              </button>
              <button
                id="btn-time-travel-30"
                onClick={() => onAdvanceTime(30)}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-semibold font-mono text-center transition-all shadow-sm cursor-pointer"
              >
                快进 +30 天
              </button>
            </div>

            {stats.systemOffsetDays > 0 && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800 flex justify-between items-center">
                <span>当前已虚拟快进了 <b>{stats.systemOffsetDays} 天</b></span>
                <button
                  onClick={onResetTime}
                  className="flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  还原今天
                </button>
              </div>
            )}
          </div>

          {/* Database Control Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="font-display font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              词库系统设置
            </h4>
            <p className="text-xs text-slate-400 font-light leading-relaxed mb-4">
              您可以直接一键重置当前词库，将其恢复到最纯净的官方演示词汇种子状态。此操作也会同步重置模拟时钟。
            </p>

            {showConfirmReset ? (
              <div className="space-y-2 animate-fade-in">
                <p className="text-xs text-rose-500 font-semibold">⚠️ 确认清空所有自定义词汇并恢复初始示例吗？</p>
                <div className="flex gap-2">
                  <button
                    onClick={onResetDb}
                    className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    确定重置
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 border border-slate-100 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重置系统数据库
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
