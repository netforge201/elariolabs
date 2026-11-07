'use client';


import Link from "next/link"; import type { SeatingGuest, SeatingObject, SeatingPlanV2 } from '@/lib/seating-types';

type Locale = 'az' | 'ru' | 'en';

type Props = {
  locale: Locale;
  couple: string;
  guests: SeatingGuest[];
  plan: SeatingPlanV2;
};

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

export default function SeatingPrintReport({ locale, couple, guests, plan }: Props) {
  const words = {
    ru: {
      title: 'План рассадки гостей',
      subtitle: 'Свадебный план зала',
      floor: 'Схема зала',
      tables: 'Списки гостей по столам',
      table: 'Стол',
      seat: 'Место',
      guest: 'Гость',
      alphabetic: 'Алфавитный список гостей',
      unassigned: 'Гости без назначенных мест',
      noUnassigned: 'Все гости распределены по местам.',
      emptyTable: 'Пока нет назначенных гостей.',
      print: 'Сохранить как PDF / Печать',
      back: 'Вернуться к редактору',
      total: 'Всего гостей',
      assigned: 'Рассажено',
      remaining: 'Без места',
      generated: 'Отчёт сформирован',
      pageHint: 'В диалоге печати выберите «Сохранить как PDF».',
    },
    en: {
      title: 'Guest Seating Plan',
      subtitle: 'Wedding venue layout',
      floor: 'Venue floor plan',
      tables: 'Guest lists by table',
      table: 'Table',
      seat: 'Seat',
      guest: 'Guest',
      alphabetic: 'Alphabetical guest list',
      unassigned: 'Guests without assigned seats',
      noUnassigned: 'All guests have been assigned.',
      emptyTable: 'No guests assigned yet.',
      print: 'Save as PDF / Print',
      back: 'Back to editor',
      total: 'Total guests',
      assigned: 'Assigned',
      remaining: 'Unassigned',
      generated: 'Report generated',
      pageHint: 'Choose “Save as PDF” in the print dialog.',
    },
    az: {
      title: 'Qonaqların oturma planı',
      subtitle: 'Toy zalının planı',
      floor: 'Zalın sxemi',
      tables: 'Masalar üzrə qonaq siyahısı',
      table: 'Masa',
      seat: 'Yer',
      guest: 'Qonaq',
      alphabetic: 'Qonaqların əlifba sırası ilə siyahısı',
      unassigned: 'Yeri təyin edilməmiş qonaqlar',
      noUnassigned: 'Bütün qonaqlar yerləşdirilib.',
      emptyTable: 'Hələ qonaq təyin edilməyib.',
      print: 'PDF kimi saxla / Çap et',
      back: 'Redaktora qayıt',
      total: 'Qonaqların sayı',
      assigned: 'Yerləşdirilib',
      remaining: 'Yersiz',
      generated: 'Hesabatın tarixi',
      pageHint: 'Çap pəncərəsində “PDF kimi saxla” seçin.',
    },
  }[locale];

  const tableObjects = plan.objects.filter(isTable);

  const assignmentDetails = plan.assignments.map(assignment => {
    const match = assignment.seatId.match(/^(.*)-seat-(\d+)$/);
    const table = match
      ? tableObjects.find(item => item.id === match[1])
      : undefined;
    const guest = guests.find(item => item.id === assignment.guestId);

    if (!table || !guest || !match) return null;

    return {
      guest,
      table,
      seatNumber: Number(match[2]) + 1,
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  const assignedIds = new Set(assignmentDetails.map(item => item.guest.id));
  const unassigned = guests
    .filter(guest => !assignedIds.has(guest.id))
    .sort((a, b) => compareNames(a.name, b.name, locale));

  const alphabetic = [...assignmentDetails].sort((a, b) =>
    compareNames(a.guest.name, b.guest.name, locale)
  );

  const occupiedTables = tableObjects
    .map(table => ({
      table,
      rows: assignmentDetails
        .filter(item => item.table.id === table.id)
        .sort((a, b) => a.seatNumber - b.seatNumber),
    }))
    .filter(item => item.rows.length > 0);

  const assignedCount = assignmentDetails.length;

  return (
    <div className="seating-report">
      <div className="seating-report-actions no-print">
        <Link href="/dashboard/seating">{words.back}</Link>
        <button type="button" onClick={() => window.print()}>
          {words.print}
        </button>
        <span>{words.pageHint}</span>
      </div>

      <article className="seating-report-document">
        <header className="seating-report-header">
          <span>ELARIO / WEDDING STUDIO</span>
          <h1>{words.title}</h1>
          <p>{couple}</p>
          <small suppressHydrationWarning>{words.generated}: {formatGeneratedDate(new Date())}</small>
        </header>

        <section className="seating-report-section seating-floor-section">
          <h2>{words.floor}</h2>
          <div className="seating-report-floor">
            <svg
              viewBox={`0 0 ${plan.venue.width} ${plan.venue.height}`}
              role="img"
              aria-label={words.floor}
            >
              <rect
                x="0"
                y="0"
                width={plan.venue.width}
                height={plan.venue.height}
                fill="#fbfaf8"
              />

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

              <rect
                x="0"
                y="0"
                width={plan.venue.width}
                height={plan.venue.height}
                fill="none"
                stroke="#ded8d2"
                strokeWidth="3"
                strokeDasharray="10 8"
              />

              {plan.objects.map(object => {
                const table = isTable(object);
                const cx = object.x + object.width / 2;
                const cy = object.y + object.height / 2;

                const fill = object.type === 'dancefloor' ? '#f0e8ec'
                  : object.type === 'stage' ? '#eee9e3'
                  : table ? '#fff' : '#e9e5e0';

                return (
                  <g
                    key={object.id}
                    transform={`rotate(${object.rotation} ${cx} ${cy})`}
                  >
                    {object.type === 'column' ? (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={Math.min(object.width, object.height) / 2}
                        fill="#d5cec7"
                        stroke="#a99e96"
                        strokeWidth="2"
                      />
                    ) : (
                      <rect
                        x={object.x}
                        y={object.y}
                        width={object.width}
                        height={object.height}
                        rx={
                          table && object.type === 'round-table'
                            ? object.width / 2
                            : object.type === 'oval-table'
                              ? object.height / 2
                              : 8
                        }
                        fill={object.type === 'wall' ? '#77716c' : fill}
                        stroke="#bdb3ad"
                        strokeWidth="2"
                      />
                    )}

                    {table ? (
                      <>
                        <text
                          x={cx}
                          y={cy - 7}
                          textAnchor="middle"
                          fontSize="17"
                          fontWeight="600"
                          fill="#514944"
                        >
                          {object.name}
                        </text>
                        <text
                          x={cx}
                          y={cy + 14}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#928781"
                        >
                          {assignmentDetails.filter(item => item.table.id === object.id).length}/{object.capacity ?? 8}
                        </text>
                      </>
                    ) : object.type !== 'wall' && (
                      <text
                        x={cx}
                        y={cy + 5}
                        textAnchor="middle"
                        fontSize="14"
                        fill="#6e655e"
                      >
                        {object.name}
                      </text>
                    )}
                  </g>
                );
              })}

              {tableObjects.flatMap(table =>
                Array.from({ length: table.capacity ?? 8 }, (_, index) => {
                  const point = seatPoint(table, index);
                  const seatId = `${table.id}-seat-${index}`;
                  const assignment = assignmentDetails.find(
                    item => item.table.id === table.id && item.seatNumber === index + 1
                  );
                  const label = assignment
                    ? assignment.guest.name.trim().slice(0, 1).toUpperCase()
                    : String(index + 1);

                  return (
                    <g key={seatId}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="11"
                        fill={assignment ? '#9c8290' : '#fff'}
                        stroke="#a99aa0"
                        strokeWidth="1.5"
                      />
                      <text
                        x={point.x}
                        y={point.y + 3.5}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="600"
                        fill={assignment ? '#fff' : '#625a55'}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
          </div>
          <div className="seating-report-summary">
            <span>{words.total}: <strong>{guests.length}</strong></span>
            <span>{words.assigned}: <strong>{assignedCount}</strong></span>
            <span>{words.remaining}: <strong>{unassigned.length}</strong></span>
          </div>
        </section>

        <section className="seating-report-section seating-tables-section">
          <h2>{words.tables}</h2>
          {occupiedTables.length ? (
            <div className="seating-report-tables-grid">
              {occupiedTables.map(({ table, rows }) => (
                <div className="seating-report-table" key={table.id}>
                  <h3>{table.name}</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>{words.seat}</th>
                        <th>{words.guest}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(row => (
                        <tr key={row.guest.id}>
                          <td>{row.seatNumber}</td>
                          <td>{row.guest.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ) : (
            <p>{words.emptyTable}</p>
          )}
        </section>

        <section className="seating-report-section seating-alphabetic-section">
          <h2>{words.alphabetic}</h2>
          <table>
            <thead>
              <tr>
                <th>{words.guest}</th>
                <th>{words.table}</th>
                <th>{words.seat}</th>
              </tr>
            </thead>
            <tbody>
              {alphabetic.map(item => (
                <tr key={item.guest.id}>
                  <td>{item.guest.name}</td>
                  <td>{item.table.name}</td>
                  <td>{item.seatNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {unassigned.length > 0 && (
          <section className="seating-report-section seating-unassigned-section">
            <h2>{words.unassigned}</h2>
            <table>
              <thead>
                <tr><th>#</th><th>{words.guest}</th></tr>
              </thead>
              <tbody>
                {unassigned.map((guest, index) => (
                  <tr key={guest.id}>
                    <td>{index + 1}</td>
                    <td>{guest.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="seating-report-footer">
          ELARIO WEDDING STUDIO · {couple}
        </footer>
      </article>
    </div>
  );
}

/** Same output on the server (Node ICU) and in every browser: dd.mm.yyyy in Baku time. */
function formatGeneratedDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Baku',
  }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return `${get('day')}.${get('month')}.${get('year')}`;
}

// Browsers ship without Azerbaijani collation while Node has it, so localeCompare(…, 'az')
// sorts differently on server and client. Sort by the Azerbaijani alphabet explicitly.
const AZ_ALPHABET = 'aAbBcCçÇdDeEəƏfFgGğĞhHxXıIiİjJkKqQlLmMnNoOöÖpPrRsSşŞtTuUüÜvVyYzZ';
function azKey(value: string) {
  return Array.from(value.trim(), ch => {
    const index = AZ_ALPHABET.indexOf(ch);
    if (index !== -1) return String.fromCharCode(0x100 + Math.floor(index / 2));
    return /\s/.test(ch) ? ' ' : String.fromCharCode(0x200 + (ch.codePointAt(0) ?? 0));
  }).join('');
}
function compareNames(a: string, b: string, locale: string) {
  if (locale !== 'az') return a.localeCompare(b, locale);
  const ka = azKey(a), kb = azKey(b);
  return ka < kb ? -1 : ka > kb ? 1 : 0;
}
