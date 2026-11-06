/**
 * Pure helpers for guest ↔ seat assignment and plan validation.
 *
 * They operate on the existing SeatingPlanV2 model (assignments are
 * `{ seatId: `${tableId}-seat-${index}`, guestId }`), so every change made
 * through them is persisted by the existing save mechanism (PATCH /api/seating).
 */
import type {
  SeatingAssignment,
  SeatingGuest,
  SeatingObject,
  SeatingPlanV2,
} from './seating-types';

export const TABLE_TYPES = ['round-table', 'rect-table', 'oval-table'] as const;
export const DEFAULT_TABLE_CAPACITY = 8;

export function isTableObject(object: SeatingObject) {
  return (TABLE_TYPES as readonly string[]).includes(object.type);
}

export function tableCapacity(table: SeatingObject) {
  return table.capacity ?? DEFAULT_TABLE_CAPACITY;
}

export function seatIdFor(tableId: string, index: number) {
  return `${tableId}-seat-${index}`;
}

/** Splits a seat id into its object id and seat index without needing the objects list. */
export function parseSeatId(seatId: string): { objectId: string; index: number } | null {
  const match = seatId.match(/^(.+)-seat-(\d+)$/);
  if (!match) return null;
  return { objectId: match[1], index: Number(match[2]) };
}

export type SeatLocation = {
  table: SeatingObject;
  index: number;
};

/** Resolves a seat id to a real table and an in-range seat index, or null. */
export function locateSeat(plan: SeatingPlanV2, seatId: string): SeatLocation | null {
  const parsed = parseSeatId(seatId);
  if (!parsed) return null;
  const table = plan.objects.find(item => item.id === parsed.objectId);
  if (!table || !isTableObject(table)) return null;
  if (parsed.index < 0 || parsed.index >= tableCapacity(table)) return null;
  return { table, index: parsed.index };
}

export function tableAssignments(plan: SeatingPlanV2, tableId: string) {
  const prefix = `${tableId}-seat-`;
  return plan.assignments.filter(item => item.seatId.startsWith(prefix));
}

/** Index of the first empty, valid seat at the table, or -1 when the table is full. */
export function findFreeSeatIndex(plan: SeatingPlanV2, table: SeatingObject) {
  const taken = new Set(plan.assignments.map(item => item.seatId));
  for (let i = 0; i < tableCapacity(table); i++) {
    if (!taken.has(seatIdFor(table.id, i))) return i;
  }
  return -1;
}

export type AssignResult =
  | { ok: true; plan: SeatingPlanV2; seatId: string; changed: boolean }
  | { ok: false; reason: 'table-full' | 'seat-occupied' | 'invalid-seat' | 'invalid-table' | 'unknown-guest' };

function withGuestAt(plan: SeatingPlanV2, guestId: string, seatId: string): SeatingPlanV2 {
  const assignments: SeatingAssignment[] = plan.assignments.filter(item => item.guestId !== guestId);
  assignments.push({ seatId, guestId });
  return { ...plan, assignments };
}

/**
 * Places a guest on a specific seat. Moving an already-seated guest frees their
 * previous seat. Occupied seats are never overwritten.
 */
export function assignGuestToSeat(
  plan: SeatingPlanV2,
  guestId: string,
  seatId: string,
  guests?: SeatingGuest[],
): AssignResult {
  if (guests && !guests.some(guest => guest.id === guestId)) return { ok: false, reason: 'unknown-guest' };
  if (!locateSeat(plan, seatId)) return { ok: false, reason: 'invalid-seat' };

  const occupant = plan.assignments.find(item => item.seatId === seatId);
  if (occupant && occupant.guestId === guestId) return { ok: true, plan, seatId, changed: false };
  if (occupant) return { ok: false, reason: 'seat-occupied' };

  return { ok: true, plan: withGuestAt(plan, guestId, seatId), seatId, changed: true };
}

/**
 * Places a guest at the first available seat of a table. A guest who already
 * sits at that table keeps their seat.
 */
