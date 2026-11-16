import { REGIONS, REGION_SIZES } from '../gameplay/WorldRegions';
import { QUEST_GIVERS } from '../gameplay/QuestNetwork';
import { ARKANA_ENCOUNTERS } from '../gameplay/ArkanaEncounters';
import type { Obstacle, Point } from './ValleyLayout';

export const FOREST_SIZE = REGION_SIZES.forest;
export const FOREST_TRAINING = { x: 1060, y: 1630 };
export const FOREST_CLEARINGS = [
  { ...QUEST_GIVERS.lyra, radius: 190, name: 'Waldsaum · Lyra' },
  { x: 1480, y: 1030, radius: 200, name: 'Alte Eiche' },
  { ...QUEST_GIVERS.neria, radius: 235, name: 'Sonnenlichtung · Neria' },
  { ...QUEST_GIVERS.tala, radius: 210, name: 'Forscherhain · Tala' },
  { x: 2760, y: 1730, radius: 120, name: 'Mooshain' },
];
/** Connected walkways; the forest between them remains freely explorable. */
export const FOREST_PATHS: readonly (readonly Point[])[] = [
  [REGIONS.forest.exit, REGIONS.forest.arrival, { x: 460, y: 1650 }, QUEST_GIVERS.lyra,
    FOREST_TRAINING, { x: 1390, y: 1730 }, { x: 1800, y: 1640 }, { x: 2150, y: 1730 }, QUEST_GIVERS.tala,
    { x: 2760, y: 1730 }, { x: 3020, y: 1700 }],
  [QUEST_GIVERS.lyra, { x: 930, y: 1180 }, { x: 1210, y: 1220 }, { x: 1480, y: 1030 },
    { x: 1780, y: 870 }, { x: 1980, y: 620 }, QUEST_GIVERS.neria],
  [QUEST_GIVERS.neria, { x: 2730, y: 750 }, { x: 2660, y: 1110 }, QUEST_GIVERS.tala],
];
export function nearForestPath(point: Point, distance = 100): boolean {
  return FOREST_PATHS.some((path) => path.slice(1).some((end, index) => {
    const start = path[index]; const dx = end.x - start.x; const dy = end.y - start.y;
    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy) < distance;
  }));
}
const targets = [REGIONS.forest.arrival, REGIONS.forest.exit, FOREST_TRAINING,
  ...Object.values(QUEST_GIVERS).filter((giver) => giver.region === 'forest'),
  ...ARKANA_ENCOUNTERS.filter((encounter) => encounter.region === 'forest')];
function reserved(point: Point): boolean {
  return nearForestPath(point) || FOREST_CLEARINGS.some((area) => Math.hypot(point.x - area.x, point.y - area.y) < area.radius)
    || targets.some((target) => Math.hypot(point.x - target.x, point.y - target.y) < 130);
}
function randomSource(): () => number {
  let seed = 20261116;
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
export interface ForestTree extends Point { variant: 'oak' | 'fir' | 'elder' | 'spruce'; height: number }
export interface ForestProp extends Point { variant: 'rock' | 'stump' | 'fern' | 'log'; width: number }
function makeScenery(): { trees: ForestTree[]; props: ForestProp[] } {
  const random = randomSource(); const trees: ForestTree[] = []; const props: ForestProp[] = [];
  const variants = ['oak', 'fir', 'elder', 'spruce'] as const;
  for (let y = 90; y < FOREST_SIZE.height + 90; y += 124) for (let x = 65; x < FOREST_SIZE.width + 65; x += 128) {
    const point = { x: x + random() * 78 - 39, y: y + random() * 68 - 34 };
    if (reserved(point) || random() < .12) continue;
    trees.push({ ...point, variant: variants[Math.floor(random() * variants.length)], height: 165 + random() * 85 });
  }
  const details = ['rock', 'stump', 'fern', 'fern', 'log'] as const;
  for (let i = 0; i < 190; i++) {
    const point = { x: 150 + random() * 2900, y: 180 + random() * 1730 };
    if (reserved(point) || trees.some((tree) => Math.hypot(tree.x - point.x, tree.y - point.y) < 50)) continue;
    const variant = details[Math.floor(random() * details.length)];
    props.push({ ...point, variant, width: variant === 'fern' ? 38 + random() * 20 : 55 + random() * 35 });
  }
  return { trees, props };
}
const scenery = makeScenery();
export const FOREST_TREES = scenery.trees;
export const FOREST_PROPS = scenery.props;
export const FOREST_OBSTACLES: readonly Obstacle[] = [
  { x: 20, y: 1040, width: 40, height: 2080 }, { x: 3180, y: 1040, width: 40, height: 2080 },
  { x: 1600, y: 20, width: 3200, height: 40 }, { x: 1600, y: 2060, width: 3200, height: 40 },
  ...FOREST_TREES.map((tree) => ({ x: tree.x, y: tree.y - 8, width: 26 + tree.height * .05, height: 25 })),
  ...FOREST_PROPS.filter((prop) => prop.variant !== 'fern').map((prop) => ({ x: prop.x, y: prop.y - 9, width: prop.width * .65, height: 20 })),
];
export function forestBlocked(point: Point, radius = 14): boolean {
  return point.x < radius || point.y < radius || point.x > FOREST_SIZE.width - radius || point.y > FOREST_SIZE.height - radius
    || FOREST_OBSTACLES.some((body) => Math.abs(point.x - body.x) < body.width / 2 + radius && Math.abs(point.y - body.y) < body.height / 2 + radius);
}
