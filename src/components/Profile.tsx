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
  selectedLanguage?: string;
  useTargetUi?: boolean;
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

const profileTranslations: Record<string, any> = {
  Chinese: {
    profileTitle: "个人资料与勋章",
    bound: "已绑定",
    createdAt: "创建日期",
    logout: "安全退出登录",
    basicInfo: "基本信息修改",
    basicInfoDesc: "修改您在艾宾记忆大厅中的个人参数",
    emailLabel: "账号绑定邮箱 (不可更改)",
    nicknameLabel: "个性昵称",
    levelLabel: "备考水平 / 词库配置",
    dailyGoalLabel: "每日复习目标 (词)",
    saveBtn: "保存基本资料",
    changePwdTitle: "修改登录密码",
    changePwdDesc: "为了您的数据安全，请定期更换复杂密码",
    oldPwdLabel: "当前旧密码",
    oldPwdPlaceholder: "请输入原密码",
    newPwdLabel: "新密码",
    newPwdPlaceholder: "最少 6 位新密码",
    confirmPwdLabel: "确认新密码",
    confirmPwdPlaceholder: "再次输入新密码",
    changePwdBtn: "修改登录密码",
    medalWallTitle: "我的专属勋章墙",
    medalWallDesc: "自律筑就卓越。解锁勋章见证您抗击遗忘、征服词海的精彩旅程。",
    litCount: "已点亮",
    streakLabel: "连续复习",
    maxStreakLabel: "历史最高",
    daysUnit: "天",
    wordsUnit: "词",
    allMedals: "全部勋章",
    streakCategory: "学习坚持",
    countCategory: "词库探索",
    masteredCategory: "终极掌握",
    badgeProgress: "进度",
    unlockedWatermark: "已点亮",
    unlockedBadgeHeader: "★ 荣誉勋章已点亮",
    lockedBadgeHeader: "🔒 勋章尚未解锁",
    requirementsLabel: "要求",
    detailProgressLabel: "当前进度",
    closeBtn: "关闭详情",
    saving: "保存中...",
    changing: "修改中...",
    successSave: "账号基础信息已成功保存并同步！",
    errorConn: "连接错误",
    pwdMismatch: "两次输入的新密码不一致。",
    pwdErr: "旧密码校验错误。",
    pwdSuccess: "密码已成功修改。",
    pwdFail: "修改密码失败。",
    levelCET4: "英语四级 (CET4)",
    levelCET6: "英语六级 (CET6)",
    levelIELTS: "雅思 (IELTS)",
    levelTOEFL: "托福 (TOEFL)",
    levelGRE: "词汇巅峰 (GRE)",
    levelCUSTOM: "自学拓展 (CUSTOM)",
    badges: {
      "streak-1": {
        name: "初试锋芒",
        desc: "连续复习 1 天",
        longDesc: "恭喜迈出第一步！坚持一天看似简单，却是点燃浩瀚词海的星星之火。",
        quote: "不积跬步，无以至千里。"
      },
      "streak-3": {
        name: "渐入佳境",
        desc: "连续复习 3 天",
        longDesc: "连续 3 天攻坚克难，您已经逐渐找到了专属于您的复习律动。",
        quote: "欲速则不达，慢就是快。"
      },
      "streak-7": {
        name: "习惯成自然",
        desc: "连续复习 7 天",
        longDesc: "坚持整整一周！艾宾浩斯曲线已经开始在您的潜意识中扎根。",
        quote: "习惯是卓越的基石。"
      },
      "streak-15": {
        name: "意志钢铁",
        desc: "连续复习 15 天",
        longDesc: "连续半个月的坚守！记忆已经不再是负担，而是您征服英语的盔甲。",
        quote: "精诚所至，金石为开。"
      },
      "streak-30": {
        name: "艾宾极境之王",
        desc: "连续复习 30 天",
        longDesc: "三十天斗转星移，您的自律与坚持已臻化境，艾宾浩斯引擎因您而荣耀！",
        quote: "自律即自由，坚持即伟大。"
      },
      "count-5": {
        name: "词汇起航",
        desc: "词库累计 5 个单词",
        longDesc: "万丈高楼平地起，第一批单词已编入您的个人艾宾记忆网。",
        quote: "万事开头难，起航即成功。"
      },
      "count-20": {
        name: "积沙成塔",
        desc: "词库累计 20 个单词",
        longDesc: "不知不觉中，您的词库已经拥有了20个高质量词汇，继续添砖加瓦！",
        quote: "九层之台，起于累土。"
      },
      "count-50": {
        name: "学富五车",
        desc: "词库累计 50 个单词",
        longDesc: "50个生词已被纳入您的遗忘对抗模型。脑力爆发，不可限量！",
        quote: "博学而笃志，切问而近思。"
      },
      "count-100": {
        name: "词海逐浪",
        desc: "词库累计 100 个单词",
        longDesc: "百词斩破！您已经成功驾驭了大规模记忆节点，是当之无愧 of 词海弄潮儿。",
        quote: "乘风破浪会有时，直挂云帆济沧海。"
      },
      "mastered-3": {
        name: "初显成效",
        desc: "牢固掌握 3 个单词",
        longDesc: "首批3个单词已通过连续3次首答正确或晋升第5阶段，实现终期掌握！",
        quote: "熟能生巧，滴水穿石。"
      },
      "mastered-10": {
        name: "大显身手",
        desc: "牢固掌握 10 个单词",
        longDesc: "10个生词被深深刻入大脑的长期记忆区，永不退化！",
        quote: "温故而知新，可以为师矣。"
      },
      "mastered-30": {
        name: "融会贯通",
        desc: "牢固掌握 30 个单词",
        longDesc: "30个核心词汇完全融会贯通，您的长期记忆效率已跃升至全新水平！",
        quote: "会当凌绝顶，一览众山小。"
      }
    }
  },
  English: {
    profileTitle: "Profile & Badges",
    bound: "Linked",
    createdAt: "Created At",
    logout: "Sign Out",
    basicInfo: "Edit Profile",
    basicInfoDesc: "Modify your personal parameters in the Ebbinghaus memory hall",
    emailLabel: "Linked Email (Read-Only)",
    nicknameLabel: "Nickname",
    levelLabel: "Exam Prep / Vocabulary Configuration",
    dailyGoalLabel: "Daily Review Goal (Words)",
    saveBtn: "Save Profile",
    changePwdTitle: "Change Password",
    changePwdDesc: "For your data security, please regularly change your password",
    oldPwdLabel: "Current Password",
    oldPwdPlaceholder: "Enter current password",
    newPwdLabel: "New Password",
    newPwdPlaceholder: "At least 6 characters",
    confirmPwdLabel: "Confirm New Password",
    confirmPwdPlaceholder: "Enter new password again",
    changePwdBtn: "Change Password",
    medalWallTitle: "My Medal Wall",
    medalWallDesc: "Self-discipline builds excellence. Unlock badges to witness your brilliant journey against forgetting.",
    litCount: "Lit",
    streakLabel: "Streak",
    maxStreakLabel: "Max",
    daysUnit: "days",
    wordsUnit: "words",
    allMedals: "All Medals",
    streakCategory: "Streak Goals",
    countCategory: "Vocabulary",
    masteredCategory: "Mastery",
    badgeProgress: "Progress",
    unlockedWatermark: "Unlocked",
    unlockedBadgeHeader: "★ Medal of Honor Unlocked",
    lockedBadgeHeader: "🔒 Medal Locked",
    requirementsLabel: "Requires",
    detailProgressLabel: "Current Progress",
    closeBtn: "Close Details",
    saving: "Saving...",
    changing: "Updating...",
    successSave: "Profile saved and synchronized!",
    errorConn: "Connection error",
    pwdMismatch: "New passwords do not match.",
    pwdErr: "Incorrect current password.",
    pwdSuccess: "Password changed successfully.",
    pwdFail: "Failed to change password.",
    levelCET4: "College English Test 4 (CET4)",
    levelCET6: "College English Test 6 (CET6)",
    levelIELTS: "IELTS",
    levelTOEFL: "TOEFL",
    levelGRE: "Peak Vocabulary (GRE)",
    levelCUSTOM: "Custom Study Extension",
    badges: {
      "streak-1": {
        name: "First Spark",
        desc: "Consecutive review for 1 day",
        longDesc: "Congratulations on taking your first step! Reviewing for a single day may seem simple, but it is the spark that lights up your vast ocean of words.",
        quote: "A journey of a thousand miles begins with a single step."
      },
      "streak-3": {
        name: "In the Groove",
        desc: "Consecutive review for 3 days",
        longDesc: "3 consecutive days of conquering difficulties. You've successfully found your personal rhythm of review.",
        quote: "More haste, less speed. Slow is fast."
      },
      "streak-7": {
        name: "Habitual Excellence",
        desc: "Consecutive review for 7 days",
        longDesc: "A whole week of persistence! The Ebbinghaus curve has started to take root in your subconscious mind.",
        quote: "Habit is the cornerstone of excellence."
      },
      "streak-15": {
        name: "Iron Will",
        desc: "Consecutive review for 15 days",
        longDesc: "Consequent defense for half a month! Memory is no longer a burden, but your armor to conquer languages.",
        quote: "Sincerity splits open metal and stone."
      },
      "streak-30": {
        name: "King of Ebbinghaus",
        desc: "Consecutive review for 30 days",
        longDesc: "Thirty days of dedication. Your discipline and persistence have reached a divine realm, and the Ebbinghaus engine is honored by you!",
        quote: "Self-discipline is freedom; persistence is greatness."
      },
      "count-5": {
        name: "Vocabulary Launch",
        desc: "Accumulate 5 words in library",
        longDesc: "Every skyscraper starts from the ground. Your first words have been woven into your personal Ebbinghaus memory net.",
        quote: "Every beginning is difficult, but launching is half the success."
      },
      "count-20": {
        name: "Sand Castle",
        desc: "Accumulate 20 words in library",
        longDesc: "Quietly, your vocabulary has grown to 20 high-quality words. Keep adding bricks to your memory fort!",
        quote: "A nine-story platform rises from a heap of earth."
      },
      "count-50": {
        name: "Highly Erudite",
        desc: "Accumulate 50 words in library",
        longDesc: "50 raw words have been incorporated into your forgetting-prevention model. Your brainpower is exploding!",
        quote: "Learn broadly, be steadfast in resolve, inquire earnestly and reflect closely."
      },
      "count-100": {
        name: "Riding the Waves",
        desc: "Accumulate 100 words in library",
        longDesc: "100 words conquered! You have successfully mastered memory nodes at scale and are now a true wave rider.",
        quote: "A time will come to ride the wind and cleave the waves, to cross the deep blue sea."
      },
      "mastered-3": {
        name: "Early Success",
        desc: "Master 3 words completely",
        longDesc: "The first 3 words have been fully mastered through consecutive correct reviews or by reaching stage 5!",
        quote: "Practice makes perfect; constant dripping wears away stone."
      },
      "mastered-10": {
        name: "Show of Skill",
        desc: "Master 10 words completely",
        longDesc: "10 words are deeply engraved in the long-term memory area of your brain, never to be lost!",
        quote: "Reviewing the old to know the new allows one to be a teacher."
      },
      "mastered-30": {
        name: "Comprehensive Mastery",
        desc: "Master 30 words completely",
        longDesc: "30 core words are completely integrated. Your long-term memory efficiency has risen to an entirely new level!",
        quote: "Once I ascend the mountain's peak, all other hills will seem small."
      }
    }
  },
  Japanese: {
    profileTitle: "プロフィールとメダル",
    bound: "連携済み",
    createdAt: "登録日",
    logout: "ログアウト",
    basicInfo: "基本情報の編集",
    basicInfoDesc: "エビングハウス記憶の殿堂における個人設定を変更します",
    emailLabel: "連携メールアドレス (変更不可)",
    nicknameLabel: "ニックネーム",
    levelLabel: "目標試験レベル / 単語帳設定",
    dailyGoalLabel: "毎日の復習目標 (単語数)",
    saveBtn: "プロフィールの保存",
    changePwdTitle: "パスワード of 変更",
    changePwdDesc: "データ安全のため、定期的に複雑なパスワードに変更してください",
    oldPwdLabel: "現在のパスワード",
    oldPwdPlaceholder: "現在のパスワードを入力",
    newPwdLabel: "新しいパスワード",
    newPwdPlaceholder: "6文字以上",
    confirmPwdLabel: "新しいパスワードの確認",
    confirmPwdPlaceholder: "新しいパスワードを再入力",
    changePwdBtn: "パスワードを変更する",
    medalWallTitle: "マイメダルウォール",
    medalWallDesc: "自己規律が卓越性を生みます。メダルをアンロックして、忘却に抗う素晴らしい学習の旅を記録しましょう。",
    litCount: "獲得",
    streakLabel: "現在の継続",
    maxStreakLabel: "最高記録",
    daysUnit: "日",
    wordsUnit: "語",
    allMedals: "すべてのメダル",
    streakCategory: "継続目標",
    countCategory: "語彙数",
    masteredCategory: "完全習得",
    badgeProgress: "進捗",
    unlockedWatermark: "獲得済み",
    unlockedBadgeHeader: "★ 名誉メダル獲得！",
    lockedBadgeHeader: "🔒 未獲得のメダル",
    requirementsLabel: "獲得条件",
    detailProgressLabel: "現在の進捗",
    closeBtn: "閉じる",
    saving: "保存中...",
    changing: "更新中...",
    successSave: "基本情報が正常に保存され、同期されました！",
    errorConn: "接続エラーが発生しました",
    pwdMismatch: "新しいパスワードが一致しません。",
    pwdErr: "現在のパスワードが正しくありません。",
    pwdSuccess: "パスワードが正常に変更されました。",
    pwdFail: "パスワードの変更に失敗しました。",
    levelCET4: "大学英語4級 (CET4)",
    levelCET6: "大学英語6級 (CET6)",
    levelIELTS: "IELTS",
    levelTOEFL: "TOEFL",
    levelGRE: "語彙の頂点 (GRE)",
    levelCUSTOM: "カスタム学習拡張",
    badges: {
      "streak-1": {
        name: "最初の一歩",
        desc: "連続学習 1 日達成",
        longDesc: "第一歩おめでとうございます！1日継続することは一見シンプルですが、広大な言葉の海を照らす最初の一火です。",
        quote: "千里の道も一歩から。"
      },
      "streak-3": {
        name: "波に乗る",
        desc: "連続学習 3 日達成",
        longDesc: "3日間連続で困難を突破しました。自分だけの最適な復習リズムを見つけ始めています。",
        quote: "急がば回れ。ゆっくり進むことが一番の近道。"
      },
      "streak-7": {
        name: "習慣の力",
        desc: "連続学習 7 日達成",
        longDesc: "まる1週間の継続！エビングハウス忘却曲線があなたの潜在意識に根付き始めています。",
        quote: "習慣は卓越性の礎である。"
      },
      "streak-15": {
        name: "鋼の意志",
        desc: "連続学習 15 日達成",
        longDesc: "半か月間の継続！記憶することはもはや負担ではなく、言語を克服するためのあなたの鎧です。",
        quote: "精神一到何事か成らざらん。"
      },
      "streak-30": {
        name: "エビングハウスの王",
        desc: "連続学習 30 日達成",
        longDesc: "30日間の献身。あなたの自己管理と執念は極致に達しました。エビングハウスエンジンはあなたを誇りに思います！",
        quote: "自己規律は自由であり、継続は偉大さである。"
      },
      "count-5": {
        name: "ボキャブラリー始動",
        desc: "単語帳に 5 語登録",
        longDesc: "すべての高層ビルは地面から始まります。最初の単語があなたの個人エビングハウス記憶網に織り込まれました。",
        quote: "何事も始まりは難しいが、踏み出すことに価値がある。"
      },
      "count-20": {
        name: "塵も積もれば山",
        desc: "単語帳に 20 語登録",
        longDesc: "いつの間にか、単語帳に20個の高品質な単語が蓄積されました。引き続き記憶を積み重ねましょう！",
        quote: "九層の台も、累土より起こる。"
      },
      "count-50": {
        name: "博学多才",
        desc: "単語帳に 50 語登録",
        longDesc: "50個の新しい単語が忘却防止モデルに組み込まれました。脳の可能性は無限大です！",
        quote: "広く学び、志を篤くし、切に問い、近くを思う。"
      },
      "count-100": {
        name: "言葉の波乗り",
        desc: "単語帳に 100 語登録",
        longDesc: "100語突破！大規模な記憶ノードを完全に制御し、本物の波乗り学習者になりました。",
        quote: "風に乗り波を割って進む時が必ず来る。白い帆を掲げて青い海を渡ろう。"
      },
      "mastered-3": {
        name: "成果の現れ",
        desc: "単語を 3 語完全習得",
        longDesc: "最初の3語を連続正解または第5段階到達により完全に長期記憶へ定着させました！",
        quote: "習うより慣れよ。雨垂れ石を穿つ。"
      },
      "mastered-10": {
        name: "実力発揮",
        desc: "単語を 10 語完全習得",
        longDesc: "10個の単語が脳の長期記憶領域に深く刻まれ、一生忘れることはありません！",
        quote: "温故知新。古きをたずねて新しきを知れば、もって師となるべし。"
      },
      "mastered-30": {
        name: "融通無碍",
        desc: "単語を 30 語完全習得",
        longDesc: "30個の核心単語を完全に習得。あなたの長期記憶効率はまったく新しいレベルに到達しました！",
        quote: "頂上に登りつめれば、周りの山々はすべて小さく見える。"
      }
    }
  },
  Spanish: {
    profileTitle: "Perfil y Medallas",
    bound: "Vinculado",
    createdAt: "Fecha de creación",
    logout: "Cerrar sesión",
    basicInfo: "Editar información básica",
    basicInfoDesc: "Modifique sus parámetros personales en el salón de memoria de Ebbinghaus",
    emailLabel: "Correo vinculado (Solo lectura)",
    nicknameLabel: "Apodo",
    levelLabel: "Nivel de preparación / Configuración de vocabulario",
    dailyGoalLabel: "Objetivo diario de revisión (Palabras)",
    saveBtn: "Guardar perfil",
    changePwdTitle: "Cambiar contraseña",
    changePwdDesc: "Para la seguridad de sus datos, cambie su contraseña regularmente",
    oldPwdLabel: "Contraseña actual",
    oldPwdPlaceholder: "Ingrese la contraseña actual",
    newPwdLabel: "Nueva contraseña",
    newPwdPlaceholder: "Mínimo 6 caracteres",
    confirmPwdLabel: "Confirmar nueva contraseña",
    confirmPwdPlaceholder: "Ingrese la nueva contraseña de nuevo",
    changePwdBtn: "Cambiar contraseña",
    medalWallTitle: "Mi muro de medallas",
    medalWallDesc: "La autodisciplina construye la excelencia. Desbloquee medallas para presenciar su brillante viaje contra el olvido.",
    litCount: "Desbloqueado",
    streakLabel: "Racha actual",
    maxStreakLabel: "Racha máxima",
    daysUnit: "días",
    wordsUnit: "palabras",
    allMedals: "Todas las medallas",
    streakCategory: "Racha",
    countCategory: "Vocabulario",
    masteredCategory: "Dominio",
    badgeProgress: "Progreso",
    unlockedWatermark: "Desbloqueado",
    unlockedBadgeHeader: "★ Medalla de Honor Desbloqueada",
    lockedBadgeHeader: "🔒 Medalla Bloqueada",
    requirementsLabel: "Requisitos",
    detailProgressLabel: "Progreso actual",
    closeBtn: "Cerrar detalles",
    saving: "Guardando...",
    changing: "Actualizando...",
    successSave: "¡Información guardada y sincronizada correctamente!",
    errorConn: "Error de conexión",
    pwdMismatch: "Las nuevas contraseñas no coinciden.",
    pwdErr: "Contraseña actual incorrecta.",
    pwdSuccess: "Contraseña cambiada con éxito.",
    pwdFail: "Error al cambiar la contraseña.",
    levelCET4: "Inglés Universitario Nivel 4 (CET4)",
    levelCET6: "Inglés Universitario Nivel 6 (CET6)",
    levelIELTS: "IELTS",
    levelTOEFL: "TOEFL",
    levelGRE: "Vocabulario GRE",
    levelCUSTOM: "Extensión personalizada",
    badges: {
      "streak-1": {
        name: "Primer Destello",
        desc: "Revisar durante 1 día seguido",
        longDesc: "¡Felicitaciones por dar el primer paso! Revisar un solo día puede parecer simple, pero es el destello que ilumina su vasto océano de palabras.",
        quote: "Un viaje de mil millas comienza con un solo paso."
      },
      "streak-3": {
        name: "En el Ritmo",
        desc: "Revisar durante 3 días seguidos",
        longDesc: "3 días consecutivos superando dificultades. Ha encontrado con éxito su ritmo personal de revisión.",
        quote: "Vísteme despacio que tengo prisa. Despacio es rápido."
      },
      "streak-7": {
        name: "Hábito Natural",
        desc: "Revisar durante 7 días seguidos",
        longDesc: "¡Una semana completa de perseverancia! La curva de Ebbinghaus ha comenzado a arraigarse en su subconsciente.",
        quote: "El hábito es la piedra angular de la excelencia."
      },
      "streak-15": {
        name: "Voluntad de Hierro",
        desc: "Revisar durante 15 días seguidos",
        longDesc: "¡Defensa consecutiva durante medio mes! La memoria ya no es una carga, sino su armadura para conquistar idiomas.",
        quote: "La sinceridad rompe incluso el metal y la piedra."
      },
      "streak-30": {
        name: "Rey de Ebbinghaus",
        desc: "Revisar durante 30 días seguidos",
        longDesc: "Treinta días de dedicación. ¡Su autodisciplina y persistencia han alcanzado un reino divino!",
        quote: "La autodisciplina es libertad; la persistencia es grandeza."
      },
      "count-5": {
        name: "Lanzamiento de Vocabulario",
        desc: "Acumular 5 palabras en la biblioteca",
        longDesc: "Todo rascacielos comienza desde el suelo. Sus primeras palabras han sido tejidas en su red de memoria.",
        quote: "Todo comienzo es difícil, pero despegar ya es un éxito."
      },
      "count-20": {
        name: "Castillo de Arena",
        desc: "Acumular 20 palabras en la biblioteca",
        longDesc: "Poco a poco, su vocabulario ha crecido a 20 palabras de alta calidad. ¡Siga sumando ladrillos!",
        quote: "Una plataforma de nueve pisos comienza con un montón de tierra."
      },
      "count-50": {
        name: "Erudito",
        desc: "Acumular 50 palabras en la biblioteca",
        longDesc: "50 palabras nuevas se han incorporado a su modelo de prevención de olvido. ¡Su cerebro está explotando!",
        quote: "Aprenda ampliamente, sea firme en su resolución, pregunte con seriedad y reflexione de cerca."
      },
      "count-100": {
        name: "Cabalgando las Olas",
        desc: "Acumular 100 palabras en la biblioteca",
        longDesc: "¡100 palabras conquistadas! Ha dominado con éxito nodos de memoria a gran escala y ahora es un jinete de olas.",
        quote: "Llegará el momento de cabalgar el viento y cortar las olas, cruzando el profundo mar azul."
      },
      "mastered-3": {
        name: "Éxito Temprano",
        desc: "Dominar 3 palabras por completo",
        longDesc: "¡Las primeras 3 palabras se han dominado completamente a través de revisiones correctas consecutivas!",
        quote: "La práctica hace al maestro; la gota constante perfora la piedra."
      },
      "mastered-10": {
        name: "Muestra de Habilidad",
        desc: "Dominar 10 palabras por completo",
        longDesc: "¡10 palabras están profundamente grabadas en el área de memoria a largo plazo de su cerebro!",
        quote: "Revisar lo antiguo para conocer lo nuevo le permite a uno ser maestro."
      },
      "mastered-30": {
        name: "Dominio Absoluto",
        desc: "Dominar 30 palabras por completo",
        longDesc: "¡30 palabras clave están completamente integradas, elevando su memoria a largo plazo a un nivel superior!",
        quote: "Una vez que ascienda a la cima de la montaña, todas las demás colinas parecerán pequeñas."
      }
    }
  },
  French: {
    profileTitle: "Profil & Médailles",
    bound: "Lié",
    createdAt: "Créé le",
    logout: "Se déconnecter",
    basicInfo: "Modifier le profil",
    basicInfoDesc: "Modifiez vos paramètres personnels dans le hall de mémoire d'Ebbinghaus",
    emailLabel: "Email associé (Lecture seule)",
    nicknameLabel: "Pseudo",
    levelLabel: "Niveau de préparation / Configuration du lexique",
    dailyGoalLabel: "Objectif de révision quotidien (Mots)",
    saveBtn: "Enregistrer le profil",
    changePwdTitle: "Modifier le mot de passe",
    changePwdDesc: "Pour la sécurité de vos données, veuillez modifier régulièrement votre mot de passe",
    oldPwdLabel: "Mot de passe actuel",
    oldPwdPlaceholder: "Entrez le mot de passe actuel",
    newPwdLabel: "Nouveau mot de passe",
    newPwdPlaceholder: "Au moins 6 caractères",
    confirmPwdLabel: "Confirmer le nouveau mot de passe",
    confirmPwdPlaceholder: "Entrez à nouveau le nouveau mot de passe",
    changePwdBtn: "Modifier le mot de passe",
    medalWallTitle: "Mon mur de médailles",
    medalWallDesc: "L'autodiscipline engendre l'excellence. Débloquez des médailles pour témoigner de votre brillant voyage contre l'oubli.",
    litCount: "Débloqué",
    streakLabel: "Série actuelle",
    maxStreakLabel: "Série max",
    daysUnit: "jours",
    wordsUnit: "mots",
    allMedals: "Toutes les médailles",
    streakCategory: "Série",
    countCategory: "Vocabulaire",
    masteredCategory: "Maîtrise",
    badgeProgress: "Progression",
    unlockedWatermark: "Débloqué",
    unlockedBadgeHeader: "★ Médaille d'honneur Débloquée",
    lockedBadgeHeader: "🔒 Médaille Verrouillée",
    requirementsLabel: "Exigences",
    detailProgressLabel: "Progression actuelle",
    closeBtn: "Fermer les détails",
    saving: "Enregistrement...",
    changing: "Mise à jour...",
    successSave: "Informations enregistrées et synchronisées avec succès !",
    errorConn: "Erreur de connexion",
    pwdMismatch: "Les nouveaux mots de passe ne correspondent pas.",
    pwdErr: "Mot de passe actuel incorrect.",
    pwdSuccess: "Mot de passe modifié avec succès.",
    pwdFail: "Échec de la modification du mot de passe.",
    levelCET4: "Anglais Universitaire Niveau 4 (CET4)",
    levelCET6: "Anglais Universitaire Niveau 6 (CET6)",
    levelIELTS: "IELTS",
    levelTOEFL: "TOEFL",
    levelGRE: "Vocabulaire GRE",
    levelCUSTOM: "Extension personnalisée",
    badges: {
      "streak-1": {
        name: "Première Étincelle",
        desc: "Réviser pendant 1 jour consécutif",
        longDesc: "Félicitations pour votre premier pas ! Réviser un seul jour peut sembler simple, mais c'est l'étincelle qui illumine votre vaste océan de mots.",
        quote: "Un voyage de mille milles commence par un seul pas."
      },
      "streak-3": {
        name: "Dans le Rythme",
        desc: "Réviser pendant 3 jours consécutifs",
        longDesc: "3 jours consécutifs à surmonter les difficultés. Vous avez trouvé avec succès votre rythme de révision.",
        quote: "Hâte-toi lentement. Doucement c'est rapide."
      },
      "streak-7": {
        name: "Habitude Naturelle",
        desc: "Réviser pendant 7 jours consécutifs",
        longDesc: "Une semaine entière de persévérance ! La courbe d'Ebbinghaus commence à s'ancrer dans votre subconscient.",
        quote: "L'habitude est la pierre angulaire de l'excellence."
      },
      "streak-15": {
        name: "Volonté de Fer",
        desc: "Réviser pendant 15 jours consécutifs",
        longDesc: "Persévérance pendant un demi-mois ! La mémoire n'est plus un fardeau, mais votre armure pour conquérir les langues.",
        quote: "La sincérité fend même le métal et la pierre."
      },
      "streak-30": {
        name: "Roi d'Ebbinghaus",
        desc: "Réviser pendant 30 jours consécutifs",
        longDesc: "Trente jours de dévouement. Votre autodiscipline et votre persévérance ont atteint un niveau divin !",
        quote: "L'autodiscipline est la liberté ; la persévérance est la grandeur."
      },
      "count-5": {
        name: "Lancement Lexical",
        desc: "Cumuler 5 mots dans la bibliothèque",
        longDesc: "Chaque gratte-ciel commence au sol. Vos premiers mots ont été tissés dans votre filet de mémoire.",
        quote: "Chaque commencement est difficile, mais décoller est déjà un succès."
      },
      "count-20": {
        name: "Château de Sable",
        desc: "Cumuler 20 mots dans la bibliothèque",
        longDesc: "Petit à petit, votre vocabulaire s'est enrichi de 20 mots de haute qualité. Continuez à bâtir !",
        quote: "Une plate-forme de neuf étages commence par un tas de terre."
      },
      "count-50": {
        name: "Érudit",
        desc: "Cumuler 50 mots dans la bibliothèque",
        longDesc: "50 nouveaux mots ont été incorporés dans votre modèle de prévention de l'oubli. Votre cerveau bouillonne !",
        quote: "Apprenez largement, soyez ferme dans votre résolution, interrogez sérieusement et réfléchissez de près."
      },
      "count-100": {
        name: "Surgir sur les Vagues",
        desc: "Cumuler 100 mots dans la bibliothèque",
        longDesc: "100 mots conquis ! Vous avez maîtrisé avec succès des nœuds de mémoire à grande échelle.",
        quote: "Le temps viendra de chevaucher le vent et de fendre les vagues, traversant la mer d'un bleu profond."
      },
      "mastered-3": {
        name: "Succès Précoce",
        desc: "Maîtriser complètement 3 mots",
        longDesc: "Les 3 premiers mots ont été parfaitement maîtrisés grâce à des révisions correctes consécutives !",
        quote: "C'est en forgeant qu'on devient forgeron ; la goute d'eau finit par creuser la pierre."
      },
      "mastered-10": {
        name: "Démonstration de Force",
        desc: "Maîtriser complètement 10 mots",
        longDesc: "10 mots sont profondément gravés dans la zone de mémoire à long terme de votre cerveau !",
        quote: "C'est en révisant l'ancien qu'on apprend le nouveau pour pouvoir enseigner."
      },
      "mastered-30": {
        name: "Maîtrise Absolue",
        desc: "Maîtriser complètement 30 mots",
        longDesc: "30 mots clés sont entièrement intégrés, propulsant votre mémoire à un niveau supérieur !",
        quote: "Une fois parvenu au sommet de la montagne, toutes les autres collines sembleront bien petites."
      }
    }
  },
  Portuguese: {
    profileTitle: "Perfil e Medalhas",
    bound: "Vinculado",
    createdAt: "Criado em",
    logout: "Sair",
    basicInfo: "Editar Perfil",
    basicInfoDesc: "Modifique seus parâmetros pessoais no salão de memória do Ebbinghaus",
    emailLabel: "E-mail vinculado (Apenas leitura)",
    nicknameLabel: "Apelido",
    levelLabel: "Nível de preparação / Configuração do vocabulário",
    dailyGoalLabel: "Meta diária de revisão (Palavras)",
    saveBtn: "Salvar perfil",
    changePwdTitle: "Alterar senha",
    changePwdDesc: "Para segurança dos seus dados, altere sua senha regularmente",
    oldPwdLabel: "Senha atual",
    oldPwdPlaceholder: "Digite a senha atual",
    newPwdLabel: "Nova senha",
    newPwdPlaceholder: "Mínimo de 6 caracteres",
    confirmPwdLabel: "Confirmar nova senha",
    confirmPwdPlaceholder: "Digite a nova senha novamente",
    changePwdBtn: "Alterar senha",
    medalWallTitle: "Meu mural de medalhas",
    medalWallDesc: "A autodisciplina constrói a excelência. Desbloqueie medalhas para testemunhar sua brilhante jornada contra o esquecimento.",
    litCount: "Desbloqueado",
    streakLabel: "Sequência atual",
    maxStreakLabel: "Sequência máxima",
    daysUnit: "dias",
    wordsUnit: "palavras",
    allMedals: "Todas as medalhas",
    streakCategory: "Sequência",
    countCategory: "Vocabulário",
    masteredCategory: "Domínio",
    badgeProgress: "Progresso",
    unlockedWatermark: "Desbloqueado",
    unlockedBadgeHeader: "★ Medalha de Honra Desbloqueada",
    lockedBadgeHeader: "🔒 Medalha Bloqueada",
    requirementsLabel: "Requisitos",
    detailProgressLabel: "Progresso atual",
    closeBtn: "Fechar detalhes",
    saving: "Salvando...",
    changing: "Atualizando...",
    successSave: "Informações salvas e sincronizadas com sucesso!",
    errorConn: "Erro de conexão",
    pwdMismatch: "As novas senhas não coincidem.",
    pwdErr: "Senha atual incorreta.",
    pwdSuccess: "Senha alterada com sucesso.",
    pwdFail: "Falha ao alterar a senha.",
    levelCET4: "Inglês Universitário Nível 4 (CET4)",
    levelCET6: "Inglês Universitário Nível 6 (CET6)",
    levelIELTS: "IELTS",
    levelTOEFL: "TOEFL",
    levelGRE: "Vocabulário GRE",
    levelCUSTOM: "Extensão personalizada",
    badges: {
      "streak-1": {
        name: "Primeira Faísca",
        desc: "Revisar por 1 dia consecutivo",
        longDesc: "Parabéns por dar o primeiro passo! Revisar um único dia pode parecer simples, mas é a faísca que ilumina seu vasto oceano de palavras.",
        quote: "Uma jornada de mil milhas começa com um único passo."
      },
      "streak-3": {
        name: "No Ritmo",
        desc: "Revisar por 3 dias consecutivos",
        longDesc: "3 dias consecutivos superando dificuldades. Você encontrou com sucesso o seu ritmo pessoal de revisão.",
        quote: "Devagar se vai ao longe. Devagar é rápido."
      },
      "streak-7": {
        name: "Hábito Natural",
        desc: "Revisar por 7 dias consecutivos",
        longDesc: "Uma semana inteira de perseverança! A curva de Ebbinghaus começou a se enraizar no seu subconsciente.",
        quote: "O hábito é a pedra angular da excelência."
      },
      "streak-15": {
        name: "Vontade de Ferro",
        desc: "Revisar por 15 dias consecutivos",
        longDesc: "Persistência por meio mês! A memória não é mais um fardo, mas a sua armadura para conquistar idiomas.",
        quote: "A sinceridade quebra até mesmo metal e pedra."
      },
      "streak-30": {
        name: "Rei do Ebbinghaus",
        desc: "Revisar por 30 dias consecutivos",
        longDesc: "Trinta dias de dedicação. Sua autodisciplina e persistência alcançaram um nível divino!",
        quote: "Autodisciplina é liberdade; persistência é grandeza."
      },
      "count-5": {
        name: "Lançamento Lexical",
        desc: "Acumular 5 palavras na biblioteca",
        longDesc: "Todo arranha-céu começa do chão. Suas primeiras palavras foram tecidas na sua rede de memória.",
        quote: "Todo começo é difícil, mas decolar já é um sucesso."
      },
      "count-20": {
        name: "Castelo de Areia",
        desc: "Acumular 20 palavras na biblioteca",
        longDesc: "Pouco a pouco, seu vocabulário cresceu para 20 palavras de alta qualidade. Continue construindo!",
        quote: "Uma plataforma de nove andares começa com um monte de terra."
      },
      "count-50": {
        name: "Erudito",
        desc: "Acumular 50 palavras na biblioteca",
        longDesc: "50 novas palavras foram introduadas ao seu modelo de prevenção do esquecimento. Seu cérebro está explodindo!",
        quote: "Aprenda amplamente, seja firme na sua resolução, pergunte com seriedade e reflita de perto."
      },
      "count-100": {
        name: "Desbravando as Ondas",
        desc: "Acumular 100 palavras na biblioteca",
        longDesc: "100 palavras conquistadas! Você dominou com sucesso nós de memória em grande escala.",
        quote: "Chegará o momento de cavalgar o vento e cortar as ondas, cruzando o profundo mar azul."
      },
      "mastered-3": {
        name: "Sucesso Precoce",
        desc: "Dominar 3 palavras completamente",
        longDesc: "As primeiras 3 palavras foram totalmente dominadas através de revisões corretas consecutivas!",
        quote: "A prática leva à perfeição; a gota d'água perfura a pedra."
      },
      "mastered-10": {
        name: "Demonstração de Habilidade",
        desc: "Dominar 10 palavras completamente",
        longDesc: "10 palavras estão profundamente gravadas na área de memória de longo prazo do seu cérebro!",
        quote: "Rever o antigo para conhecer o novo permite que alguém seja um professor."
      },
      "mastered-30": {
        name: "Domínio Absoluto",
        desc: "Dominar 30 palavras completamente",
        longDesc: "30 palavras-chave estão totalmente integradas, elevando sua memória a um nível superior!",
        quote: "Uma vez que subo ao topo da montanha, todas as outras colinas parecem pequenas."
      }
    }
  }
};

