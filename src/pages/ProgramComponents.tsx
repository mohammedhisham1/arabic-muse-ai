import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, PenTool, BookOpen, Target, Award,
    MessageCircle, BarChart3, Users,
    Layers, Brain, GraduationCap, FileText,
    CheckCircle2, Star, UserCheck, Compass, ClipboardCheck,
    Eye, Pen, Activity, Cpu, Puzzle, BookMarked
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';

/* ─── Sidebar nav items ─── */
const NAV_ITEMS = [
    { id: 'philosophy', label: 'فلسفة البرنامج', icon: Compass },
    { id: 'objectives', label: 'أهداف البرنامج', icon: Target },
    { id: 'strategies', label: 'استراتيجيات التدريس', icon: Brain },
    { id: 'resources', label: 'مصادر التعلم', icon: BookMarked },
    { id: 'activities', label: 'أنشطة التعلم', icon: Activity },
    { id: 'stages', label: 'مراحل التنفيذ', icon: GraduationCap },
    { id: 'assessment', label: 'التقييم', icon: ClipboardCheck },
    { id: 'teacher', label: 'دور المعلم', icon: Users },
    { id: 'learner', label: 'دور المتعلم', icon: UserCheck },
];

/* ─── Helpers ─── */
const fadeUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.5 },
};

const SectionHeader = ({ number, title, icon: Icon }: { number: string; title: string; icon: React.ElementType }) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-md">
            {number}
        </div>
        <div className="flex items-center gap-3">
            <Icon className="h-6 w-6 text-primary" />
            <h2 className="font-amiri text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
        </div>
    </div>
);

const BulletItem = ({ children, icon: Icon = CheckCircle2 }: { children: React.ReactNode; icon?: React.ElementType }) => (
    <li className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-primary mt-1 shrink-0" />
        <span className="text-foreground/85 leading-relaxed">{children}</span>
    </li>
);

