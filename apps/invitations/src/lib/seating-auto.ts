import type {
  SeatingPlanV2,
  SeatingGuest,
  SeatingAssignment,
  SeatingObject,
  GuestSeatingProfile,
} from './seating-types';
import { isTableObject, tableCapacity } from './seating-logic';

export type SeatingProposalIssueCode =
  | 'group-too-large'   // a "++" group is larger than the biggest table
  | 'group-split'       // a "++" group had to be split across tables
  | 'not-contiguous'    // a "++" group sits at one table but not side by side
  | 'sides-mixed'       // bride/groom side guests share a table (to avoid leaving them unseated)
  | 'excluded-conflict' // free seats exist, but each one is next to a "keep apart" guest
  | 'no-seat';          // there are more guests than free seats

export type SeatingProposalIssue = {
  code: SeatingProposalIssueCode;
  guestIds: string[];
};

export type SeatingProposal = {
  id: string;
  variant: 1 | 2 | 3;
  title: string;
  assignments: SeatingAssignment[];
  /** 0–100: share of guests seated, minus soft-constraint compromises */
  score: number;
  /** total guests seated in this proposal (kept + newly placed) */
  seated: number;
  /** existing assignments preserved untouched */
  kept: number;
  /** guests newly placed by this proposal */
  added: number;
  unseated: string[];
  issues: SeatingProposalIssue[];
};

export type SeatingProposalOptions = {
  /** Keep current valid assignments and only seat unassigned guests (default: true). */
  keepExisting?: boolean;
};

type Seat = {
  id: string;
  tableId: string;
  index: number;
  capacity: number;
};

type Weights = {
  group: number;
  side: number;
  preferred: number;
  fit: number;
};

const VARIANT_WEIGHTS: Record<1 | 2 | 3, Weights> = {
  1: { group: 60, side: 15, preferred: 500, fit: 250 },     // balanced
  2: { group: 220, side: 50, preferred: 250, fit: 900 },    // keep groups together
  3: { group: 25, side: 8, preferred: 1600, fit: 120 },     // honour preferred neighbours
};

const TITLES: Record<1 | 2 | 3, string> = {
  1: 'Balanced seating',
  2: 'Group-focused seating',
  3: 'Preference-focused seating',
};

const DEFAULT_PROFILE: GuestSeatingProfile = {
  side: 'shared',
  group: 'other',
  requiredNeighbors: [],
  preferredNeighbors: [],
  excludedNeighbors: [],
  isVip: false,
  accessibility: false,
};

function distance(a: SeatingObject, b: SeatingObject) {
  return Math.hypot(
    a.x + a.width / 2 - (b.x + b.width / 2),
    a.y + a.height / 2 - (b.y + b.height / 2),
  );
}

