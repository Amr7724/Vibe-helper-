import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Lock, Mail, UserPlus, LogIn, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './Button';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('البريد الإلكتروني مستخدم بالفعل.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً.');
      } else {
        setError('حدث خطأ غير متوقع. حاول مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#000205]">
       {/* Background Elements */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-[#0A0A0A]/80 backdrop-blur-2xl rounded-[40px] shadow-2xl p-8 md:p-10 relative overflow-hidden border border-white/5">
        
        {/* Header */}
        <div className="relative z-10 mb-10">
          <h2 className="text-4xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-white/40 text-sm">
            {isLogin ? 'Enter your details to access your workspace.' : 'Create your account to start building.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-white/30 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pr-14 pl-6 py-5 bg-[#151515] border border-white/5 rounded-[20px] text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                placeholder="البريد الإلكتروني"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-white/30 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pr-14 pl-6 py-5 bg-[#151515] border border-white/5 rounded-[20px] text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                placeholder="كلمة المرور"
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-[20px] bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full !py-5 !text-lg !rounded-[25px] shadow-lg shadow-blue-500/20 mt-4 group"
          >
            {loading ? (
              <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full">
                {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </div>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center relative z-10 pt-6 border-t border-white/5">
          <p className="text-white/40 text-sm">
            {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="mr-2 font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isLogin ? 'سجل الآن' : 'ادخل هنا'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};