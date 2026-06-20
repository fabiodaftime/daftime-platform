// Carte du monde "soft" en pointillés (grille terre/mer équirectangulaire 30x14)
// avec les 3 implantations Daftime placées par lat/long. Purement décoratif.

// 1 = terre, 0 = mer. 40 colonnes (lon -180..180), 18 lignes (lat 90..-90).
const GRID = [
  '0000000000000000000000000000000000000000',
  '0000111111000011111000110000011111111111',
  '0111111111111011100111111111111111111111',
  '0111111111111000000111111111111111111111',
  '0011111111111000000111111111111111111111',
  '0001111111110000000111111111111111111111',
  '0000011111100000000111111111111111111000',
  '0000000000111111101111111100111111110000',
  '0000000000011111101111111100110111110000',
  '0000000000011111100111111000000011110000',
  '0000000000011111100011111000000001111100',
  '0000000000001111000011110000000011111000',
  '0000000000011100000001100000000001110000',
  '0000000000011000000000000000000000000000',
  '0000000000010000000000000000000000000000',
  '0000000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000',
];

const COLS = 40;
const ROWS = 18;

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
  // Sous-échantillonnage du masque pour densifier les points (sans changer la forme).
  const STEP = 0.5;
  const dots: Array<[number, number]> = [];
  for (let y = 0; y < ROWS; y += STEP) {
    for (let x = 0; x < COLS; x += STEP) {
      const row = GRID[Math.floor(y)];
      if (row && row[Math.floor(x)] === '1') dots.push([x + STEP / 2, y + STEP / 2]);
    }
  }

  const paris = CITIES[0];
  const arc = (a: typeof CITIES[number], b: typeof CITIES[number]) =>
    `M${a.x},${a.y} Q${(a.x + b.x) / 2},${Math.min(a.y, b.y) - 1.2} ${b.x},${b.y}`;

  return (
    <svg viewBox="0 0 40 18" className="w-full h-auto" role="img" aria-label="Implantations Daftime : Paris, Dubaï, Lisbonne">
      {/* fond pointillé des continents */}
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.15} className="fill-primary" opacity={0.18} />
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
            fontSize={0.85}
          >
            {c.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
