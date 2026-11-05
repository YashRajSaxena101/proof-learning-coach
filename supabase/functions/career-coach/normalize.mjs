const validId = value => typeof value === "string" && /^[a-z0-9-]{1,20}$/.test(value);
const canRepair = ids => ids.every(id => typeof id === "string" && id.length > 0 && id.length <= 200);
const needsRepair = ids => ids.some(id => !validId(id)) || new Set(ids).size !== ids.length;

export function normalizeDecisionIds(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.decisions)) return value;
  const decisions = value.decisions;
  if (!decisions.every(d => d && typeof d === "object" && !Array.isArray(d))) return value;
  const ids = decisions.map(d => d.id);
  if (!canRepair(ids)) return value;
  const replaceDecisions = needsRepair(ids);
  return { ...value, decisions: decisions.map((decision, index) => {
    let result = replaceDecisions ? { ...decision, id: `d${index + 1}` } : { ...decision };
    if (!Array.isArray(decision.choices) || !decision.choices.every(c => c && typeof c === "object" && !Array.isArray(c))) return result;
    const choiceIds = decision.choices.map(c => c.id);
    if (canRepair(choiceIds) && needsRepair(choiceIds)) {
      result = { ...result, choices: decision.choices.map((choice, i) => ({ ...choice, id: `c${i + 1}` })) };
    }
    return result;
  }) };
}
