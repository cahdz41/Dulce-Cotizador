export type Producto = {
  id?: string;
  codigo: string;
  descripcion: string;
  grupo: string;
  subclasificacion: string;
  color: string;
  stock: number;
  imagen?: string;
};

export type CartItem = Producto & {
  cantidad: number;
  corte?: "horizontal" | "vertical";
};

export type DatosCliente = {
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  notas?: string;
};

export type Cotizacion = {
  id?: string;
  folio: string;
  fecha: string;
  estado: "pendiente" | "atendida";
  datos: DatosCliente;
  cart: CartItem[];
};

export type VentaCerrada = {
  id?: string;
  quote_id: string;
  folio: string;
  fecha: string;
  cliente_nombre: string;
  cliente_telefono?: string;
  cliente_email?: string;
  monto: number;
  productos: CartItem[];
};

export type Empresa = {
  nombre: string;
  giro: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  logo?: string;
};

export const defaultEmpresa: Empresa = {
  nombre: "Vidrios y Aluminio El Castillo",
  giro: "Distribución de vidrios y perfiles de aluminio",
  direccion: "Av. Principal #123, Col. Centro",
  telefono: "+52 55 1234 5678",
  whatsapp: "+52 55 1234 5678",
};
