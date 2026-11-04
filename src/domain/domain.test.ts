import { describe, expect, it } from "vitest";
import {
  ORDERS, LINE_ITEMS, PREVIOUS_MONTH_REVENUE, joinOrders, faultyJoinedTotal, distinctValueTotal,
  orderGrainTotal, lineAmountTotal, growthPct, inconsistentOrders, contributions, collidingTotals,
  evaluateRepair, REPAIR_OPTIONS, WAREHOUSES, SUPPLIER_LINKS, inventoryJoinedTotal, inventoryTrueTotal,
} from "./fanout";
import { predictionBranch, outcome, emptyProgress, scoreTeachBack, hasCoreCriteria, transferUnassisted, earlierHints } from "./learning";
import { curatedFeedback } from "./curated-feedback";

const rows = joinOrders(ORDERS, LINE_ITEMS);

describe("Revenue Mirage data", () => {
  it("line items sum to each order total", () => expect(inconsistentOrders(ORDERS, LINE_ITEMS)).toEqual([]));
  it("join yields 8 rows", () => expect(rows).toHaveLength(8));
  it("faulty join returns $1000 and a false +100%", () => {
    expect(faultyJoinedTotal(rows)).toBe(1000);
    expect(growthPct(PREVIOUS_MONTH_REVENUE, 1000)).toBe(100);
  });
  it("true revenue is $500, 0% growth, by both correct methods", () => {
    expect(orderGrainTotal(ORDERS)).toBe(500);
    expect(lineAmountTotal(rows)).toBe(500);
    expect(growthPct(PREVIOUS_MONTH_REVENUE, 500)).toBe(0);
  });
  it("SUM(DISTINCT total) is wrong ($380) because O101 and O103 share $120", () => {
    expect(distinctValueTotal(rows)).toBe(380);
    expect(collidingTotals(ORDERS)).toEqual([{ value: 120, orderIds: ["O101", "O103"] }]);
  });
  it("each order is counted twice, excess totals $500", () => {
    const c = contributions(rows);
    expect(c.every((x) => x.timesCounted === 2)).toBe(true);
    expect(c.reduce((a, x) => a + x.excess, 0)).toBe(500);
  });
  it("detects inconsistent line items", () => {
    expect(inconsistentOrders(ORDERS, LINE_ITEMS.slice(1))).toEqual(["O101"]);
  });
  it("repair options evaluate to their real results and correctness flags agree", () => {
    for (const o of REPAIR_OPTIONS) expect(evaluateRepair(o.id) === 500).toBe(o.correct);
    expect(evaluateRepair("distinct")).toBe(380);
  });
  it("growth throws on zero baseline", () => expect(() => growthPct(0, 10)).toThrow());
});

describe("Inventory transfer", () => {
  it("joined total is 100, true total 50", () => {
    expect(inventoryJoinedTotal(WAREHOUSES, SUPPLIER_LINKS)).toBe(100);
    expect(inventoryTrueTotal(WAREHOUSES)).toBe(50);
  });
});

describe("Adaptive learning rules", () => {
  it("high-confidence wrong → misconception; low → scaffold", () => {
    expect(predictionBranch(false, "high")).toBe("misconception");
    expect(predictionBranch(false, "low")).toBe("scaffold");
    expect(predictionBranch(true, "high")).toBe("confirm");
  });
  const solved = (attempts = [50]) => {
    const p = emptyProgress();
    p.events.push({ at: "t", step: "transfer", kind: "transfer", detail: "50" });
    p.repairSolved = true;
    p.transfer = { attempts, solved: true };
    return p;
  };
  it("first-try, no-hint transfer is unassisted", () => expect(outcome(solved())).toBe("transfer_correct_unassisted"));
  it("transfer hint makes it assisted", () => {
    const p = solved(); p.hints.transfer = 1;
    expect(outcome(p)).toBe("transfer_correct_assisted");
  });
  it("a wrong first try (retry) makes it assisted", () => expect(outcome(solved([100, 50]))).toBe("transfer_correct_assisted"));
  it("earlier hints are reported separately and don't relabel an unassisted transfer", () => {
    const p = solved(); p.hints.predict = 2; p.hints.repair = 1;
    expect(transferUnassisted(p)).toBe(true);
    expect(earlierHints(p)).toBe(3);
  });
  it("unsolved transfer stays in progress", () => {
    const p = solved(); p.transfer = { attempts: [100], solved: false };
    expect(outcome(p)).toBe("in_progress");
  });
  it("teach-back rubric scores a complete explanation", () => {
    const met = scoreTeachBack("The join repeated each order once per line item, so totals doubled. Sum li.amount instead; DISTINCT drops O103 because it has the same $120 value.");
    expect(hasCoreCriteria(met)).toBe(true);
    expect(scoreTeachBack("revenue went up")).toEqual([]);
  });
  it("missing fix fails core criteria even when DISTINCT is explained", () => {
    const met = scoreTeachBack("The join duplicated each order once per line item, so it doubled. DISTINCT is wrong because O101 and O103 share $120.");
    expect(met).toContain("distinct");
    expect(met).not.toContain("fix");
    expect(hasCoreCriteria(met)).toBe(false);
  });
  it("negated fix is not counted and is flagged in the provisional checklist", () => {
    const r = curatedFeedback("Each order was duplicated per line item at that grain; do not sum line amounts.");
    expect(r.met).not.toContain("fix");
    expect(r.negationFlag).toBe(true);
    expect(r.coreCovered).toBe(false);
  });
  it("checklist never claims verification even when all keywords match", () => {
    const r = curatedFeedback("The join repeated each order per line item so it doubled; sum li.amount instead.");
    expect(r.coreCovered).toBe(true);
    expect("passed" in r).toBe(false);
    expect(r.message).toMatch(/not a verified assessment/);
  });
});

import { completedSteps as _cs, emptyProgress as _ep, STEPS as _S } from "./learning";
describe("display completion", () => {
  it("fresh progress shows 0 of 8", () => { expect(_cs(_ep())).toEqual([]); });
  it("solved transfer counts even when not in completed, giving 8/8 in step order", () => {
    const p = { ..._ep(), completed: ["teach", "brief", "predict", "explore", "join", "trace", "repair", "brief"] as typeof _S[number]["id"][], transfer: { attempts: [50], solved: true } };
    const before = JSON.stringify(p);
    expect(_cs(p)).toEqual(_S.map((s) => s.id));
    expect(JSON.stringify(p)).toBe(before);
  });
  it("unsolved transfer is not counted", () => { expect(_cs({ ..._ep(), completed: ["brief"] })).toEqual(["brief"]); });
});
