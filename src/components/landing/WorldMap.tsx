// Carte du monde "soft" en pointillés (grille terre/mer équirectangulaire 30x14)
// avec les 3 implantations Daftime placées par lat/long. Purement décoratif.

// 1 = terre, 0 = mer. 30 colonnes (lon -180..180), 14 lignes (lat 90..-90).
const GRID = [
  '000000000000000000000000000000',
  '001111111001110011011111111111',
  '011111111101100111011111111111',
  '001111111100001111111111111111',
  '000011111000001111111111111111',
  '000000111000001111111111111111',
  '000000001111101111110111111100',
  '000000000111100111110000111100',
  '000000000111000011110000111100',
  '000000000011100001100000111100',
  '000000000011000000000000011000',
  '000000000010000000000000000000',
  '000000000000000000000000000000',
  '000000000000000000000000000000',
];

const COLS = 30;
const ROWS = 14;

// lat/long -> coordonnées de la grille (centre de cellule)
function project(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * COLS;
  const y = ((90 - lat) / 180) * ROWS;
  return { x, y };
}

const CITIES = [
  { name: 'Paris', lat: 48.85, lon: 2.35, anchor: 'middle', dy: -0.9 },
  { name: 'Lisbonne', lat: 38.72, lon: -9.13, anchor: 'end', dx: -0.7, dy: 0.4 },
  { name: 'Dubaï', lat: 25.2, lon: 55.27, anchor: 'start', dx: 0.8, dy: 0.35 },
].map((c) => ({ ...c, ...project(c.lat, c.lon) }));

export function WorldMap() {
  const dots: Array<[number, number]> = [];
  GRID.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === '1') dots.push([c + 0.5, r + 0.5]);
  });

  const paris = CITIES[0];
  const arc = (a: typeof CITIES[number], b: typeof CITIES[number]) =>
    `M${a.x},${a.y} Q${(a.x + b.x) / 2},${Math.min(a.y, b.y) - 1.2} ${b.x},${b.y}`;

  return (
    <svg viewBox="0 0 30 14" className="w-full h-auto" role="img" aria-label="Implantations Daftime : Paris, Dubaï, Lisbonne">
      {/* fond pointillé des continents */}
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.26} className="fill-primary" opacity={0.16} />
      ))}

      {/* arcs de liaison depuis Paris */}
      {CITIES.slice(1).map((c) => (
        <path key={c.name} d={arc(paris, c)} className="stroke-accent" strokeWidth={0.06}
          fill="none" strokeDasharray="0.3 0.3" opacity={0.6} />
      ))}

      {/* villes */}
      {CITIES.map((c) => (
        <g key={c.name}>
          <circle cx={c.x} cy={c.y} r={0.6} className="fill-accent" opacity={0.25} />
          <circle cx={c.x} cy={c.y} r={0.28} className="fill-accent" />
          <circle cx={c.x} cy={c.y} r={0.12} className="fill-primary" />
          <text
            x={c.x + ((c as any).dx ?? 0)} y={c.y + (c.dy ?? 0)}
            textAnchor={c.anchor as any}
            className="fill-foreground font-semibold"
            fontSize={0.7}
          >
            {c.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
