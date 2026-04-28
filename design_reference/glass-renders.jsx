// Renders SVG generativos según tipo de material
// Cada producto recibe un render visual diferenciado según su descripción/categoría

const GlassRender = ({ producto, size = 'sm' }) => {
  const w = size === 'lg' ? 600 : size === 'md' ? 280 : 140;
  const h = size === 'lg' ? 800 : size === 'md' ? 360 : 180;
  const desc = (producto.descripcion || '').toLowerCase();
  const cat = (producto.categoria || '').toLowerCase();

  // Aluminum profile renders
  if (cat.startsWith('perfil')) {
    return <AluminumProfile producto={producto} w={w} h={h} />;
  }

  // Glass renders by type
  let variant = 'claro';
  if (desc.includes('espejo')) variant = 'espejo';
  else if (desc.includes('filtrasol')) variant = 'filtrasol';
  else if (desc.includes('bronce')) variant = 'bronce';
  else if (desc.includes('pavia') || desc.includes('satinado')) variant = 'satinado';
  else if (desc.includes('reflecta azul')) variant = 'reflecta-azul';
  else if (desc.includes('reflecta bronce')) variant = 'reflecta-bronce';
  else if (desc.includes('reflecta plata')) variant = 'reflecta-plata';
  else if (desc.includes('solarblue') || desc.includes('sol lite') || desc.includes('sql lite')) variant = 'solarblue';
  else if (desc.includes('vitrosol')) variant = 'vitrosol';
  else if (desc.includes('tintex')) variant = 'tintex';

  return <GlassPane producto={producto} variant={variant} w={w} h={h} />;
};

const GlassPane = ({ producto, variant, w, h }) => {
  const id = `g-${producto.codigo}-${variant}`;
  const palettes = {
    claro:           { fill: 'linear', from: '#F0F6FA', to: '#D6E4EE', tint: '#7FA8C4' },
    espejo:          { fill: 'mirror', from: '#E8EEF2', to: '#A8B6C0', tint: '#5A6873' },
    filtrasol:       { fill: 'linear', from: '#A8C7DE', to: '#5C8BAA', tint: '#2E5876' },
    bronce:          { fill: 'linear', from: '#D4B896', to: '#8B6A47', tint: '#5C4220' },
    satinado:        { fill: 'frosted', from: '#EAEFF2', to: '#C8D2D8', tint: '#9AAAB4' },
    'reflecta-azul': { fill: 'reflecta', from: '#4A7DAA', to: '#1E3F5F', tint: '#0E2A45' },
    'reflecta-bronce': { fill: 'reflecta', from: '#A07850', to: '#5A3E22', tint: '#3A2810' },
    'reflecta-plata':{ fill: 'reflecta', from: '#C8CDD2', to: '#7A8088', tint: '#3F454C' },
    solarblue:       { fill: 'linear', from: '#7FAACA', to: '#3D6E94', tint: '#1F4666' },
    vitrosol:        { fill: 'linear', from: '#B8D4DE', to: '#6F9AAA', tint: '#3F6878' },
    tintex:          { fill: 'linear', from: '#9FB8C8', to: '#5F7888', tint: '#2F4858' },
  };
  const p = palettes[variant] || palettes.claro;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{display:'block'}}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.from} />
          <stop offset="100%" stopColor={p.to} />
        </linearGradient>
        {p.fill === 'mirror' && (
          <linearGradient id={`${id}-mirror`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="40%" stopColor={p.from} stopOpacity="0.5" />
            <stop offset="60%" stopColor={p.to} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.85" />
          </linearGradient>
        )}
        {p.fill === 'reflecta' && (
          <linearGradient id={`${id}-refl`} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor={p.from} />
            <stop offset="50%" stopColor={p.to} />
            <stop offset="100%" stopColor={p.from} />
          </linearGradient>
        )}
        {p.fill === 'frosted' && (
          <pattern id={`${id}-frost`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill={p.from} />
            <circle cx="1" cy="1" r="0.4" fill="#FFFFFF" opacity="0.6" />
            <circle cx="3" cy="2" r="0.3" fill={p.to} opacity="0.4" />
          </pattern>
        )}
      </defs>

      {/* Frame shadow */}
      <rect x="6" y="6" width={w-12} height={h-12} fill="rgba(0,0,0,0.08)" rx="2" />
      {/* Glass body */}
      <rect
        x="4" y="4" width={w-8} height={h-8}
        fill={
          p.fill === 'mirror' ? `url(#${id}-mirror)` :
          p.fill === 'reflecta' ? `url(#${id}-refl)` :
          p.fill === 'frosted' ? `url(#${id}-frost)` :
          `url(#${id}-bg)`
        }
        stroke={p.tint}
        strokeWidth="1.5"
        rx="1"
      />

      {/* Reflection highlights */}
      {p.fill !== 'frosted' && (
        <>
          <polygon
            points={`${w*0.15},4 ${w*0.35},4 ${w*0.20},${h-4} ${w*0.05},${h-4}`}
            fill="white"
            opacity="0.18"
          />
          <polygon
            points={`${w*0.55},4 ${w*0.62},4 ${w*0.50},${h-4} ${w*0.43},${h-4}`}
            fill="white"
            opacity="0.10"
          />
        </>
      )}

      {/* Edge highlight */}
      <line x1="4" y1="4" x2={w-4} y2="4" stroke="white" strokeWidth="1" opacity="0.5" />
      <line x1="4" y1="4" x2="4" y2={h-4} stroke="white" strokeWidth="1" opacity="0.3" />
    </svg>
  );
};

