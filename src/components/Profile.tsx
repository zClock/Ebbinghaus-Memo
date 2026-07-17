import React, { useState, useEffect } from "react";
import { 
  User, Mail, ShieldCheck, Target, GraduationCap, Calendar, Save, Key, AlertCircle, CheckCircle,
  Flame, Compass, Sparkles, Zap, Crown, BookOpen, Award, Shield, Medal, Star, Trophy, Lock, X
} from "lucide-react";
import { motion } from "motion/react";

interface ProfileProps {
  user: {
    id: string;
    email: string;
    name: string;
    dailyGoal: number;
    level: string;
    createdAt: string;
  };
  token: string;
  stats?: {
    totalWords: number;
    dueTodayCount: number;
    masteredCount: number;
    stageDistribution: number[];
    systemOffsetDays: number;
    virtualTime: string;
    currentStreak?: number;
    maxStreak?: number;
  };
  onProfileUpdate: (updatedUser: any) => void;
  onLogout: () => void;
}

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  longDesc: string;
  category: "streak" | "count" | "mastered";
  threshold: number;
  icon: string;
  color: string;
  glowColor: string;
  quote: string;
}

const badgeDefinitions: BadgeDefinition[] = [
  // 1. Streak Badges
  {
    id: "streak-1",
    name: "初试锋芒",
    description: "连续复习 1 天",
    longDesc: "恭喜迈出第一步！坚持一天看似简单，却是点燃浩瀚词海的星星之火。",
    category: "streak",
    threshold: 1,
    icon: "Flame",
    color: "from-orange-400 to-amber-500",
    glowColor: "shadow-orange-200",
    quote: "不积跬步，无以至千里。"
  },
  {
    id: "streak-3",
    name: "渐入佳境",
    description: "连续复习 3 天",
    longDesc: "连续 3 天攻坚克难，您已经逐渐找到了专属于您的复习律动。",
    category: "streak",
    threshold: 3,
    icon: "Compass",
    color: "from-amber-400 to-yellow-500",
    glowColor: "shadow-amber-200",
    quote: "欲速则不达，慢就是快。"
  },
  {
    id: "streak-7",
    name: "习惯成自然",
    description: "连续复习 7 天",
    longDesc: "坚持整整一周！艾宾浩斯曲线已经开始在您的潜意识中扎根。",
    category: "streak",
    threshold: 7,
    icon: "Sparkles",
    color: "from-teal-400 to-emerald-500",
    glowColor: "shadow-teal-200",
    quote: "习惯是卓越的基石。"
  },
  {
    id: "streak-15",
    name: "意志钢铁",
    description: "连续复习 15 天",
    longDesc: "连续半个月的坚守！记忆已经不再是负担，而是您征服英语的盔甲。",
    category: "streak",
    threshold: 15,
    icon: "Zap",
    color: "from-blue-400 to-indigo-600",
    glowColor: "shadow-blue-200",
    quote: "精诚所至，金石为开。"
  },
  {
    id: "streak-30",
    name: "艾宾极境之王",
    description: "连续复习 30 天",
    longDesc: "三十天斗转星移，您的自律与坚持已臻化境，艾宾浩斯引擎因您而荣耀！",
    category: "streak",
    threshold: 30,
    icon: "Crown",
    color: "from-purple-500 to-fuchsia-600",
    glowColor: "shadow-purple-200",
    quote: "自律即自由，坚持即伟大。"
  },
  // 2. Word Count Badges
  {
    id: "count-5",
    name: "词汇起航",
    description: "词库累计 5 个单词",
    longDesc: "万丈高楼平地起，第一批单词已编入您的个人艾宾记忆网。",
    category: "count",
    threshold: 5,
    icon: "BookOpen",
    color: "from-cyan-400 to-blue-500",
    glowColor: "shadow-cyan-200",
    quote: "万事开头难，起航即成功。"
  },
  {
    id: "count-20",
    name: "积沙成塔",
    description: "词库累计 20 个单词",
    longDesc: "不知不觉中，您的词库已经拥有了20个高质量词汇，继续添砖加瓦！",
    category: "count",
    threshold: 20,
    icon: "Award",
    color: "from-sky-400 to-indigo-500",
    glowColor: "shadow-sky-200",
    quote: "九层之台，起于累土。"
  },
  {
    id: "count-50",
    name: "学富五车",
    description: "词库累计 50 个单词",
    longDesc: "50个生词已被纳入您的遗忘对抗模型。脑力爆发，不可限量！",
    category: "count",
    threshold: 50,
    icon: "Shield",
    color: "from-rose-400 to-pink-500",
    glowColor: "shadow-rose-200",
    quote: "博学而笃志，切问而近思。"
  },
  {
    id: "count-100",
    name: "词海逐浪",
    description: "词库累计 100 个单词",
    longDesc: "百词斩破！您已经成功驾驭了大规模记忆节点，是当之无愧的词海弄潮儿。",
    category: "count",
    threshold: 100,
    icon: "Medal",
    color: "from-violet-500 to-purple-600",
    glowColor: "shadow-violet-200",
    quote: "乘风破浪会有时，直挂云帆济沧海。"
  },
  // 3. Mastered Word Badges
  {
    id: "mastered-3",
    name: "初显成效",
    description: "牢固掌握 3 个单词",
    longDesc: "首批3个单词已通过连续3次首答正确或晋升第5阶段，实现终期掌握！",
    category: "mastered",
    threshold: 3,
    icon: "CheckCircle",
    color: "from-emerald-400 to-green-500",
    glowColor: "shadow-emerald-200",
    quote: "熟能生巧，滴水穿石。"
  },
  {
    id: "mastered-10",
    name: "大显身手",
    description: "牢固掌握 10 个单词",
    longDesc: "10个生词被深深刻入大脑的长期记忆区，永不退化！",
    category: "mastered",
    threshold: 10,
    icon: "Star",
    color: "from-yellow-400 to-orange-500",
    glowColor: "shadow-yellow-200",
    quote: "温故而知新，可以为师矣。"
  },
  {
    id: "mastered-30",
    name: "融会贯通",
    description: "牢固掌握 30 个单词",
    longDesc: "30个核心词汇完全融会贯通，您的长期记忆效率已跃升至全新水平！",
    category: "mastered",
    threshold: 30,
    icon: "Trophy",
    color: "from-amber-500 to-yellow-600",
    glowColor: "shadow-amber-300",
    quote: "会当凌绝顶，一览众山小。"
  }
];

