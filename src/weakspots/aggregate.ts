import { loadContent } from '../content/content-loader';
import { WEAK_SPOT_TAGS, WEAK_SPOTS, type WeakSpotTag } from '../content/weak-spots';
import type { SrsState } from '../srs/types';
import type { QuizState } from '../quiz/types';

export type TagStrength = 'no-data' | 'needs-work' | 'getting-there' | 'solid';

export interface TagSummary {
  tag: WeakSpotTag;
  label: string;
  blurb: string;
  relatedObjectives: readonly string[];

  // Flashcard stats
  cardTotal: number;
  cardSeen: number;
  cardStrong: number;
  cardWeak: number;

  // Question stats
  questionTotal: number;
  questionAttempted: number;
  questionCorrect: number;

  strength: TagStrength;
  score: number; // 0–100, higher = stronger
}

export function aggregateWeakSpots(srs: SrsState, quiz: QuizState): TagSummary[] {
  const content = loadContent();
  const now = Date.now();

  return WEAK_SPOT_TAGS.map((tag) => {
    const meta = WEAK_SPOTS[tag];

    // ── Flashcard stats ────────────────────────────────────────
    let cardTotal = 0;
    let cardSeen = 0;
    let cardStrong = 0;
    let cardWeak = 0;

    for (const flashcardFile of content.flashcards.values()) {
      for (const card of flashcardFile.cards) {
        if (!card.weakSpotTags?.includes(tag)) continue;
        cardTotal++;
        const state = srs.cards[card.id];
        if (!state || state.repetition === 0) continue;
        cardSeen++;
        const overdueDays = (now - state.dueAt) / (1000 * 60 * 60 * 24);
        if (state.efactor >= 2.2 && state.lapses <= 1 && overdueDays < 3) {
          cardStrong++;
        } else if (state.efactor < 2.0 || state.lapses >= 2) {
          cardWeak++;
        }
      }
    }

    // ── Question stats ─────────────────────────────────────────
    let questionTotal = 0;
    let questionAttempted = 0;
    let questionCorrect = 0;

    for (const qFile of content.questions.values()) {
      for (const q of qFile.questions) {
        if (!q.weakSpotTags?.includes(tag)) continue;
        questionTotal++;
        const result = quiz.results[q.id];
        if (!result) continue;
        questionAttempted++;
        if (result.correct) questionCorrect++;
      }
    }

    // ── Score (0–100) ──────────────────────────────────────────
    const hasCardData = cardTotal > 0 && cardSeen > 0;
    const hasQuestionData = questionTotal > 0 && questionAttempted > 0;

    let score = 0;
    if (!hasCardData && !hasQuestionData) {
      // No data at all
      return {
        tag, label: meta.label, blurb: meta.blurb,
        relatedObjectives: meta.relatedObjectives,
        cardTotal, cardSeen, cardStrong, cardWeak,
        questionTotal, questionAttempted, questionCorrect,
        strength: 'no-data',
        score: 0,
      };
    }

    let totalWeight = 0;
    if (hasCardData) {
      const cardScore = cardTotal > 0
        ? ((cardStrong * 1.0 + (cardSeen - cardStrong - cardWeak) * 0.5) / cardTotal) * 100
        : 0;
      score += cardScore * 0.6;
      totalWeight += 0.6;
    }
    if (hasQuestionData) {
      const qScore = (questionCorrect / questionAttempted) * 100;
      score += qScore * 0.4;
      totalWeight += 0.4;
    }
    if (totalWeight > 0) score = score / totalWeight;

    const strength: TagStrength =
      score >= 70 ? 'solid' :
      score >= 40 ? 'getting-there' :
      'needs-work';

    return {
      tag, label: meta.label, blurb: meta.blurb,
      relatedObjectives: meta.relatedObjectives,
      cardTotal, cardSeen, cardStrong, cardWeak,
      questionTotal, questionAttempted, questionCorrect,
      strength, score: Math.round(score),
    };
  });
}

export function sortByWeakest(summaries: TagSummary[]): TagSummary[] {
  const order: Record<TagStrength, number> = {
    'needs-work': 0,
    'getting-there': 1,
    'no-data': 2,
    'solid': 3,
  };
  return [...summaries].sort((a, b) => {
    const od = order[a.strength] - order[b.strength];
    if (od !== 0) return od;
    return a.score - b.score; // lower score first within same strength
  });
}
