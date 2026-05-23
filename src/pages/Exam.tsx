import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OBJECTIVES_BY_ID } from '../content/objectives';
import { isObjectiveAvailable, loadContent } from '../content/content-loader';
import type { Question } from '../content/schemas';
import QuestionRenderer from '../questions/QuestionRenderer';
import { isCorrect, seededShuffle } from '../questions/grading';
import type { Answer } from '../questions/types';
import { useQuiz } from '../quiz/QuizContext';

const FULL_EXAM_QUESTIONS = 90;
const SECONDS_PER_QUESTION = 60;

type ExamQuestion = Question & { objectiveId: string };

function buildExamPool(): ExamQuestion[] {
  const pool: ExamQuestion[] = [];
  const content = loadContent();
  for (const [objId, qFile] of content.questions.entries()) {
    if (!isObjectiveAvailable(objId)) continue;
    for (const q of qFile.questions) {
      pool.push({ ...q, objectiveId: objId });
    }
  }
  return pool;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

type Phase = 'idle' | 'active' | 'review';

export default function Exam() {
  const location = useLocation();
  const navigate = useNavigate();
  const pool = useMemo(() => buildExamPool(), []);
  const examSize = Math.min(pool.length, FULL_EXAM_QUESTIONS);
  const examSeconds = examSize * SECONDS_PER_QUESTION;
  const sessionSeed = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('session');
  }, [location.search]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer | null>>({});
  const [secondsLeft, setSecondsLeft] = useState(examSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<string>('');
  const questionsRef = useRef<ExamQuestion[]>([]);
  const answersRef = useRef<Record<string, Answer | null>>({});
  const { recordResult } = useQuiz();

  const resetExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    startRef.current = '';
    questionsRef.current = [];
    answersRef.current = {};
    setQuestions([]);
    setIndex(0);
    setAnswers({});
    setSecondsLeft(examSeconds);
    setPhase('idle');
  }, [examSeconds]);

  const initializeExam = useCallback((seed: string) => {
    startRef.current = seed;
    const shuffled = seededShuffle(pool, seed).slice(0, examSize);
    questionsRef.current = shuffled;
    answersRef.current = {};
    setQuestions(shuffled);
    setIndex(0);
    setAnswers({});
    setSecondsLeft(examSeconds);
    setPhase('active');
  }, [pool, examSize, examSeconds]);

  function startExam() {
    const seed = Date.now().toString();
    navigate(`/exam?session=${seed}`);
  }

  const submitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    for (const q of questionsRef.current) {
      const a = answersRef.current[q.id] ?? null;
      if (a !== null) recordResult(q.id, isCorrect(q, a), q.objectiveId);
    }
    setPhase('review');
  }, [recordResult]);

  useEffect(() => {
    if (!sessionSeed) {
      resetExam();
      return;
    }
    if (startRef.current !== sessionSeed) {
      initializeExam(sessionSeed);
    }
  }, [initializeExam, resetExam, sessionSeed]);

  useEffect(() => {
    if (phase !== 'active') return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          submitExam();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'idle') {
    return <ExamLanding pool={pool} examSize={examSize} onStart={startExam} />;
  }

  if (phase === 'review') {
    return (
      <ExamReview
        questions={questions}
        answers={answers}
        onRestart={() => navigate('/exam')}
      />
    );
  }

  const q = questions[index];
  if (!q) {
    return <ExamLanding pool={pool} examSize={examSize} onStart={startExam} />;
  }
  const answered = Object.values(answers).filter(Boolean).length;
  const urgent = secondsLeft < 300;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            Q {index + 1} / {questions.length}
          </span>
          <span className="text-xs text-[var(--color-muted)]">{answered} answered</span>
        </div>
        <div className={`font-mono text-lg tabular-nums ${urgent ? 'text-rose-400' : 'text-[var(--color-muted)]'}`}>
          {formatTime(secondsLeft)}
        </div>
        <button
          type="button"
          onClick={submitExam}
          className="rounded border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1.5 text-sm text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20"
        >
          Submit exam
        </button>
      </div>

      <div className="mt-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            {OBJECTIVES_BY_ID[q.objectiveId as keyof typeof OBJECTIVES_BY_ID]?.id ?? q.objectiveId}
          </span>
          {answers[q.id] && (
            <span className="text-xs text-emerald-400">Answered</span>
          )}
        </div>
        <p className="mt-3 text-base leading-relaxed">{q.stem}</p>

        <QuestionRenderer
          question={q}
          answer={answers[q.id] ?? null}
          submitted={false}
          onChange={(a) => {
            answersRef.current = { ...answersRef.current, [q.id]: a };
            setAnswers((prev) => ({ ...prev, [q.id]: a }));
          }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
          className="rounded border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm disabled:opacity-30 hover:bg-black/30"
        >
          ← Previous
        </button>

        <QuestionNav
          total={questions.length}
          current={index}
          answered={Object.fromEntries(questions.map((q) => [q.id, !!answers[q.id]]))}
          onJump={setIndex}
        />

        <button
          type="button"
          disabled={index === questions.length - 1}
          onClick={() => setIndex((i) => i + 1)}
          className="rounded border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-sm disabled:opacity-30 hover:bg-black/30"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function QuestionNav({
  total,
  current,
  answered,
  onJump,
}: {
  total: number;
  current: number;
  answered: Record<string, boolean>;
  onJump: (i: number) => void;
}) {
  // Show a compact strip of dots — current=blue, answered=emerald, unanswered=gray
  // Max 30 dots, then just show numbers
  if (total > 30) {
    return (
      <span className="text-xs text-[var(--color-muted)]">
        {Object.values(answered).filter(Boolean).length} / {total} answered
      </span>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {Array.from({ length: total }, (_, i) => {
        const isAnswered = Object.values(answered)[i];
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            title={`Question ${i + 1}`}
            className={`h-2 w-2 rounded-sm ${
              i === current
                ? 'bg-sky-400'
                : isAnswered
                ? 'bg-emerald-500/70'
                : 'bg-zinc-700'
            }`}
          />
        );
      })}
    </div>
  );
}

function ExamLanding({
  pool,
  examSize,
  onStart,
}: {
  pool: ExamQuestion[];
  examSize: number;
  onStart: () => void;
}) {
  const minutes = Math.max(1, Math.round((examSize * SECONDS_PER_QUESTION) / 60));
  const capped = examSize < FULL_EXAM_QUESTIONS;
  return (
    <div>
      <h1 className="text-2xl font-semibold">Exam Mode</h1>
      <div className="mt-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <p className="text-sm">
          {examSize}-question exam, {minutes} minute{minutes === 1 ? '' : 's'}, no feedback until
          submission.
        </p>
        <ul className="mt-4 space-y-1 text-sm text-[var(--color-muted)]">
          <li>{pool.length} questions available across loaded objectives</li>
          {capped ? (
            <li>
              All {examSize} available questions will be used (the full exam is {FULL_EXAM_QUESTIONS};
              more will unlock as content is added)
            </li>
          ) : (
            <li>{examSize} questions will be selected at random</li>
          )}
          <li>You can navigate freely and change answers before submitting</li>
          <li>Timer auto-submits when it reaches 0:00</li>
        </ul>
        <button
          type="button"
          onClick={onStart}
          className="mt-6 rounded border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-5 py-2 text-sm text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 disabled:opacity-40"
          disabled={pool.length === 0}
        >
          Start exam
        </button>
        {pool.length === 0 && (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            No questions available yet. Ingest content first.
          </p>
        )}
      </div>
    </div>
  );
}

function ExamReview({
  questions,
  answers,
  onRestart,
}: {
  questions: ExamQuestion[];
  answers: Record<string, Answer | null>;
  onRestart: () => void;
}) {
  const results = questions.map((q) => ({
    q,
    answer: answers[q.id] ?? null,
    correct: isCorrect(q, answers[q.id] ?? null),
  }));
  const numCorrect = results.filter((r) => r.correct).length;
  const total = results.length;
  const pct = Math.round((numCorrect / total) * 100);
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? results : results.filter((r) => !r.correct);

  return (
    <div>
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="text-4xl font-semibold tabular-nums">{pct}%</div>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {numCorrect} of {total} correct
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="rounded border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-black/30"
          >
            New exam
          </button>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-black/30"
          >
            {showAll ? 'Show incorrect only' : 'Show all questions'}
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {displayed.map(({ q, answer, correct }) => (
          <div
            key={q.id}
            className={`rounded-md border p-5 ${
              correct ? 'border-emerald-800/50 bg-emerald-500/5' : 'border-rose-800/50 bg-rose-500/5'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--color-muted)]">
                {OBJECTIVES_BY_ID[q.objectiveId as keyof typeof OBJECTIVES_BY_ID]?.id ?? q.objectiveId}
              </span>
              <span className={`text-xs font-medium ${correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                {correct ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{q.stem}</p>
            <QuestionRenderer
              question={q}
              answer={answer}
              submitted={true}
              onChange={() => {}}
            />
            <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-3">
              <p className="text-sm text-[var(--color-text)]">
                <span className="font-medium">Explanation: </span>
                {q.explanation}
              </p>
              {q.trap && (
                <p className="text-sm text-amber-300">
                  <span className="font-medium">Common trap: </span>
                  {q.trap}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
