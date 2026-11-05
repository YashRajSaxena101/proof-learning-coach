import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Proof — workplace rehearsals for graduates" },
      {
        name: "description",
        content:
          "Proof connects learning to decisions, explanations and new constraints. Learn what is implemented and what still needs verification.",
      },
      { property: "og:title", content: "About Proof — workplace rehearsals for graduates" },
      {
        property: "og:description",
        content: "A truthful look at the practice experience and its limits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});
function About() {
  return (
    <Page>
      <p className="kicker">About Proof</p>
      <h1 className="mt-4 max-w-3xl text-4xl md:text-6xl">
        Practice the work behind the interview.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Proof is a workplace rehearsal space for graduates exploring a career. Choose a direction,
        work through a fictional team request, explain a decision and try a new constraint.
      </p>
      <section className="mt-10 max-w-2xl border-t border-border pt-6">
        <h2 className="text-3xl">What your progress means</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Your choices, attempts and help requests are recorded separately. Examples are labeled and
          do not produce AI assessments. Even live feedback is evidence from one exercise, not a
          guarantee of interview or workplace readiness.
        </p>
        <h2 className="mt-8 text-3xl">Current limits</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          The career coach uses Ollama for generated practice and feedback. Requests are limited;
          examples remain available if the service cannot respond. Career progress currently stays in your browser. Existing accounts and the
          original sample case are preserved. No learning-outcome pilot has been run.
        </p>
      </section>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg" variant="teal">
          <Link to="/practice" search={{ example: true }}>
            Try an example
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/present">Presentation preview</Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link to="/instructor">Sample instructor view</Link>
        </Button>
      </div>
    </Page>
  );
}
