import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { WorkScene } from "./WorkScene";
import { exampleScenario } from "@/domain/career/examples";

afterEach(cleanup);

it("does not render unsafe sharing as a protective access block", () => {
  const scenario = exampleScenario("Cybersecurity");
  const choice = scenario.decisions[0]!.choices[1]!;
  const { container } = render(<WorkScene scene={scenario.scene} choice={choice} />);
  expect(container.textContent).toContain("Share a full administrator account");
  expect(container.textContent).toContain(choice.consequence);
  expect(container.textContent).not.toMatch(
    /Held for review|hold request for review|scoped access path|Access granted/i,
  );
});

it("lets the learner inspect each committed decision without changing earlier meaning", () => {
  const scenario = exampleScenario("Cybersecurity");
  const decisions = scenario.decisions.map((decision, index) => ({
    id: decision.id,
    question: decision.question,
    choice: decision.choices[index ? 0 : 1]!,
  }));
  render(<WorkScene scene={scenario.scene} decisions={decisions} />);
  const earlier = screen.getByRole("button", { name: /1\. What is your first approach/ });
  const later = screen.getByRole("button", {
    name: /2\. How will you make the recommendation defensible/,
  });
  expect(earlier).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByText(/Selected approach: Share a full administrator account/),
  ).toBeInTheDocument();
  fireEvent.click(later);
  expect(later).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText(/Selected approach: Run a small trial/)).toBeInTheDocument();
  fireEvent.click(earlier);
  expect(
    screen.getByText(/Selected approach: Share a full administrator account/),
  ).toBeInTheDocument();
});

it("uses scenario labels without inventing retrieval semantics for an AI classifier", () => {
  const scene = exampleScenario("AI engineer").scene;
  scene.nodes = scene.nodes.map((node, i) => ({
    ...node,
    label: ["Training set", "Holdout set", "Classifier", "Error review"][i]!,
  }));
  const { container } = render(<WorkScene scene={scene} />);
  expect(container.textContent).toContain("Classifier");
  expect(container.textContent).not.toMatch(/retrieval|grounded answer|permitted evidence/i);
});

it("does not compare quality and speed as if they were experimental alternatives", () => {
  const scenario = exampleScenario("Product/Business");
  const { container } = render(
    <WorkScene scene={scenario.scene} choice={scenario.decisions[0]!.choices[0]} />,
  );
  expect(container.textContent).not.toMatch(/Comparison A|Comparison B|conversion rates/);
  expect(screen.getByText(/Quality assumption.*80\/100/)).toBeInTheDocument();
  expect(screen.getByText(/Speed assumption.*60\/100/)).toBeInTheDocument();
  expect(screen.getByText(/Resource cost assumption.*55\/100/)).toBeInTheDocument();
});