const AluminumProfile = ({ producto, w, h }) => {
  const desc = (producto.descripcion || '').toLowerCase();
  const id = `al-${producto.codigo}`;

  // Choose profile shape based on description
  let shape = 'rect'; // default
  if (desc.includes('jamba')) shape = 'jamba';
  else if (desc.includes('riel')) shape = 'riel';
  else if (desc.includes('zoclo')) shape = 'zoclo';
  else if (desc.includes('cerco')) shape = 'cerco';
  else if (desc.includes('bolsa')) shape = 'bolsa';
  else if (desc.includes('tapa')) shape = 'tapa';
  else if (desc.includes('junquillo') || desc.includes('jonquillo')) shape = 'junquillo';
  else if (desc.includes('esquinero')) shape = 'esquinero';
  else if (desc.includes('intermedio')) shape = 'intermedio';
  else if (desc.includes('moldura')) shape = 'moldura';
  else if (desc.includes('traslape')) shape = 'traslape';
  else if (desc.includes('escalonado')) shape = 'escalonado';

  // Render an isometric extruded profile
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{display:'block', background: 'linear-gradient(135deg,#F4F6F8 0%,#E0E4E8 100%)'}}>
      <defs>
        <linearGradient id={`${id}-al`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A8AEB4" />
          <stop offset="50%" stopColor="#E8ECF0" />
          <stop offset="100%" stopColor="#7C8288" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6A7078" />
          <stop offset="100%" stopColor="#4C5258" />
        </linearGradient>
      </defs>

      <ProfileShape shape={shape} w={w} h={h} fillId={id} />
    </svg>
  );
};

