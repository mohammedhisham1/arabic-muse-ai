import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import TeacherStudentChat from '@/components/TeacherStudentChat';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface TeacherInfo {
    teacher_id: string;
    assigned_at: string;
    profile?: {
        full_name: string | null;
    };
}

const StudentChat = () => {
    const { user } = useAuth();
  const location = useLocation();
    const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [forcedTeacherName, setForcedTeacherName] = useState<string | null>(null);

    useEffect(() => {
        if (user) loadTeachers();
    }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('teacher');
        if (t) setSelectedTeacher(t);
  }, [location.search]);

    const loadTeachers = async () => {
        if (!user) return;
        setLoading(true);

        // Get teachers assigned to this student
        const { data: assignments } = await (supabase as any)
            .from('teacher_students')
            .select('teacher_id, assigned_at')
            .eq('student_id', user.id);

        if (assignments && assignments.length > 0) {
            // Get teacher profiles
            const teacherIds = assignments.map((a: any) => a.teacher_id);
            const { data: profiles } = await (supabase as any)
                .from('profiles')
                .select('id, full_name')
                .in('id', teacherIds);

            const teachersWithProfiles = assignments.map((a: any) => ({
                ...a,
                profile: profiles?.find((p: any) => p.id === a.teacher_id),
            }));

            setTeachers(teachersWithProfiles);
            if (teachersWithProfiles.length > 0) {
                setSelectedTeacher((prev) => prev || teachersWithProfiles[0].teacher_id);
            }
        }

        // If we landed here via a direct reply link (?teacher=...), allow chat even if not assigned
        const params = new URLSearchParams(location.search);
        const forcedTeacherId = params.get('teacher');
        if (forcedTeacherId) {
            const exists = assignments?.some((a: any) => a.teacher_id === forcedTeacherId);
            if (!exists) {
                const { data: profile } = await (supabase as any)
                    .from('profiles')
                    .select('user_id, full_name')
                    .eq('user_id', forcedTeacherId)
                    .maybeSingle();

                setForcedTeacherName(profile?.full_name || 'المعلم');
                setSelectedTeacher(forcedTeacherId);
            } else {
                setForcedTeacherName(null);
            }
        }

        setLoading(false);
    };

    const selectedTeacherProfile = teachers.find(t => t.teacher_id === selectedTeacher);
    const selectedName =
        selectedTeacherProfile?.profile?.full_name ||
        forcedTeacherName ||
        'المعلم';

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto max-w-4xl px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Header */}
                    <div className="text-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-foreground">
                            <MessageCircle className="h-4 w-4 text-primary" />
                            التواصل مع المعلم
                        </span>
                        <h1 className="mt-4 font-amiri text-3xl font-bold text-foreground">
                            المحادثات
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            تواصل مع معلمك للحصول على ملاحظات وتوجيهات
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : teachers.length === 0 && !selectedTeacher ? (
                        <div className="rounded-2xl border border-border bg-card p-8 text-center">
                            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="font-bold text-foreground mb-2">لا يوجد معلم مسجل</h3>
                            <p className="text-sm text-muted-foreground">
                                لم يتم تعيين معلم لحسابك بعد. تواصل مع الإدارة للربط مع معلم.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Teacher selector (if multiple) */}
                            {teachers.length > 1 && (
                                <div className="relative">
                                    <select
                                        value={selectedTeacher || ''}
                                        onChange={(e) => setSelectedTeacher(e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-border bg-card p-4 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        {teachers.map((t) => (
                                            <option key={t.teacher_id} value={t.teacher_id}>
                                                {t.profile?.full_name || 'معلم'}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            )}

                            {/* Chat */}
                            {selectedTeacher && (
                                <TeacherStudentChat
                                    otherUserId={selectedTeacher}
                                    otherUserName={selectedName}
                                />
                            )}
                        </>
                    )}
                </motion.div>
            </main>
        </div>
    );
};

export default StudentChat;
