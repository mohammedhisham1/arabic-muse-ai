import type { WritingStyle, HighlightedPhrase } from '@/types/writer';

export const styleHighlights: Record<WritingStyle, HighlightedPhrase[]> = {
  empathetic: [
    { phrase: 'قلبها يحمل ثقل الغربة', characteristic: 'التعبير عن المشاعر العميقة' },
    { phrase: 'هل سأعود يومًا؟', characteristic: 'الحوار الداخلي العاطفي' },
    { phrase: 'تسمع صوت أمها في الذاكرة', characteristic: 'الارتباط العاطفي والحنين' },
  ],
  imaginative: [
    { phrase: 'الناس يمشون على السقوف والمطر يصعد نحو السماء', characteristic: 'كسر قوانين الواقع' },
    { phrase: 'يبدأ الناس عجائز ويموتون أطفالًا', characteristic: 'الانعكاس الخيالي' },
    { phrase: 'وحده الشاعر كان يرى الأمور كما هي حقًا', characteristic: 'المفارقة الخيالية' },
  ],
  descriptive: [
    { phrase: 'ألوان الأقمشة كنهر من الحرير المتلألئ', characteristic: 'التصوير البصري الحي' },
    { phrase: 'رائحة البهارات تمتزج بعبق القهوة المحمصة', characteristic: 'الوصف الشمي' },
    { phrase: 'أصوات الباعة تتشابك في سيمفونية شرقية', characteristic: 'الوصف السمعي' },
  ],
  analytical: [
    { phrase: 'لم يكن غضب أحمد مجرد ردة فعل عابرة', characteristic: 'الملاحظة التحليلية' },
    { phrase: 'كان نتاج سنوات من التراكم', characteristic: 'تحليل الأسباب والدوافع' },
    { phrase: 'لم يكن يصرخ عليهم حقًا، بل كان يصرخ في وجه كل من تجاهله يومًا', characteristic: 'التفسير العميق' },
  ],
  justificatory: [
    { phrase: 'إذا نظرنا إلى الأدلة بموضوعية', characteristic: 'الاستدلال المنطقي' },
    { phrase: 'الفقر لا يبيح السرقة، لكنه يفسر لماذا يلجأ إليها بعض الناس', characteristic: 'التبرير المتوازن' },
    { phrase: 'العدالة الحقيقية تنظر في الأسباب قبل أن تصدر الأحكام', characteristic: 'الخلاصة المبررة' },
  ],
  unique: [
    { phrase: 'فابتسمتُ وكتبتُ مثلي', characteristic: 'تأكيد التفرد' },
    { phrase: 'جملتي تسير بالعكس أحيانًا', characteristic: 'كسر القوالب' },
    { phrase: 'الكلمات حين تُولد في داخلي تأتي بترتيبها الخاص', characteristic: 'الصوت الشخصي المتميز' },
  ],
  meticulous: [
    { phrase: 'الساعة الثالثة والنصف فجرًا', characteristic: 'الدقة في التفاصيل الزمنية' },
    { phrase: 'يغسل يديه ثلاث مرات بالماء الدافئ والصابون', characteristic: 'التفاصيل الدقيقة المنظمة' },
    { phrase: 'يخلط الطحين مع الماء والخميرة بنسب يعرفها عن ظهر قلب', characteristic: 'الضبط والإتقان' },
  ],
  immersed: [
    { phrase: 'لم أشعر بمرور الساعات', characteristic: 'الاندماج في الزمن' },
    { phrase: 'أصابعي تتحرك على لوحة المفاتيح كأنها تعزف لحنًا', characteristic: 'حالة التدفق الإبداعي' },
    { phrase: 'أسمع صوتها، أشعر بدفء يدها، وأرى دمعتها تسقط', characteristic: 'الاندماج العميق مع الشخصيات' },
  ],
  deliberate: [
    { phrase: 'أنظر إلى تلك الصورة القديمة وأبتسم', characteristic: 'التوقف التأملي' },
    { phrase: 'كل عثرة كانت درسًا، وكل دمعة كانت بذرة لابتسامة قادمة', characteristic: 'التأمل المتأني' },
    { phrase: 'الحكمة ليست في تجنب الأخطاء، بل في تعلم القيام بعدها', characteristic: 'الاستنتاج المدروس' },
  ],
};
