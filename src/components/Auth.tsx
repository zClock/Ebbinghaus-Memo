import React, { useState } from "react";
import { Mail, Lock, User, Target, GraduationCap, ArrowRight, BookOpen, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface AuthProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState("CET4");
  const [dailyGoal, setDailyGoal] = useState(15);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin 
      ? { email, password } 
      : { email, password, name, level, dailyGoal: Number(dailyGoal) };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "请求失败，请稍后重试。");
      }

      setSuccessMsg(isLogin ? "登录成功！" : "注册成功！已为您生成专属艾宾初始词库。");
      
      // Delay success redirect slightly to let users see the state transition
      setTimeout(() => {
        onAuthSuccess(data.token, data.user);
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || "连接服务器失败。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500/20 selection:text-indigo-900">
      
      {/* Dynamic Floating Logo Accent */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 bg-indigo-600 rounded-2xl items-center justify-center text-white font-semibold shadow-xl shadow-indigo-100 mb-4 animate-bounce">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="font-display font-black text-3xl text-slate-900 tracking-tight">
          Ebbinghaus Memo
        </h2>
        <p className="mt-1 text-xs font-mono text-indigo-600 font-semibold tracking-wider uppercase">
          艾宾浩斯智能记忆引擎
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-100 shadow-xl rounded-3xl sm:px-10">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-100 pb-4 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMsg("");
              }}
              className={`flex-1 text-center py-2 text-sm font-semibold transition-all ${
                isLogin
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              登录账号
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrorMsg("");
              }}
              className={`flex-1 text-center py-2 text-sm font-semibold transition-all ${
                !isLogin
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              邮箱注册
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Error Message */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
                <BookOpen className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                电子邮箱
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-800 font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                密码
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-800 font-medium"
                />
              </div>
            </div>

            {/* Registration fields */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    个性昵称
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="如何称呼您"
                      className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-800 font-medium"
                    />
                  </div>
                </div>

                {/* Level selection & Daily goal row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Vocabulary level */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      词汇水平 / 备考
                    </label>
                    <div className="relative">
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium cursor-pointer"
                      >
                        <option value="CET4">英语四级 (CET4)</option>
                        <option value="CET6">英语六级 (CET6)</option>
                        <option value="IELTS">雅思 (IELTS)</option>
                        <option value="TOEFL">托福 (TOEFL)</option>
                        <option value="GRE">词汇巅峰 (GRE)</option>
                        <option value="CUSTOM">自学拓展 (CUSTOM)</option>
                      </select>
                    </div>
                  </div>

                  {/* Daily study goal */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      每日复习目标 (词)
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Target className="h-4 w-4" />
                      </div>
                      <input
                        type="number"
                        min={5}
                        max={200}
                        required={!isLogin}
                        value={dailyGoal}
                        onChange={(e) => setDailyGoal(Number(e.target.value))}
                        className="block w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isLogin ? "登录智能词库" : "完成注册并生成词库"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Prompt banner info */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-light leading-relaxed">
              * 艾宾浩斯记忆模型会根据您的遗忘曲线和正确率分配复习时序。
              系统数据保存在云端并与您的邮箱账号永久绑定。
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
