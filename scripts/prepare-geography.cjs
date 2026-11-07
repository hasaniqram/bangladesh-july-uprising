/**
 * Phase 1.2: derive a browser-sized GeoJSON file from the retained source.
 * The original geography remains unchanged in src/data/.
 *
 * Douglas-Peucker simplification uses a conservative coordinate tolerance.
 * Per-division integrity checks and browser rendering must pass before release.
 */
const fs = require('node:fs');
const path = require('node:path');

const input = path.join(__dirname, '..', 'src', 'data', 'bangladesh-divisions.json');
const output = path.join(__dirname, '..', 'public', 'data', 'bangladesh-divisions.simplified.json');
const source = JSON.parse(fs.readFileSync(input, 'utf8'));
const tolerance = Number(process.env.MAP_SIMPLIFY_TOLERANCE || 0.0006);
if (!Number.isFinite(tolerance) || tolerance <= 0 || tolerance > 0.005) {
  throw new Error('MAP_SIMPLIFY_TOLERANCE must be between 0 and 0.005 degrees');
}
const toleranceSquared = tolerance * tolerance;

function distanceSquared(point, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) {
    return (point[0] - a[0]) ** 2 + (point[1] - a[1]) ** 2;
  }
  const t = Math.max(0, Math.min(1,
    ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return (point[0] - (a[0] + t * dx)) ** 2 + (point[1] - (a[1] + t * dy)) ** 2;
}

function simplifyLine(points) {
  if (points.length <= 2) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    let maximum = toleranceSquared;
    let index = -1;
    for (let i = start + 1; i < end; i += 1) {
      const d = distanceSquared(points[i], points[start], points[end]);
      if (d > maximum) { maximum = d; index = i; }
    }
    if (index !== -1) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, index) => keep[index]);
}

function normalizePoint(point) {
  return [Number(point[0].toFixed(5)), Number(point[1].toFixed(5))];
}

function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    area += points[i][0] * points[i + 1][1] - points[i + 1][0] * points[i][1];
  }
  return area / 2;
}

let originalVertices = 0, finalVertices = 0, ringsReverted = 0;

function simplifyRing(ring) {
  originalVertices += ring.length;
  if (ring.length < 4) throw new Error('Invalid polygon ring with fewer than 4 points');
  const open = ring.slice(0, -1);
  const simplified = simplifyLine([...open, open[0]]).slice(0, -1).map(normalizePoint);
  const closed = [...simplified, simplified[0]];
  const beforeArea = signedArea(ring);
  const afterArea = signedArea(closed);
  // Preserve small islands, ring winding, and meaningful polygon area.
  const valid = simplified.length >= 3 && beforeArea * afterArea > 0 &&
    (Math.abs(beforeArea) < 0.000001 ||
      Math.abs(afterArea - beforeArea) / Math.abs(beforeArea) < 0.08);
  const result = valid ? closed : ring.map(normalizePoint);
  if (!valid) ringsReverted += 1;
  finalVertices += result.length;
  return result;
}

function transformGeometry(geometry) {
  if (!geometry) return geometry;
  if (geometry.type === 'Polygon') {
    return { type: 'Polygon', coordinates: geometry.coordinates.map(simplifyRing) };
  }
  if (geometry.type === 'MultiPolygon') {
    return { type: 'MultiPolygon',
      coordinates: geometry.coordinates.map(polygon => polygon.map(simplifyRing)) };
  }
  if (geometry.type === 'GeometryCollection') {
    return { type: 'GeometryCollection', geometries: geometry.geometries.map(transformGeometry) };
  }
  throw new Error('Unexpected geography geometry type: ' + geometry.type);
}

if (source.type !== 'FeatureCollection' || !Array.isArray(source.features)) {
  throw new Error('Expected GeoJSON FeatureCollection; refusing to generate an unchecked map');
}
const simplified = {
  type: 'FeatureCollection',
  features: source.features.map(feature => ({
    type: 'Feature',
    ...(feature.id === undefined ? {} : { id: feature.id }),
    properties: { name: feature.properties && feature.properties.name },
    geometry: transformGeometry(feature.geometry)
  }))
};
if (simplified.features.length < 8 ||
    simplified.features.some(feature => !feature.properties.name)) {
  throw new Error('Missing division geometry/name; refusing to deploy altered map');
}
const originalNames = source.features.map(feature => feature.properties.name).sort();
const outputNames = simplified.features.map(feature => feature.properties.name).sort();
if (JSON.stringify(originalNames) !== JSON.stringify(outputNames)) {
  throw new Error('Geographic region labels changed unexpectedly');
}
fs.mkdirSync(path.dirname(output), { recursive: true });
const result = JSON.stringify(simplified);
fs.writeFileSync(output, result);
const originalBytes = fs.statSync(input).size;
const outputBytes = Buffer.byteLength(result);
console.log(JSON.stringify({
  inputBytes: originalBytes, outputBytes,
  reductionPercent: Number((100 * (1 - outputBytes / originalBytes)).toFixed(2)),
  originalVertices, finalVertices, ringsReverted,
  divisions: simplified.features.length, tolerance
}, null, 2));
if (outputBytes >= originalBytes) {
  throw new Error('Simplification did not reduce the geography payload');
}
