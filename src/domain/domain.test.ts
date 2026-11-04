import { describe, expect, it } from "vitest";
import {
  ORDERS, LINE_ITEMS, PREVIOUS_MONTH_REVENUE, joinOrders, faultyJoinedTotal, distinctValueTotal,
  orderGrainTotal, lineAmountTotal, growthPct, inconsistentOrders, contributions, collidingTotals,
  evaluateRepair, REPAIR_OPTIONS, WAREHOUSES, SUPPLIER_LINKS, inventoryJoinedTotal, inventoryTrueTotal,
} from "./fanout";
import { predictionBranch, outcome, emptyProgress, scoreTeachBack, TEACH_PASS } from "./learning";

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
  const solved = () => {
    const p = emptyProgress();
    p.events.push({ at: "t", step: "transfer", kind: "transfer", detail: "50" });
    p.repairSolved = true;
    p.transfer = { attempts: [50], solved: true };
    p.teach = { text: "", met: ["duplication", "grain", "fix"] };
    return p;
  };
  it("clean first-try transfer + teach-back = demonstrated in this exercise", () => expect(outcome(solved())).toBe("demonstrated"));
  it("hinted transfer is assisted success, not demonstrated", () => {
    const p = solved(); p.hints.transfer = 1;
    expect(outcome(p)).toBe("assisted_success");
  });
  it("second-attempt transfer is assisted success", () => {
    const p = solved(); p.transfer.attempts = [100, 50];
    expect(outcome(p)).toBe("assisted_success");
  });
  it("teach-back rubric scores a complete explanation", () => {
    const met = scoreTeachBack("The join repeated each order once per line item, so totals doubled. Sum li.amount instead; DISTINCT drops O103 because it has the same $120 value.");
    expect(met.length).toBeGreaterThanOrEqual(TEACH_PASS);
    expect(scoreTeachBack("revenue went up")).toEqual([]);
  });
});
