import pandas as pd

df = pd.read_excel('LISTA CLIENTES.xlsx', sheet_name=1)

# Limpiar nombres de columnas
df.columns = [c.strip() for c in df.columns]

records = []
for _, row in df.iterrows():
    codigo = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ''
    descripcion = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ''
    grupo = str(row.iloc[2]).strip() if pd.notna(row.iloc[2]) else ''
    subclasificacion = str(row.iloc[3]).strip() if pd.notna(row.iloc[3]) else ''
    color = str(row.iloc[4]).strip() if pd.notna(row.iloc[4]) else ''
    stock_raw = row.iloc[6]
    stock = int(float(stock_raw)) if pd.notna(stock_raw) else 0

    if codigo and descripcion:
        records.append({
            'codigo': codigo,
            'descripcion': descripcion,
            'grupo': grupo,
            'subclasificacion': subclasificacion,
            'color': color,
            'stock': stock
        })

lines = ['import { Producto } from "./types";', '', 'export const CATALOG_DATA: Producto[] = [']

for r in records:
    desc = r['descripcion'].replace('"', '\\"')
    grupo = r['grupo'].replace('"', '\\"')
    sub = r['subclasificacion'].replace('"', '\\"')
    color = r['color'].replace('"', '\\"')
    lines.append(f'  {{ codigo: "{r["codigo"]}", descripcion: "{desc}", grupo: "{grupo}", subclasificacion: "{sub}", color: "{color}", stock: {r["stock"]} }},')

lines.append('];')
lines.append('')

with open('lib/catalog-data.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'Generados {len(records)} productos en lib/catalog-data.ts')
