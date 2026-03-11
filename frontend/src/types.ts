export interface ImageData {
  data: string;
  mimeType: string;
  preview?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: ImageData;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface QuickPrompt {
  id: string;
  label: string;
  icon: string;
  template: string;
}

export interface Domain {
  id: string;
  name: string;
  weight: number;
  topics: string[];
}

export interface DomainProgress {
  domainId: string;
  confidence: "not_started" | "learning" | "confident";
  topicsStudied: string[];
}

export interface Flashcard {
  question: string;
  answer: string;
  domain: string;
}

export interface SummaryDomain {
  domain: string;
  domainId: string;
  items: SummaryItem[];
}

export interface SummaryItem {
  service: string;
  purpose: string;
  keyPoints: string[];
  examTips: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  domain: string;
}
