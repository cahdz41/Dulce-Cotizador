# Handoff: Cotizador en línea — Vidrios y Aluminio El Castillo

## Overview

Plataforma web de pre‑cotizaciones para una distribuidora de vidrios y perfiles de aluminio. El cliente navega un catálogo, agrega productos a un carrito, llena sus datos y genera un PDF de pre‑cotización que puede enviar por WhatsApp al equipo de ventas. El equipo de ventas valida stock y precios y emite la cotización oficial.

Incluye también un **panel de administración** donde el dueño puede:
- Ver todas las pre‑cotizaciones recibidas, con detalle de productos, contacto y notas
- Marcarlas como atendidas, reabrirlas o eliminarlas
- Re‑descargar el PDF
- Contactar al cliente por WhatsApp con un clic
- Cargar/actualizar el catálogo subiendo un nuevo archivo Excel
- Editar los datos de la empresa que aparecen en el PDF

## About the Design Files

Los archivos en `design_reference/` son **referencias de diseño creadas en HTML/JSX como prototipo** — muestran la intención visual, los flujos y el comportamiento. **No son código de producción para copiar directamente.**

La tarea es **recrear estos diseños en el entorno objetivo** (el codebase del cliente) usando sus patrones, librerías y convenciones establecidas. Si todavía no hay codebase, recomendamos:

- **Frontend**: Next.js (App Router) + React + TailwindCSS + shadcn/ui
- **Backend / DB**: Supabase o Postgres + Prisma (para almacenar pre‑cotizaciones, catálogo y stock real)
- **PDF**: librería del lado del cliente (`@react-pdf/renderer` o `jspdf`) o servidor (`puppeteer`) — el prototipo usa `window.print()` lo cual es válido para la primera versión
- **Excel parsing**: `xlsx` (SheetJS) — el prototipo lo hace en el navegador con JSZip + regex, en producción es mejor con SheetJS
- **Auth admin**: Supabase Auth o NextAuth con un único rol "admin"

## Fidelity

**Alta fidelidad (hi-fi).** El prototipo refleja con precisión la paleta, tipografía, espaciado e interacciones que queremos en producción. El developer debe replicar el look pixel-perfect adaptando a las librerías del proyecto.

## Vistas / Pantallas

### 1. Topbar (compartido)
- Sticky en `top: 0`, fondo blanco, sombra sutil `0 1px 2px rgba(15,61,110,0.06)`
- Izquierda: logo (cuadrícula 4-paneles azul, ver `glass-renders.jsx` para SVG inline) + nombre empresa + tagline "Cotizador en línea"
- Derecha: toggle segmentado de 2 opciones — **Vista cliente** / **Panel admin** (en producción el panel admin debe estar protegido por auth y no visible al cliente final)

### 2. Vista Cliente — Catálogo
- **Hero gradient** azul (var(--primary) → var(--primary-dark)) con título "Cotizador en línea", descripción y un buscador grande dentro del hero (input 52px alto, ícono lupa, sombra fuerte)
- **Buscador inteligente**:
  - Tolerancia a errores tipográficos (Levenshtein ≤ 2)
  - Tokeniza la query y matchea contra: código, descripción, categoría, dimensiones
  - Muestra dropdown de **sugerencias** (top 5 por score) mientras escribe
  - Botón × para limpiar
- **Barra de categorías**: pills horizontales con conteos de productos. Activo = fondo azul + texto blanco
- **Toggle de vista**: Mosaico (grid de tarjetas) / Lista (tabla agrupada por categoría)
- **Productos sin stock** (`stock === 0`) están **ocultos automáticamente** — son invisibles para el cliente
- **Indicador de stock bajo**: si `stock <= 5`, muestra "Quedan N" en color naranja con punto pulsante
- **Tarjeta de producto** (vista mosaico):
  - Imagen 180px alto con render SVG generativo según material/tipo (en producción reemplazar por imagen real cuando estén disponibles)
  - Hover: la tarjeta sube 2px, sombra; aparece icono "lupa+" en esquina sup. derecha
  - Click en imagen → **Lightbox** con render más grande + ficha completa (modal, cierra con Esc o clic fuera)
  - Body: código (mono), descripción (16px bold), chip de categoría, dimensiones (mono), precio grande (azul, 18px bold), stock, cantidad ± y botón "Agregar"
