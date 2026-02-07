import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Mail,
    Plus,
    Trash2,
    Users,
    UserPlus,
    Settings,
    Search,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { TeacherEmail } from '@/types/database';

interface UserWithRole {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
}

const AdminDashboard = () => {
    const { user, role } = useAuth();
    const [teacherEmails, setTeacherEmails] = useState<TeacherEmail[]>([]);
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'teachers' | 'users'>('teachers');

    useEffect(() => {
        if (user && role === 'admin') {
            loadData();
        }
    }, [user, role]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load teacher emails
            const { data: emails, error: emailsError } = await (supabase as any)
                .from('teacher_emails')
                .select('*')
                .order('created_at', { ascending: false });

            if (emailsError) throw emailsError;
            setTeacherEmails(emails || []);

            // Load all users with their roles and profiles
            const { data: rolesData, error: rolesError } = await (supabase as any)
                .from('user_roles')
                .select('user_id, role');

            if (rolesError) throw rolesError;

            const { data: profilesData, error: profilesError } = await (supabase as any)
                .from('profiles')
                .select('user_id, full_name, created_at');

            if (profilesError) throw profilesError;

            // Combine the data
            const usersMap = new Map<string, UserWithRole>();

            rolesData?.forEach((r: any) => {
                usersMap.set(r.user_id, {
                    id: r.user_id,
                    email: '',
                    full_name: '',
                    role: r.role,
                    created_at: '',
                });
            });

            profilesData?.forEach((p: any) => {
                const existing = usersMap.get(p.user_id);
                if (existing) {
                    existing.full_name = p.full_name || 'غير محدد';
                    existing.created_at = p.created_at;
                }
            });

            setUsers(Array.from(usersMap.values()));
        } catch (err: any) {
            toast.error(err.message || 'حدث خطأ في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeacherEmail = async () => {
        if (!newEmail.trim()) return;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail.trim())) {
            toast.error('يرجى إدخال بريد إلكتروني صحيح');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await (supabase as any)
                .from('teacher_emails')
                .insert({ email: newEmail.trim().toLowerCase() });

            if (error) {
                if (error.code === '23505') {
                    toast.error('هذا البريد الإلكتروني موجود بالفعل');
                } else {
                    throw error;
                }
                return;
            }

            toast.success('تم إضافة البريد الإلكتروني للمعلم بنجاح!');
            setNewEmail('');
            loadData();
        } catch (err: any) {
            toast.error(err.message || 'حدث خطأ');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveTeacherEmail = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('teacher_emails')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('تم حذف البريد الإلكتروني');
            loadData();
        } catch (err: any) {
            toast.error(err.message || 'حدث خطأ');
        }
    };

    const filteredTeacherEmails = teacherEmails.filter(te =>
        te.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2.5 py-1 text-xs font-medium text-amber-600 ring-1 ring-amber-500/30">
                        <Shield className="h-3 w-3" />
                        مدير
                    </span>
                );
            case 'teacher':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary/20 to-emerald-500/20 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
                        <Users className="h-3 w-3" />
                        معلم
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500/20 to-blue-500/20 px-2.5 py-1 text-xs font-medium text-sky-600 ring-1 ring-sky-500/30">
                        <UserPlus className="h-3 w-3" />
                        طالب
                    </span>
                );
        }
    };

    const stats = {
        totalUsers: users.length,
        teachers: users.filter(u => u.role === 'teacher').length,
        students: users.filter(u => u.role === 'student').length,
        pendingTeachers: teacherEmails.length,
    };

    if (role !== 'admin') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-16 w-16 text-destructive/50" />
                    <h1 className="mt-4 font-amiri text-2xl font-bold text-foreground">غير مصرح</h1>
                    <p className="mt-2 text-muted-foreground">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="mb-8 text-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-1.5 text-sm font-medium text-amber-600 ring-1 ring-amber-500/20">
                        <Shield className="h-4 w-4" />
                        لوحة تحكم المدير
                    </span>
                    <h1 className="mt-4 font-amiri text-3xl font-bold text-foreground">
                        إدارة المنصة
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        إدارة المعلمين والمستخدمين والإعدادات
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                                <p className="mt-1 text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">المعلمين النشطين</p>
                                <p className="mt-1 text-3xl font-bold text-primary">{stats.teachers}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                                <CheckCircle className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">الطلاب</p>
                                <p className="mt-1 text-3xl font-bold text-sky-500">{stats.students}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10">
                                <UserPlus className="h-6 w-6 text-sky-500" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">بريد المعلمين المسجل</p>
                                <p className="mt-1 text-3xl font-bold text-accent">{stats.pendingTeachers}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                                <Mail className="h-6 w-6 text-accent" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-2">
                    <button
                        onClick={() => setActiveTab('teachers')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${activeTab === 'teachers'
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary'
                            }`}
                    >
                        <Mail className="h-4 w-4" />
                        بريد المعلمين
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${activeTab === 'users'
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary'
                            }`}
                    >
                        <Users className="h-4 w-4" />
                        المستخدمين
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="بحث..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'teachers' ? (
                        <motion.div
                            key="teachers"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Add Teacher Email Form */}
                            <div className="rounded-2xl border border-border bg-card p-6">
                                <h3 className="mb-4 flex items-center gap-2 font-amiri text-lg font-bold text-foreground">
                                    <UserPlus className="h-5 w-5 text-primary" />
                                    إضافة بريد معلم جديد
                                </h3>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    أضف بريد إلكتروني للمعلم. عند تسجيل المستخدم بهذا البريد، سيتم تعيينه كمعلم تلقائيًا.
                                </p>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="email"
                                            placeholder="teacher@school.com"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTeacherEmail()}
                                            className="pr-10"
                                            dir="ltr"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleAddTeacherEmail}
                                        disabled={!newEmail.trim() || submitting}
                                        className="gap-2"
                                    >
                                        {submitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4" />
                                        )}
                                        إضافة
                                    </Button>
                                </div>
                            </div>

                            {/* Teacher Emails List */}
                            <div className="rounded-2xl border border-border bg-card p-6">
                                <h3 className="mb-4 flex items-center gap-2 font-amiri text-lg font-bold text-foreground">
                                    <Mail className="h-5 w-5 text-primary" />
                                    قائمة بريد المعلمين ({filteredTeacherEmails.length})
                                </h3>

                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : filteredTeacherEmails.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Mail className="mx-auto h-12 w-12 text-muted-foreground/30" />
                                        <p className="mt-4 text-muted-foreground">
                                            {searchQuery ? 'لا توجد نتائج للبحث' : 'لم تتم إضافة أي بريد إلكتروني للمعلمين بعد'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredTeacherEmails.map((te, index) => (
                                            <motion.div
                                                key={te.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group flex items-center justify-between rounded-xl border border-border bg-background/50 p-4 transition-all hover:border-primary/30 hover:bg-primary/5"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                        <Mail className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground" dir="ltr">{te.email}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            أُضيف في {new Date(te.created_at).toLocaleDateString('ar')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                                                    onClick={() => handleRemoveTeacherEmail(te.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="rounded-2xl border border-border bg-card p-6"
                        >
                            <h3 className="mb-4 flex items-center gap-2 font-amiri text-lg font-bold text-foreground">
                                <Users className="h-5 w-5 text-primary" />
                                المستخدمين المسجلين ({filteredUsers.length})
                            </h3>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Users className="mx-auto h-12 w-12 text-muted-foreground/30" />
                                    <p className="mt-4 text-muted-foreground">
                                        {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد مستخدمين مسجلين بعد'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border text-right">
                                                <th className="pb-3 text-sm font-medium text-muted-foreground">الاسم</th>
                                                <th className="pb-3 text-sm font-medium text-muted-foreground">الدور</th>
                                                <th className="pb-3 text-sm font-medium text-muted-foreground">تاريخ التسجيل</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map((u, index) => (
                                                <motion.tr
                                                    key={u.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="border-b border-border/50 last:border-0"
                                                >
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-sm font-bold text-primary">
                                                                {u.full_name.charAt(0) || '؟'}
                                                            </div>
                                                            <span className="font-medium text-foreground">{u.full_name || 'غير محدد'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">{getRoleBadge(u.role)}</td>
                                                    <td className="py-4 text-sm text-muted-foreground">
                                                        {u.created_at ? new Date(u.created_at).toLocaleDateString('ar') : '-'}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default AdminDashboard;
