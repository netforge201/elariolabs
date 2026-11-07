'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  generateSeatingProposals,
  type SeatingProposal,
  type SeatingProposalIssueCode,
} from '@/lib/seating-auto';
import {
  assignGuestToSeat,
  assignGuestToTable,
  locateSeat,
  repairAssignments,
  tableCapacity,
  unassignGuest,
  validateSeatingPlan,
  type AssignResult,
  type SeatingIssue,
  type SeatingIssueCode,
} from '@/lib/seating-logic';
import {
  createEmptySeatingPlan,
  type SeatingAssignment,
  type GuestSeatingProfile,
  type SeatingGuest,
  type SeatingObject,
  type SeatingObjectType,
  type SeatingPlanV2,
} from '@/lib/seating-types';
import {
  RoundTableIcon,
  RectTableIcon,
  OvalTableIcon,
  SparklesIcon,
  UndoIcon,
  RedoIcon,
  DuplicateIcon,
  MinusIcon,
  CheckIcon,
} from './icons';

type Locale = 'az' | 'ru' | 'en';
type Props = {
  locale: Locale;
  couple: string;
  guests: SeatingGuest[];
  initialPlan: SeatingPlanV2;
};

const labels = {
  en: {
    title: 'Seating editor', subtitle: 'Design your reception space',
    save: 'Save', saving: 'Saving…', saved: 'Saved', unsaved: 'Unsaved changes',
    addRound: 'Round table', addRect: 'Rectangular table', addOval: 'Oval table',
    wall: 'Wall', column: 'Column', door: 'Door', window: 'Window',
    stage: 'Stage', dancefloor: 'Dance floor', bar: 'Bar', buffet: 'Buffet',
    entrance: 'Entrance', guests: 'Guests', properties: 'Properties',
    name: 'Name', capacity: 'Seats', delete: 'Delete object', empty: 'Select an object',
    zoom: 'Zoom', fit: 'Fit', grid: 'Grid', snap: 'Snap to grid',
    undo: 'Undo', redo: 'Redo', unassigned: 'Unassigned', assign: 'Assign selected guest',
    removeGuest: 'Unassign', noGuests: 'No guests available',
    selectedSeat: 'Selected seat', selectSeat: 'Select a seat on a table',
    hint: 'Drag objects to move · Wheel to zoom · Drag empty space to pan',
    error: 'Could not save changes',
  },
  ru: {
    title: 'Редактор рассадки', subtitle: 'Проектирование свадебного зала',
    save: 'Сохранить', saving: 'Сохранение…', saved: 'Сохранено', unsaved: 'Есть изменения',
    addRound: 'Круглый стол', addRect: 'Прямоугольный стол', addOval: 'Овальный стол',
    wall: 'Стена', column: 'Колонна', door: 'Дверь', window: 'Окно',
    stage: 'Сцена', dancefloor: 'Танцпол', bar: 'Бар', buffet: 'Фуршет',
    entrance: 'Вход', guests: 'Гости', properties: 'Свойства',
    name: 'Название', capacity: 'Мест', delete: 'Удалить объект', empty: 'Выберите объект',
    zoom: 'Масштаб', fit: 'Вписать', grid: 'Сетка', snap: 'Привязка к сетке',
    undo: 'Отменить', redo: 'Повторить', unassigned: 'Без места', assign: 'Назначить выбранного гостя',
    removeGuest: 'Освободить место', noGuests: 'Нет доступных гостей',
    selectedSeat: 'Выбранное место', selectSeat: 'Выберите стул у стола',
    hint: 'Перетаскивайте объекты · Колесо мыши — масштаб · Пустое место — перемещение холста',
    error: 'Не удалось сохранить изменения',
  },
  az: {
    title: 'Oturacaq redaktoru', subtitle: 'Ziyafət zalının layihələndirilməsi',
    save: 'Saxla', saving: 'Saxlanılır…', saved: 'Saxlanıldı', unsaved: 'Dəyişikliklər var',
    addRound: 'Dairəvi masa', addRect: 'Düzbucaqlı masa', addOval: 'Oval masa',
    wall: 'Divar', column: 'Sütun', door: 'Qapı', window: 'Pəncərə',
    stage: 'Səhnə', dancefloor: 'Rəqs meydanı', bar: 'Bar', buffet: 'Bufet',
    entrance: 'Giriş', guests: 'Qonaqlar', properties: 'Xüsusiyyətlər',
    name: 'Ad', capacity: 'Yerlər', delete: 'Obyekti sil', empty: 'Obyekt seçin',
    zoom: 'Miqyas', fit: 'Sığdır', grid: 'Tor', snap: 'Tora yapışdır',
    undo: 'Geri al', redo: 'Təkrar et', unassigned: 'Yerləşdirilməyən', assign: 'Seçilmiş qonağı yerləşdir',
    removeGuest: 'Yeri boşalt', noGuests: 'Mövcud qonaq yoxdur',
    selectedSeat: 'Seçilmiş yer', selectSeat: 'Masa üzərində yer seçin',
    hint: 'Obyektləri sürüşdürün · Təkər — miqyas · Boş sahə — xəritəni hərəkət etdirin',
    error: 'Dəyişiklikləri saxlamaq mümkün olmadı',
  },
};

/* Guest assignment, drag-and-drop, smart seating results and validation copy. */
const assignCopy = {
  en: {
    search: 'Search guests or tables…', all: 'All', unassignedTab: 'Unassigned', assignedTab: 'Seated',
    seat: 'seat', noMatch: 'No guests match your search.', dragHint: 'Drag a guest onto a table or a seat. Drag a seated guest here to unassign.',
    unassign: 'Unassign', locate: 'Show on plan', dropHere: 'Drop here to unassign',
    tableFull: (table: string) => `${table} is full. Increase its seats or choose another table.`,
    seatOccupied: (guest: string) => `This seat is taken by ${guest}. Unassign them first or pick a free seat.`,
    invalid: 'This seat no longer exists.', unknownGuest: 'This guest is no longer in your guest list.',
    assigned: (guest: string, table: string, seat: number) => `${guest} → ${table}, seat ${seat}`,
    unassigned: (guest: string) => `${guest} no longer has a seat`,
    dropTable: (table: string, seat: number) => `${table} · seat ${seat}`,
    dropFull: (table: string) => `${table} is full`,
    dropTaken: 'Seat taken',
    occupiedBy: (guest: string) => `Seat taken by ${guest}`,
    validate: 'Check seating', validation: 'Seating check', validationIntro: 'Inspects the current plan, including unsaved changes.',
    allGood: 'No problems found. Every guest has a valid seat.', errors: 'errors', warnings: 'warnings',
    fix: 'Remove invalid assignments', fixDone: (n: number) => `${n} invalid assignment${n === 1 ? '' : 's'} removed`,
    fixHint: 'Errors prevent saving. Removing invalid assignments keeps every valid seat and can be undone.',
    show: 'Show', unknownName: 'Deleted guest',
    keepExisting: 'Keep current assignments and only seat unassigned guests',
    kept: 'kept', added: 'newly seated', unseatedList: 'Without a seat',
    applied: (seated: number, total: number, added: number, left: number) =>
      `Smart seating: ${seated}/${total} seated (${added} newly placed)${left ? `, ${left} still without a seat` : ''}.`,
    titles: { 1: 'Balanced seating', 2: 'Group-focused seating', 3: 'Preference-focused seating' },
  },
  ru: {
    search: 'Поиск гостей или столов…', all: 'Все', unassignedTab: 'Без места', assignedTab: 'Рассажены',
    seat: 'место', noMatch: 'Гости не найдены.', dragHint: 'Перетащите гостя на стол или место. Перетащите рассаженного гостя сюда, чтобы освободить место.',
    unassign: 'Освободить', locate: 'Показать на плане', dropHere: 'Отпустите, чтобы освободить место',
    tableFull: (table: string) => `${table}: свободных мест нет. Увеличьте число мест или выберите другой стол.`,
    seatOccupied: (guest: string) => `Это место занято: ${guest}. Сначала освободите его или выберите свободное.`,
    invalid: 'Этого места больше нет.', unknownGuest: 'Этого гостя нет в списке гостей.',
    assigned: (guest: string, table: string, seat: number) => `${guest} → ${table}, место ${seat}`,
    unassigned: (guest: string) => `${guest}: место освобождено`,
    dropTable: (table: string, seat: number) => `${table} · место ${seat}`,
    dropFull: (table: string) => `${table}: мест нет`,
    dropTaken: 'Место занято',
    occupiedBy: (guest: string) => `Место занято: ${guest}`,
    validate: 'Проверить рассадку', validation: 'Проверка рассадки', validationIntro: 'Проверяется текущий план, включая несохранённые изменения.',
    allGood: 'Проблем не найдено. У каждого гостя корректное место.', errors: 'ошибок', warnings: 'предупреждений',
    fix: 'Удалить некорректные назначения', fixDone: (n: number) => `Удалено некорректных назначений: ${n}`,
    fixHint: 'Ошибки не позволяют сохранить план. Корректные места сохранятся, действие можно отменить.',
    show: 'Показать', unknownName: 'Удалённый гость',
    keepExisting: 'Сохранить текущую рассадку и рассадить только гостей без места',
    kept: 'сохранено', added: 'рассажено заново', unseatedList: 'Без места',
    applied: (seated: number, total: number, added: number, left: number) =>
      `Умная рассадка: ${seated}/${total} рассажено (новых: ${added})${left ? `, без места: ${left}` : ''}.`,
    titles: { 1: 'Сбалансированная', 2: 'По группам', 3: 'По предпочтениям' },
  },
  az: {
    search: 'Qonaq və ya masa axtar…', all: 'Hamısı', unassignedTab: 'Yersiz', assignedTab: 'Yerləşdirilib',
    seat: 'yer', noMatch: 'Qonaq tapılmadı.', dragHint: 'Qonağı masanın və ya yerin üzərinə sürüşdürün. Yerini boşaltmaq üçün yerləşdirilmiş qonağı bura sürüşdürün.',
    unassign: 'Yeri boşalt', locate: 'Planda göstər', dropHere: 'Yeri boşaltmaq üçün buraxın',
    tableFull: (table: string) => `${table} doludur. Yerlərin sayını artırın və ya başqa masa seçin.`,
    seatOccupied: (guest: string) => `Bu yer ${guest} üçündür. Əvvəlcə yeri boşaldın və ya boş yer seçin.`,
    invalid: 'Bu yer artıq mövcud deyil.', unknownGuest: 'Bu qonaq artıq siyahıda yoxdur.',
    assigned: (guest: string, table: string, seat: number) => `${guest} → ${table}, yer ${seat}`,
    unassigned: (guest: string) => `${guest} üçün yer boşaldıldı`,
    dropTable: (table: string, seat: number) => `${table} · yer ${seat}`,
    dropFull: (table: string) => `${table} doludur`,
    dropTaken: 'Yer tutulub',
    occupiedBy: (guest: string) => `Yer tutulub: ${guest}`,
    validate: 'Yerləşdirməni yoxla', validation: 'Yerləşdirmənin yoxlanışı', validationIntro: 'Saxlanılmamış dəyişikliklər daxil olmaqla cari plan yoxlanılır.',
    allGood: 'Problem tapılmadı. Hər qonağın düzgün yeri var.', errors: 'xəta', warnings: 'xəbərdarlıq',
    fix: 'Yanlış təyinatları sil', fixDone: (n: number) => `${n} yanlış təyinat silindi`,
    fixHint: 'Xətalar planı saxlamağa imkan vermir. Düzgün yerlər qalacaq, əməliyyatı geri almaq olar.',
    show: 'Göstər', unknownName: 'Silinmiş qonaq',
    keepExisting: 'Cari yerləşdirməni saxla, yalnız yersiz qonaqları yerləşdir',
    kept: 'saxlanılıb', added: 'yeni yerləşdirilib', unseatedList: 'Yersiz',
    applied: (seated: number, total: number, added: number, left: number) =>
      `Ağıllı yerləşdirmə: ${seated}/${total} yerləşdirildi (yeni: ${added})${left ? `, yersiz: ${left}` : ''}.`,
    titles: { 1: 'Balanslaşdırılmış', 2: 'Qruplara görə', 3: 'Tercihlərə görə' },
  },
};

