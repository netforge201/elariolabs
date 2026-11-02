import type {
  SeatingPlanV2,
  SeatingGuest,
  SeatingAssignment,
  SeatingObject,
  GuestSeatingProfile,
} from './seating-types';

export type SeatingProposal = {
  id: string;
  title: string;
  assignments: SeatingAssignment[];
  score: number;
  seated: number;
  unseated: string[];
  warnings: string[];
};

type Seat = {
  id: string;
  tableId: string;
  index: number;
  capacity: number;
};

type Placement = {
  tableId: string;
  seats: Seat[];
  guests: SeatingGuest[];
  score: number;
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

function isTable(object: SeatingObject) {
  return ['round-table', 'rect-table', 'oval-table'].includes(object.type);
}

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
  return objects.filter(isTable).flatMap(table => {
    const capacity = Math.max(1, Math.min(40, table.capacity ?? 8));
    return Array.from({ length: capacity }, (_, index) => ({
      id: `${table.id}-seat-${index}`,
      tableId: table.id,
      index,
      capacity,
    }));
  });
}

function areAdjacent(a: number, b: number, capacity: number) {
  if (capacity < 2) return false;
  return (a + 1) % capacity === b || (b + 1) % capacity === a;
}

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

function getTablePriority(
  table: SeatingObject,
  guests: SeatingGuest[],
  objects: SeatingObject[],
  plan: SeatingPlanV2,
) {
  let score = 0;

  for (const guest of guests) {
    const profile = getProfile(plan, guest.id);

    if (profile.accessibility) {
      const entrances = objects.filter(
        item => item.type === 'entrance' || item.type === 'door',
      );
      if (entrances.length) {
        const nearest = Math.min(...entrances.map(item => distance(table, item)));
        score += Math.max(0, 30 - nearest / 30);
      }
    }
  }

  return score;
}

function sidesCompatible(
  guests: SeatingGuest[],
  existing: SeatingGuest[],
  plan: SeatingPlanV2,
) {
  const all = [...guests, ...existing];
  const sides = new Set(
    all.map(g => getProfile(plan, g.id).side).filter(s => s !== 'shared'),
  );
  return sides.size <= 1;
}

function excludedAdjacencyValid(
  guests: SeatingGuest[],
  seats: Seat[],
  existing: SeatingGuest[],
  existingSeats: Seat[],
  plan: SeatingPlanV2,
) {
  for (let i = 0; i < guests.length; i++) {
    for (let j = i + 1; j < guests.length; j++) {
      if (
        areAdjacent(seats[i].index, seats[j].index, seats[i].capacity) &&
        hasRelation(plan, guests[i].id, guests[j].id, 'excludedNeighbors')
      ) return false;
    }

    for (let j = 0; j < existing.length; j++) {
      if (
        areAdjacent(seats[i].index, existingSeats[j].index, seats[i].capacity) &&
        hasRelation(plan, guests[i].id, existing[j].id, 'excludedNeighbors')
      ) return false;
    }
  }

  return true;
}

function preferredScore(
  guests: SeatingGuest[],
  tableId: string,
  assigned: Map<string, string>,
  plan: SeatingPlanV2,
) {
  let score = 0;

  for (const guest of guests) {
    for (const [otherId, otherTable] of assigned) {
      if (!hasRelation(plan, guest.id, otherId, 'preferredNeighbors')) continue;
      score += otherTable === tableId ? 500 : -100;
    }
  }

  return score;
}

function groupScore(
  guests: SeatingGuest[],
  tableId: string,
  assigned: Map<string, string>,
  allGuests: Map<string, SeatingGuest>,
  plan: SeatingPlanV2,
) {
  let score = 0;

  for (const guest of guests) {
    const profile = getProfile(plan, guest.id);

    for (const [otherId, otherTable] of assigned) {
      if (otherTable !== tableId) continue;

      const other = allGuests.get(otherId);
      if (!other) continue;

      const otherProfile = getProfile(plan, otherId);

      if (profile.group !== 'other' && profile.group === otherProfile.group) {
        score += 30;
      }

      if (profile.side !== 'shared' && profile.side === otherProfile.side) {
        score += 10;
      }
    }
  }

  return score;
}

