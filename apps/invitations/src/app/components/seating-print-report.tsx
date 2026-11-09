'use client';

import './seating-print.css';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { SeatingObject, SeatingPlanV2 } from '@/lib/seating-types';
import type { Locale } from './invitation/catalog';
import { formatDateParts } from './invitation/event-time';
import { PRINT_SECTIONS, printOptionsQuery, type PrintOptions, type PrintSection } from './seating-print-options';

export type PrintGuest = {
  id: string;
  name: string;
  inviteName: string | null;
  gender: 'male' | 'female' | null;
  withFamily: boolean;
  rsvpEnabled: boolean;
  rsvpStatus: 'yes' | 'no' | null;
  rsvpGuests: number | null;
};

type Props = {
  locale: Locale;
  /** Language of the invitation — decides "bəy" / "xanım" on place cards. */
  inviteLocale: Locale;
  couple: string;
  eventDay: string | null;
  eventTime: string | null;
  venueName: string | null;
  guests: PrintGuest[];
  plan: SeatingPlanV2;
  initialOptions: PrintOptions;
};

const WORDS = {
  az: {
    title: 'Qonaqların oturma planı', plan: 'Zalın sxemi', tables: 'Masalar', index: 'Əlifba göstəricisi',
    indexHint: 'Girişdə qonağı tez tapmaq üçün', unseated: 'Yeri təyin edilməmiş qonaqlar', allSeated: 'Bütün qonaqlar yerləşdirilib.',
    tableCards: 'Masa nömrələri', placeCards: 'Ad kartları', table: 'Masa', seat: 'Yer', seatShort: 'yer', guest: 'Qonaq',
    invitations: 'Dəvətnamə', seated: 'Yerləşdirilib', notSeated: 'Yersiz', tablesCount: 'Masa', seats: 'yer', free: 'boş',
    coming: 'Gələcək', declined: 'Gəlməyəcək', pending: 'Cavab gözlənilir', rsvpOff: 'RSVP bağlı', people: 'nəfər',
    invitationsShort: 'dəvətnamə', family: 'ailə ilə', expected: 'Gözlənilir', emptyTable: 'Boş masa', freeSeats: 'boş yer',
    warnDeclined: 'Gəlməyəcəyini bildirib, amma yeri saxlanılıb', contents: 'Tərkib', generated: 'Tarix', page: 'səh.',
    taken: 'Tutulub', freeLegend: 'Boş', print: 'PDF kimi saxla', back: 'Redaktora qayıt',
    hint: 'Çap pəncərəsində “PDF kimi saxla” seçin.', include: 'Daxil et', paper: 'Kağız', namesLabel: 'Adlar',
    namesInvite: 'Dəvətnamədəki ad', namesNick: 'Ləqəb', rsvpLabel: 'RSVP', on: 'Göstər', off: 'Gizlət',
    noSections: 'Ən azı bir bölmə seçin.', cut: 'Kəsik xətti üzrə kəsin', noTables: 'Planda hələ masa yoxdur.',
    sections: { summary: 'Xülasə', plan: 'Zalın sxemi', tables: 'Masalar', index: 'Əlifba göstəricisi', unseated: 'Yersiz qonaqlar', tablecards: 'Masa nömrələri', placecards: 'Ad kartları' },
  },
  ru: {
    title: 'План рассадки гостей', plan: 'Схема зала', tables: 'Столы', index: 'Алфавитный указатель',
    indexHint: 'Чтобы быстро найти гостя на входе', unseated: 'Гости без места', allSeated: 'Все гости рассажены.',
    tableCards: 'Номера столов', placeCards: 'Именные карточки', table: 'Стол', seat: 'Место', seatShort: 'место', guest: 'Гость',
    invitations: 'Приглашений', seated: 'Рассажено', notSeated: 'Без места', tablesCount: 'Столов', seats: 'мест', free: 'свободно',
    coming: 'Придут', declined: 'Не придут', pending: 'Ждём ответа', rsvpOff: 'RSVP выключен', people: 'чел.',
    invitationsShort: 'приглаш.', family: 'с семьёй', expected: 'Ожидается', emptyTable: 'Пустой стол', freeSeats: 'свободных мест',
    warnDeclined: 'Отказались (RSVP), но место за ними занято', contents: 'Содержание', generated: 'Дата', page: 'стр.',
    taken: 'Занято', freeLegend: 'Свободно', print: 'Сохранить PDF', back: 'Вернуться к редактору',
    hint: 'В окне печати выберите «Сохранить как PDF».', include: 'Включить', paper: 'Бумага', namesLabel: 'Имена',
    namesInvite: 'Имя из приглашения', namesNick: 'Ник', rsvpLabel: 'RSVP', on: 'Показать', off: 'Скрыть',
    noSections: 'Выберите хотя бы один раздел.', cut: 'Разрежьте по пунктиру', noTables: 'На плане пока нет столов.',
    sections: { summary: 'Сводка', plan: 'Схема зала', tables: 'Столы', index: 'Алфавитный указатель', unseated: 'Гости без места', tablecards: 'Номера столов', placecards: 'Именные карточки' },
  },
  en: {
    title: 'Guest seating plan', plan: 'Floor plan', tables: 'Tables', index: 'Alphabetical index',
    indexHint: 'To find a guest quickly at the entrance', unseated: 'Guests without a seat', allSeated: 'Every guest has a seat.',
    tableCards: 'Table numbers', placeCards: 'Place cards', table: 'Table', seat: 'Seat', seatShort: 'seat', guest: 'Guest',
    invitations: 'Invitations', seated: 'Seated', notSeated: 'No seat', tablesCount: 'Tables', seats: 'seats', free: 'free',
    coming: 'Coming', declined: 'Not coming', pending: 'Awaiting reply', rsvpOff: 'RSVP off', people: 'people',
    invitationsShort: 'invitations', family: 'with family', expected: 'Expected', emptyTable: 'Empty table', freeSeats: 'free seats',
    warnDeclined: 'Declined (RSVP) but still holding a seat', contents: 'Contents', generated: 'Date', page: 'p.',
    taken: 'Taken', freeLegend: 'Free', print: 'Save as PDF', back: 'Back to editor',
    hint: 'Choose “Save as PDF” in the print dialog.', include: 'Include', paper: 'Paper', namesLabel: 'Names',
    namesInvite: 'Invitation name', namesNick: 'Nickname', rsvpLabel: 'RSVP', on: 'Show', off: 'Hide',
    noSections: 'Choose at least one section.', cut: 'Cut along the dashed lines', noTables: 'There are no tables on the plan yet.',
    sections: { summary: 'Summary', plan: 'Floor plan', tables: 'Tables', index: 'Alphabetical index', unseated: 'Guests without a seat', tablecards: 'Table numbers', placecards: 'Place cards' },
  },
} as const;

