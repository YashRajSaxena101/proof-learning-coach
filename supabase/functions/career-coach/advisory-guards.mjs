export const groundedEvidence = (resume, evidence) => Array.isArray(evidence) && evidence.length > 0 && evidence.every(quote => typeof quote === "string" && quote.trim().length > 0 && resume.includes(quote));
// Conservative lexical guard, not a complete detector for protected-trait inference.
export const protectedInference = values => values.some(value => /\b(?:\d{1,3}\s*(?:years? old|year-old)|age[ds]?\s*[:=]?\s*\d|disab(?:led|ility)|pregnan(?:t|cy)|race|racial|ethnicity|ethnic|nationality|religio(?:n|us)|gender identity|sexual orientation)\b/i.test(value));
