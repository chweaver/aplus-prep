import type {
  MatchingQuestion,
  MultipleChoiceQuestion,
  MultiSelectQuestion,
  OrderingQuestion,
  Question,
  SortingQuestion,
} from '../content/schemas';
import type { Answer } from './types';

export function isCorrect(question: Question, answer: Answer | null): boolean {
  if (!answer) return false;

  switch (question.type) {
    case 'multiple-choice': {
      const q = question as MultipleChoiceQuestion;
      return answer.type === 'multiple-choice' && answer.choiceId === q.correct;
    }
    case 'multi-select': {
      const q = question as MultiSelectQuestion;
      if (answer.type !== 'multi-select') return false;
      const correct = [...q.correct].sort();
      const given = [...answer.choiceIds].sort();
      return correct.length === given.length && correct.every((c, i) => c === given[i]);
    }
    case 'ordering': {
      const q = question as OrderingQuestion;
      if (answer.type !== 'ordering') return false;
      return q.correctOrder.every((id, i) => id === answer.itemIds[i]);
    }
    case 'matching': {
      const q = question as MatchingQuestion;
      if (answer.type !== 'matching') return false;
      return q.pairs.every((p) => answer.pairs[p.leftId] === p.rightId);
    }
    case 'sorting': {
      const q = question as SortingQuestion;
      if (answer.type !== 'sorting') return false;
      return q.items.every((item) => answer.assignments[item.id] === item.correctBucket);
    }
  }
}

// Shuffle an array deterministically based on a seed string
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  for (let i = result.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
