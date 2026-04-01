import { Award, BarChart3, BookOpen, ClipboardList, GraduationCap, PenTool, Users } from 'lucide-react';

export const programPhases = [
  {
    icon: ClipboardList,
    title: 'اختبار أسلوب الكاتب',
    description: 'اكتشف أسلوبك الكتابي الفريد من خلال استبيان ذكي يحلل ميولك اللغوية والإبداعية.',
    path: '/style-test',
    color: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
  },
  {
    icon: BarChart3,
    title: 'تقرير شخصي ذكي',
    description: 'احصل على تقرير مفصل يوضح خصائصك اللغوية وسماتك الإبداعية والتحديات المتوقعة.',
    path: '/style-report',
    color: 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground',
  },
  {
    icon: BookOpen,
    title: 'نماذج مكتوبة تحليلية',
    description: 'اطلع على نصوص إبداعية تتوافق مع أسلوبك، مع تحليل تفاعلي لعناصر كل نص.',
    path: '/writing-models',
    color: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
  },
  {
    icon: GraduationCap,
    title: 'مسارات تعلم متفرعة',
    description: 'تعلّم عبر دروس مصممة خصيصًا لأسلوبك، مع أهداف واضحة وتمارين عملية.',
    path: '/learning-path',
    color: 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground',
  },
  {
    icon: PenTool,
    title: 'الكتابة الإبداعية الذكية',
    description: 'محرر نصوص ذكي مع اقتراحات لغوية عاطفية وتقييم فوري بالذكاء الاصطناعي لدقة الكلمات وعمق المشاعر والهوية اللغوية.',
    path: '/creative-writing',
    color: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
    requiresAuth: true,
  },
  {
    icon: Users,
    title: 'لوحة المعلم',
    description: 'تتبع تقدم كل متعلم، عرض تقارير الذكاء الاصطناعي، واقتراح تدخلات فردية مخصصة.',
    path: '/teacher-dashboard',
    color: 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground',
    requiresAuth: true,
    teacherOnly: true,
  },
  {
    icon: Award,
    title: 'مخرجات التعلم النهائية',
    description: 'ملخص شامل يعرض التعلم الفردي، تحسن الكتابة الإبداعية، والوعي اللغوي الذاتي المعزز.',
    path: '/final-outputs',
    color: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
    requiresAuth: true,
  },
];

