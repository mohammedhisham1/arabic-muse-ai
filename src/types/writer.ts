export type WritingStyle =
  | 'emotional'
  | 'logical'
  | 'analytical'
  | 'descriptive'
  | 'detailed'
  | 'introspective'
  | 'rationalistic'
  | 'reasoning'
  | 'reflective';

export interface QuestionOption {
  text: string;
  scores: Partial<Record<WritingStyle, number>>;
}

export interface Question {
  id: number;
  text: string;
  options: QuestionOption[];
}

export interface StyleProfile {
  style: WritingStyle;
  scores: Record<WritingStyle, number>;
}

export interface StyleInfo {
  name: string;
  icon: string;
  description: string;
  characteristics: string[];
  creativeFeatures: string[];
  challenges: string[];
  sampleText: {
    title: string;
    content: string;
    analysis: {
      titleType: string;
      languageStyle: string;
      characters: string;
      conflict: string;
    };
  };
  lessons: {
    title: string;
    objectives: string[];
  }[];
}
