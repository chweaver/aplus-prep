import { OBJECTIVES_BY_ID, type ObjectiveId } from './objectives';
import type {
  TopicFile,
  FlashcardFile,
  QuestionFile,
  LoadedContent,
} from './schemas';

const topicModules = import.meta.glob<{ default: TopicFile }>(
  './topics/*.json',
  { eager: true },
);

const flashcardModules = import.meta.glob<{ default: FlashcardFile }>(
  './flashcards/*.json',
  { eager: true },
);

const questionModules = import.meta.glob<{ default: QuestionFile }>(
  './questions/*.json',
  { eager: true },
);

function buildMap<T extends { objective: ObjectiveId }>(
  modules: Record<string, { default: T }>,
  kind: string,
): Map<ObjectiveId, T> {
  const map = new Map<ObjectiveId, T>();
  for (const path in modules) {
    const file = modules[path].default;
    if (!(file.objective in OBJECTIVES_BY_ID)) {
      throw new Error(
        `[content] ${kind} file ${path} references unknown objective "${file.objective}"`,
      );
    }
    if (map.has(file.objective)) {
      throw new Error(
        `[content] duplicate ${kind} file for objective "${file.objective}" at ${path}`,
      );
    }
    map.set(file.objective, file);
  }
  return map;
}

let cached: LoadedContent | null = null;

export function loadContent(): LoadedContent {
  if (cached) return cached;
  cached = {
    topics: buildMap(topicModules, 'topic'),
    flashcards: buildMap(flashcardModules, 'flashcard'),
    questions: buildMap(questionModules, 'question'),
  };
  return cached;
}

// Availability is derived from the presence of a topic JSON file. Topic files
// are the source of truth: an objective is "available" iff src/content/topics/
// contains its file. Flashcards and questions are independent supplements.

export function isObjectiveAvailable(objectiveId: string): boolean {
  return loadContent().topics.has(objectiveId as ObjectiveId);
}

export function hasFlashcards(objectiveId: string): boolean {
  const file = loadContent().flashcards.get(objectiveId as ObjectiveId);
  return !!file && file.cards.length > 0;
}

export function hasQuestions(objectiveId: string): boolean {
  const file = loadContent().questions.get(objectiveId as ObjectiveId);
  return !!file && file.questions.length > 0;
}

export function getAvailableObjectiveIds(): ObjectiveId[] {
  return Array.from(loadContent().topics.keys());
}
