type Props = { categoria: string; descripcion: string; size?: "sm" | "md" | "lg" };

function glassConfig(descripcion: string) {
  const d = descripcion.toLowerCase();
  if (d.includes("espejo bronce")) return { stops: ["#8B7355","#C9A96E","#8B7355"], dir: "y" };
  if (d.includes("espejo vitrosol")) return { stops: ["#4A7C9B","#8BB8D4","#4A7C9B"], dir: "y" };
  if (d.includes("espejo filtrasol")) return { stops: ["#5C7A4E","#8FB582","#5C7A4E"], dir: "y" };
  if (d.includes("espejo")) return { stops: ["#C8D8E0","#EEF4F7","#C8D8E0"], dir: "y", highlight: true };
  if (d.includes("reflecta azul")) return { stops: ["#1B4F8A","#3A7EC8","#1B4F8A"], dir: "135" };
  if (d.includes("reflecta bronce")) return { stops: ["#7A5C2E","#B8894A","#7A5C2E"], dir: "135" };
  if (d.includes("reflecta plata")) return { stops: ["#8A9BA8","#C5D2DB","#8A9BA8"], dir: "135" };
  if (d.includes("solarblue")) return { stops: ["#0D3B7A","#2B6CB0","#1A4E8A"], dir: "135" };
  if (d.includes("filtrasol")) return { stops: ["#4A7C52","#7AB87E","#4A7C52"], dir: "135" };
  if (d.includes("vitrosol")) return { stops: ["#3B6E9C","#6BA3C8","#3B6E9C"], dir: "135" };
  if (d.includes("tintex plus")) return { stops: ["#3A4A3A","#6B8B6B","#3A4A3A"], dir: "y" };
  if (d.includes("tintex")) return { stops: ["#4A5C4A","#7A9C7A","#4A5C4A"], dir: "y" };
  if (d.includes("bronce")) return { stops: ["#9B7D4A","#CBA76A","#9B7D4A"], dir: "135" };
  if (d.includes("pavia") || d.includes("satinado")) return { stops: ["#D8E4EC","#F0F6FA","#D8E4EC"], dir: "y", frosted: true };
  if (d.includes("sol lite") || d.includes("sql lite")) return { stops: ["#E8F0D8","#F5FAE8","#E8F0D8"], dir: "y" };
  return { stops: ["#C8DCE8","#E8F4FC","#C8DCE8"], dir: "y" };
}

function GlassPane({ descripcion, w = 200, h = 160 }: { descripcion: string; w?: number; h?: number }) {
  const cfg = glassConfig(descripcion);
  const id = `g-${descripcion.replace(/\s/g, "").slice(0, 8)}`;
  const angle = cfg.dir === "y" ? "90" : cfg.dir === "x" ? "0" : cfg.dir;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <linearGradient id={id} gradientTransform={`rotate(${angle}, 0.5, 0.5)`} gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={cfg.stops[0]} />
          <stop offset="50%" stopColor={cfg.stops[1]} />
          <stop offset="100%" stopColor={cfg.stops[2]} />
        </linearGradient>
        {cfg.frosted && (
          <filter id={`${id}-f`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" result="displaced" />
            <feBlend in="SourceGraphic" in2="displaced" mode="overlay" />
          </filter>
        )}
      </defs>
      <rect x="4" y="4" width={w - 8} height={h - 8} rx="3" fill={`url(#${id})`} filter={cfg.frosted ? `url(#${id}-f)` : undefined} />
      {cfg.highlight && (
        <>
          <rect x="14" y="14" width="18" height={h - 28} rx="9" fill="rgba(255,255,255,0.55)" />
          <rect x="38" y="14" width="8" height={h - 28} rx="4" fill="rgba(255,255,255,0.3)" />
        </>
      )}
      <rect x="4" y="4" width={w - 8} height={h - 8} rx="3" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <rect x="0" y="0" width={w} height={h} rx="4" fill="none" stroke="rgba(15,61,110,0.15)" strokeWidth="1.5" />
    </svg>
  );
}