export function assignGuestToTable(
  plan: SeatingPlanV2,
  guestId: string,
  tableId: string,
  guests?: SeatingGuest[],
): AssignResult {
  if (guests && !guests.some(guest => guest.id === guestId)) return { ok: false, reason: 'unknown-guest' };
  const table = plan.objects.find(item => item.id === tableId);
  if (!table || !isTableObject(table)) return { ok: false, reason: 'invalid-table' };

  const current = plan.assignments.find(item => item.guestId === guestId);
  if (current && locateSeat(plan, current.seatId)?.table.id === tableId) {
    return { ok: true, plan, seatId: current.seatId, changed: false };
  }

  const index = findFreeSeatIndex(plan, table);
  if (index < 0) return { ok: false, reason: 'table-full' };

  const seatId = seatIdFor(table.id, index);
  return { ok: true, plan: withGuestAt(plan, guestId, seatId), seatId, changed: true };
}

export function unassignGuest(plan: SeatingPlanV2, guestId: string): SeatingPlanV2 {
  return { ...plan, assignments: plan.assignments.filter(item => item.guestId !== guestId) };
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export type SeatingIssueCode =
  | 'malformed-seat'
  | 'missing-table'
  | 'seat-out-of-range'
  | 'over-capacity'
  | 'duplicate-seat'
  | 'duplicate-guest'
  | 'unknown-guest'
  | 'excluded-adjacent'
  | 'required-split'
  | 'insufficient-seats'
  | 'unassigned-guest';

export type SeatingIssue = {
  code: SeatingIssueCode;
  /** errors make the plan unsavable or inconsistent; warnings are planning hints */
  severity: 'error' | 'warning';
  guestIds: string[];
  seatIds: string[];
  tableId?: string;
  /** numeric details, e.g. assigned/capacity for over-capacity */
  count?: number;
  limit?: number;
};

function areAdjacent(a: number, b: number, capacity: number) {
  if (capacity < 2 || a === b) return false;
  return (a + 1) % capacity === b || (b + 1) % capacity === a;
}

/**
 * Inspects the real plan + guest list and reports every inconsistency the
 * current data model can express. Mirrors (and extends) the checks the API
 * performs on save, so problems are visible before saving fails.
 */
export function validateSeatingPlan(plan: SeatingPlanV2, guests: SeatingGuest[]): SeatingIssue[] {
  const issues: SeatingIssue[] = [];
  const guestIds = new Set(guests.map(guest => guest.id));
  const objectsById = new Map(plan.objects.map(item => [item.id, item]));
  const tables = plan.objects.filter(isTableObject);

  const seatCounts = new Map<string, string[]>();
  const guestSeats = new Map<string, string[]>();
  const perTable = new Map<string, Set<string>>();
  const outOfRangeByTable = new Map<string, { seatIds: string[]; guestIds: string[] }>();

  for (const item of plan.assignments) {
    seatCounts.set(item.seatId, [...(seatCounts.get(item.seatId) ?? []), item.guestId]);
    guestSeats.set(item.guestId, [...(guestSeats.get(item.guestId) ?? []), item.seatId]);

    if (!guestIds.has(item.guestId)) {
      issues.push({ code: 'unknown-guest', severity: 'error', guestIds: [item.guestId], seatIds: [item.seatId] });
    }

    const parsed = parseSeatId(item.seatId);
    if (!parsed) {
      issues.push({ code: 'malformed-seat', severity: 'error', guestIds: [item.guestId], seatIds: [item.seatId] });
      continue;
    }

    const object = objectsById.get(parsed.objectId);
    if (!object || !isTableObject(object)) {
      issues.push({ code: 'missing-table', severity: 'error', guestIds: [item.guestId], seatIds: [item.seatId] });
      continue;
    }

    const set = perTable.get(object.id) ?? new Set<string>();
    set.add(item.guestId);
    perTable.set(object.id, set);

    if (parsed.index >= tableCapacity(object)) {
      const entry = outOfRangeByTable.get(object.id) ?? { seatIds: [], guestIds: [] };
      entry.seatIds.push(item.seatId);
      entry.guestIds.push(item.guestId);
      outOfRangeByTable.set(object.id, entry);
    }
  }

  for (const [tableId, entry] of outOfRangeByTable) {
    issues.push({
      code: 'seat-out-of-range', severity: 'error', tableId,
      guestIds: entry.guestIds, seatIds: entry.seatIds,
    });
  }

  for (const table of tables) {
    const seated = perTable.get(table.id)?.size ?? 0;
    if (seated > tableCapacity(table)) {
      issues.push({
        code: 'over-capacity', severity: 'error', tableId: table.id,
        guestIds: [...(perTable.get(table.id) ?? [])], seatIds: [],
        count: seated, limit: tableCapacity(table),
      });
    }
  }

  for (const [seatId, ids] of seatCounts) {
    if (ids.length > 1) {
      issues.push({
        code: 'duplicate-seat', severity: 'error', guestIds: [...new Set(ids)], seatIds: [seatId],
        tableId: parseSeatId(seatId)?.objectId,
      });
    }
  }

  for (const [guestId, seatIds] of guestSeats) {
    if (seatIds.length > 1) {
      issues.push({ code: 'duplicate-guest', severity: 'error', guestIds: [guestId], seatIds });
    }
  }

  // Relationship checks only on clean, valid assignments.
  const validSeat = new Map<string, SeatLocation>();
  for (const item of plan.assignments) {
    if (guestSeats.get(item.guestId)?.length !== 1) continue;
    const location = locateSeat(plan, item.seatId);
    if (location) validSeat.set(item.guestId, location);
  }

  const seenPairs = new Set<string>();
  for (const [guestId, profile] of Object.entries(plan.guestProfiles ?? {})) {
    if (!guestIds.has(guestId)) continue;
    const here = validSeat.get(guestId);

    for (const otherId of profile.excludedNeighbors) {
      const key = [guestId, otherId].sort().join('|');
      if (seenPairs.has(`x:${key}`) || !guestIds.has(otherId)) continue;
      seenPairs.add(`x:${key}`);
      const there = validSeat.get(otherId);
      if (here && there && here.table.id === there.table.id &&
        areAdjacent(here.index, there.index, tableCapacity(here.table))) {
        issues.push({
          code: 'excluded-adjacent', severity: 'warning', tableId: here.table.id,
          guestIds: [guestId, otherId],
          seatIds: [seatIdFor(here.table.id, here.index), seatIdFor(there.table.id, there.index)],
        });
      }
    }

    for (const otherId of profile.requiredNeighbors) {
      const key = [guestId, otherId].sort().join('|');
      if (seenPairs.has(`r:${key}`) || !guestIds.has(otherId)) continue;
      seenPairs.add(`r:${key}`);
      const there = validSeat.get(otherId);
      if (here && there && here.table.id !== there.table.id) {
        issues.push({
          code: 'required-split', severity: 'warning',
          guestIds: [guestId, otherId],
          seatIds: [seatIdFor(here.table.id, here.index), seatIdFor(there.table.id, there.index)],
        });
      }
    }
  }

  const totalSeats = tables.reduce((sum, table) => sum + tableCapacity(table), 0);
  if (guests.length > totalSeats) {
    issues.push({
      code: 'insufficient-seats', severity: 'warning', guestIds: [], seatIds: [],
      count: guests.length, limit: totalSeats,
    });
  }

  // A guest whose only assignment points at a missing table/seat is effectively unseated.
  const unassigned = guests.filter(guest =>
    !(guestSeats.get(guest.id) ?? []).some(seatId => locateSeat(plan, seatId)));
  if (unassigned.length) {
    issues.push({
      code: 'unassigned-guest', severity: 'warning',
      guestIds: unassigned.map(guest => guest.id), seatIds: [],
    });
  }

  return issues;
}

/**
 * Removes every assignment the API would reject (or that is otherwise
 * inconsistent): unknown guests, nonexistent tables/seats, duplicate seats and
 * duplicate guests. The first valid assignment of each guest/seat is kept.
 */
export function repairAssignments(plan: SeatingPlanV2, guests: SeatingGuest[]) {
  const guestIds = new Set(guests.map(guest => guest.id));
  const usedSeats = new Set<string>();
  const usedGuests = new Set<string>();
  const kept: SeatingAssignment[] = [];

  for (const item of plan.assignments) {
    if (!guestIds.has(item.guestId)) continue;
    if (!locateSeat(plan, item.seatId)) continue;
    if (usedSeats.has(item.seatId) || usedGuests.has(item.guestId)) continue;
    usedSeats.add(item.seatId);
    usedGuests.add(item.guestId);
    kept.push(item);
  }

  return {
    plan: { ...plan, assignments: kept },
    removed: plan.assignments.length - kept.length,
  };
}
