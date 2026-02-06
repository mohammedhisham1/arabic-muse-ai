import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenTool, GraduationCap, BookUser, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'login' | 'register';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const showRoleStep = searchParams.get('step') === 'role';
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If user is logged in and has a role, redirect
  if (user && role && !showRoleStep) {
    navigate(role === 'teacher' ? '/teacher-dashboard' : '/creative-writing');
    return null;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('تم تسجيل الدخول بنجاح!');
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleSelect = async (selectedRole: 'student' | 'teacher') => {
    setSubmitting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('user_roles')
        .insert({ user_id: currentUser.id, role: selectedRole });

      if (error) throw error;
      toast.success('تم تحديد الدور بنجاح!');
      window.location.href = selectedRole === 'teacher' ? '/teacher-dashboard' : '/creative-writing';
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  // Role selection screen
  if (user && !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8"
        >
          <div className="text-center mb-8">
            <h1 className="font-amiri text-3xl font-bold text-foreground">اختر دورك</h1>
            <p className="mt-2 text-muted-foreground">حدد طريقة استخدامك للمنصة</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleRoleSelect('student')}
              disabled={submitting}
              className="group w-full rounded-xl border-2 border-border bg-card p-6 text-right transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-amiri text-lg font-bold text-foreground">متعلم</h3>
                  <p className="text-sm text-muted-foreground">تعلم الكتابة الإبداعية وطور مهاراتك</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('teacher')}
              disabled={submitting}
              className="group w-full rounded-xl border-2 border-border bg-card p-6 text-right transition-all hover:border-accent hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <BookUser className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-amiri text-lg font-bold text-foreground">معلم</h3>
                  <p className="text-sm text-muted-foreground">تابع تقدم طلابك واطلع على تقاريرهم</p>
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <PenTool className="h-7 w-7" />
          </div>
          <h1 className="font-amiri text-3xl font-bold text-foreground">
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {mode === 'login' ? 'أدخل بياناتك للدخول إلى المنصة' : 'أنشئ حسابًا جديدًا للبدء'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'register' && (
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
          )}

          <div className="relative">
            <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pr-10"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'جارٍ المعالجة...' : mode === 'login' ? 'دخول' : 'إنشاء حساب'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm text-primary hover:underline"
          >
            {mode === 'login' ? 'ليس لديك حساب؟ أنشئ حسابًا جديدًا' : 'لديك حساب بالفعل؟ سجل الدخول'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