function AluminumProfile({ descripcion, w = 200, h = 160 }: { descripcion: string; w?: number; h?: number }) {
  const d = descripcion.toLowerCase();
  const cx = w / 2;
  const cy = h / 2;

  let shape: React.ReactNode;

  if (d.includes("jamba")) {
    shape = (
      <g transform={`translate(${cx - 30}, ${cy - 50})`}>
        <rect x="0" y="0" width="60" height="100" rx="2" fill="#B8C8D4" stroke="#8A9BA8" strokeWidth="1.5" />
        <rect x="8" y="0" width="44" height="100" fill="#D4E0E8" />
        <rect x="0" y="0" width="8" height="100" fill="#98AABB" />
        <rect x="52" y="0" width="8" height="100" fill="#98AABB" />
        <rect x="8" y="8" width="44" height="6" fill="#C0CED8" />
        {d.includes("mosq") && <rect x="20" y="20" width="20" height="60" rx="2" fill="rgba(150,180,200,0.4)" stroke="#8AA0B0" strokeWidth="0.8" />}
      </g>
    );
  } else if (d.includes("riel")) {
    shape = (
      <g transform={`translate(${cx - 50}, ${cy - 15})`}>
        <rect x="0" y="0" width="100" height="30" rx="2" fill="#C8D8E4" stroke="#8A9BA8" strokeWidth="1.5" />
        <rect x="10" y="8" width="80" height="6" rx="1" fill="#98AABB" />
        <rect x="10" y="18" width="80" height="6" rx="1" fill="#98AABB" />
        {d.includes("mosq") && <rect x="15" y="5" width="70" height="3" fill="rgba(150,180,200,0.5)" stroke="#8AA0B0" strokeWidth="0.5" />}
      </g>
    );
  } else if (d.includes("zoclo") || d.includes("cabezal")) {
    shape = (
      <g transform={`translate(${cx - 50}, ${cy - 20})`}>
        <rect x="0" y="0" width="100" height="40" rx="2" fill="#C0D0DC" stroke="#8A9BA8" strokeWidth="1.5" />
        <rect x="0" y="0" width="100" height="10" fill="#98AABB" />
        <rect x="0" y="30" width="100" height="10" fill="#98AABB" />
        <rect x="10" y="12" width="80" height="4" rx="1" fill="#A8BCCC" />
        <rect x="10" y="22" width="80" height="4" rx="1" fill="#A8BCCC" />
      </g>
    );
  } else if (d.includes("bolsa")) {
    shape = (
      <g transform={`translate(${cx - 30}, ${cy - 35})`}>
        <path d="M0,70 L0,0 Q30,-15 60,0 L60,70 Z" fill="#C8D8E4" stroke="#8A9BA8" strokeWidth="1.5" />
        <path d="M8,65 L8,8 Q30,-5 52,8 L52,65 Z" fill="#D4E0E8" />
        <rect x="0" y="65" width="60" height="6" rx="1" fill="#98AABB" />
      </g>
    );
  } else if (d.includes("tapa")) {
    shape = (
      <g transform={`translate(${cx - 50}, ${cy - 10})`}>
        <rect x="0" y="0" width="100" height="20" rx="10" fill="#C8D8E4" stroke="#8A9BA8" strokeWidth="1.5" />
        <rect x="5" y="5" width="90" height="10" rx="5" fill="#D4E0E8" />
      </g>
    );
  } else if (d.includes("esquinero")) {
    shape = (
      <g transform={`translate(${cx - 35}, ${cy - 35})`}>
        <path d="M0,70 L0,0 L70,0 L70,15 L15,15 L15,70 Z" fill="#C8D8E4" stroke="#8A9BA8" strokeWidth="1.5" />
        <path d="M0,70 L0,8 L8,0 L70,0 L70,8 L15,8 L15,70 Z" fill="#D4E0E8" />
      </g>
    );
  } else if (d.includes("junquillo") || d.includes("jonquillo")) {
    shape = (
      <g transform={`translate(${cx - 50}, ${cy - 5})`}>
        <rect x="0" y="0" width="100" height="10" rx="3" fill="#C8D8E4" stroke="#8A9BA8" strokeWidth="1.5" />
        <rect x="3" y="2" width="94" height="6" rx="2" fill="#D4E0E8" />
      </g>
    );
  } else if (d.includes("traslape")) {
    shape = (
      <g transform={`translate(${cx - 40}, ${cy - 30})`}>
        <path d="M0,60 L0,20 L20,0 L80,0 L80,40 L60,60 Z" fill="#C8D8E4" stroke="#8A9BA8" strokeWidth="1.5" />
        <path d="M6,55 L6,23 L23,6 L74,6 L74,37 L57,55 Z" fill="#D4E0E8" />
      </g>
    );
  } else if (d.includes("intermedio")) {
    shape = (
      <g transform={`translate(${cx - 15}, ${cy - 50})`}>
        <rect x="0" y="0" width="30" height="100" rx="2" fill="#C8D8E4" stroke="#8A9BA8" strokeWidth="1.5" />
        <rect x="6" y="0" width="18" height="100" fill="#D4E0E8" />
        <rect x="0" y="45" width="30" height="10" fill="#A8BCCC" />
      </g>
    );
  } else if (d.includes("cerco")) {
    shape = (
      <g transform={`translate(${cx - 40}, ${cy - 40})`}>
        <rect x="0" y="0" width="80" height="80" rx="3" fill="none" stroke="#8A9BA8" strokeWidth="6" />
        <rect x="0" y="0" width="80" height="80" rx="3" fill="none" stroke="#C8D8E4" strokeWidth="3" />
        <rect x="3" y="3" width="74" height="74" rx="2" fill="none" stroke="#D4E0E8" strokeWidth="1.5" />
      </g>
    );
  } else if (d.includes("moldura")) {
    shape = (
      <g transform={`translate(${cx - 50}, ${cy - 8})`}>
        <path d="M0,16 L5,0 L95,0 L100,16 L95,32 L5,32 Z" fill="#C8D8E4" stroke="#8A9BA8" strokeWidth="1.5" />
        <path d="M8,16 L12,4 L88,4 L92,16 L88,28 L12,28 Z" fill="#D4E0E8" />
      </g>
    );
  } else if (d.includes("escalonado")) {
    shape = (
      <g transform={`translate(${cx - 35}, ${cy - 40})`}>
        <path d="M0,80 L0,0 L70,0 L70,25 L35,25 L35,55 L70,55 L70,80 Z" fill="#C8D8E4" stroke="#8A9BA8" strokeWidth="1.5" />
        <path d="M7,73 L7,7 L63,7 L63,18 L28,18 L28,62 L63,62 L63,73 Z" fill="#D4E0E8" />
      </g>
    );
  } else {
    shape = (
      <g transform={`translate(${cx - 30}, ${cy - 40})`}>
        <rect x="0" y="0" width="60" height="80" rx="3" fill="#C8D8E4" stroke="#8A9BA8" strokeWidth="1.5" />
        <rect x="8" y="8" width="44" height="64" rx="2" fill="#D4E0E8" />
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="bg-grad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#EBF2F7" />
          <stop offset="100%" stopColor="#D4E2EC" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill="url(#bg-grad)" />
      {shape}
    </svg>
  );
}

function Accessory({ descripcion, w = 200, h = 160 }: { descripcion: string; w?: number; h?: number }) {
  const d = descripcion.toLowerCase();
  const cx = w / 2, cy = h / 2;

  let shape: React.ReactNode;
  if (d.includes("sellador") || d.includes("acrilico")) {
    shape = (
      <g transform={`translate(${cx - 18}, ${cy - 40})`}>
        <rect x="4" y="0" width="28" height="50" rx="4" fill="#E8E8E8" stroke="#AAAAAA" strokeWidth="1.5" />
        <rect x="0" y="0" width="36" height="12" rx="3" fill="#CCCCCC" stroke="#AAAAAA" strokeWidth="1" />
        <rect x="8" y="14" width="20" height="30" rx="2" fill="white" opacity="0.6" />
        <rect x="4" y="50" width="28" height="8" rx="0 0 4 4" fill="#BBBBBB" />
      </g>
    );
  } else if (d.includes("chapa") || d.includes("perico")) {
    shape = (
      <g transform={`translate(${cx - 22}, ${cy - 30})`}>
        <rect x="0" y="0" width="44" height="60" rx="4" fill="#C8C8C0" stroke="#888880" strokeWidth="1.5" />
        <circle cx="22" cy="20" r="10" fill="#A8A898" stroke="#888880" strokeWidth="1" />
        <rect x="14" y="36" width="16" height="18" rx="2" fill="#B8B8A8" stroke="#888880" strokeWidth="1" />
        <circle cx="22" cy="20" r="4" fill="#787868" />
      </g>
    );
  } else if (d.includes("jaladera") || d.includes("tirador")) {
    shape = (
      <g transform={`translate(${cx - 30}, ${cy - 12})`}>
        <rect x="0" y="8" width="60" height="8" rx="4" fill="#C8C8C0" stroke="#888880" strokeWidth="1.5" />
        <rect x="8" y="0" width="8" height="24" rx="4" fill="#C8C8C0" stroke="#888880" strokeWidth="1" />
        <rect x="44" y="0" width="8" height="24" rx="4" fill="#C8C8C0" stroke="#888880" strokeWidth="1" />
      </g>
    );
  } else if (d.includes("carretilla")) {
    shape = (
      <g transform={`translate(${cx - 20}, ${cy - 20})`}>
        <rect x="0" y="0" width="40" height="28" rx="3" fill="#C8C8C0" stroke="#888880" strokeWidth="1.5" />
        <circle cx="10" cy="36" r="8" fill="#A8A898" stroke="#888880" strokeWidth="1.5" />
        <circle cx="30" cy="36" r="8" fill="#A8A898" stroke="#888880" strokeWidth="1.5" />
        <circle cx="10" cy="36" r="3" fill="#787868" />
        <circle cx="30" cy="36" r="3" fill="#787868" />
      </g>
    );
  } else {
    shape = (
      <g transform={`translate(${cx - 20}, ${cy - 20})`}>
        <rect x="0" y="0" width="40" height="40" rx="4" fill="#C8C8C0" stroke="#888880" strokeWidth="1.5" />
        <rect x="8" y="8" width="24" height="24" rx="2" fill="#D8D8D0" />
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="acc-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#F5F5F0" />
          <stop offset="100%" stopColor="#E5E5E0" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill="url(#acc-bg)" />
      {shape}
    </svg>
  );
}

export default function GlassRender({ categoria, descripcion, size = "md" }: Props) {
  const dims = size === "sm" ? { w: 80, h: 64 } : size === "lg" ? { w: 280, h: 220 } : { w: 200, h: 160 };
  const cat = categoria.toLowerCase();

  if (cat.includes("vidrio")) return <GlassPane descripcion={descripcion} {...dims} />;
  if (cat.includes("accesorio")) return <Accessory descripcion={descripcion} {...dims} />;
  return <AluminumProfile descripcion={descripcion} {...dims} />;
}
