import { motion } from 'framer-motion';
import { Link2, Zap } from 'lucide-react';
import { styleCompatibility } from '@/data/compatibility';
import { styleNames } from '@/data/styles';
import type { WritingStyle } from '@/types/writer';

interface CompatibilityMatrixProps {
  currentStyle: WritingStyle;
}

const CompatibilityMatrix = ({ currentStyle }: CompatibilityMatrixProps) => {
  const compat = styleCompatibility[currentStyle];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Link2 className="h-5 w-5 text-primary" />
        <h3 className="font-amiri text-xl font-bold text-foreground">مصفوفة التوافق مع الأنماط الأخرى</h3>
      </div>

      <div className="space-y-5">
        {/* Strong compatibility */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">توافق قوي</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {compat.strong.map((style, idx) => (
              <motion.div
                key={style}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center"
              >
                <span className="text-2xl block mb-2">
                  {getStyleIcon(style)}
                </span>
                <p className="text-sm font-bold text-foreground">{styleNames[style]}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getCompatibilityReason(currentStyle, style)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Moderate compatibility */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold text-foreground">توافق متوسط</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {compat.moderate.map((style, idx) => (
              <motion.div
                key={style}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
                className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-center"
              >
                <span className="text-xl block mb-1">
                  {getStyleIcon(style)}
                </span>
                <p className="text-sm font-bold text-foreground">{styleNames[style]}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getCompatibilityReason(currentStyle, style)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const styleIcons: Record<WritingStyle, string> = {
  empathetic: '💗',
  imaginative: '🌈',
  descriptive: '🎨',
  analytical: '🔍',
  justificatory: '⚖️',
  unique: '✨',
  meticulous: '📋',
  immersed: '🌊',
  deliberate: '🧘',
};

function getStyleIcon(style: WritingStyle): string {
  return styleIcons[style] || '📝';
}

const compatibilityReasons: Record<string, string> = {
  'empathetic-imaginative': 'كلاهما يعتمد على المشاعر والعاطفة',
  'empathetic-immersed': 'كلاهما ينغمس بعمق في التجربة',
  'empathetic-descriptive': 'الوصف يعزز التعاطف العاطفي',
  'empathetic-deliberate': 'التأني يعمق الحساسية العاطفية',
  'empathetic-unique': 'التفرد يثري الصوت العاطفي',
  'imaginative-unique': 'كلاهما يكسر القوالب التقليدية',
  'imaginative-empathetic': 'العاطفة تغذي الخيال',
  'imaginative-descriptive': 'الوصف يجسّد العوالم الخيالية',
  'imaginative-immersed': 'الاندماج يعزز الخيال الخصب',
  'imaginative-analytical': 'التحليل يعطي عمقًا للخيال',
  'descriptive-meticulous': 'كلاهما يهتم بالتفاصيل الدقيقة',
  'descriptive-immersed': 'الاندماج يثري الوصف الحسي',
  'descriptive-empathetic': 'المشاعر تعمق الوصف',
  'descriptive-imaginative': 'الخيال يوسع آفاق الوصف',
  'descriptive-deliberate': 'التأني يصقل الصور الوصفية',
  'analytical-deliberate': 'كلاهما يعتمد على التفكير العميق',
  'analytical-justificatory': 'كلاهما يبني على المنطق والتحليل',
  'analytical-meticulous': 'كلاهما يهتم بالدقة والتفصيل',
  'analytical-unique': 'التفرد يعزز الرؤية التحليلية',
  'analytical-descriptive': 'الوصف يدعم التحليل البصري',
  'justificatory-analytical': 'كلاهما يستخدم المنطق والحجة',
  'justificatory-deliberate': 'التأني يقوي الحجج المقدمة',
  'justificatory-meticulous': 'الدقة تعزز قوة البرهان',
  'justificatory-unique': 'التفرد يبتكر حججًا جديدة',
  'justificatory-empathetic': 'التعاطف يلين الحجج ويقنع',
  'unique-imaginative': 'الخيال يغذي التفرد الإبداعي',
  'unique-empathetic': 'العاطفة تصنع صوتًا أصيلًا',
  'unique-immersed': 'الاندماج يكشف الصوت الفريد',
  'unique-analytical': 'التحليل يعمق التفرد',
  'unique-descriptive': 'الوصف المتفرد يترك بصمة',
  'meticulous-deliberate': 'كلاهما يسعى للإتقان والدقة',
  'meticulous-analytical': 'كلاهما يهتم بالتفاصيل المنهجية',
  'meticulous-descriptive': 'الوصف الدقيق يحتاج للتدقيق',
  'meticulous-justificatory': 'الدقة تعزز قوة الحجة',
  'meticulous-immersed': 'الاندماج مع التفاصيل الدقيقة',
  'immersed-empathetic': 'كلاهما ينغمس في المشاعر',
  'immersed-descriptive': 'الاندماج يثري الوصف الحسي',
  'immersed-imaginative': 'الخيال يعمق الاندماج',
  'immersed-unique': 'الاندماج يكشف التفرد',
  'immersed-deliberate': 'التأني يعمق حالة الاستغراق',
  'deliberate-meticulous': 'كلاهما يعمل بعناية وإتقان',
  'deliberate-analytical': 'التحليل يحتاج للتأني',
  'deliberate-justificatory': 'التأني يصقل الحجج',
  'deliberate-empathetic': 'التأني يعمق التعاطف',
  'deliberate-descriptive': 'التأني يصقل الوصف',
};

function getCompatibilityReason(current: WritingStyle, target: WritingStyle): string {
  return compatibilityReasons[`${current}-${target}`] || compatibilityReasons[`${target}-${current}`] || 'يكمل أسلوبك بطريقة فريدة';
}

export default CompatibilityMatrix;
