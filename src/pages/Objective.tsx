import { Link, useParams } from 'react-router-dom';
import { OBJECTIVES_BY_ID, isObjectiveId } from '../content/objectives';
import { loadContent } from '../content/content-loader';
import Callout from '../components/Callout';

export default function Objective() {
  const { objectiveId } = useParams();

  if (!objectiveId || !isObjectiveId(objectiveId)) {
    return (
      <div>
        <p className="text-sm text-[var(--color-muted)]">Unknown objective.</p>
        <Link to="/" className="mt-2 inline-block text-sm text-[var(--color-accent)] hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const meta = OBJECTIVES_BY_ID[objectiveId];
  const topic = loadContent().topics.get(objectiveId);
  const estMinutes = topic?.estimatedMinutes ?? meta.estimatedMinutes;

  return (
    <div>
      <Link
        to={`/domain/${meta.domain}`}
        className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
      >
        ← Domain {meta.domain}.0
      </Link>

      <div className="mt-2 flex items-baseline gap-3">
        <span className="font-mono text-sm text-[var(--color-muted)]">{meta.id}</span>
        <span className="text-xs text-[var(--color-muted)]">This objective: ~{estMinutes} min</span>
      </div>
      <h1 className="mt-1 text-2xl font-semibold leading-snug">{meta.title}</h1>

      {!topic && (
        <div className="mt-8 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <p className="text-sm">No content yet for this objective.</p>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Paste a Professor Messer transcript covering {meta.id} to populate.
          </p>
        </div>
      )}

      {topic?.needsReview && (
        <div className="mt-6">
          <Callout kind="review">
            <strong>Stub content. </strong>
            {topic.reviewNotes ?? 'No transcript ingested yet.'}
          </Callout>
        </div>
      )}

      {topic?.subtopics.map((s) => (
        <section
          key={s.id}
          className="mt-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          <h2 className="text-lg font-medium">{s.heading}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
            {s.notes}
          </p>
          {s.whyOnExam && (
            <div className="mt-4">
              <Callout kind="why">
                <strong>Why this is on the exam: </strong>
                {s.whyOnExam}
              </Callout>
            </div>
          )}
          {s.commonTrap && (
            <div className="mt-3">
              <Callout kind="trap">
                <strong>Common trap: </strong>
                {s.commonTrap}
              </Callout>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