export default function Profile({ user, token, stats, onProfileUpdate, onLogout, selectedLanguage = "English", useTargetUi = false }: ProfileProps) {
  const langKey = (selectedLanguage === "All" || !selectedLanguage) ? "English" : selectedLanguage;
  const p = useTargetUi ? (profileTranslations[langKey] || profileTranslations.English) : profileTranslations.Chinese;

  // Profile modification states
  const [name, setName] = useState(user.name);
  const [dailyGoal, setDailyGoal] = useState(String(user.dailyGoal ?? 15));
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
    { id: "all", name: p.allMedals },
    { id: "streak", name: p.streakCategory },
    { id: "count", name: p.countCategory },
    { id: "mastered", name: p.masteredCategory }
  ];

  const filteredBadges = badgeDefinitions.filter(badge => {
    if (activeCategory === "all") return true;
    return badge.category === activeCategory;
  });

  useEffect(() => {
    setName(user.name);
    setDailyGoal(String(user.dailyGoal ?? 15));
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
        body: JSON.stringify({ name, dailyGoal: Number(dailyGoal) || 15, language: langKey })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (useTargetUi ? "Update failed" : "修改失败"));
      }

      setProfileMsg({ type: "success", text: p.successSave });
      onProfileUpdate(data);
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || p.errorConn });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: p.pwdMismatch });
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
        throw new Error(data.error || p.pwdErr);
      }

      setPasswordMsg({ type: "success", text: p.pwdSuccess });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || p.pwdFail });
    } finally {
      setIsChangingPwd(false);
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
                <span>{p.bound}</span>
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-light flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email}</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-300" />
              <span>{p.createdAt}: {new Date(user.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
        >
          {p.logout}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Modify Basic Info */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-indigo-500" />
              <span>{p.basicInfo}</span>
            </h3>
            <p className="text-xs text-slate-400 font-light">
              {p.basicInfoDesc}
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
                {p.emailLabel}
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
                {p.nicknameLabel}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium"
              />
            </div>

            {/* Daily Goal */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span>{p.dailyGoalLabel}</span>
              </label>
              <input
                type="number"
                min={5}
                max={200}
                required
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
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
                  <span>{p.saveBtn}</span>
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
              <span>{p.changePwdTitle}</span>
            </h3>
            <p className="text-xs text-slate-400 font-light">
              {p.changePwdDesc}
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
                {p.oldPwdLabel}
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={p.oldPwdPlaceholder}
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium placeholder:text-slate-300"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {p.newPwdLabel}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={p.newPwdPlaceholder}
                className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium placeholder:text-slate-300"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {p.confirmPwdLabel}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={p.confirmPwdPlaceholder}
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
                  <span>{p.changePwdBtn}</span>
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
              <span>{p.medalWallTitle}</span>
            </h3>
            <p className="text-xs text-slate-400 font-light">
              {p.medalWallDesc}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 flex items-center gap-4 text-xs font-mono text-slate-600 self-start sm:self-auto">
            <div>
              {p.litCount}: <span className="font-bold text-indigo-600">{unlockedCount}</span> / {badgeDefinitions.length}
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div>
              {p.streakLabel}: <span className="font-bold text-orange-500">{currentStreak}</span> {p.daysUnit}
            </div>
            <div className="w-px h-4 bg-slate-200 text-slate-300"></div>
            <div>
              {p.maxStreakLabel}: <span className="font-bold text-indigo-500">{maxStreak}</span> {p.daysUnit}
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
            const badgeTrans = p.badges[badge.id] || { name: badge.name, desc: badge.description };

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
                  {badgeTrans.name}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 font-light leading-snug line-clamp-2 px-1 h-7 flex items-center justify-center">
                  {badgeTrans.desc}
                </p>

                {/* Progress Mini Bar */}
                <div className="w-full mt-3 space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                    <span>{p.badgeProgress}</span>
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
                    {p.unlockedWatermark}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Badge Detail Dialog / Modal */}
      {selectedBadge && (() => {
        const badgeTrans = p.badges[selectedBadge.id] || { 
          name: selectedBadge.name, 
          desc: selectedBadge.description,
          longDesc: selectedBadge.longDesc,
          quote: selectedBadge.quote
        };
        const isUnlocked = checkUnlocked(selectedBadge);
        return (
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
                  isUnlocked
                    ? `bg-gradient-to-tr ${selectedBadge.color} text-white shadow-xl ${selectedBadge.glowColor}/40 ring-4 ring-indigo-50`
                    : "bg-slate-100 text-slate-300"
                }`}>
                  <BadgeIcon iconName={selectedBadge.icon} className="w-10 h-10 animate-pulse" />
                </div>

                <div>
                  <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 ${
                    isUnlocked
                      ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                      : "bg-slate-100 border border-slate-200 text-slate-400"
                  }`}>
                    {isUnlocked ? p.unlockedBadgeHeader : p.lockedBadgeHeader}
                  </span>
                  <h3 className="font-display font-black text-slate-900 text-xl tracking-tight">
                    {badgeTrans.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {p.requirementsLabel}: {badgeTrans.desc}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4.5 text-left border border-slate-100 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed font-light">
                  {badgeTrans.longDesc}
                </p>
                {isUnlocked && (
                  <div className="pt-2.5 border-t border-slate-200/60 text-center">
                    <p className="text-[11px] italic font-serif text-indigo-600/90 leading-normal">
                      “ {badgeTrans.quote} ”
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400 px-1 font-mono">
                  <span>{p.detailProgressLabel}</span>
                  <span className="font-semibold text-slate-700">
                    {getProgress(selectedBadge)} / {selectedBadge.threshold}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isUnlocked ? `bg-gradient-to-r ${selectedBadge.color}` : "bg-slate-300"
                    }`}
                    style={{ width: `${Math.min(100, (getProgress(selectedBadge) / selectedBadge.threshold) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
              >
                {p.closeBtn}
              </button>
            </motion.div>
          </div>
        );
      })()}

    </div>

  );
}
