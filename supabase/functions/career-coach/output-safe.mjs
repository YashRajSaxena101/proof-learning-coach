export function allowedGeneratedText(value) { return !/<\/?(?:script|iframe|style|img|svg|object)\b|https?:\/\/|javascript:/i.test(value); }
