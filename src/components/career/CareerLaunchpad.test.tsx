import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { careerStore } from "@/services/career/store";
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <a
      href="/practice"
      onClick={(event) => {
        event.preventDefault();
        onClick?.();
      }}
    >
      {children}
    </a>
  ),
}));
vi.mock("./WorkScene", () => ({ WorkScene: () => <div>Workflow preview</div> }));
import { CareerLaunchpad } from "./CareerLaunchpad";
beforeEach(() => {
  cleanup();
  careerStore.set(() => ({ version: 1, sessions: [] }));
});
it("carries the chosen direction into setup without creating pretend progress", () => {
  render(<CareerLaunchpad />);
  fireEvent.click(screen.getByRole("button", { name: "Cybersecurity" }));
  expect(screen.getByRole("button", { name: "Cybersecurity" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("heading", { name: "Access without the overshare" })).toBeVisible();
  fireEvent.click(screen.getByRole("link", { name: /Personalize this direction/ }));
  expect(careerStore.get().profile?.topic).toBe("Cybersecurity");
  expect(careerStore.get().sessions).toEqual([]);
});