- **Vista lista**: tabla agrupada por categoría con columnas miniatura, código, descripción, dimensiones, stock, precio, acciones
- **Carrito flotante (FAB)**: aparece abajo-derecha cuando hay items. Píldora azul con badge naranja del conteo + total + CTA "Ver pre‑cotización →"
- **Drawer del carrito**: slide-in desde la derecha. Lista editable, subtotal, leyenda de pre‑cotización, botón "Continuar a datos de contacto"

### 3. Vista Cliente — Checkout (3 pasos)
- **Stepper** arriba: Datos → Revisar → Enviar
- **Paso 1 (Datos)**: form con nombre*, teléfono/WhatsApp*, email, dirección de obra, notas. Validación inline (regex teléfono `^[\d\s+()\-]{8,}$`). Sidebar de resumen sticky con productos y subtotal
- **Paso 2 (Revisar)**: preview en pantalla del PDF tal cual se imprimirá; abajo 3 botones — Editar datos (gris), Descargar PDF (negro), **Enviar por WhatsApp** (verde 25D366, prominente, con icono WhatsApp)
- **Paso 3 (Éxito)**: ícono de check, folio, mensaje de confirmación, resumen mini, botón "Volver al inicio"

### 4. PDF generado
Diseño A4. Contiene:
- Logo + nombre empresa + giro + dirección + tel + WhatsApp (header con borde inferior azul 2px)
- Etiqueta **PRE‑COTIZACIÓN** + folio (PRE-XXXXXXX) + fecha (header derecho)
- **Banner de advertencia** amarillo: "Este documento es una pre‑cotización... será validada por personal de ventas"
- Bloque de datos del cliente (gris claro, grid 2 columnas)
- Tabla de productos: Código (mono) | Descripción | Categoría | Dim. | Cant. | P. Unit. | Subtotal — header azul, filas alternadas
- Footer con total estimado destacado
- Sección de notas del cliente (si hay)
- Footer con avisos legales/disclaimers

Generación: `window.open` + `window.print()` con HTML completo embebido. En producción, recomendado migrar a `@react-pdf/renderer` (mejor control) o `puppeteer` server-side (genera PDF sin pasar por print del navegador).

### 5. Panel Admin
- **Stats cards**: Total cotizaciones, Pendientes (highlight azul gradient), Atendidas, Productos en catálogo, Total cotizado-atendido
- **Tabs**: Pre‑cotizaciones | Catálogo | Datos de empresa
- **Pre‑cotizaciones**: layout 2 columnas — lista a la izquierda, detalle a la derecha
  - Cada fila: folio (mono), badge de estado (pendiente=naranja / atendida=verde), nombre del cliente, conteo de productos + total, fecha
  - Detalle: contacto con botón directo a WhatsApp (verde), email, dirección. Tabla de productos. Notas. Acciones: Marcar atendida / Reabrir / Descargar PDF / Eliminar
- **Catálogo**: zona de carga con botón "Seleccionar archivo .xlsx" (input file oculto). Mensaje de éxito/error después de procesar. Resumen de categorías actuales con conteo y stock. Botón "Restaurar catálogo precargado"
- **Empresa**: form simple con nombre, giro, dirección, teléfono, WhatsApp + botón Guardar

## Interactions & Behavior

### Búsqueda fuzzy
Implementación en `catalog.jsx` (función `fuzzyScore` + `lev`):
1. Si la query existe como substring exacta → score alto basado en posición
2. Si no, tokenizar query y para cada token (≥2 chars):
   - Substring match → +50
   - Prefix match (primeras N-1 chars) → +20
   - Levenshtein distance ≤ 2 → +15
3. Filtrar productos con score > 10, ordenar desc

### Carga de Excel
1. `FileReader` → ArrayBuffer
2. JSZip descomprime el .xlsx
3. Parsea `xl/sharedStrings.xml` (índice de strings compartidos)
4. Parsea `xl/worksheets/sheet1.xml` celda por celda
5. Detecta automáticamente la fila de header buscando texto "codig" o "descrip"
6. Mapea columnas por nombre normalizado (sin acentos, lowercase): codigo, categoria, descripcion, dimensiones/medidas, precio, stock/inventario/existencia, unidad
7. Construye objetos `Producto`. Si no viene columna stock, asigna stock pseudo-aleatorio determinista basado en el código (para demo)
8. **En producción usar SheetJS (`xlsx`)** — el parser regex del prototipo es frágil con archivos creados en distintas versiones de Excel

