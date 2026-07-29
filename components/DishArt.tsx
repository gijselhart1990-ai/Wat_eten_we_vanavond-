import type { Recipe } from "../lib/types";

function seedRand(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return function () { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h = (h ^ (h >>> 16)) >>> 0; return h / 4294967296; };
}

export function DishArt({ r, size = 116, fill = false }: { r: Recipe; size?: number; fill?: boolean }) {
  const rnd = seedRand(r.id);
  const pal = r.pal;
  const cx = 50, cy = 52;

  const scatter = (count: number, rx: number, ry: number, minR: number, maxR: number) => {
    const items: { x: number; y: number; rr: number; col: string; rot: number }[] = [];
    for (let i = 0; i < count; i++) {
      const ang = rnd() * Math.PI * 2, rad = Math.sqrt(rnd());
      const x = cx + Math.cos(ang) * rx * rad, y = cy + Math.sin(ang) * ry * rad;
      const rr = minR + rnd() * (maxR - minR);
      items.push({ x, y, rr, col: pal[Math.floor(rnd() * pal.length)], rot: rnd() * 90 });
    }
    return items;
  };

  let content;
  if (r.type === "Pasta") {
    const strands = [];
    for (let i = 0; i < 7; i++) {
      const y = 42 + i * 3.2, off = (rnd() - 0.5) * 6;
      strands.push(`M28,${y + off} C42,${y - 5 + off} 58,${y + 6 + off} 72,${y - 2 + off}`);
    }
    content = (
      <g>
        <ellipse cx={cx} cy={cy} rx="34" ry="30" fill={r.base} />
        <ellipse cx={cx} cy={cy} rx="34" ry="30" fill="url(#glo)" opacity="0.35" />
        {strands.map((d, i) => <path key={i} d={d} stroke={i % 2 ? r.base : pal[0]} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.85" />)}
        {scatter(9, 24, 20, 2.4, 4).map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.rr} fill={b.col} />)}
      </g>
    );
  } else if (r.type === "Wrap") {
    content = (
      <g>
        <g transform="rotate(-24 50 52)">
          <rect x="26" y="30" width="20" height="44" rx="10" fill={r.base} />
          <rect x="26" y="30" width="20" height="44" rx="10" fill="url(#glo)" opacity="0.3" />
          <ellipse cx="36" cy="30" rx="10" ry="4.5" fill="#F1E6C4" />
          {scatter(6, 8, 4, 2, 3.4).map((b, i) => <circle key={i} cx={36 + (b.x - 50) * 0.5} cy={31 + (b.y - 52) * 0.2} r={b.rr} fill={b.col} />)}
        </g>
        <g transform="rotate(20 62 54)">
          <rect x="52" y="34" width="20" height="42" rx="10" fill={r.base} />
          <rect x="52" y="34" width="20" height="42" rx="10" fill="url(#glo)" opacity="0.3" />
          <ellipse cx="62" cy="34" rx="10" ry="4.5" fill="#F1E6C4" />
          {scatter(6, 8, 4, 2, 3.4).map((b, i) => <circle key={i} cx={62 + (b.x - 50) * 0.5} cy={35 + (b.y - 52) * 0.2} r={b.rr} fill={b.col} />)}
        </g>
      </g>
    );
  } else if (r.type === "Sandwich") {
    content = (
      <g transform="rotate(-4 50 52)">
        <rect x="24" y="60" width="52" height="12" rx="6" fill={r.base} />
        <rect x="26" y="52" width="48" height="9" rx="4" fill={pal[1]} />
        <rect x="26" y="45" width="48" height="8" rx="3" fill={pal[0]} />
        <rect x="27" y="40" width="46" height="6" rx="3" fill={pal[2]} />
        <rect x="24" y="30" width="52" height="13" rx="7" fill={r.base} />
        <rect x="24" y="30" width="52" height="13" rx="7" fill="url(#glo)" opacity="0.4" />
        {[32, 44, 56, 68].map((x, i) => <circle key={i} cx={x} cy={36} r="1.1" fill="#B98A3C" />)}
      </g>
    );
  } else if (r.type === "Plate") {
    content = (
      <g>
        <circle cx={cx} cy={cy} r="33" fill="#F6F2EA" />
        <circle cx={cx} cy={cy} r="33" fill="url(#glo)" opacity="0.3" />
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={30 + i * 3.6} y={40 + i} width="3" height="24" rx="1.5" transform={`rotate(${-16 + i * 3} ${33 + i * 3.6} 52)`} fill={pal[1]} />)}
        {[0, 1, 2].map((i) => <path key={i} d={`M52,${42 + i * 7} q11,-3 20,1 q-11,5 -20,-1`} fill={pal[0]} opacity="0.92" />)}
        {r.drizzle && <path d="M40,66 q10,4 20,0" stroke="#F4EFE6" strokeWidth="2" fill="none" strokeLinecap="round" />}
      </g>
    );
  } else if (r.type === "Flatbread") {
    content = (
      <g>
        <path d="M22,58 Q50,20 78,58 Q50,50 22,58 Z" fill={r.base} />
        <path d="M22,58 Q50,20 78,58 Q50,50 22,58 Z" fill="url(#glo)" opacity="0.3" />
        {scatter(9, 20, 8, 2.2, 3.6).map((b, i) => <circle key={i} cx={b.x} cy={46 + (b.y - 52) * 0.35} r={b.rr} fill={b.col} />)}
        {r.drizzle && <path d="M34,50 q16,6 32,0" stroke="#F4EFE6" strokeWidth="2" fill="none" strokeLinecap="round" />}
      </g>
    );
  } else {
    // Bowl / Oven
    const rx = r.type === "Oven" ? 37 : 33, ry = r.type === "Oven" ? 27 : 30;
    content = (
      <g>
        {r.type === "Oven"
          ? <rect x={cx - rx} y={cy - ry} width={rx * 2} height={ry * 2} rx="8" fill={r.base} />
          : <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={r.base} />}
        <g clipPath="url(#clipDish)">
          {scatter(16, rx - 6, ry - 5, 2.6, 5).map((b, i) => (
            <rect key={i} x={b.x - b.rr} y={b.y - b.rr} width={b.rr * 2} height={b.rr * 1.7} rx={b.rr} fill={b.col} transform={`rotate(${b.rot} ${b.x} ${b.y})`} />
          ))}
        </g>
        {r.type === "Oven"
          ? <rect x={cx - rx} y={cy - ry} width={rx * 2} height={ry * 2} rx="8" fill="url(#glo)" opacity="0.28" />
          : <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#glo)" opacity="0.28" />}
        {r.drizzle && <path d="M32,58 q9,5 18,0 q9,-5 18,0" stroke="#F4EFE6" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.95" />}
      </g>
    );
  }

  return (
    <svg viewBox="0 0 100 100" width={fill ? "100%" : size} height={fill ? "100%" : size} preserveAspectRatio={fill ? "xMidYMid slice" : "xMidYMid meet"} className="fp-dish" role="img" aria-label={`Illustratie van ${r.name}`}>
      <defs>
        <radialGradient id="glo" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" /><stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="clipDish"><ellipse cx={cx} cy={cy} rx="31" ry="28" /></clipPath>
        <radialGradient id="bg" cx="50%" cy="42%" r="75%">
          <stop offset="0%" stopColor="#332C22" /><stop offset="100%" stopColor="#221D16" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#bg)" />
      <ellipse cx="50" cy="80" rx="30" ry="6" fill="#000" opacity="0.28" />
      {content}
    </svg>
  );
}
