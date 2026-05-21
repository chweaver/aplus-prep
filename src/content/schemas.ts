import type { Domain, ObjectiveId } from './objectives';
import type { WeakSpotTag } from './weak-spots';

// ============================================================
// Topic notes — one file per objective
// ============================================================

export interface TopicFile {
  objective: ObjectiveId;
  title: string;
  domain: Domain;
  estimatedMinutes?: number;
  subtopics: Subtopic[];
  sources: string[];
  needsReview: boolean;
  reviewNotes?: string;
}

export interface Subtopic {
  id: string;
  heading: string;
  notes: string;
  whyOnExam?: string;
  commonTrap?: string;
  weakSpotTags?: WeakSpotTag[];
}

// ============================================================
// Flashcards
// ============================================================

export interface FlashcardFile {
  objective: ObjectiveId;
  cards: Flashcard[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags?: string[];
  weakSpotTags?: WeakSpotTag[];
  sourceTranscript: string;
  needsReview: boolean;
}

// ============================================================
// Practice questions (Learn + Exam modes)
// ============================================================

export interface QuestionFile {
  objective: ObjectiveId;
  questions: Question[];
}

interface BaseQuestion {
  id: string;
  stem: string;
  explanation: string;
  trap?: string;
  tags?: string[];
  weakSpotTags?: WeakSpotTag[];
  sourceTranscript: string;
  needsReview: boolean;
  estimatedSeconds?: number;
}

export interface Choice {
  id: string;
  text: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  choices: Choice[];
  correct: string;
}

export interface MultiSelectQuestion extends BaseQuestion {
  type: 'multi-select';
  choices: Choice[];
  correct: string[];
}

export interface OrderingItem {
  id: string;
  text: string;
}

export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering';
  items: OrderingItem[];
  correctOrder: string[];
}

export interface MatchingPair {
  leftId: string;
  leftText: string;
  rightId: string;
  rightText: string;
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  pairs: MatchingPair[];
}

export interface SortingBucket {
  id: string;
  label: string;
}

export interface SortingItem {
  id: string;
  text: string;
  correctBucket: string;
}

export interface SortingQuestion extends BaseQuestion {
  type: 'sorting';
  buckets: SortingBucket[];
  items: SortingItem[];
}

export type Question =
  | MultipleChoiceQuestion
  | MultiSelectQuestion
  | OrderingQuestion
  | MatchingQuestion
  | SortingQuestion;

export type QuestionType = Question['type'];

// ============================================================
// Aggregate loaded content (from content-loader)
// ============================================================

export interface LoadedContent {
  topics: Map<ObjectiveId, TopicFile>;
  flashcards: Map<ObjectiveId, FlashcardFile>;
  questions: Map<ObjectiveId, QuestionFile>;
}