function BadgeIcon({ iconName, className }: { iconName: string; className?: string }) {
  switch (iconName) {
    case "Flame": return <Flame className={className} />;
    case "Compass": return <Compass className={className} />;
    case "Sparkles": return <Sparkles className={className} />;
    case "Zap": return <Zap className={className} />;
    case "Crown": return <Crown className={className} />;
    case "BookOpen": return <BookOpen className={className} />;
    case "Award": return <Award className={className} />;
    case "Shield": return <Shield className={className} />;
    case "Medal": return <Medal className={className} />;
    case "CheckCircle": return <CheckCircle className={className} />;
    case "Star": return <Star className={className} />;
    case "Trophy": return <Trophy className={className} />;
    default: return <Award className={className} />;
  }
}

export default function Profile({ user, token, stats, onProfileUpdate, onLogout }: ProfileProps) {
  // Profile modification states
  const [name, setName] = useState(user.name);
  const [level, setLevel] = useState(user.level);
  const [dailyGoal, setDailyGoal] = useState(user.dailyGoal);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Password alteration states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  // Medal Wall State
  const [activeCategory, setActiveCategory] = useState<"all" | "streak" | "count" | "mastered">("all");
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  const totalWords = stats?.totalWords ?? 0;
  const masteredCount = stats?.masteredCount ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;
  const maxStreak = stats?.maxStreak ?? 0;

  const checkUnlocked = (badge: BadgeDefinition) => {
    if (badge.category === "streak") {
      return maxStreak >= badge.threshold;
    } else if (badge.category === "count") {
      return totalWords >= badge.threshold;
    } else if (badge.category === "mastered") {
      return masteredCount >= badge.threshold;
    }
    return false;
  };

  const getProgress = (badge: BadgeDefinition) => {
    if (badge.category === "streak") {
      return maxStreak;
    } else if (badge.category === "count") {
      return totalWords;
    } else if (badge.category === "mastered") {
      return masteredCount;
    }
    return 0;
  };

  const unlockedCount = badgeDefinitions.filter(checkUnlocked).length;

  const categories = [
    { id: "all", name: "全部勋章" },
    { id: "streak", name: "学习坚持" },
    { id: "count", name: "词库探索" },
    { id: "mastered", name: "终极掌握" }
  ];

  const filteredBadges = badgeDefinitions.filter(badge => {
    if (activeCategory === "all") return true;
    return badge.category === activeCategory;
  });

  useEffect(() => {
    setName(user.name);
    setLevel(user.level);
    setDailyGoal(user.dailyGoal);
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });
    setIsUpdating(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, level, dailyGoal: Number(dailyGoal) })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "修改失败");
      }

      setProfileMsg({ type: "success", text: "账号基础信息已成功保存并同步！" });
      onProfileUpdate(data);
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "连接错误" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "两次输入的新密码不一致。" });
      return;
    }

    setIsChangingPwd(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "旧密码校验错误。");
      }

      setPasswordMsg({ type: "success", text: "密码已成功修改。" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "修改密码失败。" });
    } finally {
      setIsChangingPwd(false);
    }
  };

  const getLevelLabel = (lvl: string) => {
    switch (lvl) {
      case "CET4": return "大学英语四级 (CET4)";
      case "CET6": return "大学英语六级 (CET6)";
      case "IELTS": return "雅思 (IELTS)";
      case "TOEFL": return "托福 (TOEFL)";
      case "GRE": return "词汇巅峰 (GRE)";
      default: return "自学拓展 (CUSTOM)";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 selection:bg-indigo-500/20 selection:text-indigo-900">
      
      {/* Account Info Header / Binding Banner */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4.5">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-indigo-100 uppercase">
            {user.name ? user.name.slice(0, 2) : "Us"}
          </div>
          <div className="space-y-1">
            <h2 className="font-display font-bold text-slate-900 text-xl flex items-center gap-2">
              <span>{user.name}</span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>已绑定</span>
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-light flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email}</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-300" />
              <span>创建日期: {new Date(user.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
        >
          安全退出登录
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Modify Basic Info */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-indigo-500" />
              <span>基本信息修改</span>
            </h3>
            <p className="text-xs text-slate-400 font-light">
              修改您在艾宾记忆大厅中的个人参数
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileMsg.text && (
              <div className={`p-3 rounded-xl flex items-start gap-2.5 text-xs ${
                profileMsg.type === "success" 
                  ? "bg-emerald-50 border border-emerald-100 text-emerald-700" 
                  : "bg-rose-50 border border-rose-100 text-rose-700"
              }`}>
                {profileMsg.type === "success" ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            {/* Display Email (Readonly) */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                账号绑定邮箱 (不可更改)
              </label>
              <input
                type="text"
                disabled
                value={user.email}
                className="block w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-100 rounded-lg text-slate-400 cursor-not-allowed font-medium"
              />
            </div>

            {/* Change Nickname */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                个性昵称
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium"
              />
            </div>

            {/* Level Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                备考水平 / 词库配置
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="block w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium cursor-pointer"
              >
                <option value="CET4">英语四级 (CET4)</option>
                <option value="CET6">英语六级 (CET6)</option>
                <option value="IELTS">雅思 (IELTS)</option>
                <option value="TOEFL">托福 (TOEFL)</option>
                <option value="GRE">词汇巅峰 (GRE)</option>
                <option value="CUSTOM">自学拓展 (CUSTOM)</option>
              </select>
            </div>

            {/* Daily Goal */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span>每日复习目标 (词)</span>
              </label>
              <input
                type="number"
                min={5}
                max={200}
                required
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow shadow-indigo-100 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>保存基本资料</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
              <Key className="w-4.5 h-4.5 text-indigo-500" />
              <span>修改登录密码</span>
            </h3>
            <p className="text-xs text-slate-400 font-light">
              为了您的数据安全，请定期更换复杂密码
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordMsg.text && (
              <div className={`p-3 rounded-xl flex items-start gap-2.5 text-xs ${
                passwordMsg.type === "success" 
                  ? "bg-emerald-50 border border-emerald-100 text-emerald-700" 
                  : "bg-rose-50 border border-rose-100 text-rose-700"
              }`}>
                {passwordMsg.type === "success" ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            {/* Old Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                当前旧密码
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入原密码"
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium placeholder:text-slate-300"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                新密码
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="最少 6 位新密码"
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium placeholder:text-slate-300"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                确认新密码
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium placeholder:text-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPwd}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow shadow-indigo-100 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isChangingPwd ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>修改登录密码</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Achievement Medals Wall Section */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>我的专属勋章墙</span>
            </h3>
            <p className="text-xs text-slate-400 font-light">
              自律筑就卓越。解锁勋章见证您抗击遗忘、征服词海的精彩旅程。
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 flex items-center gap-4 text-xs font-mono text-slate-600 self-start sm:self-auto">
            <div>
              已点亮: <span className="font-bold text-indigo-600">{unlockedCount}</span> / {badgeDefinitions.length}
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div>
              连续复习: <span className="font-bold text-orange-500">{currentStreak}</span> 天
            </div>
            <div className="w-px h-4 bg-slate-200 text-slate-300"></div>
            <div>
              历史最高: <span className="font-bold text-indigo-500">{maxStreak}</span> 天
            </div>
          </div>
        </div>

        {/* Categories Selector */}
        <div className="flex gap-2 border-b border-slate-100 pb-3 overflow-x-auto scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Badge Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredBadges.map(badge => {
            const isUnlocked = checkUnlocked(badge);
            const progress = getProgress(badge);
            const percent = Math.min(100, (progress / badge.threshold) * 100);

            return (
              <motion.div
                key={badge.id}
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={() => setSelectedBadge(badge)}
                className={`relative overflow-hidden border rounded-3xl p-4 flex flex-col items-center text-center cursor-pointer select-none transition-all group ${
                  isUnlocked
                    ? "bg-gradient-to-b from-white to-slate-50 border-slate-200/80 shadow-md shadow-slate-100"
                    : "bg-slate-50/50 border-slate-100"
                }`}
              >
                {/* Background flare on hover for unlocked */}
                {isUnlocked && (
                  <div className="absolute inset-0 bg-radial-gradient from-indigo-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                )}

                {/* Badge Icon Circular frame */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 relative transition-all group-hover:scale-105 ${
                  isUnlocked
                    ? `bg-gradient-to-tr ${badge.color} text-white shadow-lg ${badge.glowColor}/30`
                    : "bg-slate-100 text-slate-300"
                }`}>
                  <BadgeIcon iconName={badge.icon} className="w-6 h-6" />
                  {!isUnlocked && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-white border border-slate-100 text-slate-400 p-1 rounded-full shadow-sm">
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {/* Badge Title & Short Desc */}
                <h4 className={`text-xs font-bold ${isUnlocked ? "text-slate-800" : "text-slate-400"}`}>
                  {badge.name}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 font-light leading-snug line-clamp-2 px-1 h-7 flex items-center justify-center">
                  {badge.description}
                </p>

                {/* Progress Mini Bar */}
                <div className="w-full mt-3 space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                    <span>进度</span>
                    <span>
                      {progress} / {badge.threshold}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked ? `bg-gradient-to-r ${badge.color}` : "bg-slate-300"
                      }`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Achieved watermark or stamp */}
                {isUnlocked && (
                  <span className="absolute top-2 right-2 text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full scale-90 origin-top-right shadow-sm">
                    已点亮
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Badge Detail Dialog / Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 border border-slate-100 shadow-2xl relative overflow-hidden text-center space-y-6"
          >
            {/* Background Light Glow */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 bg-gradient-to-tr ${selectedBadge.color}`}></div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              {/* Badge Emblem Display */}
              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center relative ${
                checkUnlocked(selectedBadge)
                  ? `bg-gradient-to-tr ${selectedBadge.color} text-white shadow-xl ${selectedBadge.glowColor}/40 ring-4 ring-indigo-50`
                  : "bg-slate-100 text-slate-300"
              }`}>
                <BadgeIcon iconName={selectedBadge.icon} className="w-10 h-10 animate-pulse" />
              </div>

              <div>
                <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 ${
                  checkUnlocked(selectedBadge)
                    ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                    : "bg-slate-100 border border-slate-200 text-slate-400"
                }`}>
                  {checkUnlocked(selectedBadge) ? "★ 荣誉勋章已点亮" : "🔒 勋章尚未解锁"}
                </span>
                <h3 className="font-display font-black text-slate-900 text-xl tracking-tight">
                  {selectedBadge.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  要求: {selectedBadge.description}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4.5 text-left border border-slate-100 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed font-light">
                {selectedBadge.longDesc}
              </p>
              {checkUnlocked(selectedBadge) && (
                <div className="pt-2.5 border-t border-slate-200/60 text-center">
                  <p className="text-[11px] italic font-serif text-indigo-600/90 leading-normal">
                    “ {selectedBadge.quote} ”
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400 px-1 font-mono">
                <span>当前进度</span>
                <span className="font-semibold text-slate-700">
                  {getProgress(selectedBadge)} / {selectedBadge.threshold}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    checkUnlocked(selectedBadge) ? `bg-gradient-to-r ${selectedBadge.color}` : "bg-slate-300"
                  }`}
                  style={{ width: `${Math.min(100, (getProgress(selectedBadge) / selectedBadge.threshold) * 100)}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              关闭详情
            </button>
          </motion.div>
        </div>
      )}

    </div>

  );
}
