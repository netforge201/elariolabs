export type SeatingObjectType =
  | 'round-table'
  | 'rect-table'
  | 'oval-table'
  | 'wall'
  | 'column'
  | 'door'
  | 'window'
  | 'stage'
  | 'dancefloor'
  | 'bar'
  | 'buffet'
  | 'entrance';

export type SeatingObject = {
  id: string;
  type: SeatingObjectType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  capacity?: number;
};

export type SeatingAssignment = {
  seatId: string;
  guestId: string;
};

export type GuestSeatingProfile = {
  side: 'bride' | 'groom' | 'shared';
  group: string;
  requiredNeighbors: string[];
  preferredNeighbors: string[];
  excludedNeighbors: string[];
  isVip: boolean;
  accessibility: boolean;
};

export type SeatingPlanV2 = {
  version: 2;
  guestProfiles: Record<string, GuestSeatingProfile>;
  guestGroups: { id: string; name: string }[];
  venue: {
    width: number;
    height: number;
    background: string | null;
  };
  objects: SeatingObject[];
  assignments: SeatingAssignment[];
  settings: {
    gridEnabled: boolean;
    snapEnabled: boolean;
    gridSize: number;
  };
};

export type SeatingGuest = {
  id: string;
  name: string;
};

export function createEmptySeatingPlan(): SeatingPlanV2 {
  return {
    version: 2,
    guestProfiles: {},
    guestGroups: [],
    venue: { width: 1600, height: 1100, background: null },
    objects: [],
    assignments: [],
    settings: { gridEnabled: true, snapEnabled: true, gridSize: 20 },
  };
}

export function normalizeSeatingPlan(value: unknown): SeatingPlanV2 {
  const empty = createEmptySeatingPlan();

  if (!value || typeof value !== 'object' || Array.isArray(value)) return empty;

  const raw = value as Record<string, unknown>;

  if (raw.version === 2 && Array.isArray(raw.objects)) {
    const venue = raw.venue && typeof raw.venue === 'object'
      ? raw.venue as Record<string, unknown>
      : {};

    const settings = raw.settings && typeof raw.settings === 'object'
      ? raw.settings as Record<string, unknown>
      : {};

    return {
      version: 2,
      guestProfiles: raw.guestProfiles && typeof raw.guestProfiles === 'object' && !Array.isArray(raw.guestProfiles)
        ? Object.fromEntries(
            Object.entries(raw.guestProfiles as Record<string, unknown>).map(([id, value]) => {
              const profile = value && typeof value === 'object'
                ? value as Record<string, unknown>
                : {};
              return [id, {
                side: profile.side === 'bride' || profile.side === 'groom' ? profile.side : 'shared',
                group: typeof profile.group === 'string' ? profile.group : 'other',
                requiredNeighbors: Array.isArray(profile.requiredNeighbors)
                  ? profile.requiredNeighbors.filter((item): item is string => typeof item === 'string')
                  : [],
                preferredNeighbors: Array.isArray(profile.preferredNeighbors)
                  ? profile.preferredNeighbors.filter((item): item is string => typeof item === 'string')
                  : [],
                excludedNeighbors: Array.isArray(profile.excludedNeighbors)
                  ? profile.excludedNeighbors.filter((item): item is string => typeof item === 'string')
                  : [],
                isVip: profile.isVip === true,
                accessibility: profile.accessibility === true,
              } satisfies GuestSeatingProfile];
            })
          )
        : {},
      guestGroups: Array.isArray(raw.guestGroups)
        ? raw.guestGroups.filter((item): item is { id: string; name: string } =>
            Boolean(item && typeof item.id === 'string' && typeof item.name === 'string'))
        : [],
      venue: {
        width: typeof venue.width === 'number' ? venue.width : 1600,
        height: typeof venue.height === 'number' ? venue.height : 1100,
        background: typeof venue.background === 'string' ? venue.background : null,
      },
      objects: raw.objects.filter((item): item is SeatingObject =>
        Boolean(item && typeof item === 'object' &&
          typeof (item as SeatingObject).id === 'string' &&
          typeof (item as SeatingObject).type === 'string')
      ),
      assignments: Array.isArray(raw.assignments)
        ? raw.assignments.filter((item): item is SeatingAssignment =>
            Boolean(item && typeof item === 'object' &&
              typeof (item as SeatingAssignment).seatId === 'string' &&
              typeof (item as SeatingAssignment).guestId === 'string'))
        : [],
      settings: {
        gridEnabled: settings.gridEnabled !== false,
        snapEnabled: settings.snapEnabled !== false,
        gridSize: typeof settings.gridSize === 'number' ? settings.gridSize : 20,
      },
    };
  }

  // Backward compatibility: convert the old table/guestIds format in memory.
  const oldTables = Array.isArray(raw.tables) ? raw.tables : [];
  const objects: SeatingObject[] = [];
  const assignments: SeatingAssignment[] = [];

  for (const item of oldTables) {
    if (!item || typeof item !== 'object') continue;
    const table = item as Record<string, unknown>;
    if (typeof table.id !== 'string') continue;

    const capacity = Math.max(1, Math.min(30, Number(table.capacity) || 8));
    const id = table.id;
    const type = table.shape === 'rect' ? 'rect-table' : 'round-table';

    objects.push({
      id,
      type,
      name: typeof table.name === 'string' ? table.name : 'Table',
      x: Number(table.x) || 50,
      y: Number(table.y) || 50,
      width: type === 'rect-table' ? 170 : 150,
      height: type === 'rect-table' ? 110 : 150,
      rotation: 0,
      capacity,
    });

    const guestIds = Array.isArray(table.guestIds) ? table.guestIds : [];
    guestIds.slice(0, capacity).forEach((guestId, index) => {
      if (typeof guestId === 'string') {
        assignments.push({ seatId: `${id}-seat-${index}`, guestId });
      }
    });
  }

  return { ...empty, objects, assignments };
}