const TABLE_TYPES = ['round-table', 'rect-table', 'oval-table'];
const isTable = (object: SeatingObject) => TABLE_TYPES.includes(object.type);
const capacityOf = (table: SeatingObject) => table.capacity ?? 8;

type Seated = { guest: PrintGuest; table: SeatingObject; seat: number };

export default function SeatingPrintReport({
  locale, inviteLocale, couple, eventDay, eventTime, venueName, guests, plan, initialOptions,
}: Props) {
  const w = WORDS[locale];
  const [options, setOptions] = useState<PrintOptions>(initialOptions);

  // Keep the choices in the URL so a reload or a shared link reproduces the same PDF.
  useEffect(() => {
    window.history.replaceState(null, '', printOptionsQuery(options));
  }, [options]);

  const has = (section: PrintSection) => options.sections.includes(section);
  const shown = (guest: PrintGuest) => (options.names === 'invite' ? guest.inviteName?.trim() || guest.name : guest.name);

  const data = useMemo(() => {
    const tables = plan.objects.filter(isTable).sort((a, b) => naturalCompare(a.name, b.name, locale));
    const tableById = new Map(tables.map(table => [table.id, table]));
    const guestById = new Map(guests.map(guest => [guest.id, guest]));

    // Only seats that still exist (table present, index within capacity), one seat per guest.
    const seated: Seated[] = [];
    const seen = new Set<string>();
    for (const assignment of plan.assignments) {
      const match = assignment.seatId.match(/^(.*)-seat-(\d+)$/);
      const table = match ? tableById.get(match[1]) : undefined;
      const guest = guestById.get(assignment.guestId);
      const index = match ? Number(match[2]) : -1;
      if (!table || !guest || index < 0 || index >= capacityOf(table) || seen.has(guest.id)) continue;
      seen.add(guest.id);
      seated.push({ guest, table, seat: index + 1 });
    }

    const byTable = new Map<string, Seated[]>();
    for (const row of seated) byTable.set(row.table.id, [...(byTable.get(row.table.id) ?? []), row]);
    for (const rows of byTable.values()) rows.sort((a, b) => a.seat - b.seat);

    const seatOf = new Map(seated.map(row => [row.guest.id, row]));
    const unseated = guests.filter(guest => !seatOf.has(guest.id));
    const totalSeats = tables.reduce((sum, table) => sum + capacityOf(table), 0);

    const rsvpOn = guests.filter(g => g.rsvpEnabled);
    const yes = rsvpOn.filter(g => g.rsvpStatus === 'yes');
    const rsvp = {
      any: rsvpOn.length > 0,
      yesInvites: yes.length,
      yesPeople: yes.reduce((sum, g) => sum + (g.rsvpGuests ?? 1), 0),
      no: rsvpOn.filter(g => g.rsvpStatus === 'no').length,
      pending: rsvpOn.filter(g => !g.rsvpStatus).length,
      off: guests.length - rsvpOn.length,
    };
    const declinedSeated = seated.filter(row => row.guest.rsvpEnabled && row.guest.rsvpStatus === 'no');

    return { tables, seated, byTable, seatOf, unseated, totalSeats, rsvp, declinedSeated };
  }, [plan, guests, locale]);

  const sortedGuests = useMemo(
    () => [...guests].sort((a, b) => compareNames(shown(a), shown(b), locale)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `shown` depends only on options.names
    [guests, locale, options.names],
  );

  const date = eventDay ? formatDateParts(eventDay, locale) : null;
  const eventLine = [date ? `${date.weekday}, ${date.full}` : null, eventTime, venueName].filter(Boolean).join(' · ');
  const showRsvp = options.rsvp && data.rsvp.any;

  const footer = `${couple} · ${w.title}`.replace(/[\\"]/g, '\\$&').replace(/\s+/g, ' ');
  const size = options.paper === 'a3' ? 'A3' : 'A4';
  const pageCss = `
@page { size: ${size}; margin: 14mm 12mm 16mm;
  @bottom-left { content: "${footer}"; font: 8pt 'DM Sans', system-ui, sans-serif; color: #6b7d73; }
  @bottom-right { content: "${w.page} " counter(page) " / " counter(pages); font: 8pt 'DM Sans', system-ui, sans-serif; color: #6b7d73; }
}
@page plan { size: ${size} landscape; margin: 10mm 10mm 14mm; }
@page cards { margin: 8mm; @bottom-left { content: none; } @bottom-right { content: none; } }`;

  function toggleSection(section: PrintSection) {
    setOptions(o => ({
      ...o,
      sections: o.sections.includes(section) ? o.sections.filter(s => s !== section) : [...o.sections, section],
    }));
  }

  function print() {
    void document.fonts.ready.then(() => window.print());
  }

  const placeName = (guest: PrintGuest) => {
    const name = shown(guest);
    if (inviteLocale !== 'az' || options.names !== 'invite') return name;
    return guest.gender === 'male' ? `${name} bəy` : guest.gender === 'female' ? `${name} xanım` : name;
  };

  const rsvpMark = (guest: PrintGuest) => {
    if (!showRsvp || !guest.rsvpEnabled) return null;
    if (guest.rsvpStatus === 'yes') return <span className="pr-mark is-yes">✓ {guest.rsvpGuests ?? 1}</span>;
    if (guest.rsvpStatus === 'no') return <span className="pr-mark is-no">✗</span>;
    return <span className="pr-mark is-pending">…</span>;
  };

  const tableCardPages = chunk(data.tables, 2);
  const placeCardPages = chunk([...data.seated].sort((a, b) => compareNames(shown(a.guest), shown(b.guest), locale)), 8);
  const indexGroups = groupByLetter(sortedGuests, shown);

  return (
    <div className={`pr-root pr-paper-${options.paper}`}>
      <style>{pageCss}</style>

      <aside className="pr-toolbar" aria-label={w.include}>
        <div className="pr-toolbar-row">
          <Link href="/dashboard/seating" className="pr-btn">← {w.back}</Link>
          <button type="button" className="pr-btn pr-btn--primary" onClick={print} disabled={options.sections.length === 0}>{w.print}</button>
          <span className="pr-hint">{w.hint}</span>
        </div>
        <fieldset className="pr-field">
          <legend>{w.include}</legend>
          <div className="pr-chips">
            {PRINT_SECTIONS.map(section => (
              <label key={section} className={`pr-chip ${has(section) ? 'is-on' : ''}`}>
                <input type="checkbox" checked={has(section)} onChange={() => toggleSection(section)} />
                {w.sections[section]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="pr-toolbar-row">
          <Segment label={w.paper} value={options.paper} onChange={paper => setOptions(o => ({ ...o, paper }))}
            items={[['a4', 'A4'], ['a3', 'A3']]} />
          <Segment label={w.namesLabel} value={options.names} onChange={names => setOptions(o => ({ ...o, names }))}
            items={[['invite', w.namesInvite], ['nick', w.namesNick]]} />
          {data.rsvp.any && (
            <Segment label={w.rsvpLabel} value={options.rsvp ? 'on' : 'off'} onChange={v => setOptions(o => ({ ...o, rsvp: v === 'on' }))}
              items={[['on', w.on], ['off', w.off]]} />
          )}
        </div>
        {options.sections.length === 0 && <p className="pr-warning" role="alert">{w.noSections}</p>}
      </aside>

      <div className="pr-document">
        {has('summary') && (
          <section className="pr-sheet pr-summary">
            <p className="pr-kicker">ELARIO</p>
            <h1>{w.title}</h1>
            <p className="pr-couple">{couple}</p>
            {eventLine && <p className="pr-event">{eventLine}</p>}

            <div className="pr-stats">
              <Stat label={w.invitations} value={guests.length} />
              <Stat label={w.seated} value={`${data.seated.length} / ${guests.length}`} />
              <Stat label={w.notSeated} value={data.unseated.length} tone={data.unseated.length ? 'warn' : undefined} />
              <Stat label={w.tablesCount} value={data.tables.length}
                note={`${data.totalSeats} ${w.seats} · ${Math.max(0, data.totalSeats - data.seated.length)} ${w.free}`} />
            </div>

            {showRsvp && (
              <>
                <h2 className="pr-h2">RSVP</h2>
                <div className="pr-stats">
                  <Stat label={w.coming} value={`${data.rsvp.yesPeople} ${w.people}`} note={`${data.rsvp.yesInvites} ${w.invitationsShort}`} tone="yes" />
                  <Stat label={w.declined} value={data.rsvp.no} tone={data.rsvp.no ? 'no' : undefined} />
                  <Stat label={w.pending} value={data.rsvp.pending} />
                  <Stat label={w.rsvpOff} value={data.rsvp.off} />
                </div>
              </>
            )}

            {showRsvp && data.declinedSeated.length > 0 && (
              <div className="pr-alert">
                <strong>{w.warnDeclined}: {data.declinedSeated.length}</strong>
                <ul>
                  {data.declinedSeated.map(row => (
                    <li key={row.guest.id}>{shown(row.guest)} — {row.table.name}, {w.seatShort} {row.seat}</li>
                  ))}
                </ul>
              </div>
            )}

            <h2 className="pr-h2">{w.contents}</h2>
            <ol className="pr-contents">
              {PRINT_SECTIONS.filter(s => s !== 'summary' && has(s)).map(s => <li key={s}>{w.sections[s]}</li>)}
            </ol>
            <p className="pr-generated" suppressHydrationWarning>{w.generated}: {formatGeneratedDate(new Date())}</p>
          </section>
        )}

        {has('plan') && (
          <section className="pr-sheet pr-plan">
            <header className="pr-section-head">
              <h2>{w.plan}</h2>
              <span className="pr-legend">
                <i className="is-taken" aria-hidden="true" />{w.taken}
                <i aria-hidden="true" />{w.freeLegend}
              </span>
            </header>
            <FloorPlan plan={plan} tables={data.tables} byTable={data.byTable} label={w.plan} />
          </section>
        )}

        {has('tables') && (
          <section className="pr-sheet">
            <header className="pr-section-head"><h2>{w.tables}</h2><span>{couple}</span></header>
            {data.tables.length === 0 ? <p className="pr-muted">{w.noTables}</p> : (
              <div className="pr-table-grid">
                {data.tables.map(table => {
                  const rows = data.byTable.get(table.id) ?? [];
                  const expected = rows.reduce((sum, r) => sum + (r.guest.rsvpEnabled && r.guest.rsvpStatus === 'yes' ? (r.guest.rsvpGuests ?? 1) : 0), 0);
                  return (
                    <article className="pr-table-card" key={table.id}>
                      <header>
                        <h3>{table.name}</h3>
                        <span className="pr-occupancy">{rows.length}/{capacityOf(table)}</span>
                      </header>
                      {rows.length === 0 ? <p className="pr-muted">{w.emptyTable}</p> : (
                        <table>
                          <tbody>
                            {rows.map(row => (
                              <tr key={row.guest.id}>
                                <td className="pr-seat-no">{row.seat}</td>
                                <td>
                                  {shown(row.guest)}
                                  {row.guest.withFamily && <span className="pr-tag">{w.family}</span>}
                                </td>
                                <td className="pr-mark-cell">{rsvpMark(row.guest)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      <footer>
                        {capacityOf(table) - rows.length > 0 && <span>{capacityOf(table) - rows.length} {w.freeSeats}</span>}
                        {showRsvp && expected > 0 && <span>{w.expected}: {expected} {w.people}</span>}
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {has('index') && (
          <section className="pr-sheet">
            <header className="pr-section-head"><h2>{w.index}</h2><span>{w.indexHint}</span></header>
            <div className="pr-index">
              {indexGroups.map(([letter, items]) => (
                <div className="pr-index-group" key={letter}>
                  <p className="pr-index-letter">{letter}</p>
                  {items.map(guest => {
                    const seat = data.seatOf.get(guest.id);
                    return (
                      <p className="pr-index-row" key={guest.id}>
                        <span className="pr-index-name">{shown(guest)}</span>
                        <span className="pr-index-dots" aria-hidden="true" />
                        <span className="pr-index-seat">{seat ? `${seat.table.name} · ${seat.seat}` : '—'}</span>
                      </p>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        )}

        {has('unseated') && (
          <section className={`pr-sheet ${has('index') ? 'pr-continue' : ''}`}>
            <header className="pr-section-head"><h2>{w.unseated}</h2><span>{data.unseated.length}</span></header>
            {data.unseated.length === 0 ? <p className="pr-muted">{w.allSeated}</p> : (
              <ol className="pr-unseated">
                {[...data.unseated].sort((a, b) => compareNames(shown(a), shown(b), locale)).map(guest => (
                  <li key={guest.id}>
                    {shown(guest)}
                    {guest.withFamily && <span className="pr-tag">{w.family}</span>}
                    {rsvpMark(guest)}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {has('tablecards') && tableCardPages.map((pair, pageIndex) => (
          <section className="pr-sheet pr-cards pr-tablecards" key={`tc-${pageIndex}`} aria-label={w.tableCards}>
            {pair.map(table => (
              <div className="pr-tablecard" key={table.id}>
                <p className="pr-tablecard-couple">{couple}</p>
                <p className="pr-tablecard-name">{table.name}</p>
                {date && <p className="pr-tablecard-date">{date.full}</p>}
              </div>
            ))}
          </section>
        ))}

        {has('placecards') && placeCardPages.map((cards, pageIndex) => (
          <section className="pr-sheet pr-cards pr-placecards" key={`pc-${pageIndex}`} aria-label={w.placeCards}>
            {cards.map(row => (
              <div className="pr-placecard" key={row.guest.id}>
                <p className="pr-placecard-name">{placeName(row.guest)}</p>
                <p className="pr-placecard-seat">{row.table.name} · {w.seatShort} {row.seat}</p>
                {row.guest.withFamily && <p className="pr-placecard-family">{w.family}</p>}
              </div>
            ))}
            {pageIndex === 0 && <p className="pr-cut-hint">{w.cut}</p>}
          </section>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Segment<T extends string>({ label, value, items, onChange }: {
  label: string; value: T; items: [T, string][]; onChange: (value: T) => void;
}) {
  return (
    <div className="pr-field">
      <span className="pr-field-label">{label}</span>
      <div className="pr-segment" role="radiogroup" aria-label={label}>
        {items.map(([id, text]) => (
          <button key={id} type="button" role="radio" aria-checked={value === id}
            className={value === id ? 'is-on' : ''} onClick={() => onChange(id)}>{text}</button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, note, tone }: { label: string; value: string | number; note?: string; tone?: 'yes' | 'no' | 'warn' }) {
  return (
    <div className={`pr-stat ${tone ? `is-${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function FloorPlan({ plan, tables, byTable, label }: {
  plan: SeatingPlanV2; tables: SeatingObject[]; byTable: Map<string, Seated[]>; label: string;
}) {
  // Sizes follow the venue size so seat numbers stay legible however big the hall is.
  const unit = Math.max(1, Math.max(plan.venue.width, plan.venue.height) / 1400);
  const seatR = 13 * unit;
  return (
    <div className="pr-floor">
      <svg viewBox={`0 0 ${plan.venue.width} ${plan.venue.height}`} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width={plan.venue.width} height={plan.venue.height} fill="#fbfcfa" />
        {plan.venue.background && (
          <image href={plan.venue.background} x="0" y="0" width={plan.venue.width} height={plan.venue.height}
            preserveAspectRatio="none" opacity="0.55" />
        )}
        <rect x="2" y="2" width={plan.venue.width - 4} height={plan.venue.height - 4} fill="none" stroke="#c9d4cc" strokeWidth="3" strokeDasharray="12 8" />

        {plan.objects.map(object => {
          const table = isTable(object);
          const cx = object.x + object.width / 2;
          const cy = object.y + object.height / 2;
          const rows = table ? byTable.get(object.id) ?? [] : [];
          const fill = object.type === 'wall' ? '#5b6b62'
            : object.type === 'dancefloor' ? '#e7efe8'
            : object.type === 'stage' ? '#ece7dc'
            : table ? '#ffffff' : '#eef1ec';
          return (
            <g key={object.id} transform={`rotate(${object.rotation} ${cx} ${cy})`}>
              {object.type === 'column' ? (
                <circle cx={cx} cy={cy} r={Math.min(object.width, object.height) / 2} fill="#cfd8d1" stroke="#7e8f84" strokeWidth="2" />
              ) : (
                <rect x={object.x} y={object.y} width={object.width} height={object.height}
                  rx={object.type === 'round-table' ? object.width / 2 : object.type === 'oval-table' ? object.height / 2 : 8}
                  fill={fill} stroke={table ? '#1f3a2e' : '#9fb0a5'} strokeWidth={table ? 2.5 : 2} />
              )}
              {table ? (
                <>
                  <text x={cx} y={cy - 4 * unit} textAnchor="middle" fontSize={19 * unit} fontWeight="700" fill="#1f3a2e" fontFamily="Sora, DM Sans, sans-serif">{object.name}</text>
                  <text x={cx} y={cy + 17 * unit} textAnchor="middle" fontSize={13 * unit} fill="#4d6358" fontFamily="DM Sans, sans-serif">{rows.length}/{capacityOf(object)}</text>
                </>
              ) : object.type !== 'wall' && (
                <text x={cx} y={cy + 5 * unit} textAnchor="middle" fontSize={16 * unit} fill="#3f5248" fontFamily="DM Sans, sans-serif">{object.name}</text>
              )}
            </g>
          );
        })}

        {tables.flatMap(table => {
          const taken = new Set((byTable.get(table.id) ?? []).map(row => row.seat));
          return Array.from({ length: capacityOf(table) }, (_, index) => {
            const point = seatPoint(table, index);
            const occupied = taken.has(index + 1);
            return (
              <g key={`${table.id}-${index}`}>
                <circle cx={point.x} cy={point.y} r={seatR} fill={occupied ? '#1f3a2e' : '#ffffff'} stroke={occupied ? '#1f3a2e' : '#8fa197'} strokeWidth="1.8" />
                <text x={point.x} y={point.y + 4.5 * unit} textAnchor="middle" fontSize={12 * unit} fontWeight="700"
                  fill={occupied ? '#ffffff' : '#4d6358'} fontFamily="DM Sans, sans-serif">{index + 1}</text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
}

/** Seat positions — the same geometry the editor draws. */
function seatPoint(table: SeatingObject, index: number) {
  const count = capacityOf(table);
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  if (table.type === 'round-table' || table.type === 'oval-table') {
    return {
      x: table.x + table.width / 2 + Math.cos(angle) * (table.width / 2 + 23),
      y: table.y + table.height / 2 + Math.sin(angle) * (table.height / 2 + 23),
    };
  }
  const perimeter = 2 * (table.width + table.height);
  const distance = (index / count) * perimeter;
  if (distance < table.width) return { x: table.x + distance, y: table.y - 24 };
  if (distance < table.width + table.height) return { x: table.x + table.width + 24, y: table.y + distance - table.width };
  if (distance < 2 * table.width + table.height) return { x: table.x + table.width - (distance - table.width - table.height), y: table.y + table.height + 24 };
  return { x: table.x - 24, y: table.y + table.height - (distance - 2 * table.width - table.height) };
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** First letter for the index; Azerbaijani i/ı handled without relying on browser locale data. */
function initialOf(name: string) {
  const ch = name.trim().charAt(0);
  if (ch === 'i') return 'İ';
  if (ch === 'ı') return 'I';
  return ch.toUpperCase() || '#';
}

function groupByLetter(guests: PrintGuest[], shown: (g: PrintGuest) => string): [string, PrintGuest[]][] {
  const groups: [string, PrintGuest[]][] = [];
  for (const guest of guests) {
    const letter = initialOf(shown(guest));
    const last = groups[groups.length - 1];
    if (last && last[0] === letter) last[1].push(guest);
    else groups.push([letter, [guest]]);
  }
  return groups;
}

/** "Masa 2" before "Masa 10". */
function naturalCompare(a: string, b: string, locale: string) {
  const pad = (s: string) => s.replace(/\d+/g, d => d.padStart(8, '0'));
  return compareNames(pad(a), pad(b), locale);
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

