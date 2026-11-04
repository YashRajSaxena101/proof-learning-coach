// Pure, deterministic calculations for join fan-out scenarios. No I/O.

export interface Order { id: string; total: number }
export interface LineItem { id: string; orderId: string; amount: number }
export interface JoinedRow { orderId: string; orderTotal: number; lineId: string; lineAmount: number }

export const PREVIOUS_MONTH_REVENUE = 500;

export const ORDERS: Order[] = [
  { id: "O101", total: 120 },
  { id: "O102", total: 80 },
  { id: "O103", total: 120 },
  { id: "O104", total: 180 },
];

export const LINE_ITEMS: LineItem[] = [
  { id: "L1", orderId: "O101", amount: 50 },
  { id: "L2", orderId: "O101", amount: 70 },
  { id: "L3", orderId: "O102", amount: 30 },
  { id: "L4", orderId: "O102", amount: 50 },
  { id: "L5", orderId: "O103", amount: 40 },
  { id: "L6", orderId: "O103", amount: 80 },
  { id: "L7", orderId: "O104", amount: 100 },
  { id: "L8", orderId: "O104", amount: 80 },
];

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function joinOrders(orders: Order[], items: LineItem[]): JoinedRow[] {
  return orders.flatMap((o) =>
    items.filter((i) => i.orderId === o.id).map((i) => ({
      orderId: o.id, orderTotal: o.total, lineId: i.id, lineAmount: i.amount,
    })),
  );
}

/** SUM(orders.total) over the joined rows — the faulty dashboard query. */
export const faultyJoinedTotal = (rows: JoinedRow[]) => sum(rows.map((r) => r.orderTotal));
/** SUM(DISTINCT orders.total) — collapses equal *values*, not equal orders. */
export const distinctValueTotal = (rows: JoinedRow[]) => sum([...new Set(rows.map((r) => r.orderTotal))]);
/** SUM(total) FROM orders — correct, order grain. */
export const orderGrainTotal = (orders: Order[]) => sum(orders.map((o) => o.total));
/** SUM(line_items.amount) — correct, line grain. */
export const lineAmountTotal = (rows: JoinedRow[]) => sum(rows.map((r) => r.lineAmount));

export function growthPct(previous: number, current: number): number {
  if (previous === 0) throw new Error("Previous period is zero; growth undefined");
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Orders whose line items don't add up to the order total. Empty = consistent data. */
export function inconsistentOrders(orders: Order[], items: LineItem[]): string[] {
  return orders
    .filter((o) => sum(items.filter((i) => i.orderId === o.id).map((i) => i.amount)) !== o.total)
    .map((o) => o.id);
}

export interface Contribution { orderId: string; total: number; timesCounted: number; contributed: number; excess: number }
export function contributions(rows: JoinedRow[]): Contribution[] {
  const map = new Map<string, Contribution>();
  for (const r of rows) {
    const c = map.get(r.orderId) ?? { orderId: r.orderId, total: r.orderTotal, timesCounted: 0, contributed: 0, excess: 0 };
    c.timesCounted += 1;
    c.contributed += r.orderTotal;
    c.excess = c.contributed - c.total;
    map.set(r.orderId, c);
  }
  return [...map.values()];
}

/** Values that appear on more than one distinct order — why DISTINCT is wrong. */
export function collidingTotals(orders: Order[]): { value: number; orderIds: string[] }[] {
  const by = new Map<number, string[]>();
  for (const o of orders) by.set(o.total, [...(by.get(o.total) ?? []), o.id]);
  return [...by.entries()].filter(([, ids]) => ids.length > 1).map(([value, orderIds]) => ({ value, orderIds }));
}

// ---------- Repair options (validated, no arbitrary SQL execution) ----------
export type RepairId = "join_sum" | "distinct" | "order_grain" | "line_sum";
export interface RepairOption { id: RepairId; label: string; sql: string; correct: boolean; why: string }

export const REPAIR_OPTIONS: RepairOption[] = [
  { id: "distinct", label: "Deduplicate with DISTINCT", correct: false,
    sql: "SELECT SUM(DISTINCT o.total)\nFROM orders o\nJOIN line_items li ON li.order_id = o.id;",
    why: "DISTINCT removes repeated values, not repeated orders. O101 and O103 are both $120, so one real order vanishes." },
  { id: "order_grain", label: "Aggregate at order grain", correct: true,
    sql: "SELECT SUM(o.total)\nFROM orders o;",
    why: "One row per order, so each order's total is counted exactly once." },
  { id: "line_sum", label: "Sum the line amounts", correct: true,
    sql: "SELECT SUM(li.amount)\nFROM orders o\nJOIN line_items li ON li.order_id = o.id;",
    why: "After the join the grain is one row per line item — so sum the line-level column." },
  { id: "join_sum", label: "Keep the dashboard query", correct: false,
    sql: "SELECT SUM(o.total)\nFROM orders o\nJOIN line_items li ON li.order_id = o.id;",
    why: "Each order total is repeated once per line item, doubling revenue." },
];

export function evaluateRepair(id: RepairId, orders = ORDERS, items = LINE_ITEMS): number {
  const rows = joinOrders(orders, items);
  switch (id) {
    case "join_sum": return faultyJoinedTotal(rows);
    case "distinct": return distinctValueTotal(rows);
    case "order_grain": return orderGrainTotal(orders);
    case "line_sum": return lineAmountTotal(rows);
  }
}

// ---------- Transfer: inventory ----------
export interface Warehouse { id: string; name: string; quantity: number }
export interface SupplierLink { warehouseId: string; supplier: string }

export const WAREHOUSES: Warehouse[] = [
  { id: "W1", name: "Dallas", quantity: 30 },
  { id: "W2", name: "Austin", quantity: 20 },
];
export const SUPPLIER_LINKS: SupplierLink[] = [
  { warehouseId: "W1", supplier: "Acorn Parts" },
  { warehouseId: "W1", supplier: "Bluebird Co." },
  { warehouseId: "W2", supplier: "Acorn Parts" },
  { warehouseId: "W2", supplier: "Cedar Goods" },
];

export function inventoryJoinedTotal(ws: Warehouse[], links: SupplierLink[]): number {
  return sum(ws.flatMap((w) => links.filter((l) => l.warehouseId === w.id).map(() => w.quantity)));
}
export const inventoryTrueTotal = (ws: Warehouse[]) => sum(ws.map((w) => w.quantity));