const issueCopy: Record<Locale, Record<SeatingIssueCode, (issue: SeatingIssue, table: string) => string>> = {
  en: {
    'malformed-seat': () => 'Assignment with an unreadable seat reference',
    'missing-table': () => 'Seated at a table that no longer exists',
    'seat-out-of-range': (issue, table) => `${table}: guests on seats beyond the table's capacity`,
    'over-capacity': (issue, table) => `${table}: ${issue.count} guests for ${issue.limit} seats`,
    'duplicate-seat': (issue, table) => `${table}: several guests share one seat`,
    'duplicate-guest': () => 'Guest assigned to more than one seat',
    'unknown-guest': () => 'Seat assigned to a guest who is no longer in the guest list',
    'excluded-adjacent': (issue, table) => `${table}: "keep apart" guests sit next to each other`,
    'required-split': () => '"Must sit together" guests are at different tables',
    'insufficient-seats': issue => `${issue.count} guests but only ${issue.limit} seats`,
    'unassigned-guest': issue => `${issue.guestIds.length} guest${issue.guestIds.length === 1 ? '' : 's'} without a seat`,
  },
  ru: {
    'malformed-seat': () => 'Назначение с некорректной ссылкой на место',
    'missing-table': () => 'Гость сидит за столом, которого больше нет',
    'seat-out-of-range': (issue, table) => `${table}: гости на местах сверх вместимости стола`,
    'over-capacity': (issue, table) => `${table}: ${issue.count} гостей на ${issue.limit} мест`,
    'duplicate-seat': (issue, table) => `${table}: несколько гостей на одном месте`,
    'duplicate-guest': () => 'Гость назначен на несколько мест',
    'unknown-guest': () => 'Место назначено гостю, которого нет в списке',
    'excluded-adjacent': (issue, table) => `${table}: гости «не сажать рядом» сидят рядом`,
    'required-split': () => 'Гости «++» сидят за разными столами',
    'insufficient-seats': issue => `${issue.count} гостей, но только ${issue.limit} мест`,
    'unassigned-guest': issue => `Без места: ${issue.guestIds.length}`,
  },
  az: {
    'malformed-seat': () => 'Yer istinadı yanlış olan təyinat',
    'missing-table': () => 'Qonaq artıq mövcud olmayan masadadır',
    'seat-out-of-range': (issue, table) => `${table}: masanın tutumundan artıq yerlərdə qonaqlar var`,
    'over-capacity': (issue, table) => `${table}: ${issue.limit} yerə ${issue.count} qonaq`,
    'duplicate-seat': (issue, table) => `${table}: bir yerdə bir neçə qonaq`,
    'duplicate-guest': () => 'Qonaq bir neçə yerə təyin edilib',
    'unknown-guest': () => 'Yer siyahıda olmayan qonağa təyin edilib',
    'excluded-adjacent': (issue, table) => `${table}: "ayrı oturmalı" qonaqlar yan-yanadır`,
    'required-split': () => '"++" qonaqlar fərqli masalardadır',
    'insufficient-seats': issue => `${issue.count} qonaq, lakin cəmi ${issue.limit} yer`,
    'unassigned-guest': issue => `Yersiz qonaqlar: ${issue.guestIds.length}`,
  },
};

const proposalIssueCopy: Record<Locale, Record<SeatingProposalIssueCode, string>> = {
  en: {
    'group-too-large': '"Must sit together" group is larger than any table and was split',
    'group-split': 'Group split across tables',
    'not-contiguous': 'Group at one table, but not side by side',
    'sides-mixed': "Bride's and groom's sides share a table so everyone gets a seat",
    'excluded-conflict': 'Every free seat is next to a "keep apart" guest',
    'no-seat': 'Not enough free seats',
  },
  ru: {
    'group-too-large': 'Группа «++» больше любого стола и была разделена',
    'group-split': 'Группа разделена между столами',
    'not-contiguous': 'Группа за одним столом, но не рядом',
    'sides-mixed': 'Стороны жениха и невесты за одним столом, чтобы рассадить всех',
    'excluded-conflict': 'Все свободные места рядом с гостями «не сажать рядом»',
    'no-seat': 'Недостаточно свободных мест',
  },
  az: {
    'group-too-large': '"++" qrupu istənilən masadan böyükdür və bölündü',
    'group-split': 'Qrup masalar arasında bölündü',
    'not-contiguous': 'Qrup eyni masadadır, lakin yan-yana deyil',
    'sides-mixed': 'Hamıya yer çatsın deyə gəlin və bəy tərəfi eyni masadadır',
    'excluded-conflict': 'Bütün boş yerlər "ayrı oturmalı" qonaqların yanındadır',
    'no-seat': 'Kifayət qədər boş yer yoxdur',
  },
};

type DropTarget =
  | { kind: 'seat'; seatId: string; tableId: string }
  | { kind: 'table'; tableId: string }
  | { kind: 'unassign' };

type GuestDrag = {
  guestId: string;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
};

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase();
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isTable(object: SeatingObject) {
  return ['round-table', 'rect-table', 'oval-table'].includes(object.type);
}

function seatPoint(table: SeatingObject, index: number) {
  const count = table.capacity ?? 8;
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;

  if (table.type === 'round-table' || table.type === 'oval-table') {
    return {
      x: table.x + table.width / 2 + Math.cos(angle) * (table.width / 2 + 23),
      y: table.y + table.height / 2 + Math.sin(angle) * (table.height / 2 + 23),
    };
  }

  const perimeter = 2 * (table.width + table.height);
  const distance = (index / count) * perimeter;
  let x = 0;
  let y = 0;

  if (distance < table.width) {
    x = table.x + distance;
    y = table.y - 24;
  } else if (distance < table.width + table.height) {
    x = table.x + table.width + 24;
    y = table.y + distance - table.width;
  } else if (distance < 2 * table.width + table.height) {
    x = table.x + table.width - (distance - table.width - table.height);
    y = table.y + table.height + 24;
  } else {
    x = table.x - 24;
    y = table.y + table.height - (distance - 2 * table.width - table.height);
  }

  return { x, y };
}

function objectLabel(type: SeatingObjectType, t: typeof labels.ru): string {
  const map: Record<SeatingObjectType, keyof typeof labels.ru> = {
    'round-table': 'addRound', 'rect-table': 'addRect', 'oval-table': 'addOval',
    wall: 'wall', column: 'column', door: 'door', window: 'window',
    stage: 'stage', dancefloor: 'dancefloor', bar: 'bar', buffet: 'buffet', entrance: 'entrance',
  };
  return t[map[type]];
}

const uiCopy = {
  en: {
    eyebrow: 'ELARIO / WEDDING STUDIO', objects: 'OBJECTS', duplicate: 'Duplicate',
    alignLeft: 'Align left', alignTop: 'Align top', centerX: 'Center horizontally', centerY: 'Center vertically',
    selected: (n: number) => `${n} selected`, zoomIn: 'Zoom in', zoomOut: 'Zoom out',
    small: 'Small', medium: 'Medium', large: 'Large', overview: 'VENUE OVERVIEW',
    tables: (n: number) => `${n} ${n === 1 ? 'table' : 'tables'}`, objectCount: (n: number) => `${n} ${n === 1 ? 'object' : 'objects'}`,
    rotation: 'Rotation', close: 'Close', seatSheet: 'Selected seat',
  },
  ru: {
    eyebrow: 'ELARIO / СВАДЕБНАЯ СТУДИЯ', objects: 'ОБЪЕКТЫ', duplicate: 'Дублировать',
    alignLeft: 'По левому краю', alignTop: 'По верхнему краю', centerX: 'Центр по горизонтали', centerY: 'Центр по вертикали',
    selected: (n: number) => `Выбрано: ${n}`, zoomIn: 'Приблизить', zoomOut: 'Отдалить',
    small: 'Малый', medium: 'Средний', large: 'Большой', overview: 'ОБЗОР ЗАЛА',
    tables: (n: number) => `Столов: ${n}`, objectCount: (n: number) => `Объектов: ${n}`,
    rotation: 'Поворот', close: 'Закрыть', seatSheet: 'Выбранное место',
  },
  az: {
    eyebrow: 'ELARIO / TOY STUDİYASI', objects: 'OBYEKTLƏR', duplicate: 'Kopyasını yarat',
    alignLeft: 'Sola düzlə', alignTop: 'Yuxarı düzlə', centerX: 'Üfüqi mərkəzlə', centerY: 'Şaquli mərkəzlə',
    selected: (n: number) => `Seçilib: ${n}`, zoomIn: 'Böyüt', zoomOut: 'Kiçilt',
    small: 'Kiçik', medium: 'Orta', large: 'Böyük', overview: 'ZALIN XƏRİTƏSİ',
    tables: (n: number) => `Masa: ${n}`, objectCount: (n: number) => `Obyekt: ${n}`,
    rotation: 'Fırlanma', close: 'Bağla', seatSheet: 'Seçilmiş yer',
  },
} as const;

