import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Not found.</h1>
      <Link
        to="/"
        className="mt-3 inline-block text-sm text-[var(--color-accent)] hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
