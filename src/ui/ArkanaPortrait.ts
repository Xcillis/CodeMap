import type { ArkanId } from '../combat/types';
import { ART_BASE, ART_MANIFEST } from '../art/ArtCatalog';
import { MOTION_BASE, MOTION_MANIFEST } from '../art/MotionCatalog';

/** The same generated atlas supplies portraits; no duplicate image downloads or separate creature designs. */
export function arkanaPortrait(actor: ArkanId): SVGSVGElement {
  const namespace = 'http://www.w3.org/2000/svg';
  const sheet = actor === 'frostmolch' ? MOTION_MANIFEST.sheets.frostmolch : ART_MANIFEST.characters;
  const frame = actor === 'frostmolch' ? MOTION_MANIFEST.sheets.frostmolch.frames['frostmolch-down-0'] : ART_MANIFEST.characters.frames[actor];
  const svg = document.createElementNS(namespace, 'svg'); svg.classList.add('arkana-portrait'); svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', `${frame.x} ${frame.y} ${frame.width} ${frame.height}`);
  const image = document.createElementNS(namespace, 'image'); image.setAttribute('href', `${actor === 'frostmolch' ? MOTION_BASE : ART_BASE}${sheet.file}`);
  image.setAttribute('width', String(sheet.width)); image.setAttribute('height', String(sheet.height));
  svg.append(image); return svg;
}