### Enviar por WhatsApp
```js
const phone = empresa.whatsapp.replace(/\D/g, '');
const msg = encodeURIComponent(
  `Hola ${empresa.nombre}, soy ${cliente.nombre}. Te envío mi pre‑cotización ${folio} por ${total} (${cart.length} productos). Adjunto el PDF generado por su sistema. Gracias.`
);
window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
```
**Nota importante**: WhatsApp Web no permite adjuntar archivos automáticamente vía URL. El cliente debe descargar el PDF y adjuntarlo manualmente al chat. En producción considerar:
- WhatsApp Business API (oficial, requiere aprobación) para enviar el PDF como adjunto programáticamente
- Subir el PDF a un bucket público (Supabase Storage / S3) y enviar el link en el mensaje

### Persistencia (prototipo)
Todo en `localStorage`:
- `catalog` — array de productos
- `empresa` — objeto con datos
- `quotes` — array de pre‑cotizaciones

**En producción**: tabla `products`, tabla `quotes` con FK a `quote_items`, tabla `company_settings`. Las cotizaciones del cliente se envían al backend al confirmar.

### Animaciones
- Tarjetas: hover lift 2px + sombra, transición 200ms
- Lightbox: fade + zoom-in con `cubic-bezier(0.34, 1.56, 0.64, 1)` (ligero overshoot)
- Drawer: slide desde derecha 250ms `cubic-bezier(0.16, 1, 0.3, 1)`
- Toast de confirmación al agregar al carrito: aparece 2.2s abajo-centro
- Stock dot: punto con halo de 3px de mismo color en 20% opacidad

## Modelo de datos

```ts
type Producto = {
  codigo: string;        // ej "76101"
  categoria: string;     // ej "Vidrio 3mm" | "Perfil aluminio 2\""
  descripcion: string;   // ej "Cristal Claro" | "Filtrasol"
  dimensiones: string;   // ej "1.80 x 2.60m" | "3\""
  precio: number;        // MXN
  stock: number;         // unidades disponibles
  unidad: 'hoja' | 'pieza';
  imagen?: string;       // URL — vacío = usar render SVG generativo por categoría/descripción
};

type Cotizacion = {
  folio: string;             // ej "PRE-1730000"
  fecha: string;             // ISO datetime
  estado: 'pendiente' | 'atendida';
  datos: {
    nombre: string;
    telefono: string;        // requerido, formato internacional
    email?: string;
    direccion?: string;
    notas?: string;
  };
  cart: (Producto & { cantidad: number })[];
  total: number;
};

type Empresa = {
  nombre: string;
  giro: string;
  direccion: string;
  telefono: string;
  whatsapp: string;          // con LADA, ej "+52 55 1234 5678"
  logo?: string;
};
```

## Design Tokens

```css
/* Colores */
--primary:        #0F3D6E;  /* Azul corporativo */
--primary-dark:   #0A2B4F;
--primary-light:  #E8F0F7;  /* fondo de chips, banners */
--primary-soft:   #D6E4EE;
--accent:         #E07B3F;  /* naranja para badges, destacados */
--accent-soft:    #FCE8DC;
--whatsapp:       #25D366;
--success:        #16A34A;
--warning:        #F59E0B;
--danger:         #DC2626;
--ink:            #1A2332;  /* texto principal */
--ink-mute:       #5A6878;
--ink-soft:       #93A0AE;
--bg:             #F7F9FB;  /* fondo app */
--surface:        #FFFFFF;
--border:         #E1E6EC;
--border-strong:  #C8D2DB;

/* Sombras */
--shadow-sm: 0 1px 2px rgba(15, 61, 110, 0.06);
--shadow:    0 4px 16px rgba(15, 61, 110, 0.08), 0 1px 2px rgba(15, 61, 110, 0.06);
--shadow-lg: 0 16px 48px rgba(15, 61, 110, 0.18), 0 4px 12px rgba(15, 61, 110, 0.08);

/* Radios */
--radius-sm: 5px;
--radius:    8px;
--radius-lg: 12px;
```

### Tipografía
- **Inter** (Google Fonts) — pesos 400, 500, 600, 700, 800. Uso general y display
- **JetBrains Mono** (Google Fonts) — peso 500. Códigos de producto, dimensiones, totales, folios

