import type { ArkanId } from '../combat/types';
import { ART_BASE, ART_MANIFEST } from '../art/ArtCatalog';

/** The same generated atlas supplies portraits; no duplicate image downloads or separate creature designs. */
export function arkanaPortrait(actor: ArkanId): SVGSVGElement {
  const namespace = 'http://www.w3.org/2000/svg'; const frame = ART_MANIFEST.characters.frames[actor];
  const svg = document.createElementNS(namespace, 'svg'); svg.classList.add('arkana-portrait'); svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', `${frame.x} ${frame.y} ${frame.width} ${frame.height}`);
  const image = document.createElementNS(namespace, 'image'); image.setAttribute('href', `${ART_BASE}${ART_MANIFEST.characters.file}`);
  image.setAttribute('width', String(ART_MANIFEST.characters.width)); image.setAttribute('height', String(ART_MANIFEST.characters.height));
  svg.append(image); return svg;
}
