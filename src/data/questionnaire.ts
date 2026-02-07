import { Statement, StatementGroup, WritingStyle } from '@/types/writer';

export const statements: Statement[] = [
  // الكاتب المتعاطف (1-5)
  { id: 1, text: 'أحرص على أن تُظهر كتابتي تفهُّمًا لمشاعر الآخرين وتجاربهم.', style: 'empathetic' },
  { id: 2, text: 'أحاول التعبير عن وجهات النظر المختلفة باحترام واهتمام.', style: 'empathetic' },
  { id: 3, text: 'أتجنب استخدام الكلمات التي قد تجرح مشاعر القارئ.', style: 'empathetic' },
  { id: 4, text: 'أُراعي في كتابتي الظروف الإنسانية التي يمرّ بها الأشخاص.', style: 'empathetic' },
  { id: 5, text: 'أكتب بطريقة تعكس تعاطفي مع الفئات الضعيفة أو المتضررة.', style: 'empathetic' },

  // الكاتب الخيالي (6-10)
  { id: 6, text: 'أتخيّل عوالم أو مواقف غير واقعية أثناء الكتابة.', style: 'imaginative' },
  { id: 7, text: 'أستخدم شخصيات أو أحداثًا مبتكرة لا تعتمد على الواقع.', style: 'imaginative' },
  { id: 8, text: 'أفضّل كتابة نصوص تتضمّن خيالًا أو عناصر غير مألوفة.', style: 'imaginative' },
  { id: 9, text: 'أستمتع بابتكار أحداث لا يمكن حدوثها في الحياة اليومية.', style: 'imaginative' },
  { id: 10, text: 'أرى أن النص يصبح أجمل عندما يحتوي على مفارقات خيالية.', style: 'imaginative' },

  // الكاتب الوصفي (11-15)
  { id: 11, text: 'أستخدم الكثير من التفاصيل التي تصف المكان أو الحدث.', style: 'descriptive' },
  { id: 12, text: 'أعتمد على الحواس الخمس لبناء المشاهد في النص.', style: 'descriptive' },
  { id: 13, text: 'أستمتع برسم صورة ذهنية دقيقة للقارئ.', style: 'descriptive' },
  { id: 14, text: 'أفضّل التمهّل في السرد من أجل الوصف الدقيق.', style: 'descriptive' },
  { id: 15, text: 'يظهر اهتمامي بعناصر اللون والصوت والحركة بشكل مستمر.', style: 'descriptive' },

  // الكاتب التحليلي (16-20)
  { id: 16, text: 'أحاول تفسير الأحداث وبيان أسبابها أثناء الكتابة.', style: 'analytical' },
  { id: 17, text: 'أطرح أسئلة من نوع "لماذا؟" و"كيف؟" داخل النص.', style: 'analytical' },
  { id: 18, text: 'أربط بين عناصر الموضوع وأحلل العلاقات بينها.', style: 'analytical' },
  { id: 19, text: 'أهتم بعمق الفكرة أكثر من جمال الأسلوب.', style: 'analytical' },
  { id: 20, text: 'أقدّم رؤية أو استنتاجًا نهائيًا بعد تحليل المحتوى.', style: 'analytical' },

  // الكاتب التبريري (21-25)
  { id: 21, text: 'أحاول دائمًا تبرير مواقفي أو أفكاري في النص.', style: 'justificatory' },
  { id: 22, text: 'أستخدم أمثلة كثيرة لتفسير أسباب ما أكتب عنه.', style: 'justificatory' },
  { id: 23, text: 'أميل إلى الدفاع عن وجهة نظري بإيراد حجج متتابعة.', style: 'justificatory' },
  { id: 24, text: 'أشرح للقارئ لماذا اخترت موقفًا معينًا في الكتابة.', style: 'justificatory' },
  { id: 25, text: 'أركز على إقناع القارئ بصحة أفكاري من خلال التبرير المستمر.', style: 'justificatory' },

  // الكاتب المتفرد (26-30)
  { id: 26, text: 'أسلوبي خاصًّا ومختلفًا عن الآخرين.', style: 'unique' },
  { id: 27, text: 'أحاول ابتكار طرق جديدة لعرض الأفكار.', style: 'unique' },
  { id: 28, text: 'أكتب بنبرة شخصية مميزة تظهر في أعمالي.', style: 'unique' },
  { id: 29, text: 'لا أحب التقليد، بل أميل إلى الإبداع والتميّز.', style: 'unique' },
  { id: 30, text: 'أسعى لترك بصمة خاصة تُعرف بها كتابتي.', style: 'unique' },

  // الكاتب المدقق (31-35)
  { id: 31, text: 'أهتم اهتمامًا كبيرًا بصحة القواعد والإملاء.', style: 'meticulous' },
  { id: 32, text: 'أتأكد من دقة كل معلومة قبل إدراجها في النص.', style: 'meticulous' },
  { id: 33, text: 'أراجع وأستخدم علامات الترقيم بعناية.', style: 'meticulous' },
  { id: 34, text: 'أحرص على تنظيم الفقرات بشكل منطقي ومتسلسل.', style: 'meticulous' },
  { id: 35, text: 'لا أقبل بوجود أي خطأ صغير في النص.', style: 'meticulous' },

  // الكاتب المستغرق (36-40)
  { id: 36, text: 'أنشغل كليًّا أثناء الكتابة ولا أشعر بالوقت.', style: 'immersed' },
  { id: 37, text: 'أعيش أحداث النص وكأنني جزء منها.', style: 'immersed' },
  { id: 38, text: 'يصعب عليّ التوقف عن الكتابة عندما أكون مندمجًا فيها.', style: 'immersed' },
  { id: 39, text: 'أركز بشدة بحيث أن المحيط الخارجي لا يؤثر فيّ أثناء الكتابة.', style: 'immersed' },
  { id: 40, text: 'أشعر بالحماس العميق حين أكون مستغرقًا في الكتابة.', style: 'immersed' },

  // الكاتب المتأني (41-45)
  { id: 41, text: 'آخذ وقتًا كافيًا للتفكير قبل البدء في الكتابة.', style: 'deliberate' },
  { id: 42, text: 'أراجع النص أكثر من مرة قبل تسليمه.', style: 'deliberate' },
  { id: 43, text: 'أفضّل الكتابة ببطء مع ضمان جودة كل فكرة.', style: 'deliberate' },
  { id: 44, text: 'أتردد في اختيار العبارات حتى أتأكد من دقتها.', style: 'deliberate' },
  { id: 45, text: 'لا أندفع في كتابة الأفكار قبل التأكد من ترابطها.', style: 'deliberate' },
];

