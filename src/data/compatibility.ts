import type { WritingStyle, StyleCompatibility } from '@/types/writer';

export const styleCompatibility: Record<WritingStyle, StyleCompatibility> = {
  empathetic: {
    strong: ['imaginative', 'immersed', 'descriptive'],
    moderate: ['deliberate', 'unique'],
  },
  imaginative: {
    strong: ['unique', 'empathetic', 'descriptive'],
    moderate: ['immersed', 'analytical'],
  },
  descriptive: {
    strong: ['meticulous', 'immersed', 'empathetic'],
    moderate: ['imaginative', 'deliberate'],
  },
  analytical: {
    strong: ['deliberate', 'justificatory', 'meticulous'],
    moderate: ['unique', 'descriptive'],
  },
  justificatory: {
    strong: ['analytical', 'deliberate', 'meticulous'],
    moderate: ['unique', 'empathetic'],
  },
  unique: {
    strong: ['imaginative', 'empathetic', 'immersed'],
    moderate: ['analytical', 'descriptive'],
  },
  meticulous: {
    strong: ['deliberate', 'analytical', 'descriptive'],
    moderate: ['justificatory', 'immersed'],
  },
  immersed: {
    strong: ['empathetic', 'descriptive', 'imaginative'],
    moderate: ['unique', 'deliberate'],
  },
  deliberate: {
    strong: ['meticulous', 'analytical', 'justificatory'],
    moderate: ['empathetic', 'descriptive'],
  },
};

export const compatibilityLabels: Record<string, string> = {
  strong: 'توافق قوي',
  moderate: 'توافق متوسط',
};
