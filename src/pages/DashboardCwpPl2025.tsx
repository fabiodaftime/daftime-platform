import { useParams } from "react-router-dom";

export default function DashboardCwpPl2025() {
  const { id } = useParams();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto w-full max-w-6xl px-6 pt-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          CWP P&amp;L 2025 and EBITDA
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Page vide (template en cours). Company ID: {id}
        </p>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <p className="text-sm text-muted-foreground">
            Collez ici le HTML à reporter et je le transformerai en composants React.
          </p>
        </div>
      </section>
    </main>
  );
}
