// Components for the Azerbaijani carpet & buta collection.
//
// The artwork itself is generated (scripts/carpet-art/generate.mjs →
// carpet-art.ts) from computed geometry:
//   • butas built on the yin-yang construction with exact inset bands,
//     beads and lozenges spaced along the contours, a volute curl at the tip;
//   • florals (gul rosettes, xətai palmettes, islimi vines) from petal curves;
//   • carpet motifs designed knot by knot (göl medallions, borders, fields),
//     symmetric by construction and seamless as tiles.
// Colours come from the template's --k-* palette through the k* classes.
// Everything is inline SVG and aria-hidden.

import { useId, type CSSProperties } from 'react';
import { ART, CORNERS, TILES, type ArtName, type TileName } from './carpet-art';

type Props = { className?: string; style?: CSSProperties };

/** A standalone ornament from the generated set. */
export function Art({ name, className, style }: Props & { name: ArtName }) {
  const art = ART[name];
  return (
    <svg className={className} style={style} viewBox={art.vb} aria-hidden="true" focusable="false"
      dangerouslySetInnerHTML={{ __html: art.svg }} />
  );
}

/** Thickness in px of a band of `kind` woven at `knot` px per knot. */
export function bandSize(kind: TileName, knot: number) {
  return TILES[kind][1] * knot;
}

/**
 * Fills its box with a woven pattern. `knot` is the size of one knot in CSS
 * px; whole or half pixels keep tile edges on device pixels (no seams).
 * Vertical bands rotate the tile by 90°.
 */
export function Band({ kind, knot, vertical = false, className, style }: Props & {
  kind: TileName; knot: number; vertical?: boolean;
}) {
  const id = `kb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [w, h, art] = TILES[kind];
  return (
    <span className={`kx-band ${className ?? ''}`} style={style} aria-hidden="true">
      <svg width="100%" height="100%" focusable="false" shapeRendering="crispEdges">
        <defs>
          <pattern id={id} patternUnits="userSpaceOnUse" width={w * knot} height={h * knot}
            viewBox={`0 0 ${w} ${h}`} patternTransform={vertical ? 'rotate(90)' : undefined}
            dangerouslySetInnerHTML={{ __html: art }} />
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </span>
  );
}

export type FrameLayer = { kind: TileName; knot: number };

/** Total thickness of a frame. */
export function frameSize(layers: FrameLayer[]) {
  return layers.reduce((sum, l) => sum + bandSize(l.kind, l.knot), 0);
}

/**
 * Concentric woven borders. Each layer is four strips (top and bottom run the
 * full width, sides run between them); the layers listed in `corners` turn
 * their corners with a woven star block, as carpet borders do.
 */
export function CarpetFrame({ layers, corners = [], className }: {
  layers: FrameLayer[];
  corners?: number[];
  className?: string;
}) {
  let offset = 0;
  return (
    <div className={`kx-frame ${className ?? ''}`} aria-hidden="true">
      {layers.map((layer, index) => {
        const o = offset;
        const t = bandSize(layer.kind, layer.knot);
        offset += t;
        const knots = TILES[layer.kind][1];
        const corner = CORNERS[knots];
        return (
          <div key={index} className="kx-frame-layer">
            <Band kind={layer.kind} knot={layer.knot} className="kx-strip" style={{ top: o, left: o, right: o, height: t }} />
            <Band kind={layer.kind} knot={layer.knot} className="kx-strip" style={{ bottom: o, left: o, right: o, height: t }} />
            <Band kind={layer.kind} knot={layer.knot} vertical className="kx-strip" style={{ top: o + t, bottom: o + t, left: o, width: t }} />
            <Band kind={layer.kind} knot={layer.knot} vertical className="kx-strip" style={{ top: o + t, bottom: o + t, right: o, width: t }} />
            {corner && corners.includes(index) && (['tl', 'tr', 'bl', 'br'] as const).map(c => (
              <svg key={c} className="kx-corner" viewBox={`0 0 ${knots} ${knots}`} shapeRendering="crispEdges"
                style={{
                  width: t, height: t,
                  ...(c[0] === 't' ? { top: o } : { bottom: o }),
                  ...(c[1] === 'l' ? { left: o } : { right: o }),
                }}
                dangerouslySetInnerHTML={{ __html: corner }} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** Pointed (ogee) arch cap — Oriental Palace window. */
export function OgeeCap({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 200 92" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 92 V66 C0 40 38 34 68 22 C84 15 95 8 100 0 C105 8 116 15 132 22 C162 34 200 40 200 66 V92 Z" />
    </svg>
  );
}

/** Lancet (two-centred) arch cap — Azerbaijani Heritage panel. */
export function LancetCap({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 200 110" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 110 V82 C0 40 54 10 100 0 C146 10 200 40 200 82 V110 Z" />
    </svg>
  );
}