export default function SeatingPlanner({ locale, couple, guests, initialPlan }: Props) {
  const t = labels[locale];
  const ui = uiCopy[locale];
  const svgRef = useRef<SVGSVGElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<SeatingPlanV2>(() => initialPlan ?? createEmptySeatingPlan());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const [transform, setTransform] = useState<{
    id: string;
    mode: 'resize' | 'rotate';
    pointerId: number;
    startX: number;
    startY: number;
    originals: SeatingObject[];
    centerX: number;
    centerY: number;
    startAngle: number;
    bounds: { left: number; top: number; width: number; height: number };
    beforePlan: SeatingPlanV2;
  } | null>(null);

  const [selectedGuest, setSelectedGuest] = useState('');
  const [profileGuestId, setProfileGuestId] = useState('');
  const [preferredNeighborDraft, setPreferredNeighborDraft] = useState('');
  const [excludedNeighborDraft, setExcludedNeighborDraft] = useState('');
  const [newGuestGroupName, setNewGuestGroupName] = useState('');
  const [autoProposals, setAutoProposals] = useState<SeatingProposal[]>([]);
  const [showAutoSeating, setShowAutoSeating] = useState(false);
  const [keepExistingSeats, setKeepExistingSeats] = useState(true);
  const [showValidation, setShowValidation] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [guestFilter, setGuestFilter] = useState<'all' | 'unassigned' | 'assigned'>('all');
  const [guestDrag, setGuestDrag] = useState<GuestDrag | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string; id: number } | null>(null);
  const guestSectionRef = useRef<HTMLElement>(null);
  const [zoom, setZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState('');
  const [past, setPast] = useState<SeatingPlanV2[]>([]);
  const [future, setFuture] = useState<SeatingPlanV2[]>([]);
  const [drag, setDrag] = useState<{
    id: string | null;
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    clientStartX: number;
    clientStartY: number;
    mode: 'move' | 'pan' | 'select';
    items: { id: string; x: number; y: number }[];
    beforePlan: SeatingPlanV2;
  } | null>(null);

  const selectedObject = plan.objects.find(item => item.id === selectedId) ?? null;
  // Only assignments that point at a real seat count as "seated" (stale ones are reported by validation).
  const assignedIds = useMemo(
    () => new Set(plan.assignments.filter(item => locateSeat(plan, item.seatId)).map(item => item.guestId)),
    [plan],
  );
  const unassigned = guests.filter(guest => !assignedIds.has(guest.id));
  const occupied = plan.assignments.length;
  const tableCount = plan.objects.filter(isTable).length;
  const totalSeats = plan.objects.filter(isTable).reduce((sum, item) => sum + (item.capacity ?? 8), 0);

  const updatePlan = useCallback((next: SeatingPlanV2) => {
    setPast(items => [...items.slice(-49), plan]);
    setFuture([]);
    setPlan(next);
    setSaved(false);
    setError('');
  }, [plan]);

  const ac = assignCopy[locale];
  const guestsById = useMemo(() => new Map(guests.map(guest => [guest.id, guest])), [guests]);
  const guestName = useCallback((id: string) => guestsById.get(id)?.name ?? ac.unknownName, [guestsById, ac]);

  /** Where each guest currently sits (only valid seats on existing tables). */
  const guestLocations = useMemo(() => {
    const map = new Map<string, { tableId: string; tableName: string; seatId: string; seatNumber: number }>();
    for (const item of plan.assignments) {
      if (map.has(item.guestId)) continue;
      const location = locateSeat(plan, item.seatId);
      if (!location) continue;
      map.set(item.guestId, {
        tableId: location.table.id,
        tableName: location.table.name,
        seatId: item.seatId,
        seatNumber: location.index + 1,
      });
    }
    return map;
  }, [plan]);

  const validationIssues = useMemo(() => validateSeatingPlan(plan, guests), [plan, guests]);
  const validationErrors = validationIssues.filter(issue => issue.severity === 'error');

  const showNotice = useCallback((tone: 'ok' | 'error', text: string) => {
    setNotice({ tone, text, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), notice.tone === 'error' ? 5000 : 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function assignFailureText(result: Extract<AssignResult, { ok: false }>, tableId?: string, seatId?: string) {
    if (result.reason === 'table-full') {
      return ac.tableFull(plan.objects.find(item => item.id === tableId)?.name ?? '');
    }
    if (result.reason === 'seat-occupied') {
      const occupant = plan.assignments.find(item => item.seatId === seatId);
      return ac.seatOccupied(occupant ? guestName(occupant.guestId) : '');
    }
    if (result.reason === 'unknown-guest') return ac.unknownGuest;
    return ac.invalid;
  }

  /** Commits an assignment change through the normal undoable plan update. */
  function commitAssignment(result: AssignResult, guestId: string, target: { tableId?: string; seatId?: string }) {
    if (!result.ok) {
      showNotice('error', assignFailureText(result, target.tableId, target.seatId));
      return false;
    }
    if (!result.changed) return true;
    updatePlan(result.plan);
    const location = locateSeat(result.plan, result.seatId);
    if (location) {
      showNotice('ok', ac.assigned(guestName(guestId), location.table.name, location.index + 1));
      setSelectedId(location.table.id);
      setSelectedIds([location.table.id]);
      setSelectedSeat(result.seatId);
    }
    return true;
  }

  function unassignGuestById(guestId: string) {
    if (!plan.assignments.some(item => item.guestId === guestId)) return;
    const seatId = plan.assignments.find(item => item.guestId === guestId)?.seatId;
    updatePlan(unassignGuest(plan, guestId));
    if (seatId && selectedSeat === seatId) setSelectedSeat(null);
    showNotice('ok', ac.unassigned(guestName(guestId)));
  }

  function locateGuest(guestId: string) {
    const location = guestLocations.get(guestId);
    if (!location) return;
    setSelectedId(location.tableId);
    setSelectedIds([location.tableId]);
    setSelectedSeat(location.seatId);
  }

  function openAutoSeating(keepExisting = keepExistingSeats) {
    setAutoProposals(generateSeatingProposals(guests, plan, { keepExisting }));
    setShowAutoSeating(true);
  }

  function applyAutoSeating(proposal: SeatingProposal) {
    updatePlan({ ...plan, assignments: proposal.assignments });
    setShowAutoSeating(false);
    setAutoProposals([]);
    showNotice(
      proposal.unseated.length ? 'error' : 'ok',
      ac.applied(proposal.seated, guests.length, proposal.added, proposal.unseated.length),
    );
  }

  function fixInvalidAssignments() {
    const { plan: repaired, removed } = repairAssignments(plan, guests);
    if (!removed) return;
    updatePlan(repaired);
    showNotice('ok', ac.fixDone(removed));
  }

  function focusIssue(issue: SeatingIssue) {
    const tableId = issue.tableId ?? (issue.guestIds.length ? guestLocations.get(issue.guestIds[0])?.tableId : undefined);
    if (tableId && plan.objects.some(item => item.id === tableId)) {
      setSelectedId(tableId);
      setSelectedIds([tableId]);
      setSelectedSeat(issue.seatIds.find(seatId => locateSeat(plan, seatId)) ?? null);
      setShowValidation(false);
    } else if (issue.code === 'unassigned-guest') {
      setGuestFilter('unassigned');
      setGuestSearch('');
      setShowValidation(false);
    }
  }

  /* ---------------- Guest drag-and-drop ---------------- */

  /** Converts a screen point into venue coordinates (honours zoom, pan and SVG scaling). */
  function clientToVenue(clientX: number, clientY: number) {
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    return { x: (p.x - pan.x) / zoom, y: (p.y - pan.y) / zoom };
  }

  function findDropTarget(clientX: number, clientY: number): DropTarget | null {
    const section = guestSectionRef.current?.getBoundingClientRect();
    if (section && clientX >= section.left && clientX <= section.right && clientY >= section.top && clientY <= section.bottom) {
      return { kind: 'unassign' };
    }

    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;

    const p = clientToVenue(clientX, clientY);
    if (!p) return null;

    const screenScale = zoom * (rect.width / 1200);
    const seatRadius = Math.max(14, 14 / screenScale);
    const tables = plan.objects.filter(isTable);

    // Seats first (they are drawn on top of tables).
    let bestSeat: { seatId: string; tableId: string; distance: number } | null = null;
    for (const table of tables) {
      for (let index = 0; index < tableCapacity(table); index++) {
        const s = seatPoint(table, index);
        const d = Math.hypot(s.x - p.x, s.y - p.y);
        if (d <= seatRadius && (!bestSeat || d < bestSeat.distance)) {
          bestSeat = { seatId: `${table.id}-seat-${index}`, tableId: table.id, distance: d };
        }
      }
    }
    if (bestSeat) return { kind: 'seat', seatId: bestSeat.seatId, tableId: bestSeat.tableId };

    // Then table bodies (rotation-aware; top-most table wins), with a margin for the seat ring.
    for (let i = tables.length - 1; i >= 0; i--) {
      const table = tables[i];
      const cx = table.x + table.width / 2;
      const cy = table.y + table.height / 2;
      const angle = (-table.rotation * Math.PI) / 180;
      const dx = p.x - cx;
      const dy = p.y - cy;
      const lx = dx * Math.cos(angle) - dy * Math.sin(angle);
      const ly = dx * Math.sin(angle) + dy * Math.cos(angle);
      const margin = 24;
      if (Math.abs(lx) <= table.width / 2 + margin && Math.abs(ly) <= table.height / 2 + margin) {
        return { kind: 'table', tableId: table.id };
      }
    }
    return null;
  }

  function startGuestDrag(event: ReactPointerEvent<Element>, guestId: string) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    if (!guestsById.has(guestId)) return;
    setGuestDrag({
      guestId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      active: false,
    });
  }

  function dropGuest(guestId: string, target: DropTarget | null) {
    if (!target) return;
    if (target.kind === 'unassign') {
      unassignGuestById(guestId);
      return;
    }
    if (target.kind === 'seat') {
      commitAssignment(assignGuestToSeat(plan, guestId, target.seatId, guests), guestId, target);
      return;
    }
    commitAssignment(assignGuestToTable(plan, guestId, target.tableId, guests), guestId, target);
  }

  // Latest handlers for the window listeners below (they need current plan/zoom/pan).
  const guestDragHandlers = useRef<{ move: (e: PointerEvent) => void; end: (e: PointerEvent, cancel: boolean) => void } | null>(null);
  useEffect(() => {
    guestDragHandlers.current = {
      move(event) {
        if (!guestDrag || event.pointerId !== guestDrag.pointerId) return;
        const moved = Math.hypot(event.clientX - guestDrag.startX, event.clientY - guestDrag.startY);
        const active = guestDrag.active || moved > 5;
        setGuestDrag({ ...guestDrag, x: event.clientX, y: event.clientY, active });
        if (active) {
          const target = findDropTarget(event.clientX, event.clientY);
          const assigned = plan.assignments.some(item => item.guestId === guestDrag.guestId);
          setDropTarget(target?.kind === 'unassign' && !assigned ? null : target);
        }
      },
      end(event, cancel) {
        if (!guestDrag || event.pointerId !== guestDrag.pointerId) return;
        if (guestDrag.active && !cancel) {
          dropGuest(guestDrag.guestId, findDropTarget(event.clientX, event.clientY));
        }
        setGuestDrag(null);
        setDropTarget(null);
      },
    };
  });

  const guestDragging = guestDrag !== null;
  useEffect(() => {
    if (!guestDragging) return;
    const move = (event: PointerEvent) => guestDragHandlers.current?.move(event);
    const up = (event: PointerEvent) => guestDragHandlers.current?.end(event, false);
    const cancel = (event: PointerEvent) => guestDragHandlers.current?.end(event, true);
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setGuestDrag(null); setDropTarget(null); }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key);
    document.body.classList.add('sp-guest-dragging');
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key);
      document.body.classList.remove('sp-guest-dragging');
    };
  }, [guestDragging]);

  /** Text + tone shown on the drag ghost for the current drop target. */
  function dropPreview(): { text: string; ok: boolean } | null {
    if (!guestDrag?.active || !dropTarget) return null;
    if (dropTarget.kind === 'unassign') return { text: ac.dropHere, ok: true };
    const table = plan.objects.find(item => item.id === dropTarget.tableId);
    if (!table) return null;
    if (dropTarget.kind === 'seat') {
      const occupant = plan.assignments.find(item => item.seatId === dropTarget.seatId);
      if (occupant && occupant.guestId !== guestDrag.guestId) return { text: ac.occupiedBy(guestName(occupant.guestId)), ok: false };
      return { text: ac.dropTable(table.name, (locateSeat(plan, dropTarget.seatId)?.index ?? 0) + 1), ok: true };
    }
    const result = assignGuestToTable(plan, guestDrag.guestId, table.id);
    if (!result.ok) return { text: ac.dropFull(table.name), ok: false };
    return { text: ac.dropTable(table.name, (locateSeat(result.plan, result.seatId)?.index ?? 0) + 1), ok: true };
  }

  function addObject(type: SeatingObjectType) {
    const table = type.endsWith('-table');
    const count = plan.objects.filter(item => item.type === type).length + 1;
    const object: SeatingObject = {
      id: uid(),
      type,
      name: `${objectLabel(type, t)} ${count}`,
      x: 560 + (count % 4) * 210,
      y: 340 + Math.floor(count / 4) * 180,
      width: table ? (type === 'rect-table' ? 190 : 150) : type === 'wall' ? 260 : 150,
      height: table ? (type === 'rect-table' ? 110 : 150) : type === 'wall' ? 16 : 80,
      rotation: 0,
      ...(table ? { capacity: 8 } : {}),
    };
    updatePlan({ ...plan, objects: [...plan.objects, object] });
    setSelectedId(object.id);
    setSelectedIds([object.id]);
    setSelectedSeat(null);
  }

  function duplicateSelected() {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    if (!ids.length) return;

    const copies = plan.objects
      .filter(item => ids.includes(item.id))
      .map(item => ({
        ...item,
        id: uid(),
        name: `${item.name} copy`,
        x: item.x + 35,
        y: item.y + 35,
      }));

    if (!copies.length) return;

    updatePlan({ ...plan, objects: [...plan.objects, ...copies] });
    setSelectedIds(copies.map(item => item.id));
    setSelectedId(copies[0].id);
    setSelectedSeat(null);
  }

  function updateObject(id: string, patch: Partial<SeatingObject>) {
    updatePlan({ ...plan, objects: plan.objects.map(item => item.id === id ? { ...item, ...patch } : item) });
  }

  function removeSelected() {
    if (!selectedObject) return;
    const ids = new Set(Array.from({ length: selectedObject.capacity ?? 0 }, (_, i) => `${selectedObject.id}-seat-${i}`));
    updatePlan({
      ...plan,
      objects: plan.objects.filter(item => item.id !== selectedObject.id),
      assignments: plan.assignments.filter(item => !ids.has(item.seatId)),
    });
    setSelectedId(null);
    setSelectedIds([]);
    setSelectedSeat(null);
  }

  function updateGuestProfile(guestId: string, patch: Partial<GuestSeatingProfile>) {
    const current = plan.guestProfiles?.[guestId] ?? {
      side: 'shared',
      group: 'other',
      requiredNeighbors: [],
      preferredNeighbors: [],
      excludedNeighbors: [],
      isVip: false,
      accessibility: false,
    };

    updatePlan({
      ...plan,
      guestProfiles: {
        ...plan.guestProfiles,
        [guestId]: { ...current, ...patch },
      },
    });
  }

  function assignGuest() {
    if (!selectedSeat || !selectedGuest) return;
    // Never overwrite a seat that already belongs to another guest.
    const done = commitAssignment(
      assignGuestToSeat(plan, selectedGuest, selectedSeat, guests),
      selectedGuest,
      { seatId: selectedSeat },
    );
    if (done) setSelectedGuest('');
  }

  function unassignSeat() {
    if (!selectedSeat) return;
    updatePlan({ ...plan, assignments: plan.assignments.filter(item => item.seatId !== selectedSeat) });
  }

  function undo() {
    const previous = past[past.length - 1];
    if (!previous) return;
    setFuture(items => [plan, ...items]);
    setPast(items => items.slice(0, -1));
    setPlan(previous);
    setSaved(false);
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setPast(items => [...items, plan]);
    setFuture(items => items.slice(1));
    setPlan(next);
    setSaved(false);
  }

  function point(event: ReactPointerEvent<SVGSVGElement>) {
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: (p.x - pan.x) / zoom, y: (p.y - pan.y) / zoom };
  }

  function startObjectDrag(event: ReactPointerEvent<SVGElement>, object: SeatingObject) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.stopPropagation();

    const p = point(event as ReactPointerEvent<SVGSVGElement>);
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;

    const currentSelection = selectedIds.length
      ? selectedIds
      : selectedId ? [selectedId] : [];

    let nextIds: string[];

    if (additive) {
      nextIds = currentSelection.includes(object.id)
        ? currentSelection.filter(id => id !== object.id)
        : [...currentSelection, object.id];
    } else {
      nextIds = currentSelection.includes(object.id)
        ? currentSelection
        : [object.id];
    }

    setSelectedIds(nextIds);
    setSelectedId(nextIds.includes(object.id) ? object.id : nextIds[0] ?? null);
    setSelectedSeat(null);

    if (additive || !nextIds.includes(object.id)) return;

    const movingItems = plan.objects
      .filter(item => nextIds.includes(item.id))
      .map(item => ({ id: item.id, x: item.x, y: item.y }));

    setDrag({
      id: object.id,
      pointerId: event.pointerId,
      startX: p.x,
      startY: p.y,
      panX: pan.x,
      panY: pan.y,
      clientStartX: event.clientX,
      clientStartY: event.clientY,
      mode: 'move',
      items: movingItems,
      beforePlan: plan,
    });

    (event.currentTarget as SVGElement).setPointerCapture?.(event.pointerId);
  }

  function startPan(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    if ((event.target as Element).closest?.('.sp-object, .sp-seat, .sp-transform-handle, .sp-minimap')) return;

    const p = point(event);
    const selecting = event.shiftKey;

    if (!selecting) {
      setSelectedId(null);
      setSelectedIds([]);
      setSelectedSeat(null);
    }

    setMarquee(selecting ? { x: p.x, y: p.y, width: 0, height: 0 } : null);

    setDrag({
      id: null,
      pointerId: event.pointerId,
      startX: p.x,
      startY: p.y,
      panX: pan.x,
      panY: pan.y,
      clientStartX: event.clientX,
      clientStartY: event.clientY,
      mode: selecting ? 'select' : 'pan',
      items: [],
      beforePlan: plan,
    });

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function movePointer(event: ReactPointerEvent<SVGSVGElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;

    const p = point(event);

    if (drag.mode === 'move' && drag.id) {
      const dx = p.x - drag.startX;
      const dy = p.y - drag.startY;

      setPlan(current => ({
        ...current,
        objects: current.objects.map(item => {
          const original = drag.items.find(entry => entry.id === item.id);
          if (!original) return item;

          let x = original.x + dx;
          let y = original.y + dy;

          if (current.settings.snapEnabled) {
            const size = current.settings.gridSize;
            x = Math.round(x / size) * size;
            y = Math.round(y / size) * size;
          }

          return { ...item, x, y };
        }),
      }));
      setSaved(false);
      return;
    }

    if (drag.mode === 'select') {
      setMarquee({
        x: Math.min(drag.startX, p.x),
        y: Math.min(drag.startY, p.y),
        width: Math.abs(p.x - drag.startX),
        height: Math.abs(p.y - drag.startY),
      });
      return;
    }

    if (drag.mode === 'pan') {
      const svg = svgRef.current;
      if (!svg) return;

      const dx = (event.clientX - drag.clientStartX) * (1200 / svg.clientWidth);
      const dy = (event.clientY - drag.clientStartY) * (800 / svg.clientHeight);

      setPan({
        x: drag.panX + dx,
        y: drag.panY + dy,
      });
    }
  }

  function endPointer() {
    if (!drag) return;

    if (drag.mode === 'move' && drag.id) {
      setPast(items => [...items.slice(-49), drag.beforePlan]);
      setFuture([]);
    }

    if (drag.mode === 'select' && marquee) {
      const x1 = marquee.x;
      const y1 = marquee.y;
      const x2 = x1 + marquee.width;
      const y2 = y1 + marquee.height;

      const ids = plan.objects.filter(item => {
        const left = item.x;
        const top = item.y;
        const right = item.x + item.width;
        const bottom = item.y + item.height;
        return right >= x1 && left <= x2 && bottom >= y1 && top <= y2;
      }).map(item => item.id);

      setSelectedIds(ids);
      setSelectedId(ids[0] ?? null);
      setSelectedSeat(null);
    }

    setDrag(null);
    setMarquee(null);
  }

  function startTransform(
    event: ReactPointerEvent<SVGElement>,
    object: SeatingObject,
    mode: 'resize' | 'rotate'
  ) {
    event.stopPropagation();
    event.preventDefault();

    const p = point(event as ReactPointerEvent<SVGSVGElement>);
    const ids = selectedIds.includes(object.id) ? selectedIds : [object.id];
    const originals = plan.objects.filter(item => ids.includes(item.id));

    if (!originals.length) return;

    const left = Math.min(...originals.map(item => item.x));
    const top = Math.min(...originals.map(item => item.y));
    const right = Math.max(...originals.map(item => item.x + item.width));
    const bottom = Math.max(...originals.map(item => item.y + item.height));
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;

    setSelectedId(object.id);
    setSelectedIds(ids);
    setTransform({
      id: object.id,
      mode,
      pointerId: event.pointerId,
      startX: p.x,
      startY: p.y,
      originals,
      centerX,
      centerY,
      startAngle: Math.atan2(p.y - centerY, p.x - centerX),
      bounds: { left, top, width: right - left, height: bottom - top },
      beforePlan: plan,
    });

    (event.currentTarget as SVGElement).setPointerCapture?.(event.pointerId);
  }

  function moveTransform(event: ReactPointerEvent<SVGSVGElement>) {
    if (!transform || transform.pointerId !== event.pointerId) return;

    const p = point(event);
    const dx = p.x - transform.startX;
    const dy = p.y - transform.startY;
    const originals = transform.originals;

    if (transform.mode === 'resize') {
      const scaleX = Math.max(0.1,
        (transform.bounds.width + dx) / Math.max(1, transform.bounds.width));
      const scaleY = Math.max(0.1,
        (transform.bounds.height + dy) / Math.max(1, transform.bounds.height));

      setPlan(current => ({
        ...current,
        objects: current.objects.map(item => {
          const original = originals.find(source => source.id === item.id);
          if (!original) return item;

          return {
            ...item,
            x: transform.bounds.left + (original.x - transform.bounds.left) * scaleX,
            y: transform.bounds.top + (original.y - transform.bounds.top) * scaleY,
            width: Math.max(35, original.width * scaleX),
            height: Math.max(25, original.height * scaleY),
          };
        }),
      }));
    } else {
      const currentAngle = Math.atan2(
        p.y - transform.centerY,
        p.x - transform.centerX
      );
      let delta = (currentAngle - transform.startAngle) * 180 / Math.PI;

      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      const radians = delta * Math.PI / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);

      setPlan(current => ({
        ...current,
        objects: current.objects.map(item => {
          const original = originals.find(source => source.id === item.id);
          if (!original) return item;

          const cx = original.x + original.width / 2 - transform.centerX;
          const cy = original.y + original.height / 2 - transform.centerY;

          const rotatedX = cx * cos - cy * sin;
          const rotatedY = cx * sin + cy * cos;

          return {
            ...item,
            x: transform.centerX + rotatedX - original.width / 2,
            y: transform.centerY + rotatedY - original.height / 2,
            rotation: Math.round(original.rotation + delta),
          };
        }),
      }));
    }

    setSaved(false);
  }

  function endTransform() {
    if (transform) {
      setPast(items => [...items.slice(-49), transform.beforePlan]);
      setFuture([]);
    }
    setTransform(null);
  }

  function alignSelected(mode: 'left' | 'top' | 'center-x' | 'center-y') {
    const ids = selectedIds.length > 1 ? selectedIds : [];
    if (ids.length < 2) return;
    const items = plan.objects.filter(item => ids.includes(item.id));
    if (items.length < 2) return;

    const left = Math.min(...items.map(item => item.x));
    const top = Math.min(...items.map(item => item.y));
    const centerX = items.reduce((sum, item) => sum + item.x + item.width / 2, 0) / items.length;
    const centerY = items.reduce((sum, item) => sum + item.y + item.height / 2, 0) / items.length;

    updatePlan({
      ...plan,
      objects: plan.objects.map(item => {
        if (!ids.includes(item.id)) return item;
        if (mode === 'left') return { ...item, x: left };
        if (mode === 'top') return { ...item, y: top };
        if (mode === 'center-x') return { ...item, x: centerX - item.width / 2 };
        return { ...item, y: centerY - item.height / 2 };
      }),
    });
  }

  function handleDuplicateShortcut(event: React.KeyboardEvent<HTMLDivElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      duplicateSelected();
    }
  }

  function zoomAt(clientX: number, clientY: number, nextZoom: number) {
    const svg = svgRef.current;
    if (!svg) {
      setZoom(nextZoom);
      return;
    }

    const rect = svg.getBoundingClientRect();
    const cursorX = (clientX - rect.left) * 1200 / rect.width;
    const cursorY = (clientY - rect.top) * 800 / rect.height;

    setPan({
      x: cursorX - ((cursorX - pan.x) / zoom) * nextZoom,
      y: cursorY - ((cursorY - pan.y) / zoom) * nextZoom,
    });
    setZoom(nextZoom);
  }

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function handleWheel(event: WheelEvent) {
      // Pinch gesture: prevent browser page zoom and zoom the venue.
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();

        const factor = Math.exp(-event.deltaY * 0.0040);
        const nextZoom = Math.max(0.25, Math.min(3, zoom * factor));

        if (Math.abs(nextZoom - zoom) > 0.0001) {
          zoomAt(event.clientX, event.clientY, nextZoom);
        }
        return;
      }

      // Two-finger scrolling: pan the venue instead of the page.
      event.preventDefault();

      const currentSvg = svgRef.current;
      if (!currentSvg) return;

      const rect = currentSvg.getBoundingClientRect();
      const scaleX = 1200 / rect.width;
      const scaleY = 800 / rect.height;

      setPan(current => ({
        x: current.x - event.deltaX * scaleX,
        y: current.y - event.deltaY * scaleY,
      }));
    }

    svg.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      svg.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, pan]);

  function zoomFromCenter(factor: number) {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const nextZoom = Math.max(0.25, Math.min(3, zoom * factor));
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, nextZoom);
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/seating', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || t.error);
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setSaving(false);
    }
  }

  function fitCanvas() {
    const scale = Math.min(
      1100 / plan.venue.width,
      700 / plan.venue.height,
      1.2
    );
    setZoom(Math.max(0.25, scale));
    setPan({
      x: (1200 - plan.venue.width * Math.max(0.25, scale)) / 2,
      y: (800 - plan.venue.height * Math.max(0.25, scale)) / 2,
    });
  }

  function setVenueSize(width: number, height: number) {
    updatePlan({
      ...plan,
      venue: { ...plan.venue, width, height },
    });
    setSelectedId(null);
    setSelectedIds([]);
    setSelectedSeat(null);
    setZoom(Math.min(0.7, 900 / width, 600 / height));
    setPan({ x: 40, y: 30 });
  }

  async function handleBackgroundUpload(file?: File) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(locale === 'ru' ? 'Выберите файл изображения.' : 'Please select an image file.');
      return;
    }

    try {
      const image = await createImageBitmap(file);
      const scale = Math.min(1, 1800 / image.width, 1300 / image.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not process image');

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.close();

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          result => result ? resolve(result) : reject(new Error('Image compression failed')),
          'image/jpeg',
          0.78
        );
      });

      if (blob.size > 1_500_000) {
        throw new Error(locale === 'ru' ? 'Изображение слишком большое даже после сжатия.' : 'Image is too large after compression.');
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        updatePlan({
          ...plan,
          venue: { ...plan.venue, background: reader.result },
        });
      };
      reader.onerror = () => setError('Could not read image');
      reader.readAsDataURL(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload background');
    }
  }

  const assignmentBySeat = new Map(plan.assignments.map(item => [item.seatId, item.guestId]));

  const selectedTableGuests = selectedObject && isTable(selectedObject)
    ? plan.assignments
        .filter(item => item.seatId.startsWith(`${selectedObject.id}-seat-`))
        .map(item => {
          const match = item.seatId.match(/-seat-(\d+)$/);
          return {
            ...item,
            seatNumber: match ? Number(match[1]) + 1 : 0,
            guest: guests.find(guest => guest.id === item.guestId),
          };
        })
        .filter(item => item.guest)
        .sort((a, b) => a.seatNumber - b.seatNumber)
    : [];

  return (
    <div className="sp-editor" tabIndex={0} onKeyDown={handleDuplicateShortcut}>
      <header className="sp-topbar">
        <div className="sp-heading">
          <span className="sp-eyebrow">{ui.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{couple} · {t.subtitle}</p>
        </div>
        <div className="sp-top-actions">
          <span className={saved ? 'sp-save-state' : 'sp-save-state dirty'}>{saved ? t.saved : t.unsaved}</span>
          <button
            type="button"
            className="sp-export-button"
            onClick={() => window.open('/dashboard/seating/print', '_blank', 'noopener,noreferrer')}
          >
            {locale === 'ru' ? 'Экспорт PDF' : locale === 'az' ? 'PDF ixracı' : 'Export PDF'}
          </button>
          <button className="sp-primary" onClick={save} disabled={saving || saved}>{saving ? t.saving : t.save}</button>
        </div>
      </header>

      <div className="sp-workspace">
        <aside className="sp-tools">
          <span className="sp-panel-label">{ui.objects}</span>
          <button onClick={() => addObject('round-table')} className="flex items-center gap-1.5"><RoundTableIcon className="w-4 h-4 inline-block" /> {t.addRound}</button>
          <button onClick={() => addObject('rect-table')} className="flex items-center gap-1.5"><RectTableIcon className="w-4 h-4 inline-block" /> {t.addRect}</button>
          <button onClick={() => addObject('oval-table')} className="flex items-center gap-1.5"><OvalTableIcon className="w-4 h-4 inline-block" /> {t.addOval}</button>
          <div className="sp-tool-divider" />
          {(['wall', 'column', 'door', 'window', 'stage', 'dancefloor', 'bar', 'buffet', 'entrance'] as SeatingObjectType[]).map(type => (
            <button key={type} onClick={() => addObject(type)}>{objectLabel(type, t)}</button>
          ))}
          <div className="sp-tool-divider" />
          <button className="sp-auto-trigger flex items-center justify-center gap-1.5" onClick={() => openAutoSeating()} disabled={!guests.length || !plan.objects.some(isTable)}>
            <SparklesIcon className="w-4 h-4 inline-block text-amber-300" /> {locale === 'ru' ? 'Умная рассадка' : locale === 'az' ? 'Ağıllı yerləşdirmə' : 'Smart Seating'}
          </button>
          <button type="button" className="sp-validate-trigger" onClick={() => setShowValidation(true)}>
            <span>{ac.validate}</span>
            {validationErrors.length > 0
              ? <span className="sp-validate-badge error">{validationErrors.length}</span>
              : validationIssues.length > 0
                ? <span className="sp-validate-badge">{validationIssues.length}</span>
                : <span className="sp-validate-badge ok"><CheckIcon className="w-3 h-3" /></span>}
          </button>
          <div className="sp-tool-divider" />
          <button onClick={undo} disabled={!past.length} className="flex items-center gap-1.5"><UndoIcon className="w-3.5 h-3.5 inline-block" /> {t.undo}</button>
          <button onClick={redo} disabled={!future.length} className="flex items-center gap-1.5"><RedoIcon className="w-3.5 h-3.5 inline-block" /> {t.redo}</button>
          <div className="sp-tool-divider" />
          <button onClick={duplicateSelected} disabled={!selectedIds.length && !selectedId} className="flex items-center gap-1.5"><DuplicateIcon className="w-3.5 h-3.5 inline-block" /> {ui.duplicate}</button>
          <button onClick={() => alignSelected('left')} disabled={selectedIds.length < 2}>{ui.alignLeft}</button>
          <button onClick={() => alignSelected('top')} disabled={selectedIds.length < 2}>{ui.alignTop}</button>
          <button onClick={() => alignSelected('center-x')} disabled={selectedIds.length < 2}>{ui.centerX}</button>
          <button onClick={() => alignSelected('center-y')} disabled={selectedIds.length < 2}>{ui.centerY}</button>

          <span className="sp-selection-count">
            {selectedIds.length > 1 ? ui.selected(selectedIds.length) : ''}
          </span>
        </aside>

        <main className="sp-canvas-area">
          <div className="sp-canvas-toolbar">
            <span>{t.hint}</span>
            <div>
              {(selectedIds.length > 0 || selectedId !== null) && (
                <span className="sp-selection-indicator">
                  {ui.selected(selectedIds.length || (selectedId ? 1 : 0))}
                </span>
              )}
              <button onClick={() => zoomFromCenter(1 / 1.2)} title={ui.zoomOut} aria-label={ui.zoomOut} className="inline-flex items-center justify-center"><MinusIcon className="w-3 h-3" /></button>
              <strong>{Math.round(zoom * 100)}%</strong>
              <button onClick={() => zoomFromCenter(1.2)} title={ui.zoomIn} aria-label={ui.zoomIn}>+</button>
              <button onClick={fitCanvas}>{t.fit}</button>
              <button className={plan.settings.gridEnabled ? 'active' : ''} onClick={() => updatePlan({ ...plan, settings: { ...plan.settings, gridEnabled: !plan.settings.gridEnabled } })}>{t.grid}</button>
              <button className={plan.settings.snapEnabled ? 'active' : ''} onClick={() => updatePlan({ ...plan, settings: { ...plan.settings, snapEnabled: !plan.settings.snapEnabled } })}>{t.snap}</button>
            </div>
          </div>

          <div className="sp-venue-toolbar">
            <span>{locale === 'ru' ? 'Размер зала' : locale === 'az' ? 'Zalın ölçüsü' : 'Venue size'}</span>
            <button onClick={() => setVenueSize(1200, 800)}>{ui.small} · 1200 × 800</button>
            <button onClick={() => setVenueSize(1600, 1100)}>{ui.medium} · 1600 × 1100</button>
            <button onClick={() => setVenueSize(2200, 1500)}>{ui.large} · 2200 × 1500</button>
            <label>
              {locale === 'ru' ? 'Ширина' : locale === 'az' ? 'En' : 'Width'}
              <input
                type="number"
                min="400"
                max="5000"
                defaultValue={plan.venue.width}
                key={`venue-width-${plan.venue.width}`}
                onBlur={event => {
                  const width = Math.max(400, Math.min(5000, Number(event.target.value) || plan.venue.width));
                  if (width !== plan.venue.width) setVenueSize(width, plan.venue.height);
                }}
              />
            </label>
            <label>
              {locale === 'ru' ? 'Высота' : locale === 'az' ? 'Hündürlük' : 'Height'}
              <input
                type="number"
                min="300"
                max="4000"
                defaultValue={plan.venue.height}
                key={`venue-height-${plan.venue.height}`}
                onBlur={event => {
                  const height = Math.max(300, Math.min(4000, Number(event.target.value) || plan.venue.height));
                  if (height !== plan.venue.height) setVenueSize(plan.venue.width, height);
                }}
              />
            </label>
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={event => {
                void handleBackgroundUpload(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <button onClick={() => backgroundInputRef.current?.click()}>
              {plan.venue.background
                ? (locale === 'ru' ? 'Заменить фон' : locale === 'az' ? 'Fonu dəyiş' : 'Replace background')
                : (locale === 'ru' ? 'Загрузить план зала' : locale === 'az' ? 'Zal planını yüklə' : 'Upload floor plan')}
            </button>
            {plan.venue.background && (
              <button onClick={() => updatePlan({
                ...plan,
                venue: { ...plan.venue, background: null },
              })}>
                {locale === 'ru' ? 'Убрать фон' : locale === 'az' ? 'Fonu sil' : 'Remove background'}
              </button>
            )}
          </div>

          <svg
            ref={svgRef}
            className="sp-canvas"
            viewBox="0 0 1200 800"
            onPointerDown={startPan}
            onPointerMove={event => {
              if (transform) moveTransform(event);
              else movePointer(event);
            }}
            onPointerUp={() => {
              if (transform) endTransform();
              else endPointer();
            }}
            onPointerCancel={() => {
              if (transform) endTransform();
              else endPointer();
            }}
          >
            <defs>
              <pattern id="sp-grid" width={plan.settings.gridSize} height={plan.settings.gridSize} patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#d9d4d0" />
              </pattern>
              <filter id="sp-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#43352f" floodOpacity=".10" />
              </filter>
            </defs>
            <rect width="1200" height="800" fill="#fbfaf8" />
            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              <rect x="-3000" y="-3000" width="8000" height="8000" fill={plan.settings.gridEnabled ? 'url(#sp-grid)' : 'transparent'} />
              {plan.venue.background && (
                <image
                  href={plan.venue.background}
                  x="0"
                  y="0"
                  width={plan.venue.width}
                  height={plan.venue.height}
                  preserveAspectRatio="none"
                  opacity="0.72"
                  pointerEvents="none"
                />
              )}
              <rect x="0" y="0" width={plan.venue.width} height={plan.venue.height} fill="none" stroke="#ded8d2" strokeWidth="2" strokeDasharray="8 8" />

              {marquee && (
                <rect
                  x={marquee.x}
                  y={marquee.y}
                  width={marquee.width}
                  height={marquee.height}
                  fill="#6f8f7c"
                  fillOpacity=".12"
                  stroke="#2f5a46"
                  strokeWidth="2"
                  strokeDasharray="7 5"
                  pointerEvents="none"
                />
              )}

              {plan.objects.map(object => {
                const selected = selectedIds.includes(object.id);
                const table = isTable(object);
                const fill = object.type === 'dancefloor' ? '#f0e8ec'
                  : object.type === 'stage' ? '#eee9e3'
                  : table ? '#fff' : '#e9e5e0';
                const stroke = selected ? '#967c89' : '#bdb3ad';
                const cx = object.x + object.width / 2;
                const cy = object.y + object.height / 2;

                return (
                  <g key={object.id} transform={`rotate(${object.rotation} ${cx} ${cy})`}
                    onPointerDown={event => startObjectDrag(event, object)}
                    className="sp-object">
                    {object.type === 'wall' ? (
                      <rect x={object.x} y={object.y} width={object.width} height={object.height} rx="3" fill="#77716c" stroke={stroke} strokeWidth={selected ? 4 : 1} />
                    ) : object.type === 'column' ? (
                      <circle cx={cx} cy={cy} r={Math.min(object.width, object.height) / 2} fill="#d5cec7" stroke={stroke} strokeWidth={selected ? 4 : 2} />
                    ) : (
                      <rect x={object.x} y={object.y} width={object.width} height={object.height}
                        rx={table && object.type === 'round-table' ? object.width / 2 : object.type === 'oval-table' ? object.height / 2 : 8}
                        fill={fill} stroke={stroke} strokeWidth={selected ? 3 : 1.5}
                        filter={table ? 'url(#sp-shadow)' : undefined} />
                    )}
                    {table && (
                      <>
                        <text x={cx} y={cy - 7} textAnchor="middle" className="sp-table-name">{object.name}</text>
                        <text x={cx} y={cy + 14} textAnchor="middle" className="sp-table-count">
                          {plan.assignments.filter(item => item.seatId.startsWith(`${object.id}-seat-`)).length}/{object.capacity ?? 8}
                        </text>
                      </>
                    )}
                    {!table && object.type !== 'wall' && object.type !== 'column' && (
                      <text x={cx} y={cy + 4} textAnchor="middle" className="sp-object-label">{object.name}</text>
                    )}
                    {selected && (
                      <>
                        <rect
                          x={object.x - 9}
                          y={object.y - 9}
                          width={object.width + 18}
                          height={object.height + 18}
                          fill="none"
                          stroke="#1f3a2e"
                          strokeWidth="3"
                          strokeDasharray="7 3"
                          rx="9"
                          pointerEvents="none"
                          className="sp-selected-outline"
                        />
                        {[
                          [object.x - 9, object.y - 9],
                          [object.x + object.width + 9, object.y - 9],
                          [object.x - 9, object.y + object.height + 9],
                          [object.x + object.width + 9, object.y + object.height + 9],
                        ].map(([hx, hy], index) => (
                          <rect
                            key={index}
                            x={hx - 4}
                            y={hy - 4}
                            width="8"
                            height="8"
                            rx="2"
                            fill="#fff"
                            stroke="#1f3a2e"
                            strokeWidth="2"
                            pointerEvents="none"
                          />
                        ))}
                        <g pointerEvents="none">
                          <rect
                            x={object.x}
                            y={object.y - 29}
                            width={Math.max(72, object.name.length * 6 + 18)}
                            height="19"
                            rx="5"
                            fill="#1f3a2e"
                          />
                          <text
                            x={object.x + Math.max(72, object.name.length * 6 + 18) / 2}
                            y={object.y - 16}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="10"
                            fontWeight="600"
                          >
                            SELECTED
                          </text>
                        </g>
                      </>
                    )}
                    {selectedId === object.id && (
                      <>
                        <circle
                          cx={object.x + object.width}
                          cy={object.y + object.height}
                          r="8"
                          className="sp-transform-handle"
                          onPointerDown={event => startTransform(event, object, 'resize')}
                        />
                        <line
                          x1={cx}
                          y1={object.y}
                          x2={cx}
                          y2={object.y - 35}
                          stroke="#9c8290"
                          strokeWidth="2"
                          pointerEvents="none"
                        />
                        <circle
                          cx={cx}
                          cy={object.y - 42}
                          r="8"
                          className="sp-transform-handle sp-rotate-handle"
                          onPointerDown={event => startTransform(event, object, 'rotate')}
                        />
                      </>
                    )}
                  </g>
                );
              })}

              {plan.objects.filter(isTable).flatMap(table =>
                Array.from({ length: table.capacity ?? 8 }, (_, index) => {
                  const seatId = `${table.id}-seat-${index}`;
                  const p = seatPoint(table, index);
                  const guestId = assignmentBySeat.get(seatId);
                  const guest = guests.find(item => item.id === guestId);
                  const active = selectedSeat === seatId;
                  return (
                    <g key={seatId} className="sp-seat" onPointerDown={event => {
                      event.stopPropagation();
                      // Occupied seat: the guest can be dragged to another seat/table or back to the list.
                      if (guest) startGuestDrag(event, guest.id);
                    }}
                      onClick={event => { event.stopPropagation(); setSelectedId(table.id); setSelectedSeat(seatId); }}>
                      <circle cx={p.x} cy={p.y} r={active ? 13 : 10}
                        fill={guest ? '#9c8290' : '#fff'} stroke={active ? '#5d4352' : '#a99aa0'} strokeWidth={active ? 3 : 1.5} />
                      {guest && <text x={p.x} y={p.y + 3} textAnchor="middle" className="sp-seat-initial">{guest.name.slice(0, 1).toUpperCase()}</text>}
                      {guest && <title>{guest.name}</title>}
                    </g>
                  );
                })
              )}

              {guestDrag?.active && dropTarget && dropTarget.kind !== 'unassign' && (() => {
                // Drag feedback layer only; it sits above the existing table/seat rendering.
                const table = plan.objects.find(item => item.id === dropTarget.tableId);
                if (!table) return null;
                const preview = dropPreview();
                const color = preview?.ok === false ? '#b4574a' : '#5f8a6c';
                if (dropTarget.kind === 'seat') {
                  const index = locateSeat(plan, dropTarget.seatId)?.index ?? 0;
                  const p = seatPoint(table, index);
                  return (
                    <circle cx={p.x} cy={p.y} r={17} fill="none" stroke={color} strokeWidth="3"
                      strokeDasharray="5 3" pointerEvents="none" className="sp-drop-ring" />
                  );
                }
                const cx = table.x + table.width / 2;
                const cy = table.y + table.height / 2;
                return (
                  <rect
                    x={table.x - 36} y={table.y - 36} width={table.width + 72} height={table.height + 72}
                    rx={table.type === 'rect-table' ? 14 : Math.min(table.width, table.height) / 2 + 36}
                    transform={`rotate(${table.rotation} ${cx} ${cy})`}
                    fill={color} fillOpacity=".06" stroke={color} strokeWidth="3" strokeDasharray="9 5"
                    pointerEvents="none" className="sp-drop-ring"
                  />
                );
              })()}
            </g>
          </svg>

          <div className="sp-minimap">
            <div className="sp-minimap-title">{ui.overview}</div>
            <svg
              viewBox={`0 0 ${plan.venue.width} ${plan.venue.height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <rect x="0" y="0" width={plan.venue.width} height={plan.venue.height} fill="#fbfaf8" />
              {plan.venue.background && (
                <image
                  href={plan.venue.background}
                  x="0"
                  y="0"
                  width={plan.venue.width}
                  height={plan.venue.height}
                  preserveAspectRatio="none"
                  opacity="0.72"
                />
              )}
              {plan.objects.map(object => (
                <rect
                  key={object.id}
                  x={object.x}
                  y={object.y}
                  width={object.width}
                  height={object.height}
                  rx={isTable(object) ? 8 : 2}
                  fill={selectedIds.includes(object.id) ? "#9c8290" : "#c9c0ba"}
                  opacity=".85"
                />
              ))}
              <rect
                x={-pan.x / zoom}
                y={-pan.y / zoom}
                width={1200 / zoom}
                height={800 / zoom}
                fill="none"
                stroke="#2f5a46"
                strokeWidth="8"
              />
            </svg>
          </div>

          <div className="sp-canvas-footer">
            <span>{ui.tables(tableCount)}</span>
            <span>{occupied} / {totalSeats} {t.guests.toLowerCase()}</span>
            <span>{ui.objectCount(plan.objects.length)}</span>
          </div>
        </main>

        <aside className="sp-inspector">
          <section>
            <span className="sp-panel-label">{t.properties.toUpperCase()}</span>
            {!selectedObject ? <p className="sp-muted">{t.empty}</p> : (
              <div className="sp-fields">
                <label>{t.name}
                  <input value={selectedObject.name} onChange={event => updateObject(selectedObject.id, { name: event.target.value })} />
                </label>
                {isTable(selectedObject) && (
                  <label>{t.capacity}
                    <input type="number" min="1" max="40" value={selectedObject.capacity ?? 8}
                      onChange={event => updateObject(selectedObject.id, { capacity: Math.max(1, Math.min(40, Number(event.target.value) || 1)) })} />
                  </label>
                )}
                <div className="sp-fields-row">
                  <label>X<input type="number" value={Math.round(selectedObject.x)} onChange={event => updateObject(selectedObject.id, { x: Number(event.target.value) })} /></label>
                  <label>Y<input type="number" value={Math.round(selectedObject.y)} onChange={event => updateObject(selectedObject.id, { y: Number(event.target.value) })} /></label>
                </div>
                <div className="sp-fields-row">
                  <label>W<input type="number" min="10" value={Math.round(selectedObject.width)} onChange={event => updateObject(selectedObject.id, { width: Math.max(10, Number(event.target.value)) })} /></label>
                  <label>H<input type="number" min="10" value={Math.round(selectedObject.height)} onChange={event => updateObject(selectedObject.id, { height: Math.max(10, Number(event.target.value)) })} /></label>
                </div>
                <label>{ui.rotation}
                  <input type="number" value={selectedObject.rotation} onChange={event => updateObject(selectedObject.id, { rotation: Number(event.target.value) })} />
                </label>
                <button className="sp-danger" onClick={removeSelected}>{t.delete}</button>
              </div>
            )}
          </section>

          {selectedObject && isTable(selectedObject) && (
            <section className="sp-table-guests">
              <span className="sp-panel-label">
                {locale === 'ru' ? 'ГОСТИ ЗА СТОЛОМ' : locale === 'az' ? 'MASADAKI QONAQLAR' : 'TABLE GUESTS'}
              </span>
              <div className="sp-table-guests-heading">
                <strong>{selectedObject.name}</strong>
                <span>{selectedTableGuests.length}/{selectedObject.capacity ?? 8}</span>
              </div>
              {selectedTableGuests.length ? (
                <div className="sp-table-guest-list">
                  {selectedTableGuests.map(item => (
                    <div className="sp-table-guest-row" key={item.seatId}>
                      <button
                        type="button"
                        className="sp-table-guest-info"
                        onClick={() => setSelectedSeat(item.seatId)}
                        title={locale === 'ru' ? 'Перейти к месту' : locale === 'az' ? 'Oturacağa keç' : 'Select seat'}
                      >
                        <span className="sp-table-seat-number">{item.seatNumber}</span>
                        <span>{item.guest!.name}</span>
                      </button>
                      <button
                        type="button"
                        className="sp-table-guest-remove"
                        onClick={() => {
                          updatePlan({
                            ...plan,
                            assignments: plan.assignments.filter(assignment => assignment.seatId !== item.seatId),
                          });
                          if (selectedSeat === item.seatId) setSelectedSeat(null);
                        }}
                        title={locale === 'ru' ? 'Освободить место' : locale === 'az' ? 'Yeri boşalt' : 'Unassign guest'}
                      >×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sp-muted">
                  {locale === 'ru' ? 'За этим столом пока никого нет.' : locale === 'az' ? 'Bu masada hələ qonaq yoxdur.' : 'No guests assigned to this table yet.'}
                </p>
              )}
            </section>
          )}

          <section
            ref={guestSectionRef}
            className={dropTarget?.kind === 'unassign' ? 'sp-guest-section sp-drop-active' : 'sp-guest-section'}
          >
            <span className="sp-panel-label">{t.guests.toUpperCase()}</span>
            <p className="sp-muted">{selectedSeat ? t.selectedSeat : t.selectSeat}</p>
            {selectedSeat && (() => {
              const occupantId = assignmentBySeat.get(selectedSeat);
              const location = locateSeat(plan, selectedSeat);
              return (
                <>
                  {location && (
                    <p className="sp-seat-status">
                      <strong>{location.table.name} · {ac.seat} {location.index + 1}</strong>
                      <span>{occupantId ? guestName(occupantId) : t.unassigned}</span>
                    </p>
                  )}
                  {!occupantId && (
                    <>
                      <select value={selectedGuest} onChange={event => setSelectedGuest(event.target.value)}>
                        <option value="">{t.unassigned}</option>
                        {unassigned.map(guest => <option key={guest.id} value={guest.id}>{guest.name}</option>)}
                      </select>
                      <button className="sp-primary sp-wide" onClick={assignGuest} disabled={!selectedGuest}>{t.assign}</button>
                    </>
                  )}
                  {occupantId && (
                    <button className="sp-secondary sp-wide" onClick={unassignSeat}>{t.removeGuest}</button>
                  )}
                </>
              );
            })()}

            <div className="sp-guest-browser">
              <input
                type="search"
                className="sp-guest-search"
                value={guestSearch}
                placeholder={ac.search}
                aria-label={ac.search}
                onChange={event => setGuestSearch(event.target.value)}
              />
              <div className="sp-guest-filters" role="tablist">
                {([
                  ['all', ac.all, guests.length],
                  ['unassigned', ac.unassignedTab, guests.filter(guest => !guestLocations.has(guest.id)).length],
                  ['assigned', ac.assignedTab, guests.filter(guest => guestLocations.has(guest.id)).length],
                ] as const).map(([value, label, count]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={guestFilter === value}
                    className={guestFilter === value ? 'active' : ''}
                    onClick={() => setGuestFilter(value)}
                  >
                    {label} <span>{count}</span>
                  </button>
                ))}
              </div>
              <p className="sp-muted">{dropTarget?.kind === 'unassign' ? ac.dropHere : ac.dragHint}</p>
              {(() => {
                const query = normalizeSearch(guestSearch.trim());
                const visible = guests.filter(guest => {
                  const location = guestLocations.get(guest.id);
                  if (guestFilter === 'assigned' && !location) return false;
                  if (guestFilter === 'unassigned' && location) return false;
                  if (!query) return true;
                  return normalizeSearch(guest.name).includes(query) ||
                    (location ? normalizeSearch(location.tableName).includes(query) : false);
                });
                if (!guests.length) return <p className="sp-muted">{t.noGuests}</p>;
                if (!visible.length) return <p className="sp-muted">{ac.noMatch}</p>;
                return (
                  <ul className="sp-guest-list">
                    {visible.map(guest => {
                      const location = guestLocations.get(guest.id);
                      const dragging = guestDrag?.active && guestDrag.guestId === guest.id;
                      const active = location && location.seatId === selectedSeat;
                      return (
                        <li
                          key={guest.id}
                          className={[
                            'sp-guest-row',
                            location ? 'assigned' : 'unassigned',
                            dragging ? 'dragging' : '',
                            active ? 'active' : '',
                          ].filter(Boolean).join(' ')}
                          onPointerDown={event => {
                            if ((event.target as Element).closest('button')) return;
                            event.preventDefault();
                            startGuestDrag(event, guest.id);
                          }}
                          onClick={event => {
                            if ((event.target as Element).closest('button')) return;
                            if (location) locateGuest(guest.id);
                            else if (selectedSeat && !assignmentBySeat.has(selectedSeat)) {
                              commitAssignment(assignGuestToSeat(plan, guest.id, selectedSeat, guests), guest.id, { seatId: selectedSeat });
                            }
                          }}
                          title={location ? ac.locate : undefined}
                        >
                          <span className="sp-guest-grip" aria-hidden="true" />
                          <span className="sp-guest-name">{guest.name}</span>
                          <span className={location ? 'sp-guest-status assigned' : 'sp-guest-status'}>
                            {location ? `${location.tableName} · ${location.seatNumber}` : t.unassigned}
                          </span>
                          {location && (
                            <button
                              type="button"
                              className="sp-table-guest-remove"
                              title={ac.unassign}
                              aria-label={`${ac.unassign}: ${guest.name}`}
                              onClick={() => unassignGuestById(guest.id)}
                            >×</button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>

            <div className="sp-guest-profile">
              <span className="sp-panel-label">
                {locale === 'ru' ? 'ПРОФИЛЬ ГОСТЯ' : locale === 'az' ? 'QONAQ PROFİLİ' : 'GUEST PROFILE'}
              </span>

              <select value={profileGuestId} onChange={event => {
                setProfileGuestId(event.target.value);
                setPreferredNeighborDraft('');
                setExcludedNeighborDraft('');
              }}>
                <option value="">{locale === 'ru' ? 'Выберите гостя…' : locale === 'az' ? 'Qonaq seçin…' : 'Select guest…'}</option>
                {guests.map(guest => <option key={guest.id} value={guest.id}>{guest.name}</option>)}
              </select>

              {profileGuestId && (() => {
                const profile = plan.guestProfiles?.[profileGuestId] ?? {
                  side: 'shared' as const,
                  group: 'other',
                  requiredNeighbors: [],
      preferredNeighbors: [],
                  excludedNeighbors: [],
                  isVip: false,
                  accessibility: false,
                };
                const others = guests.filter(guest => guest.id !== profileGuestId);
                const tr = locale === 'ru' ? {
                  side: 'Сторона', bride: 'Невеста', groom: 'Жених', shared: 'Общие',
                  group: 'Группа', family: 'Семья', friends: 'Друзья', colleagues: 'Коллеги', other: 'Другое',
                  preferred: 'Желательные соседи', excluded: 'Не сажать рядом', choose: 'Выберите гостя',
                  vip: 'VIP-гость', access: 'Требуется доступное место', add: 'Добавить', remove: 'Удалить',
                } : locale === 'az' ? {
                  side: 'Tərəf', bride: 'Gəlin tərəfi', groom: 'Bəy tərəfi', shared: 'Ümumi',
                  group: 'Qrup', family: 'Ailə', friends: 'Dostlar', colleagues: 'Həmkarlar', other: 'Digər',
                  preferred: 'Üstünlük verilən qonşular', excluded: 'Yanında oturmamalıdır', choose: 'Qonaq seçin',
                  vip: 'VIP qonaq', access: 'Əlçatan yer tələb olunur', add: 'Əlavə et', remove: 'Sil',
                } : {
                  side: 'Side', bride: 'Bride', groom: 'Groom', shared: 'Shared',
                  group: 'Group', family: 'Family', friends: 'Friends', colleagues: 'Colleagues', other: 'Other',
                  preferred: 'Preferred neighbors', excluded: 'Keep apart', choose: 'Select a guest',
                  vip: 'VIP guest', access: 'Accessibility requirements', add: 'Add', remove: 'Remove',
                };

                const updateNeighbors = (
                  field: 'preferredNeighbors' | 'excludedNeighbors',
                  guestId: string,
                  add: boolean
                ) => {
                  const current = profile[field];
                  updateGuestProfile(profileGuestId, {
                    [field]: add ? [...current, guestId] : current.filter(id => id !== guestId),
                  });
                };

                return (
                  <div className="sp-fields">
                    <label>{tr.side}
                      <select value={profile.side} onChange={event =>
                        updateGuestProfile(profileGuestId, {
                          side: event.target.value as GuestSeatingProfile['side'],
                        })
                      }>
                        <option value="bride">{tr.bride}</option>
                        <option value="groom">{tr.groom}</option>
                        <option value="shared">{tr.shared}</option>
                      </select>
                    </label>

                    <label>{tr.group}
                      <select value={profile.group} onChange={event =>
                        updateGuestProfile(profileGuestId, { group: event.target.value })
                      }>
                        <option value="family">{tr.family}</option>
                        <option value="friends">{tr.friends}</option>
                        <option value="colleagues">{tr.colleagues}</option>
                        <option value="other">{tr.other}</option>
                        {(plan.guestGroups ?? []).map(group =>
                          <option key={group.id} value={group.id}>{group.name}</option>
                        )}
                      </select>
                    </label>

                    {([
                      { field: 'preferredNeighbors' as const, title: tr.preferred, draft: preferredNeighborDraft, setDraft: setPreferredNeighborDraft },
                      { field: 'excludedNeighbors' as const, title: tr.excluded, draft: excludedNeighborDraft, setDraft: setExcludedNeighborDraft },
                    ]).map(list => {
                      const available = others.filter(guest => !profile[list.field].includes(guest.id));
                      return (
                        <div className="sp-neighbor-editor" key={list.field}>
                          <strong>{list.title}</strong>
                          <div className="sp-neighbor-add">
                            <select value={list.draft} onChange={event => list.setDraft(event.target.value)}>
                              <option value="">{tr.choose}</option>
                              {available.map(guest => <option key={guest.id} value={guest.id}>{guest.name}</option>)}
                            </select>
                            <button type="button" disabled={!list.draft} onClick={() => {
                              updateNeighbors(list.field, list.draft, true);
                              list.setDraft('');
                            }}>+</button>
                          </div>
                          <div className="sp-neighbor-list">
                            {profile[list.field].map(id => {
                              const guest = guests.find(item => item.id === id);
                              if (!guest) return null;
                              return (
                                <div className="sp-neighbor-chip" key={id}>
                                  <span>{guest.name}</span>
                                  <button type="button" onClick={() => updateNeighbors(list.field, id, false)}>×</button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    <label className="sp-profile-check">
                      <input type="checkbox" checked={profile.isVip}
                        onChange={event => updateGuestProfile(profileGuestId, { isVip: event.target.checked })} />
                      {tr.vip}
                    </label>
                    <label className="sp-profile-check">
                      <input type="checkbox" checked={profile.accessibility}
                        onChange={event => updateGuestProfile(profileGuestId, { accessibility: event.target.checked })} />
                      {tr.access}
                    </label>
                  </div>
                );
              })()}

              <div className="sp-custom-groups">
                <strong className="sp-panel-label">
                  {locale === 'ru' ? 'СОБСТВЕННЫЕ ГРУППЫ' : locale === 'az' ? 'XÜSUSİ QRUPLAR' : 'CUSTOM GROUPS'}
                </strong>
                <div className="sp-neighbor-add sp-group-create">
                  <input
                    value={newGuestGroupName}
                    placeholder={locale === 'ru' ? 'Название группы' : locale === 'az' ? 'Qrupun adı' : 'Group name'}
                    onChange={event => setNewGuestGroupName(event.target.value)}
                  />
                  <button type="button" disabled={!newGuestGroupName.trim()} onClick={() => {
                    const name = newGuestGroupName.trim();
                    if (!name) return;
                    updatePlan({
                      ...plan,
                      guestGroups: [...(plan.guestGroups ?? []), { id: uid(), name }],
                    });
                    setNewGuestGroupName('');
                  }}>+</button>
                </div>

                {(plan.guestGroups ?? []).map(group => (
                  <div className="sp-custom-group-row" key={group.id}>
                    <input value={group.name} onChange={event => updatePlan({
                      ...plan,
                      guestGroups: plan.guestGroups.map(item =>
                        item.id === group.id ? { ...item, name: event.target.value } : item
                      ),
                    })} />
                    <button type="button" onClick={() => updatePlan({
                      ...plan,
                      guestGroups: plan.guestGroups.filter(item => item.id !== group.id),
                      guestProfiles: Object.fromEntries(
                        Object.entries(plan.guestProfiles).map(([id, value]) => [
                          id, value.group === group.id ? { ...value, group: 'other' } : value,
                        ])
                      ),
                    })}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </aside>
      </div>

      {showAutoSeating && (
        <div className="sp-auto-overlay" onMouseDown={event => {
          if (event.target === event.currentTarget) setShowAutoSeating(false);
        }}>
          <section className="sp-auto-dialog" role="dialog" aria-modal="true">
            <header className="sp-auto-header">
              <div>
                <span className="sp-panel-label">ELARIO / SMART PLANNER</span>
                <h2>{locale === 'ru' ? 'Варианты рассадки' : locale === 'az' ? 'Yerləşdirmə variantları' : 'Seating proposals'}</h2>
                <p>{locale === 'ru' ? 'Текущая рассадка не изменится, пока ты не нажмёшь «Применить».' : locale === 'az' ? 'Tətbiq etməyənə qədər hazırkı yerləşdirmə dəyişməyəcək.' : 'Your current seating stays unchanged until you apply a proposal.'}</p>
              </div>
              <button type="button" className="sp-auto-close" onClick={() => setShowAutoSeating(false)}>×</button>
            </header>
            <div className="sp-auto-summary">
              <span>{guests.length} {locale === 'ru' ? 'гостей' : locale === 'az' ? 'qonaq' : 'guests'}</span>
              <span>{plan.objects.filter(isTable).reduce((sum, item) => sum + (item.capacity ?? 8), 0)} {locale === 'ru' ? 'мест' : locale === 'az' ? 'yer' : 'seats'}</span>
            </div>
            <label className="sp-auto-keep">
              <input
                type="checkbox"
                checked={keepExistingSeats}
                onChange={event => {
                  setKeepExistingSeats(event.target.checked);
                  openAutoSeating(event.target.checked);
                }}
              />
              {ac.keepExisting}
            </label>
            <div className="sp-auto-cards">
              {autoProposals.map((proposal, index) => (
                <article className="sp-auto-card" key={proposal.id}>
                  <div className="sp-auto-card-top">
                    <span className="sp-auto-number">0{index + 1}</span>
                    <div>
                      <h3>{ac.titles[proposal.variant]}</h3>
                      <span className="sp-auto-score">{locale === 'ru' ? 'Оценка' : locale === 'az' ? 'Qiymət' : 'Score'}: {proposal.score}</span>
                    </div>
                  </div>
                  <div className="sp-auto-stats">
                    <strong>{proposal.seated} / {guests.length}</strong>
                    <span>{locale === 'ru' ? 'рассажено' : locale === 'az' ? 'yerləşdirilib' : 'seated'}</span>
                    <span>{proposal.kept} {ac.kept} · {proposal.added} {ac.added}</span>
                  </div>
                  {proposal.unseated.length > 0
                    ? <p className="sp-auto-warning">{proposal.unseated.length} {locale === 'ru' ? 'гостей без места' : locale === 'az' ? 'qonaq üçün yer yoxdur' : 'guests without seats'}</p>
                    : <p className="sp-auto-ok">{locale === 'ru' ? 'Все гости получили места' : locale === 'az' ? 'Bütün qonaqlara yer ayrılıb' : 'Everyone has a seat'}</p>}
                  {proposal.issues.length > 0 && (
                    <ul className="sp-auto-issues">
                      {proposal.issues.map(issue => (
                        <li key={issue.code + issue.guestIds.join()}>
                          <span>{proposalIssueCopy[locale][issue.code]}</span>
                          <small>
                            {issue.guestIds.slice(0, 4).map(guestName).join(', ')}
                            {issue.guestIds.length > 4 ? ` +${issue.guestIds.length - 4}` : ''}
                          </small>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" className="sp-primary sp-wide" onClick={() => applyAutoSeating(proposal)}>
                    {locale === 'ru' ? 'Применить вариант' : locale === 'az' ? 'Variantı tətbiq et' : 'Apply proposal'}
                  </button>
                </article>
              ))}
            </div>
            <footer className="sp-auto-footer">
              <span>{locale === 'ru' ? 'Можно отменить через Undo.' : locale === 'az' ? 'Geri al ilə ləğv edə bilərsiniz.' : 'You can undo this change.'}</span>
              <button type="button" className="sp-secondary" onClick={() => openAutoSeating()}>{locale === 'ru' ? 'Пересчитать' : locale === 'az' ? 'Yenidən hesabla' : 'Regenerate'}</button>
            </footer>
          </section>
        </div>
      )}

      {showValidation && (
        <div className="sp-auto-overlay" onMouseDown={event => {
          if (event.target === event.currentTarget) setShowValidation(false);
        }}>
          <section className="sp-auto-dialog sp-validation-dialog" role="dialog" aria-modal="true" aria-label={ac.validation}>
            <header className="sp-auto-header">
              <div>
                <span className="sp-panel-label">ELARIO / SEATING CHECK</span>
                <h2>{ac.validation}</h2>
                <p>{ac.validationIntro}</p>
              </div>
              <button type="button" className="sp-auto-close" onClick={() => setShowValidation(false)}>×</button>
            </header>
            <div className="sp-auto-summary">
              <span>{guestLocations.size} / {guests.length} {locale === 'ru' ? 'рассажено' : locale === 'az' ? 'yerləşdirilib' : 'seated'}</span>
              <span>{validationErrors.length} {ac.errors}</span>
              <span>{validationIssues.length - validationErrors.length} {ac.warnings}</span>
            </div>
            {validationIssues.length === 0 ? (
              <p className="sp-auto-ok">{ac.allGood}</p>
            ) : (
              <ul className="sp-validation-list">
                {validationIssues.map((issue, index) => {
                  const table = issue.tableId ? plan.objects.find(item => item.id === issue.tableId)?.name ?? '' : '';
                  const canFocus = Boolean(
                    (issue.tableId && plan.objects.some(item => item.id === issue.tableId)) ||
                    (issue.guestIds.length && guestLocations.has(issue.guestIds[0])) ||
                    issue.code === 'unassigned-guest',
                  );
                  return (
                    <li key={`${issue.code}-${index}`} className={`sp-validation-item ${issue.severity}`}>
                      <div>
                        <strong>{issueCopy[locale][issue.code](issue, table)}</strong>
                        {issue.guestIds.length > 0 && (
                          <span>
                            {issue.guestIds.slice(0, 6).map(guestName).join(', ')}
                            {issue.guestIds.length > 6 ? ` +${issue.guestIds.length - 6}` : ''}
                          </span>
                        )}
                      </div>
                      {canFocus && (
                        <button type="button" className="sp-secondary" onClick={() => focusIssue(issue)}>{ac.show}</button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {validationErrors.length > 0 && (
              <footer className="sp-auto-footer">
                <span>{ac.fixHint}</span>
                <button type="button" className="sp-primary" onClick={fixInvalidAssignments}>{ac.fix}</button>
              </footer>
            )}
          </section>
        </div>
      )}

      {guestDrag?.active && (() => {
        const preview = dropPreview();
        return (
          <div
            className={preview ? (preview.ok ? 'sp-drag-ghost ok' : 'sp-drag-ghost blocked') : 'sp-drag-ghost'}
            style={{ left: guestDrag.x, top: guestDrag.y }}
            aria-hidden="true"
          >
            <strong>{guestName(guestDrag.guestId)}</strong>
            {preview && <span>{preview.text}</span>}
          </div>
        );
      })()}

      {notice && (
        <p key={notice.id} className={`sp-notice ${notice.tone}`} role="status">{notice.text}</p>
      )}

      {error && <p className="sp-error">{error}</p>}

      {/* Phones: the guest panel sits far below the canvas, so a tapped seat
          gets a compact assign sheet pinned above the tab bar (hidden on desktop). */}
      {selectedSeat && (() => {
        const location = locateSeat(plan, selectedSeat);
        if (!location) return null;
        const occupantId = assignmentBySeat.get(selectedSeat);
        return (
          <div className="sp-seat-sheet" role="dialog" aria-label={ui.seatSheet}>
            <div className="sp-seat-sheet-head">
              <div>
                <small>{ui.seatSheet}</small>
                <strong>{location.table.name} · {ac.seat} {location.index + 1}</strong>
                <span>{occupantId ? guestName(occupantId) : t.unassigned}</span>
              </div>
              <button type="button" className="sp-seat-sheet-close" aria-label={ui.close}
                onClick={() => setSelectedSeat(null)}>×</button>
            </div>
            {occupantId ? (
              <button type="button" className="sp-secondary sp-wide" onClick={unassignSeat}>{t.removeGuest}</button>
            ) : unassigned.length === 0 ? (
              <p className="sp-muted">{t.noGuests}</p>
            ) : (
              <div className="sp-seat-sheet-assign">
                <select value={selectedGuest} onChange={event => setSelectedGuest(event.target.value)} aria-label={t.assign}>
                  <option value="">{t.unassigned}</option>
                  {unassigned.map(guest => <option key={guest.id} value={guest.id}>{guest.name}</option>)}
                </select>
                <button type="button" className="sp-primary" onClick={assignGuest} disabled={!selectedGuest}>{t.assign}</button>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