export const dimensionLabels: Record<WritingStyle, string> = {
  empathetic: 'الكاتب المتعاطف',
  imaginative: 'الكاتب الخيالي',
  descriptive: 'الكاتب الوصفي',
  analytical: 'الكاتب التحليلي',
  justificatory: 'الكاتب التبريري',
  unique: 'الكاتب المتفرد',
  meticulous: 'الكاتب المدقق',
  immersed: 'الكاتب المستغرق',
  deliberate: 'الكاتب المتأني',
};

export const ALL_STYLES: WritingStyle[] = [
  'empathetic', 'imaginative', 'descriptive', 'analytical', 'justificatory',
  'unique', 'meticulous', 'immersed', 'deliberate',
];

// Shuffled statements so the user cannot identify which dimension each belongs to.
// Uses a deterministic interleave: pick one from each dimension in round-robin order.
function interleaveStatements(): Statement[] {
  const groups = ALL_STYLES.map(style => statements.filter(s => s.style === style));
  const result: Statement[] = [];
  const maxLen = Math.max(...groups.map(g => g.length));
  for (let i = 0; i < maxLen; i++) {
    for (const group of groups) {
      if (i < group.length) result.push(group[i]);
    }
  }
  return result;
}

export const shuffledStatements = interleaveStatements();

export const STATEMENTS_PER_PAGE = 5;
export const TOTAL_PAGES = Math.ceil(shuffledStatements.length / STATEMENTS_PER_PAGE);
export const TOTAL_STATEMENTS = statements.length;