/* ─── Main Component ─── */
const ProgramComponents = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(NAV_ITEMS[0].id);
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    // Track active section with IntersectionObserver
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) {
                    setActiveSection(visible[0].target.id);
                }
            },
            { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
        );

        NAV_ITEMS.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) {
                sectionRefs.current[id] = el;
                observer.observe(el);
            }
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="container mx-auto px-4 pt-12 pb-6"
            >
                <div className="mx-auto max-w-4xl text-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
                        <FileText className="h-4 w-4" />
                        دليل البرنامج
                    </span>
                    <h1 className="font-amiri text-4xl font-bold text-foreground sm:text-5xl leading-tight">
                        دليل البرنامج
                    </h1>
                    <p className="mt-4 text-xl text-primary font-medium">
                        القائم على التعلم الشخصي المعزز بالذكاء الاصطناعي
                    </p>
                </div>
            </motion.div>

            {/* Two-column layout */}
            <div className="container mx-auto px-4 pb-16">
                <div className="flex gap-8 max-w-6xl mx-auto">

                    {/* ── Sticky Sidebar (left) ── */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <nav className="sticky top-24 rounded-2xl border border-border bg-card p-4 space-y-1 max-h-[calc(100vh-7rem)] overflow-y-auto">
                            <p className="text-xs font-bold text-muted-foreground mb-3 px-3">المحتويات</p>
                            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => scrollToSection(id)}
                                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-right ${activeSection === id
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* ── Main Content ── */}
                    <div className="flex-1 min-w-0 space-y-10">

                        {/* Section 1: Philosophy */}
                        <motion.section {...fadeUp} id="philosophy" className="scroll-mt-24 rounded-2xl border border-border bg-card p-8 sm:p-10">
                            <SectionHeader number="١" title="فلسفة البرنامج" icon={Compass} />
                            <p className="text-foreground/80 leading-relaxed mb-6">
                                ينطلق البرنامج من رؤية تعليمية تجمع بين النظرية البنائية والاجتماعية والتواصلية. تقوم فلسفته على المبادئ التالية:
                            </p>
                            <ul className="space-y-5">
                                <BulletItem icon={Star}>
                                    يقوم هذا البرنامج على فلسفة تعليمية تعترف بأن لكل متعلم للغة العربية من غير الناطقين بها أسلوبًا كتابيًا فريدًا ومنهجًا إبداعيًا مميزًا.
                                </BulletItem>
                                <BulletItem icon={Star}>
                                    إن أنجع التعليم هو ذلك الذي يتعرف على هذا الأسلوب ويوظفه كنقطة انطلاق لتطوير مهارات الكتابة الإبداعية وتعزيز الهوية اللغوية.
                                </BulletItem>
                                <BulletItem icon={Star}>
                                    تستند هذه الفلسفة إلى مبدأ التعلم الشخصي وفقًا لأسلوب الكاتب، مع دعم فوري بالذكاء الاصطناعي يتم تنفيذه عبر خطوات متكاملة. يوظف البرنامج تقنيات الذكاء الاصطناعي (AI) لتحليل أساليب الكتّاب/المتعلمين وتقديم مسارات تعلم فريدة ومخصصة لكل أسلوب. يتلقى كل متعلم محتوى ونماذج وأنشطة وتغذية راجعة تتوافق مع أسلوبه الكتابي المحدد، مما يضمن تجربة تعلم فردية حقيقية تبني ثقته اللغوية.
                                </BulletItem>
                            </ul>
                        </motion.section>

                        {/* Section 2: Objectives */}
                        <motion.section {...fadeUp} id="objectives" className="scroll-mt-24 rounded-2xl border border-border bg-card p-8 sm:p-10">
                            <SectionHeader number="٢" title="أهداف البرنامج" icon={Target} />
                            <p className="text-foreground/80 leading-relaxed mb-6">
                                من المتوقع أن يكون المتعلمون بنهاية البرنامج قادرين على:
                            </p>
                            <ul className="space-y-4">
                                <BulletItem>تعريف القصة الإبداعية.</BulletItem>
                                <BulletItem>التعرف على عناصر القصة الإبداعية (الشخصيات، المكان، الزمان، الصراع، الذروة، والحل).</BulletItem>
                                <BulletItem>تحليل نصوص قصصية قصيرة.</BulletItem>
                                <BulletItem>إنتاج قصة إبداعية كاملة تناسب أسلوبهم الكتابي.</BulletItem>
                                <BulletItem>التعبير عن أنفسهم لغويًا بوضوح وثقة.</BulletItem>
                                <BulletItem>استخدام أدوات الذكاء الاصطناعي لتحسين كتاباتهم.</BulletItem>
                            </ul>
                        </motion.section>

                        {/* Section 3: Teaching Strategies */}
                        <motion.section {...fadeUp} id="strategies" className="scroll-mt-24 rounded-2xl border border-border bg-card p-8 sm:p-10">
                            <SectionHeader number="٣" title="استراتيجيات التدريس (المعززة بالذكاء الاصطناعي)" icon={Brain} />
                            <p className="text-foreground/80 leading-relaxed mb-6">
                                يعتمد البرنامج على مجموعة من الاستراتيجيات المدعومة بالذكاء الاصطناعي:
                            </p>
                            <div className="grid gap-5 sm:grid-cols-2">
                                {[
                                    {
                                        title: 'النمذجة التكيفية',
                                        desc: 'يعرض النظام نماذج قصصية تتوافق مع أسلوب المتعلم المحدد لتعزيز المحاكاة الواعية.',
                                        icon: Layers,
                                    },
                                    {
                                        title: 'استراتيجية السقالات الديناميكية',
                                        desc: 'تقديم دعم يتلاشى تدريجيًا؛ في البداية يقترح الذكاء الاصطناعي جملًا افتتاحية، ثم يقدم كلمات مفتاحية، وأخيرًا يسمح للمتعلم بالكتابة بحرية مع التوجيه.',
                                        icon: Puzzle,
                                    },
                                    {
                                        title: 'التعلم الشخصي التكيفي',
                                        desc: 'من خلال التشخيص والتفريع.',
                                        icon: Cpu,
                                    },
                                    {
                                        title: 'التغذية الراجعة التصحيحية الفورية',
                                        desc: 'معالجة الأخطاء النحوية ضمن سياق الكتابة الإبداعية دون مقاطعة تدفق الأفكار.',
                                        icon: MessageCircle,
                                    },
                                    {
                                        title: 'التعلم بالممارسة والتحسين المستمر',
                                        desc: 'قائمة على المسودات المتعددة، حيث يقدم الذكاء الاصطناعي تغذية راجعة تصحيحية وإبداعية في كل مرحلة.',
                                        icon: Activity,
                                    },
                                ].map((strategy, i) => (
                                    <div key={i} className="rounded-xl border border-border bg-background p-5 hover:border-primary/30 transition-colors">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                                <strategy.icon className="h-4 w-4 text-primary" />
                                            </div>
                                            <h4 className="font-bold text-foreground text-sm">{strategy.title}</h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{strategy.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Section 4: Learning Resources */}
                        <motion.section {...fadeUp} id="resources" className="scroll-mt-24 rounded-2xl border border-border bg-card p-8 sm:p-10">
                            <SectionHeader number="٤" title="مصادر التعلم" icon={BookMarked} />
                            <ul className="space-y-4">
                                <BulletItem icon={Sparkles}>بيئة تعلم إلكترونية مدعومة بالذكاء الاصطناعي.</BulletItem>
                                <BulletItem icon={PenTool}>محرر نصوص ذكي.</BulletItem>
                                <BulletItem icon={ClipboardCheck}>اختبارات تكيفية عبر الإنترنت.</BulletItem>
                                <BulletItem icon={Layers}>قوالب قصصية متعددة حسب الأسلوب.</BulletItem>
                                <BulletItem icon={Puzzle}>بنك أنشطة تفاعلي.</BulletItem>
                            </ul>
                        </motion.section>

                        {/* Section 5: Learning Activities */}
                        <motion.section {...fadeUp} id="activities" className="scroll-mt-24 rounded-2xl border border-border bg-card p-8 sm:p-10">
                            <SectionHeader number="٥" title="أنشطة التعلم (لجميع الأساليب)" icon={Activity} />
                            <ul className="space-y-4">
                                <BulletItem>نشاط تشخيصي تفاعلي لأسلوب الكاتب (استكشاف ذاتي موجّه).</BulletItem>
                                <BulletItem>بناء خريطة مفردات شخصية.</BulletItem>
                                <BulletItem>نشاط محفّزات سرد قصصي تكيفي.</BulletItem>
                                <BulletItem>نشاط كتابة موجّه بالأسلوب.</BulletItem>
                                <BulletItem>أنشطة بنائية تفاعلية.</BulletItem>
                                <BulletItem>نشاط تحسين المسودة التدريجي.</BulletItem>
                                <BulletItem>تحليل ذكي تفاعلي لنماذج قصصية.</BulletItem>
                                <BulletItem>توسيع الذات اللغوية من خلال نشاط التعبير الحر الموجّه.</BulletItem>
                                <BulletItem>نشاط مشروع القصة النهائي التكيفي.</BulletItem>
                                <BulletItem>اختبارات فهم تفاعلية تكيفية.</BulletItem>
                            </ul>
                        </motion.section>

                        {/* Section 6: Implementation Stages */}
                        <motion.section {...fadeUp} id="stages" className="scroll-mt-24 rounded-2xl border border-border bg-card p-8 sm:p-10">
                            <SectionHeader number="٦" title="مراحل تنفيذ البرنامج (سيناريو التعلم)" icon={GraduationCap} />
                            <p className="text-foreground/80 leading-relaxed mb-8">
                                يتكون البرنامج من سبع مراحل لجميع الأساليب:
                            </p>
                            <div className="space-y-6">
                                {[
                                    { stage: '١', title: 'مرحلة التشخيص (بناء ملف المتعلم)', desc: 'تطبيق الاستبانة وتصنيف المتعلم تلقائيًا.', icon: ClipboardCheck, color: 'from-violet-500/20 to-purple-500/20' },
                                    { stage: '٢', title: 'مرحلة التقرير الذكي', desc: 'تعريف المتعلم بأسلوبه الكتابي (نقاط القوة، التحديات، ونصيحة قيّمة).', icon: FileText, color: 'from-blue-500/20 to-cyan-500/20' },
                                    { stage: '٣', title: 'مرحلة النمذجة', desc: 'عرض "نموذج قصصي" يناسب أسلوب المتعلم.', icon: BookOpen, color: 'from-emerald-500/20 to-green-500/20' },
                                    { stage: '٤', title: 'مرحلة المسارات المتفرعة', desc: 'تفريد الأهداف والأنشطة والمحتوى بناءً على أسلوب المتعلم.', icon: Layers, color: 'from-amber-500/20 to-orange-500/20' },
                                    { stage: '٥', title: 'مرحلة الإنتاج الإبداعي', desc: 'استخدام المحرر الذكي لكتابة القصة بدعم الذكاء الاصطناعي.', icon: PenTool, color: 'from-pink-500/20 to-rose-500/20' },
                                    { stage: '٦', title: 'مرحلة لوحة المتابعة والرصد', desc: 'يراقب المعلم تقدم كل طالب وإنجاز الأنشطة وفقًا لأسلوبه الكتابي ومدى تحقق أهداف التعلم.', icon: BarChart3, color: 'from-sky-500/20 to-indigo-500/20' },
                                    { stage: '٧', title: 'مرحلة المخرجات النهائية', desc: 'يُقيِّم المتعلم تطور كتابته الإبداعية وكفاءته اللغوية وفقًا لأسلوبه الكتابي.', icon: Award, color: 'from-teal-500/20 to-emerald-500/20' },
                                ].map((stage, i) => (
                                    <div key={i} className="flex gap-5">
                                        <div className="flex flex-col items-center">
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${stage.color} border-2 border-primary/20 font-bold text-primary`}>
                                                {stage.stage}
                                            </div>
                                            {i < 6 && <div className="w-0.5 flex-1 bg-border mt-2" />}
                                        </div>
                                        <div className="pb-6">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <stage.icon className="h-4 w-4 text-primary" />
                                                <h4 className="font-bold text-foreground">{stage.title}</h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{stage.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Section 7: Assessment */}
                        <motion.section {...fadeUp} id="assessment" className="scroll-mt-24 rounded-2xl border border-border bg-card p-8 sm:p-10">
                            <SectionHeader number="٧" title="التقييم" icon={ClipboardCheck} />

                            {/* Diagnostic */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-2 w-2 rounded-full bg-violet-500" />
                                    <h3 className="font-amiri text-xl font-bold text-foreground">التقييم التشخيصي (القبلي)</h3>
                                </div>
                                <ul className="space-y-3 pr-4">
                                    <BulletItem icon={Eye}>
                                        يُجرى من خلال استبانة أسلوب الكاتب (45 فقرة) يحلّلها الذكاء الاصطناعي لتصنيف المتعلم وفقًا لأسلوبه الكتابي وتحديد مسار تعلمه.
                                    </BulletItem>
                                </ul>
                            </div>

                            {/* Formative */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <h3 className="font-amiri text-xl font-bold text-foreground">التقييم البنائي (التكويني)</h3>
                                </div>
                                <ul className="space-y-3 pr-4">
                                    <BulletItem icon={Activity}>
                                        يستمر طوال البرنامج من خلال التحليل الآلي المستمر لكتابة المتعلم في كل نشاط.
                                    </BulletItem>
                                    <BulletItem icon={MessageCircle}>
                                        تقديم تقارير تقييم فورية لتقييم المتعلم بعد كل مهمة كتابية.
                                    </BulletItem>
                                    <BulletItem icon={Cpu}>
                                        تقديم تقارير فورية بعد كل اختبار (تغذية راجعة بالذكاء الاصطناعي - AI Feedback).
                                    </BulletItem>
                                </ul>
                            </div>

                            {/* Summative */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                                    <h3 className="font-amiri text-xl font-bold text-foreground">التقييم الختامي (البعدي)</h3>
                                </div>
                                <ul className="space-y-3 pr-4">
                                    <BulletItem icon={Pen}>
                                        يشمل تقييم النص السردي الإبداعي النهائي الذي يكتبه المتعلم وفقًا لمعايير محددة.
                                    </BulletItem>
                                    <BulletItem icon={BarChart3}>
                                        تقييم تطور الكفاءة اللغوية.
                                    </BulletItem>
                                    <BulletItem icon={FileText}>
                                        تقرير تحليلي شامل ينتجه النظام الذكي يوضح التقدم المتنوع للمتعلم. (ملخص الإنجازات: عدد الكلمات / التحسين / الأهداف المحققة... كما يظهر في شاشة مخرجات الإنجاز).
                                    </BulletItem>
                                </ul>
                            </div>
                        </motion.section>

                        {/* Section 8: Teacher's Role */}
                        <motion.section {...fadeUp} id="teacher" className="scroll-mt-24 rounded-2xl border border-border bg-card p-8 sm:p-10">
                            <SectionHeader number="٨" title="دور المعلم" icon={Users} />
                            <p className="text-foreground/80 leading-relaxed mb-6">
                                في هذا البرنامج، يتحوّل دور المعلم من ناقل للمعرفة إلى ميسّر وموجّه ومراقب. يؤدي المعلم المهام التالية:
                            </p>
                            <ul className="space-y-4">
                                <BulletItem icon={Eye}>مراقبة تقدم كل متعلم.</BulletItem>
                                <BulletItem icon={FileText}>مراجعة تقارير الذكاء الاصطناعي.</BulletItem>
                                <BulletItem icon={BarChart3}>تصدير التقارير للمتابعة / توثيق البحث.</BulletItem>
                            </ul>
                        </motion.section>

                        {/* Section 9: Learner's Role */}
                        <motion.section {...fadeUp} id="learner" className="scroll-mt-24 rounded-2xl border border-border bg-card p-8 sm:p-10">
                            <SectionHeader number="٩" title="دور المتعلم" icon={UserCheck} />
                            <p className="text-foreground/80 leading-relaxed mb-6">
                                المتعلم هو محور التركيز والفاعل الأساسي في هذا البرنامج. يتطلب البرنامج مشاركة فاعلة ومسؤولية حقيقية في رحلة تعلمه. وتحديدًا، يشمل دوره ما يلي:
                            </p>
                            <ul className="space-y-4">
                                <BulletItem>إكمال استبانة تقييم الأسلوب بصدق.</BulletItem>
                                <BulletItem>التفاعل مع النماذج والمحتوى التفاعلي المصمم وفقًا لأسلوبه.</BulletItem>
                                <BulletItem>إتمام أنشطة الكتابة والاستفادة من التغذية الراجعة الفورية.</BulletItem>
                                <BulletItem>كتابة ومراجعة نصه الإبداعي بناءً على اقتراحات النظام.</BulletItem>
                                <BulletItem>التأمل في قدراته اللغوية وتطوير أسلوبه الكتابي الخاص.</BulletItem>
                            </ul>
                        </motion.section>

                        {/* CTA */}
                        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center mt-4">
                            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-10">
                                <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
                                <h2 className="font-amiri text-2xl font-bold text-foreground mb-3">
                                    هل أنت مستعد للبدء؟
                                </h2>
                                <p className="text-muted-foreground mb-6">
                                    ابدأ رحلتك الآن باختبار الأسلوب الكتابي واكتشف إمكانياتك الإبداعية
                                </p>
                                <div className="flex flex-wrap justify-center gap-4">
                                    <Button variant="hero" size="lg" onClick={() => navigate('/style-test')} className="gap-2">
                                        <Sparkles className="h-5 w-5" />
                                        ابدأ اختبار الأسلوب
                                    </Button>
                                    <Button variant="outline" size="lg" onClick={() => navigate('/')}>
                                        العودة للصفحة الرئيسية
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgramComponents;
