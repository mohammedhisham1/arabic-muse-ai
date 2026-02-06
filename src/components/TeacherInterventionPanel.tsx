import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, Send, Trash2, BookOpen, AlertCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Intervention {
  id: string;
  teacher_id: string;
  student_id: string;
  writing_id: string | null;
  intervention_type: string;
  content: string;
  created_at: string;
}

interface TeacherInterventionPanelProps {
  studentId: string;
  writingId?: string;
  studentName?: string;
}

const interventionTypes = [
  { value: 'note', label: 'ملاحظة', icon: MessageSquarePlus },
  { value: 'exercise', label: 'تمرين مقترح', icon: BookOpen },
  { value: 'warning', label: 'تنبيه', icon: AlertCircle },
  { value: 'tip', label: 'نصيحة', icon: Lightbulb },
];

const TeacherInterventionPanel = ({ studentId, writingId, studentName }: TeacherInterventionPanelProps) => {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [newContent, setNewContent] = useState('');
  const [selectedType, setSelectedType] = useState('note');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInterventions();
  }, [studentId, writingId]);

  const loadInterventions = async () => {
    let query = (supabase as any)
      .from('teacher_interventions')
      .select('*')
      .eq('teacher_id', user!.id)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (writingId) {
      query = query.eq('writing_id', writingId);
    }

    const { data } = await query;
    if (data) setInterventions(data);
  };

  const handleSubmit = async () => {
    if (!newContent.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('teacher_interventions')
        .insert({
          teacher_id: user!.id,
          student_id: studentId,
          writing_id: writingId || null,
          intervention_type: selectedType,
          content: newContent.trim(),
        });

      if (error) throw error;
      toast.success('تم إضافة الملاحظة بنجاح');
      setNewContent('');
      loadInterventions();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('teacher_interventions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInterventions(prev => prev.filter(i => i.id !== id));
      toast.success('تم الحذف');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    }
  };

  const getTypeConfig = (type: string) => {
    return interventionTypes.find(t => t.value === type) || interventionTypes[0];
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h3 className="font-amiri text-lg font-bold text-foreground flex items-center gap-2">
        <MessageSquarePlus className="h-5 w-5 text-primary" />
        ملاحظات المعلم {studentName ? `— ${studentName}` : ''}
      </h3>

      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {interventionTypes.map(type => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              selectedType === type.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <type.icon className="h-3 w-3" />
            {type.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="اكتب ملاحظتك أو اقتراحك للطالب..."
          className="min-h-[80px] flex-1 rounded-xl border border-input bg-background p-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!newContent.trim() || submitting}
        size="sm"
        className="gap-1.5"
      >
        <Send className="h-3.5 w-3.5" />
        إرسال
      </Button>

      {/* Interventions list */}
      <AnimatePresence>
        {interventions.map((intervention) => {
          const config = getTypeConfig(intervention.intervention_type);
          const Icon = config.icon;

          return (
            <motion.div
              key={intervention.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="group flex items-start gap-3 rounded-xl border border-border bg-background p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary">{config.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(intervention.created_at).toLocaleDateString('ar')}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-line">{intervention.content}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                onClick={() => handleDelete(intervention.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {interventions.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">لا توجد ملاحظات بعد</p>
      )}
    </div>
  );
};

export default TeacherInterventionPanel;
