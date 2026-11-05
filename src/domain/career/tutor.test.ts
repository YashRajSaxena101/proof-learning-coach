import { describe, expect, it } from "vitest";
import { formatTutorReply } from "./tutor";

describe("formatTutorReply", () => {
  it("keeps the guiding question with the explanation in displayed history", () => {
    expect(
      formatTutorReply({
        message: "Compare the judge with human labels.",
        nextQuestion: "Which disagreements would you review first?",
      }),
    ).toBe("Compare the judge with human labels.\n\nWhich disagreements would you review first?");
  });

  it("matches server history bounds without clipping the next question", () => {
    const reply = formatTutorReply({ message: "a".repeat(2000), nextQuestion: "q".repeat(400) });
    expect(reply).toBe("a".repeat(1598) + "\n\n" + "q".repeat(400));
    expect(reply).toHaveLength(2000);
  });
});
