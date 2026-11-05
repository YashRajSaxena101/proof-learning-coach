/** Keep the visible coach turn identical to the bounded server conversation. */
export function formatTutorReply(reply: { message: string; nextQuestion: string }): string {
  return `${reply.message.slice(0, 1598)}\n\n${reply.nextQuestion}`;
}
