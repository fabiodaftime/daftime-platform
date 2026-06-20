// Carte du monde "soft" en contours (géométrie Natural Earth 110m projetée en
// équirectangulaire) + les 3 implantations Daftime placées au lat/long exact.
import { LAND_PATHS } from './landPaths';

// Projection équirectangulaire : viewBox 360 (lon) x 180 (lat), origine en haut-gauche.
function project(lat: number, lon: number) {
  return { x: lon + 180, y: (90 - lat) * 1.2 };
}

const CITIES = [
  { name: 'Paris', lat: 48.85, lon: 2.35, anchor: 'middle', dx: 0, dy: -5 },
  { name: 'Lisbonne', lat: 38.72, lon: -9.13, anchor: 'end', dx: -4, dy: 2.6 },
  { name: 'Dubaï', lat: 25.2, lon: 55.27, anchor: 'start', dx: 4.5, dy: 2.6 },
].map((c) => ({ ...c, ...project(c.lat, c.lon) }));

export function WorldMap() {
  const paris = CITIES[0];
  const arc = (a: typeof CITIES[number], b: typeof CITIES[number]) =>
    `M${a.x},${a.y} Q${(a.x + b.x) / 2},${Math.min(a.y, b.y) - 12} ${b.x},${b.y}`;

  return (
    <svg
      viewBox="0 6 360 172"
      className="w-full h-auto"
      role="img"
      aria-label="Implantations Daftime : Paris, Dubaï, Lisbonne"
    >
      {/* Continents en contours soft */}
      <g
        className="fill-primary stroke-primary"
        style={{ fillOpacity: 0.05, strokeOpacity: 0.4 }}
        strokeWidth={0.5}
        strokeLinejoin="round"
      >
        {LAND_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* Arcs de liaison depuis Paris */}
      {CITIES.slice(1).map((c) => (
        <path
          key={c.name}
          d={arc(paris, c)}
          className="stroke-accent"
          fill="none"
          strokeWidth={0.7}
          strokeDasharray="2 2"
          opacity={0.6}
        />
      ))}

      {/* Villes */}
      {CITIES.map((c) => (
        <g key={c.name}>
          <circle cx={c.x} cy={c.y} r={3.4} className="fill-accent" opacity={0.22} />
          <circle cx={c.x} cy={c.y} r={1.7} className="fill-accent" />
          <circle cx={c.x} cy={c.y} r={0.7} className="fill-primary" />
          <text
            x={c.x + c.dx}
            y={c.y + c.dy}
            textAnchor={c.anchor as any}
            className="fill-foreground font-semibold"
            fontSize={5.2}
          >
            {c.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