const ProfileShape = ({ shape, w, h, fillId }) => {
  const cx = w / 2, cy = h / 2;
  const fill = `url(#${fillId}-al)`;
  const side = `url(#${fillId}-side)`;
  const stroke = '#3A4046';
  const sw = Math.max(0.8, w/180);

  // Each shape: 2D cross-section, sized to ~60% of viewport
  const s = Math.min(w, h) * 0.62;
  const x = cx - s/2, y = cy - s/2;

  if (shape === 'jamba') {
    // U-channel
    return (
      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        <path d={`M${x},${y} L${x+s},${y} L${x+s},${y+s*0.18} L${x+s*0.82},${y+s*0.18} L${x+s*0.82},${y+s*0.82} L${x+s},${y+s*0.82} L${x+s},${y+s} L${x},${y+s} L${x},${y+s*0.82} L${x+s*0.18},${y+s*0.82} L${x+s*0.18},${y+s*0.18} L${x},${y+s*0.18} Z`} fill={fill} />
      </g>
    );
  }
  if (shape === 'riel') {
    // Track with two grooves
    return (
      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        <rect x={x} y={y+s*0.55} width={s} height={s*0.45} fill={fill} />
        <rect x={x+s*0.18} y={y+s*0.10} width={s*0.10} height={s*0.45} fill={fill} />
        <rect x={x+s*0.40} y={y+s*0.10} width={s*0.10} height={s*0.45} fill={fill} />
        <rect x={x+s*0.62} y={y+s*0.10} width={s*0.10} height={s*0.45} fill={fill} />
      </g>
    );
  }
  if (shape === 'zoclo') {
    return (
      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        <path d={`M${x},${y+s*0.55} L${x+s},${y+s*0.55} L${x+s},${y+s} L${x},${y+s} Z`} fill={fill} />
        <path d={`M${x+s*0.30},${y} L${x+s*0.40},${y} L${x+s*0.40},${y+s*0.55} L${x+s*0.30},${y+s*0.55} Z`} fill={fill} />
        <path d={`M${x+s*0.60},${y} L${x+s*0.70},${y} L${x+s*0.70},${y+s*0.55} L${x+s*0.60},${y+s*0.55} Z`} fill={fill} />
      </g>
    );
  }
  if (shape === 'cerco') {
    // Square frame profile
    return (
      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        <rect x={x} y={y} width={s} height={s} fill={fill} />
        <rect x={x+s*0.18} y={y+s*0.18} width={s*0.64} height={s*0.64} fill="#FFFFFF" stroke={stroke} strokeWidth={sw} />
      </g>
    );
  }
  if (shape === 'bolsa') {
    return (
      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        <path d={`M${x},${y} L${x+s},${y} L${x+s},${y+s} L${x},${y+s} L${x},${y+s*0.65} L${x+s*0.20},${y+s*0.65} L${x+s*0.20},${y+s*0.35} L${x},${y+s*0.35} Z`} fill={fill} />
      </g>
    );
  }
  if (shape === 'tapa') {
    return (
      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        <path d={`M${x},${y+s*0.45} L${x+s},${y+s*0.45} L${x+s},${y+s*0.65} L${x},${y+s*0.65} Z`} fill={fill} />
        <path d={`M${x+s*0.10},${y+s*0.65} L${x+s*0.20},${y+s*0.65} L${x+s*0.20},${y+s*0.95} L${x+s*0.10},${y+s*0.95} Z`} fill={fill} />
        <path d={`M${x+s*0.80},${y+s*0.65} L${x+s*0.90},${y+s*0.65} L${x+s*0.90},${y+s*0.95} L${x+s*0.80},${y+s*0.95} Z`} fill={fill} />
      </g>
    );
  }
  if (shape === 'junquillo') {
    return (
      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        <path d={`M${x+s*0.35},${y} L${x+s*0.65},${y} L${x+s*0.65},${y+s*0.50} L${x+s},${y+s*0.50} L${x+s},${y+s*0.70} L${x},${y+s*0.70} L${x},${y+s*0.50} L${x+s*0.35},${y+s*0.50} Z`} fill={fill} />
      </g>
    );
  }
  if (shape === 'esquinero') {
    return (
      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        <path d={`M${x},${y} L${x+s*0.30},${y} L${x+s*0.30},${y+s*0.70} L${x+s},${y+s*0.70} L${x+s},${y+s} L${x},${y+s} Z`} fill={fill} />
      </g>
    );
  }
  if (shape === 'intermedio') {
    return (
      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        <path d={`M${x+s*0.30},${y} L${x+s*0.70},${y} L${x+s*0.70},${y+s*0.40} L${x+s},${y+s*0.40} L${x+s},${y+s*0.60} L${x+s*0.70},${y+s*0.60} L${x+s*0.70},${y+s} L${x+s*0.30},${y+s} L${x+s*0.30},${y+s*0.60} L${x},${y+s*0.60} L${x},${y+s*0.40} L${x+s*0.30},${y+s*0.40} Z`} fill={fill} />
      </g>
    );
  }
  if (shape === 'moldura') {
    return (
      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        <path d={`M${x},${y+s*0.30} Q${x+s*0.5},${y} ${x+s},${y+s*0.30} L${x+s},${y+s*0.70} Q${x+s*0.5},${y+s} ${x},${y+s*0.70} Z`} fill={fill} />
      </g>
    );
  }
  if (shape === 'traslape') {
    return (
      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        <path d={`M${x},${y+s*0.20} L${x+s*0.55},${y+s*0.20} L${x+s*0.55},${y} L${x+s},${y} L${x+s},${y+s} L${x+s*0.45},${y+s} L${x+s*0.45},${y+s*0.80} L${x},${y+s*0.80} Z`} fill={fill} />
      </g>
    );
  }
  if (shape === 'escalonado') {
    return (
      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        <path d={`M${x},${y+s*0.70} L${x+s*0.35},${y+s*0.70} L${x+s*0.35},${y+s*0.40} L${x+s*0.70},${y+s*0.40} L${x+s*0.70},${y+s*0.10} L${x+s},${y+s*0.10} L${x+s},${y+s} L${x},${y+s} Z`} fill={fill} />
      </g>
    );
  }
  // default: rectangular profile
  return (
    <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
      <rect x={x} y={y+s*0.30} width={s} height={s*0.40} fill={fill} />
    </g>
  );
};

window.GlassRender = GlassRender;
