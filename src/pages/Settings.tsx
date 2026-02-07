import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Lock, Eye, EyeOff, Check, Loader2, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const Settings = () => {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (newPassword.length < 6) {
            toast.error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('كلمة المرور الجديدة وتأكيدها غير متطابقتين');
            return;
        }

        setSubmitting(true);

        try {
            // Update password using Supabase Auth
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast.success('تم تغيير كلمة المرور بنجاح!');

            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
        } finally {
            setSubmitting(false);
        }
    };

    const passwordStrength = (password: string) => {
        if (password.length === 0) return { strength: 0, label: '', color: '' };
        if (password.length < 6) return { strength: 1, label: 'ضعيفة', color: 'bg-destructive' };
        if (password.length < 8) return { strength: 2, label: 'متوسطة', color: 'bg-accent' };
        if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
            return { strength: 4, label: 'قوية جداً', color: 'bg-primary' };
        }
        return { strength: 3, label: 'جيدة', color: 'bg-emerald-500' };
    };

    const strength = passwordStrength(newPassword);

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-2xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 text-center"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                            <SettingsIcon className="h-4 w-4" />
                            الإعدادات
                        </span>
                        <h1 className="mt-4 font-amiri text-3xl font-bold text-foreground">
                            إعدادات الحساب
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            إدارة حسابك وتغيير كلمة المرور
                        </p>
                    </motion.div>

                    {/* Account Info Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6 rounded-2xl border border-border bg-card p-6"
                    >
                        <h2 className="mb-4 flex items-center gap-2 font-amiri text-lg font-bold text-foreground">
                            <User className="h-5 w-5 text-primary" />
                            معلومات الحساب
                        </h2>
                        <div className="flex items-center gap-3 rounded-xl bg-background/50 p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                                <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                                <p className="font-medium text-foreground" dir="ltr">{user?.email}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Password Change Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl border border-border bg-card p-6"
                    >
                        <h2 className="mb-6 flex items-center gap-2 font-amiri text-lg font-bold text-foreground">
                            <Lock className="h-5 w-5 text-primary" />
                            تغيير كلمة المرور
                        </h2>

                        <form onSubmit={handlePasswordChange} className="space-y-5">
                            {/* New Password */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    كلمة المرور الجديدة
                                </label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type={showNewPassword ? 'text' : 'password'}
                                        placeholder="أدخل كلمة المرور الجديدة"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pr-10 pl-10"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {newPassword.length > 0 && (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(strength.strength / 4) * 100}%` }}
                                                    className={`h-full ${strength.color}`}
                                                />
                                            </div>
                                            <span className={`text-xs font-medium ${strength.color.replace('bg-', 'text-')}`}>
                                                {strength.label}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                    تأكيد كلمة المرور الجديدة
                                </label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="أعد إدخال كلمة المرور الجديدة"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pr-10 pl-10"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Match Indicator */}
                                {confirmPassword.length > 0 && (
                                    <div className="mt-2 flex items-center gap-1.5">
                                        {newPassword === confirmPassword ? (
                                            <>
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                <span className="text-xs text-emerald-500">كلمتا المرور متطابقتان</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                                                <span className="text-xs text-destructive">كلمتا المرور غير متطابقتين</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full gap-2"
                                disabled={submitting || newPassword.length < 6 || newPassword !== confirmPassword}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        جارٍ التغيير...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4" />
                                        تغيير كلمة المرور
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Security Tips */}
                        <div className="mt-6 rounded-xl bg-primary/5 border border-primary/10 p-4">
                            <h3 className="text-sm font-bold text-foreground mb-2">نصائح لكلمة مرور قوية:</h3>
                            <ul className="space-y-1 text-xs text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-primary" />
                                    استخدم 8 أحرف على الأقل
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-primary" />
                                    اجمع بين الأحرف الكبيرة والصغيرة
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-primary" />
                                    أضف أرقامًا ورموزًا خاصة
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-primary" />
                                    تجنب استخدام كلمات شائعة أو معلومات شخصية
                                </li>
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Settings;
