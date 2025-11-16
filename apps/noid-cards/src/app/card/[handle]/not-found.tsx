import Link from "next/link";

export default function CardNotFound() {
  return (
    <main className="card-page">
      <div className="card-empty">
        <p>No credential is available for this handle.</p>
        <Link href="/">Return to directory</Link>
      </div>
    </main>
  );
}