Escala:
- H1 hero: 28px / 700 / -0.02em
- H2: 20-24px / 700
- H3: 15-16px / 700
- Body: 14px / 400 (default)
- Small: 12-13px
- Micro: 10-11px (uppercase + letter-spacing 0.04-0.08em para etiquetas)

### Espaciado
Múltiplos de 4px. Padding más usados: 12, 14, 16, 20, 24, 28, 32, 36.

## Renders SVG generativos (placeholder de imágenes)

`glass-renders.jsx` genera SVGs distintos según el material o tipo de perfil. **En producción esto se reemplaza por imágenes reales** del producto. Lógica:

**Vidrios** (`GlassPane`): cada variante tiene una paleta de gradient + tipo de fill:
- `claro`, `filtrasol`, `bronce`, `solarblue`, `vitrosol`, `tintex` → gradient lineal
- `espejo` → gradient vertical con highlight blanco simulando reflejo
- `satinado`/`pavia` → patrón de puntos esmerilado
- `reflecta-azul`, `reflecta-bronce`, `reflecta-plata` → gradient diagonal con stops

**Perfiles aluminio** (`AluminumProfile`): cross-section 2D del perfil según el nombre — jamba (U-channel), riel (con grooves), zoclo, cerco (marco), bolsa, tapa, junquillo, esquinero, intermedio, moldura, traslape, escalonado.

## Responsive

- **Desktop (>900px)**: layouts grid 2-columnas, sidebars sticky
- **Tablet (≤900px)**: hero 1 columna, checkout 1 columna, lightbox 1 columna scrolleable, panel admin 1 columna
- **Mobile (≤600px)**: grid 2-col reducido, FAB del carrito sin texto CTA (solo total e ícono), drawer ocupa 100vw, tabla del PDF en font-size reducido

## Files

`design_reference/`:
- `index.html` — entry point, contiene **toda la hoja de estilos CSS** del sistema (líneas 13–700+). Empieza por aquí para ver tokens, componentes y responsive
- `app.jsx` — root component, manejo de modo (cliente/admin), fase (catalog/checkout), carrito y persistencia localStorage
- `catalog.jsx` — vista cliente: hero, buscador con fuzzy match, filtros, grid + lista, lightbox, drawer del carrito
- `checkout.jsx` — flujo de 3 pasos del cliente, preview del PDF y función `generatePDF()` (HTML + window.print)
- `admin.jsx` — panel admin completo: stats, lista/detalle de cotizaciones, carga de Excel (función `parseExcel`), edición de empresa
- `glass-renders.jsx` — renders SVG generativos de vidrios y perfiles
- `data.js` — catálogo precargado de los 76 productos del Excel original. Stock simulado con valores deterministas
- `Catalogo_original.xlsx` — archivo Excel real entregado por el cliente. Contiene 76 SKUs en 6 categorías. **No incluye columnas de imagen ni de stock** — añadir `Stock` o `Inventario` y `Imagen` (URL) cuando esté listo

## Recomendaciones para producción

1. **Auth y multi-tenant**: el panel admin debe estar protegido (login). Considerar si habrá múltiples vendedores con sus propias cuentas
2. **Stock en tiempo real**: actualmente cada cotización es estática. En producción, el stock debe descontarse o reservarse temporalmente cuando se confirme una cotización
3. **WhatsApp Business API**: para adjuntar el PDF automáticamente sin que el cliente tenga que hacerlo manual
4. **Imágenes reales**: agregar columna `imagen` al Excel/DB. Mostrar imagen real con fallback al render SVG generativo si falta
5. **Numeración de folio**: actualmente `PRE-` + timestamp. En producción usar secuencia atómica en DB
6. **Validación email/teléfono**: usar `libphonenumber-js` para teléfonos mexicanos
7. **Notificaciones**: email/WhatsApp al admin cuando llega una pre-cotización nueva
8. **PDF server-side**: para mejor consistencia tipográfica y poder enviarlo como adjunto, generar con puppeteer o `@react-pdf/renderer`
9. **Búsqueda en backend** cuando el catálogo crezca >500 productos. Postgres full-text search o Algolia/Meilisearch
10. **i18n**: actualmente todo está en español, dejar abierto si quieren expandir
