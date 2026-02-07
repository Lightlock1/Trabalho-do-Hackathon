
export enum EmotionalState {
  CALM = 'Calm',
  STRESSED = 'Stressed',
  OVERLOADED = 'Overloaded',
  BURNOUT_RISK = 'Burnout Risk'
}

export type WellnessCategory = 'Burnout' | 'Focus' | 'Sleep' | 'Physical';

export interface UserProfile {
  name: string;
  emailOrPhone: string;
  age?: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  locationAccess?: boolean;
  darkMode?: boolean;
}

export interface CheckInData {
  timestamp: number;
  moodScale: number; // 1-10
  text: string;
  stressScore: number; // 0-100
  emotionalState: EmotionalState;
  aiMessage: string;
  suggestions: string[];
}

export interface AIResponse {
  stressScore: number;
  emotionalState: EmotionalState;
  aiMessage: string;
  suggestions: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
