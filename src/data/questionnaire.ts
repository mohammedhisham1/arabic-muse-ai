import { Question } from '@/types/writer';

export const questions: Question[] = [
  {
    id: 1,
    text: 'عندما تقرأ نصًا أدبيًا، ما أول ما يلفت انتباهك؟',
    options: [
      { text: 'العواطف والمشاعر المتدفقة في النص', scores: { emotional: 2, introspective: 1 } },
      { text: 'البناء المنطقي والتسلسل الواضح للأفكار', scores: { logical: 2, reasoning: 1 } },
      { text: 'التحليل العميق للشخصيات ودوافعها', scores: { analytical: 2, detailed: 1 } },
      { text: 'الأوصاف الحية والصور البصرية الغنية', scores: { descriptive: 2, emotional: 1 } },
    ],
  },
  {
    id: 2,
    text: 'كيف تفضل بناء أفكارك عند الكتابة؟',
    options: [
      { text: 'أبدأ بمشاعري وأترك القلم يتدفق بحرية', scores: { emotional: 2, reflective: 1 } },
      { text: 'أرتب أفكاري بتسلسل منطقي واضح ومحكم', scores: { logical: 2, rationalistic: 1 } },
      { text: 'أحلل كل فكرة بعمق قبل الانتقال للتالية', scores: { analytical: 2, reasoning: 1 } },
      { text: 'أستخدم الحجج والبراهين العقلية لدعم كل نقطة', scores: { rationalistic: 2, logical: 1 } },
    ],
  },
  {
    id: 3,
    text: 'ما نوع النصوص التي تستمتع بقراءتها أكثر؟',
    options: [
      { text: 'النصوص الوصفية الغنية بالصور والتفاصيل الحسية', scores: { descriptive: 2, detailed: 1 } },
      { text: 'النصوص التأملية التي تغوص في أعماق النفس', scores: { introspective: 2, reflective: 1 } },
      { text: 'النصوص التي تعتمد على الاستدلال والاستنتاج', scores: { reasoning: 2, analytical: 1 } },
      { text: 'النصوص المفصلة والشاملة التي لا تترك شاردة', scores: { detailed: 2, descriptive: 1 } },
    ],
  },
  {
    id: 4,
    text: 'عندما تريد إقناع شخص ما بوجهة نظرك، ماذا تستخدم؟',
    options: [
      { text: 'العواطف والمشاعر المؤثرة التي تلامس القلب', scores: { emotional: 2, descriptive: 1 } },
      { text: 'الحجج العقلانية المتماسكة والمنظمة', scores: { rationalistic: 2, logical: 1 } },
      { text: 'الأدلة والبراهين المبنية على الاستدلال', scores: { reasoning: 2, rationalistic: 1 } },
      { text: 'التحليل المفصل والشامل لجميع جوانب الموقف', scores: { analytical: 2, detailed: 1 } },
    ],
  },
  {
    id: 5,
    text: 'كيف تصف أسلوبك في التفكير بشكل عام؟',
    options: [
      { text: 'تأملي وعميق، أغوص في المعاني الداخلية', scores: { introspective: 2, emotional: 1 } },
      { text: 'منطقي ومنظم، أتبع خطوات واضحة', scores: { logical: 2, rationalistic: 1 } },
      { text: 'تفصيلي ودقيق، أهتم بكل التفاصيل', scores: { detailed: 2, analytical: 1 } },
      { text: 'انعكاسي ومراجع، أعيد التفكير في تجاربي', scores: { reflective: 2, introspective: 1 } },
    ],
  },
  {
    id: 6,
    text: 'ما الذي يجعل النص الأدبي مميزًا ولا يُنسى في نظرك؟',
    options: [
      { text: 'الصور البصرية والأوصاف الحية التي تنقلك إلى المكان', scores: { descriptive: 2, emotional: 1 } },
      { text: 'العمق الفكري والتأمل الفلسفي في الحياة', scores: { introspective: 2, reflective: 1 } },
      { text: 'الاستنتاجات الذكية والمفاجآت في الحبكة', scores: { reasoning: 2, logical: 1 } },
      { text: 'الشمولية والتفصيل في تناول الموضوع', scores: { detailed: 2, analytical: 1 } },
    ],
  },
  {
    id: 7,
    text: 'عندما تواجه موقفًا صعبًا في حياتك، كيف تتعامل معه؟',
    options: [
      { text: 'أستمع لمشاعري أولاً وأعبّر عنها بصدق', scores: { emotional: 2, reflective: 1 } },
      { text: 'أحلل الموقف من جميع جوانبه بموضوعية', scores: { analytical: 2, logical: 1 } },
      { text: 'أبحث عن الحل العقلاني الأمثل بهدوء', scores: { rationalistic: 2, reasoning: 1 } },
      { text: 'أتأمل في الموقف بعمق وأستخلص العبر', scores: { reflective: 2, introspective: 1 } },
    ],
  },
  {
    id: 8,
    text: 'ما الذي تركز عليه أكثر عند كتابة قصة قصيرة؟',
    options: [
      { text: 'المشاعر الداخلية للشخصيات وعالمهم النفسي', scores: { emotional: 2, introspective: 1 } },
      { text: 'تسلسل الأحداث المنطقي وتماسك الحبكة', scores: { logical: 2, reasoning: 1 } },
      { text: 'وصف المكان والزمان والأجواء بدقة متناهية', scores: { descriptive: 2, detailed: 1 } },
      { text: 'تحليل دوافع الشخصيات وفهم تصرفاتهم', scores: { analytical: 2, rationalistic: 1 } },
    ],
  },
];
