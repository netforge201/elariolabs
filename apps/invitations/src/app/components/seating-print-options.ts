/** Options of the seating PDF export, kept in the page URL so a reload or a shared link keeps them. */

export const PRINT_SECTIONS = ['summary', 'plan', 'tables', 'index', 'unseated', 'tablecards', 'placecards'] as const;
export type PrintSection = (typeof PRINT_SECTIONS)[number];

export type PrintOptions = {
  sections: PrintSection[];
  paper: 'a4' | 'a3';
  /** Which name to print: the one on the invitation, or the couple's own nickname. */
  names: 'invite' | 'nick';
  rsvp: boolean;
};

export const DEFAULT_SECTIONS: PrintSection[] = ['summary', 'plan', 'tables', 'index', 'unseated'];

type Params = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function parsePrintOptions(params: Params, hasRsvp: boolean): PrintOptions {
  const raw = one(params.s);
  const sections = raw === undefined
    ? DEFAULT_SECTIONS
    : raw.split(',').filter((s): s is PrintSection => (PRINT_SECTIONS as readonly string[]).includes(s));
  const rsvp = one(params.rsvp);
  return {
    sections,
    paper: one(params.paper) === 'a3' ? 'a3' : 'a4',
    names: one(params.names) === 'nick' ? 'nick' : 'invite',
    rsvp: rsvp === undefined ? hasRsvp : rsvp === '1',
  };
}

export function printOptionsQuery(options: PrintOptions): string {
  const params = new URLSearchParams({
    s: PRINT_SECTIONS.filter(s => options.sections.includes(s)).join(','),
    paper: options.paper,
    names: options.names,
    rsvp: options.rsvp ? '1' : '0',
  });
  return `?${params.toString()}`;
}