function getOrders(group: SeatingGuest[], variant: number): SeatingGuest[][] {
  if (group.length <= 1) return [[...group]];

  const sorted = [...group].sort((a, b) =>
    hash(`${a.id}:${variant}`) - hash(`${b.id}:${variant}`)
  );

  const orders: SeatingGuest[][] = [];
  const add = (order: SeatingGuest[]) => {
    if (!orders.some(existing => existing.map(g => g.id).join('|') === order.map(g => g.id).join('|'))) {
      orders.push(order);
    }
  };

  add(sorted);
  add([...sorted].reverse());

  for (let i = 0; i < sorted.length; i++) {
    add([...sorted.slice(i), ...sorted.slice(0, i)]);
    const reversed = [...sorted].reverse();
    add([...reversed.slice(i), ...reversed.slice(0, i)]);
  }

  if (group.length <= 7) {
    let count = 0;
    const permute = (remaining: SeatingGuest[], current: SeatingGuest[]) => {
      if (count >= 3000) return;
      if (!remaining.length) {
        add(current);
        count++;
        return;
      }
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


function compactnessPenalty(
  tableId: string,
  capacity: number,
  seats: Seat[],
  occupied: Set<string>,
  newSeats: Seat[],
) {
  const indexes = new Set<number>();

  for (const seat of seats) {
    if (seat.tableId === tableId && occupied.has(seat.id)) {
      indexes.add(seat.index);
    }
  }

  for (const seat of newSeats) indexes.add(seat.index);

  if (indexes.size <= 1) return 0;

  const sorted = [...indexes].sort((a, b) => a - b);
  const gaps: number[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[(i + 1) % sorted.length];
    gaps.push((next - current - 1 + capacity) % capacity);
  }

  const largestOuterGap = Math.max(...gaps);
  const unnecessaryEmptySeats =
    gaps.reduce((sum, gap) => sum + gap, 0) - largestOuterGap;

  return unnecessaryEmptySeats;
}

function findPlacement(
  group: SeatingGuest[],
  variant: number,
  seats: Seat[],
  objects: SeatingObject[],
  plan: SeatingPlanV2,
  assigned: Map<string, string>,
  occupied: Set<string>,
  assignedTables: Map<string, string>,
  allGuests: Map<string, SeatingGuest>,
): Placement | null {
  const tables = objects.filter(isTable);
  let best: Placement | null = null;

  for (const table of tables) {
    const tableSeats = seats
      .filter(s => s.tableId === table.id)
      .sort((a, b) => a.index - b.index);

    const capacity = tableSeats.length;
    if (group.length > capacity) continue;

    const existingEntries = [...assigned.entries()]
      .filter(([seatId]) => seats.find(s => s.id === seatId)?.tableId === table.id);

    const existingGuests = existingEntries
      .map(([, id]) => allGuests.get(id))
      .filter((g): g is SeatingGuest => Boolean(g));

    const existingSeats = existingEntries
      .map(([seatId]) => seats.find(s => s.id === seatId))
      .filter((s): s is Seat => Boolean(s));

    if (!sidesCompatible(group, existingGuests, plan)) continue;

    for (const order of getOrders(group, variant)) {
      for (let start = 0; start < capacity; start++) {
        const block = Array.from(
          { length: group.length },
          (_, i) => tableSeats[(start + i) % capacity],
        );

        if (block.some(s => occupied.has(s.id))) continue;

        if (!excludedAdjacencyValid(
          order, block, existingGuests, existingSeats, plan,
        )) continue;

        const gaps = compactnessPenalty(
          table.id,
          capacity,
          seats,
          occupied,
          block,
        );

        const vipCount = order.filter(g => getProfile(plan, g.id).isVip).length;
        const stages = objects.filter(item => item.type === 'stage');
        const nearestStage = stages.length
          ? Math.min(...stages.map(stage => distance(table, stage)))
          : 0;

        // VIP — главный критерий выбора стола: чем ближе к сцене, тем лучше.
        const vipPriority = vipCount > 0
          ? -nearestStage * 100000 * vipCount
          : 0;

        const score =
          vipPriority +
          getTablePriority(table, order, objects, plan) +
          preferredScore(order, table.id, assignedTables, plan) +
          groupScore(order, table.id, assignedTables, allGuests, plan) -
          gaps * 10000 +
          ((hash(`${table.id}:${start}:${order.map(g => g.id).join(':')}:${variant}`) % 1000) / 100000);

        if (!best || score > best.score) {
          best = { tableId: table.id, seats: block, guests: order, score };
        }
      }
    }
  }

  return best;
}

function generateProposal(
  guests: SeatingGuest[],
  plan: SeatingPlanV2,
  variant: number,
): SeatingProposal {
  const seats = makeSeats(plan.objects);
  const components = getComponents(guests, plan);
  const allGuests = new Map(guests.map(g => [g.id, g]));
  const assigned = new Map<string, string>();
  const assignedTables = new Map<string, string>();
  const occupied = new Set<string>();
  const warnings: string[] = [];

  const orderedComponents = [...components].sort((a, b) => {
    const vipCount = (group: SeatingGuest[]) =>
      group.filter(g => getProfile(plan, g.id).isVip).length;

    const vipDifference = vipCount(b) - vipCount(a);
    if (vipDifference !== 0) return vipDifference;

    if (a.length !== b.length) return b.length - a.length;

    const priority = (group: SeatingGuest[]) => group.reduce((sum, g) => {
      const p = getProfile(plan, g.id);
      return sum + (p.accessibility ? 8 : 0) + p.preferredNeighbors.length;
    }, 0);

    return priority(b) - priority(a);
  });

  for (const component of orderedComponents) {
    const placement = findPlacement(
      component,
      variant,
      seats,
      plan.objects,
      plan,
      assigned,
      occupied,
      assignedTables,
      allGuests,
    );

    if (!placement) {
      const names = component.map(g => g.name).join(', ');
      const capacity = Math.max(0, ...plan.objects.filter(isTable).map(t => t.capacity ?? 8));

      if (component.length > capacity) {
        warnings.push(`Группа ++ не помещается за один стол: ${names}`);
      } else {
        warnings.push(`Не удалось разместить группу целиком: ${names}`);
      }
      continue;
    }

    placement.guests.forEach((guest, index) => {
      const seat = placement.seats[index];
      assigned.set(seat.id, guest.id);
      assignedTables.set(guest.id, placement.tableId);
      occupied.add(seat.id);
    });
  }

  const assignments = Array.from(assigned, ([seatId, guestId]) => ({
    seatId,
    guestId,
  }));

  const unseated = guests
    .filter(g => !assignedTables.has(g.id))
    .map(g => g.id);

  // Проверяем, что каждая связанная группа ++ находится за одним столом
  // и занимает непрерывный блок мест.
  for (const component of components) {
    const placed = component.filter(g => assignedTables.has(g.id));
    if (placed.length !== component.length) continue;

    const tableIds = new Set(placed.map(g => assignedTables.get(g.id)));
    if (tableIds.size !== 1) {
      warnings.push(`Группа ++ разделена между столами: ${component.map(g => g.name).join(', ')}`);
      continue;
    }

    const indexes = placed
      .map(g => {
        const seatId = assignments.find(a => a.guestId === g.id)?.seatId;
        return seats.find(s => s.id === seatId)?.index;
      })
      .filter((n): n is number => n !== undefined)
      .sort((a, b) => a - b);

    const capacity = seats.find(s => s.tableId === [...tableIds][0])?.capacity ?? 0;
    const contiguous = indexes.length === 1 ||
      indexes.every((value, i) =>
        i === 0 || value === indexes[i - 1] + 1
      ) ||
      (indexes[0] === 0 && indexes[indexes.length - 1] === capacity - 1);

    if (!contiguous) {
      warnings.push(`Группа ++ не занимает последовательные места: ${component.map(g => g.name).join(', ')}`);
    }
  }

  // Проверяем запрет соседства и разделение сторон.
  for (let i = 0; i < guests.length; i++) {
    for (let j = i + 1; j < guests.length; j++) {
      const a = guests[i];
      const b = guests[j];
      const seatAId = assignments.find(x => x.guestId === a.id)?.seatId;
      const seatBId = assignments.find(x => x.guestId === b.id)?.seatId;
      if (!seatAId || !seatBId) continue;

      const seatA = seats.find(s => s.id === seatAId);
      const seatB = seats.find(s => s.id === seatBId);
      if (!seatA || !seatB || seatA.tableId !== seatB.tableId) continue;

      if (
        areAdjacent(seatA.index, seatB.index, seatA.capacity) &&
        hasRelation(plan, a.id, b.id, 'excludedNeighbors')
      ) {
        warnings.push(`Не выполнено −: ${a.name} / ${b.name}`);
      }

      const sideA = getProfile(plan, a.id).side;
      const sideB = getProfile(plan, b.id).side;
      if (sideA !== 'shared' && sideB !== 'shared' && sideA !== sideB) {
        warnings.push(`Стороны жениха и невесты оказались за одним столом: ${a.name} / ${b.name}`);
      }
    }
  }

  if (unseated.length) {
    warnings.push(`Не удалось рассадить: ${unseated.map(id => allGuests.get(id)?.name ?? id).join(', ')}`);
  }

  return {
    id: `proposal-${variant}`,
    title: ['Balanced seating', 'Group-focused seating', 'Preference-focused seating'][variant - 1],
    assignments,
    score: assignments.length * 1000,
    seated: assignments.length,
    unseated,
    warnings: [...new Set(warnings)],
  };
}

export function generateSeatingProposals(
  guests: SeatingGuest[],
  plan: SeatingPlanV2,
): SeatingProposal[] {
  return [1, 2, 3]
    .map(variant => generateProposal(guests, plan, variant))
    .sort((a, b) => b.seated - a.seated || b.score - a.score);
}
