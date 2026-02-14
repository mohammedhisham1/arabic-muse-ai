import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles, ArrowRight, Phone, Globe, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'login' | 'register' | 'forgot';

const Auth = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Redirect based on role when user is authenticated
  useEffect(() => {
    console.log('Auth page state:', { loading, user: user?.email, role });

    if (!loading && user) {
      // User is logged in
      if (role) {
        // Has a role - show success and redirect
        setLoginSuccess(true);
        const timer = setTimeout(() => {
          if (role === 'admin') {
            navigate('/admin');
          } else if (role === 'teacher') {
            navigate('/teacher-dashboard');
          } else {
            // Students go to homepage
            navigate('/');
          }
        }, 1000); // 1 second delay for animation
        return () => clearTimeout(timer);
      } else {
        // No role - redirect to homepage
        console.log('No role found, redirecting to homepage');
        navigate('/');
      }
    }
  }, [user, role, loading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Determine the correct redirect URL (use production URL, not localhost)
      const siteUrl = import.meta.env.PROD
        ? 'https://arabic-muse-ai.netlify.app'
        : window.location.origin;

      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteUrl}/settings`,
        });
        if (error) throw error;
        toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
        setMode('login');
        setSubmitting(false);
        return;
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              age: age,
              phone_number: phone,
              country: country
            },
            emailRedirectTo: siteUrl,
          },
        });
        if (error) throw error;
        toast.success('تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب.');
        // Switch to login mode after successful registration
        setMode('login');
        setSubmitting(false);
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Translate common error messages to Arabic
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('يرجى تأكيد بريدك الإلكتروني أولاً');
          } else if (error.message.includes('Too many requests')) {
            throw new Error('محاولات كثيرة، يرجى الانتظار قليلاً');
          }
          throw error;
        }
        toast.success('تم تسجيل الدخول بنجاح!');
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
      setSubmitting(false);
    }
  };

  // Show beautiful loading screen only after successful login
  if (loginSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Logo Animation */}
          <motion.div
            animate={{
              rotate: loginSuccess ? 360 : 0,
              scale: loginSuccess ? [1, 1.2, 1] : 1
            }}
            transition={{
              duration: loginSuccess ? 0.6 : 0,
              ease: "easeInOut"
            }}
            className="relative mx-auto mb-6"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/30 blur-xl" />

              {/* Main logo */}
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                <PenTool className="h-10 w-10" />
              </div>
            </div>

            {/* Sparkles for success */}
            {loginSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="h-6 w-6 text-amber-400" />
              </motion.div>
            )}
          </motion.div>

          {/* App Name */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-amiri text-3xl font-bold text-foreground mb-4"
          >
            قلم
          </motion.h1>

          {/* Loading message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            {loginSuccess ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
                <p className="text-lg font-medium text-foreground">مرحبًا بعودتك!</p>
                <p className="text-sm text-muted-foreground">جارٍ تحويلك...</p>
              </>
            ) : (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">جارٍ التحميل...</p>
              </>
            )}
          </motion.div>

          {/* Progress bar for success */}
          {loginSuccess && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              className="mt-6 h-1 max-w-[200px] mx-auto overflow-hidden rounded-full bg-muted"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-emerald-500"
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
          >
            <PenTool className="h-7 w-7" />
          </motion.div>
          <h1 className="font-amiri text-3xl font-bold text-foreground">
            {mode === 'login' ? 'تسجيل الدخول' : mode === 'register' ? 'إنشاء حساب جديد' : 'إعادة تعيين كلمة المرور'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {mode === 'login' ? 'أدخل بياناتك للدخول إلى المنصة' : mode === 'register' ? 'أنشئ حسابًا جديدًا للبدء' : 'أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="relative">
                  <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="الاسم الكامل"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="السن"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="رقم الهاتف"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>

                <div className="relative">
                  <Globe className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="البلد"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pr-10"
              required
              dir="ltr"
            />
          </div>

          {/* Password field - hidden in forgot mode */}
          {mode !== 'forgot' && (
            <div className="relative">
              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 pl-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          )}

          {/* Forgot Password Link - only show in login mode */}
          {mode === 'login' && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ المعالجة...
              </>
            ) : mode === 'login' ? (
              'دخول'
            ) : mode === 'register' ? (
              'إنشاء حساب'
            ) : (
              'إرسال رابط إعادة التعيين'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'forgot' ? (
            <button
              onClick={() => setMode('login')}
              className="text-sm text-primary hover:underline transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowRight className="h-4 w-4" />
              العودة لتسجيل الدخول
            </button>
          ) : (
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setPassword('');
              }}
              className="text-sm text-primary hover:underline transition-colors"
            >
              {mode === 'login' ? 'ليس لديك حساب؟ أنشئ حسابًا جديدًا' : 'لديك حساب بالفعل؟ سجل الدخول'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