function hash(value: string) {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) {
    result ^= value.charCodeAt(i);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function getProfile(plan: SeatingPlanV2, id: string) {
  return plan.guestProfiles?.[id] ?? DEFAULT_PROFILE;
}

function hasRelation(
  plan: SeatingPlanV2,
  a: string,
  b: string,
  field: 'requiredNeighbors' | 'preferredNeighbors' | 'excludedNeighbors',
) {
  return getProfile(plan, a)[field].includes(b) ||
    getProfile(plan, b)[field].includes(a);
}

function makeSeats(objects: SeatingObject[]): Seat[] {
  return objects.filter(isTableObject).flatMap(table => {
    // Same capacity rule the editor and the API use (capacity ?? 8).
    const capacity = tableCapacity(table);
    return Array.from({ length: capacity }, (_, index) => ({
      id: `${table.id}-seat-${index}`,
      tableId: table.id,
      index,
      capacity,
    }));
  });
}

function areAdjacent(a: number, b: number, capacity: number) {
  if (capacity < 2 || a === b) return false;
  return (a + 1) % capacity === b || (b + 1) % capacity === a;
}

/** Connected components of the "must sit together" (++) relation. */
function getComponents(guests: SeatingGuest[], plan: SeatingPlanV2) {
  const byId = new Map(guests.map(g => [g.id, g]));
  const visited = new Set<string>();
  const components: SeatingGuest[][] = [];

  for (const guest of guests) {
    if (visited.has(guest.id)) continue;

    const stack = [guest.id];
    const component: SeatingGuest[] = [];
    visited.add(guest.id);

    while (stack.length) {
      const id = stack.pop()!;
      const current = byId.get(id);
      if (current) component.push(current);

      for (const other of guests) {
        if (visited.has(other.id)) continue;
        if (hasRelation(plan, id, other.id, 'requiredNeighbors')) {
          visited.add(other.id);
          stack.push(other.id);
        }
      }
    }

    components.push(component);
  }

  return components;
}

/** Dominant named group of a component ('other' when none). */
function groupKey(component: SeatingGuest[], plan: SeatingPlanV2) {
  const counts = new Map<string, number>();
  for (const guest of component) {
    const group = getProfile(plan, guest.id).group;
    if (group && group !== 'other') counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  let best = 'other';
  let bestCount = 0;
  for (const [group, count] of counts) {
    if (count > bestCount) { best = group; bestCount = count; }
  }
  return best;
}

function getOrders(group: SeatingGuest[], variant: number): SeatingGuest[][] {
  if (group.length <= 1) return [[...group]];

  const sorted = [...group].sort((a, b) =>
    hash(`${a.id}:${variant}`) - hash(`${b.id}:${variant}`)
  );

  const orders: SeatingGuest[][] = [];
  const seen = new Set<string>();
  const add = (order: SeatingGuest[]) => {
    const key = order.map(g => g.id).join('|');
    if (seen.has(key)) return;
    seen.add(key);
    orders.push(order);
  };

  add(sorted);
  add([...sorted].reverse());

  for (let i = 0; i < sorted.length; i++) {
    add([...sorted.slice(i), ...sorted.slice(0, i)]);
    const reversed = [...sorted].reverse();
    add([...reversed.slice(i), ...reversed.slice(0, i)]);
  }

  if (group.length <= 6) {
    const permute = (remaining: SeatingGuest[], current: SeatingGuest[]) => {
      if (!remaining.length) { add(current); return; }
      for (let i = 0; i < remaining.length; i++) {
        permute(
          [...remaining.slice(0, i), ...remaining.slice(i + 1)],
          [...current, remaining[i]],
        );
      }
    };
    permute(sorted, []);
  }

  return orders;
}

/** Empty seats trapped between occupied seats at one table (excluding the single largest gap). */
function compactnessPenalty(capacity: number, occupiedIndexes: number[], newIndexes: number[]) {
  const indexes = new Set([...occupiedIndexes, ...newIndexes]);
  if (indexes.size <= 1) return 0;

  const sorted = [...indexes].sort((a, b) => a - b);
  const gaps: number[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[(i + 1) % sorted.length];
    gaps.push((next - current - 1 + capacity) % capacity);
  }

  return gaps.reduce((sum, gap) => sum + gap, 0) - Math.max(...gaps);
}

type State = {
  seatGuest: Map<string, string>;   // seatId -> guestId
  guestSeat: Map<string, Seat>;     // guestId -> seat
};

type Candidate = {
  tableId: string;
  seats: Seat[];
  score: number;
  sidesMixed: boolean;
};

type PassMode = 'strict' | 'mixed-sides' | 'scattered';

class Planner {
  private readonly seats: Seat[];
  private readonly seatsByTable = new Map<string, Seat[]>();
  private readonly tables: SeatingObject[];
  private readonly stageDistance = new Map<string, number>();
  private readonly accessibilityBonus = new Map<string, number>();
  private readonly guestsById: Map<string, SeatingGuest>;
  readonly state: State = { seatGuest: new Map(), guestSeat: new Map() };

  constructor(
    private readonly plan: SeatingPlanV2,
    guests: SeatingGuest[],
    private readonly variant: 1 | 2 | 3,
    private readonly weights: Weights,
  ) {
    this.guestsById = new Map(guests.map(g => [g.id, g]));
    this.tables = plan.objects.filter(isTableObject);
    this.seats = makeSeats(plan.objects);
    for (const seat of this.seats) {
      const list = this.seatsByTable.get(seat.tableId) ?? [];
      list.push(seat);
      this.seatsByTable.set(seat.tableId, list);
    }

    const stages = plan.objects.filter(item => item.type === 'stage');
    const entrances = plan.objects.filter(item => item.type === 'entrance' || item.type === 'door');
    for (const table of this.tables) {
      this.stageDistance.set(table.id, stages.length
        ? Math.min(...stages.map(stage => distance(table, stage))) : 0);
      this.accessibilityBonus.set(table.id, entrances.length
        ? Math.max(0, 30 - Math.min(...entrances.map(item => distance(table, item))) / 30) : 0);
    }
  }

  get maxCapacity() {
    return Math.max(0, ...this.tables.map(tableCapacity));
  }

  get freeSeatCount() {
    return this.seats.length - this.state.seatGuest.size;
  }

  seat(guestId: string, seat: Seat) {
    this.state.seatGuest.set(seat.id, guestId);
    this.state.guestSeat.set(guestId, seat);
  }

  /** Keeps a current assignment when it points at a real, free seat. */
  keep(assignment: SeatingAssignment) {
    if (!this.guestsById.has(assignment.guestId)) return false;
    if (this.state.guestSeat.has(assignment.guestId)) return false;
    if (this.state.seatGuest.has(assignment.seatId)) return false;
    const seat = this.seats.find(item => item.id === assignment.seatId);
    if (!seat) return false;
    this.seat(assignment.guestId, seat);
    return true;
  }

  private occupantsAt(tableId: string) {
    const seats = this.seatsByTable.get(tableId) ?? [];
    const result: { guestId: string; seat: Seat }[] = [];
    for (const seat of seats) {
      const guestId = this.state.seatGuest.get(seat.id);
      if (guestId) result.push({ guestId, seat });
    }
    return result;
  }

  private sidesCompatible(guestIds: string[], occupants: string[]) {
    const sides = new Set(
      [...guestIds, ...occupants].map(id => getProfile(this.plan, id).side).filter(s => s !== 'shared'),
    );
    return sides.size <= 1;
  }

  private excludedValid(order: SeatingGuest[], block: Seat[], occupants: { guestId: string; seat: Seat }[]) {
    for (let i = 0; i < order.length; i++) {
      for (let j = i + 1; j < order.length; j++) {
        if (areAdjacent(block[i].index, block[j].index, block[i].capacity) &&
          hasRelation(this.plan, order[i].id, order[j].id, 'excludedNeighbors')) return false;
      }
      for (const occupant of occupants) {
        if (areAdjacent(block[i].index, occupant.seat.index, block[i].capacity) &&
          hasRelation(this.plan, order[i].id, occupant.guestId, 'excludedNeighbors')) return false;
      }
    }
    return true;
  }

  /** Order-independent quality of putting `group` on `block` at `table`. */
  private scoreBlock(
    group: SeatingGuest[],
    table: SeatingObject,
    block: Seat[],
    occupants: { guestId: string; seat: Seat }[],
    remainingInGroup: number,
    key: string,
    groupTables: Set<string>,
    sidesMixed: boolean,
    anchorTableId?: string,
  ) {
    const w = this.weights;
    let score = 0;

    // VIPs: closest table to the stage is the main criterion (unchanged behaviour).
    const vipCount = group.filter(g => getProfile(this.plan, g.id).isVip).length;
    if (vipCount) score -= (this.stageDistance.get(table.id) ?? 0) * 100000 * vipCount;

    // Accessibility: near an entrance/door.
    const accessCount = group.filter(g => getProfile(this.plan, g.id).accessibility).length;
    score += (this.accessibilityBonus.get(table.id) ?? 0) * accessCount;

    // Relationships with guests who are already seated anywhere.
    for (const guest of group) {
      const profile = getProfile(this.plan, guest.id);
      for (const otherId of profile.preferredNeighbors) {
        const seat = this.state.guestSeat.get(otherId);
        if (seat) score += seat.tableId === table.id ? w.preferred : -w.preferred / 5;
      }
      for (const otherId of profile.requiredNeighbors) {
        const seat = this.state.guestSeat.get(otherId);
        if (!seat) continue;
        score += seat.tableId === table.id ? 5000 : -1000;
        if (seat.tableId === table.id && block.some(b => areAdjacent(b.index, seat.index, b.capacity))) score += 1500;
      }
    }

    // Group cohesion with the people already at this table.
    let groupMatesHere = 0;
    for (const occupant of occupants) {
      const other = getProfile(this.plan, occupant.guestId);
      for (const guest of group) {
        const profile = getProfile(this.plan, guest.id);
        if (profile.group !== 'other' && profile.group === other.group) {
          score += w.group;
          groupMatesHere++;
        } else if (profile.group !== 'other' && other.group !== 'other') {
          score -= w.group / 3; // mixing two different named groups
        }
        if (profile.side !== 'shared' && profile.side === other.side) score += w.side;
      }
    }

    // Named groups: start at a table with room for the rest of the group, and
    // afterwards prefer tables where the group already sits.
    if (key !== 'other') {
      const freeAfter = (this.seatsByTable.get(table.id)?.length ?? 0) - occupants.length - block.length;
      if (!groupTables.size) {
        score += freeAfter >= remainingInGroup ? w.fit : -w.fit / 2;
      } else if (!groupTables.has(table.id)) {
        score -= w.fit * 2;
      } else if (groupMatesHere === 0) {
        score += w.group;
      }
    }

    // Splitting a group: stay near the members that were already placed.
    if (anchorTableId) score += anchorTableId === table.id ? 8000 : 0;

    if (sidesMixed) score -= 20000;

    const gaps = compactnessPenalty(
      tableCapacity(table),
      occupants.map(o => o.seat.index),
      block.map(b => b.index),
    );
    score -= gaps * 10000;

    score += (hash(`${table.id}:${block[0]?.index}:${this.variant}`) % 1000) / 100000;
    return score;
  }

  /**
   * Best placement for `group` at a single table under the given pass mode.
   * Returns the chosen seats aligned with the returned guest order.
   */
  findPlacement(
    group: SeatingGuest[],
    mode: PassMode,
    remainingInGroup: number,
    key: string,
    anchorTableId?: string,
  ): { tableId: string; seats: Seat[]; order: SeatingGuest[]; sidesMixed: boolean } | null {
    const candidates: Candidate[] = [];
    const ids = group.map(g => g.id);
    const groupTables = new Set<string>();
    if (key !== 'other') {
      for (const [guestId, seat] of this.state.guestSeat) {
        if (getProfile(this.plan, guestId).group === key) groupTables.add(seat.tableId);
      }
    }

    for (const table of this.tables) {
      const tableSeats = this.seatsByTable.get(table.id) ?? [];
      const capacity = tableSeats.length;
      const occupants = this.occupantsAt(table.id);
      if (capacity - occupants.length < group.length) continue;

      const compatible = this.sidesCompatible(ids, occupants.map(o => o.guestId));
      if (mode === 'strict' && !compatible) continue;

      const blocks: Seat[][] = [];
      if (mode === 'scattered') {
        // Free seats at this table, nearest to each other, starting at each free seat.
        const free = tableSeats.filter(s => !this.state.seatGuest.has(s.id));
        for (let start = 0; start < free.length; start++) {
          blocks.push(Array.from({ length: group.length }, (_, i) => free[(start + i) % free.length]));
        }
      } else {
        for (let start = 0; start < capacity; start++) {
          const block = Array.from({ length: group.length }, (_, i) => tableSeats[(start + i) % capacity]);
          if (block.some(s => this.state.seatGuest.has(s.id))) continue;
          blocks.push(block);
        }
      }

      for (const block of blocks) {
        candidates.push({
          tableId: table.id,
          seats: block,
          sidesMixed: !compatible,
          score: this.scoreBlock(group, table, block, occupants, remainingInGroup, key, groupTables, !compatible, anchorTableId),
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    const orders = getOrders(group, this.variant);

    for (const candidate of candidates) {
      const occupants = this.occupantsAt(candidate.tableId);
      for (const order of orders) {
        if (this.excludedValid(order, candidate.seats, occupants)) {
          return { tableId: candidate.tableId, seats: candidate.seats, order, sidesMixed: candidate.sidesMixed };
        }
      }
    }

    return null;
  }
}

function generateProposal(
  guests: SeatingGuest[],
  plan: SeatingPlanV2,
  variant: 1 | 2 | 3,
  keepExisting: boolean,
): SeatingProposal {
  const planner = new Planner(plan, guests, variant, VARIANT_WEIGHTS[variant]);
  const issues: SeatingProposalIssue[] = [];

  let kept = 0;
  if (keepExisting) {
    for (const assignment of plan.assignments) {
      if (planner.keep(assignment)) kept++;
    }
  }

  const toPlace = guests.filter(g => !planner.state.guestSeat.has(g.id));
  const components = getComponents(toPlace, plan);

  // Remaining (unplaced) members per named group — used to keep groups together.
  const remainingByGroup = new Map<string, number>();
  const keys = new Map<SeatingGuest[], string>();
  for (const component of components) {
    const key = groupKey(component, plan);
    keys.set(component, key);
    remainingByGroup.set(key, (remainingByGroup.get(key) ?? 0) + component.length);
  }

  const vipCount = (group: SeatingGuest[]) => group.filter(g => getProfile(plan, g.id).isVip).length;
  const priority = (group: SeatingGuest[]) => group.reduce((sum, g) => {
    const p = getProfile(plan, g.id);
    return sum + (p.accessibility ? 8 : 0) + p.preferredNeighbors.length;
  }, 0);

  // VIPs first, then whole named groups one after another (largest first),
  // larger "++" components before singles inside a group.
  const ordered = [...components].sort((a, b) => {
    const vip = vipCount(b) - vipCount(a);
    if (vip) return vip;
    const ka = keys.get(a)!;
    const kb = keys.get(b)!;
    if (ka !== kb) {
      if (ka === 'other') return 1;
      if (kb === 'other') return -1;
      const size = (remainingByGroup.get(kb) ?? 0) - (remainingByGroup.get(ka) ?? 0);
      if (size) return size;
      return ka < kb ? -1 : 1;
    }
    if (a.length !== b.length) return b.length - a.length;
    const p = priority(b) - priority(a);
    if (p) return p;
    return hash(`${a[0].id}:${variant}`) - hash(`${b[0].id}:${variant}`);
  });

  const mixedSides = new Set<string>();

  const place = (
    group: SeatingGuest[],
    key: string,
    modes: PassMode[],
    anchorTableId?: string,
  ) => {
    const remaining = Math.max(0, (remainingByGroup.get(key) ?? 0) - group.length);
    for (const mode of modes) {
      const placement = planner.findPlacement(group, mode, remaining, key, anchorTableId);
      if (!placement) continue;
      placement.order.forEach((guest, index) => planner.seat(guest.id, placement.seats[index]));
      if (placement.sidesMixed) group.forEach(g => mixedSides.add(g.id));
      return { mode, tableId: placement.tableId };
    }
    return null;
  };

  for (const component of ordered) {
    const key = keys.get(component)!;

    if (component.length > 1 && component.length > planner.maxCapacity) {
      issues.push({ code: 'group-too-large', guestIds: component.map(g => g.id) });
    } else {
      const result = place(component, key, ['strict', 'mixed-sides', 'scattered']);
      if (result) {
        if (result.mode === 'scattered' && component.length > 1) {
          issues.push({ code: 'not-contiguous', guestIds: component.map(g => g.id) });
        }
        remainingByGroup.set(key, (remainingByGroup.get(key) ?? 0) - component.length);
        continue;
      }
    }

    // Could not keep the component at one table: seat members one by one,
    // preferring the table where the previous member went.
    let anchor: string | undefined;
    let placedAny = false;
    for (const guest of component) {
      const result = place([guest], key, ['strict', 'mixed-sides'], anchor);
      if (result) {
        anchor = anchor ?? result.tableId;
        placedAny = true;
      }
      remainingByGroup.set(key, (remainingByGroup.get(key) ?? 0) - 1);
    }
    if (placedAny && component.length > 1) {
      issues.push({ code: 'group-split', guestIds: component.map(g => g.id) });
    }
  }

  if (mixedSides.size) issues.push({ code: 'sides-mixed', guestIds: [...mixedSides] });

  const unseated = guests.filter(g => !planner.state.guestSeat.has(g.id)).map(g => g.id);
  if (unseated.length) {
    // Guests left over while seats were still free could only be blocked by "keep apart" rules.
    const blocked = planner.freeSeatCount > 0;
    issues.push({ code: blocked ? 'excluded-conflict' : 'no-seat', guestIds: unseated });
  }

  const assignments = Array.from(planner.state.seatGuest, ([seatId, guestId]) => ({ seatId, guestId }));
  const seated = assignments.length;
  const compromises = issues.filter(issue =>
    issue.code === 'group-split' || issue.code === 'not-contiguous' || issue.code === 'sides-mixed',
  ).length;
  const score = Math.max(0, Math.round((100 * seated) / Math.max(1, guests.length)) - compromises * 3);

  return {
    id: `proposal-${variant}`,
    variant,
    title: TITLES[variant],
    assignments,
    score,
    seated,
    kept,
    added: seated - kept,
    unseated,
    issues,
  };
}

export function generateSeatingProposals(
  guests: SeatingGuest[],
  plan: SeatingPlanV2,
  options: SeatingProposalOptions = {},
): SeatingProposal[] {
  const keepExisting = options.keepExisting !== false;
  return ([1, 2, 3] as const)
    .map(variant => generateProposal(guests, plan, variant, keepExisting))
    .sort((a, b) => b.seated - a.seated || b.score - a.score || a.variant - b.variant);
}
