export type Rol = 'ADMIN' | 'TECNICO' | 'SOCIO';

export type UsuarioAuth = {
  id: number;
  nombre: string;
  username: string;
  email?: string | null;
  telefono?: string | null;
  rol: Rol;
  foto_perfil?: string | null;
  estado?: string | null;
};

export type AuthResponse = {
  mensaje: string;
  access_token: string;
  refresh_token?: string;
  usuario: UsuarioAuth;
};

export type TokenInfo = {
  sub: string;
  jti?: string;
  type?: string;
  claims?: Record<string, unknown>;
};

export type Aviso = {
  id: number;
  titulo: string;
  contenido: string;
  tipo_aviso: string;
  prioridad: string;
  fecha_publicacion: string;
  hora_publicacion: string;
  fecha_inicio?: string | null;
  hora_inicio?: string | null;
  fecha_fin?: string | null;
  hora_fin?: string | null;
};

export type Lectura = {
  id: number;
  socio?: string | null;
  cedula?: string | null;
  medidor?: string | null;
  direccion?: string | null;
  lectura_anterior?: number | null;
  lectura_actual: number;
  consumo_calculado?: number | null;
  indicador?: string | null;
  fecha_lectura: string;
  hora_lectura: string;
  latitud?: number | null;
  longitud?: number | null;
  estado: string;
  observacion?: string | null;
  evidencias: string[];
};

export type Incidencia = {
  id: number;
  tipo_incidencia: string;
  titulo?: string | null;
  descripcion: string;
  prioridad: string;
  estado: string;
  fecha_reporte: string;
  hora_reporte: string;
  latitud?: number | null;
  longitud?: number | null;
  sector?: string | null;
  vivienda?: string | null;
  usuario?: string | null;
  evidencias: string[];
};

export type Planilla = {
  id: number;
  numero_planilla: string;
  socio?: string | null;
  periodo_anio: number;
  periodo_mes: number;
  consumo_m3: number;
  total_pagar: number;
  estado: string;
  fecha_emision?: string | null;
  fecha_pago?: string | null;
};

export type RecaudacionResumen = {
  total_recaudado: number;
  total_pendiente: number;
  planillas_pagadas: number;
  pagos_registrados: number;
};

export type MiVivienda = {
  vivienda_id: number;
  codigo_vivienda?: string | null;
  direccion: string;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  sector?: string | null;
  numero_medidor?: string | null;
  codigo_socio?: string | null;
};

export type UsuarioListado = {
  id: number;
  cedula?: string | null;
  nombre: string;
  username: string;
  email?: string | null;
  telefono?: string | null;
  rol: Rol;
  foto_perfil?: string | null;
  estado: string;
  codigo_socio?: string | null;
  numero_medidor?: string | null;
  direccion?: string | null;
  sector?: string | null;
};

export type MedidorListado = {
  id: number;
  numero_medidor: string;
  socio: string;
  cedula?: string | null;
  direccion?: string | null;
  sector?: string | null;
  latitud?: number | null;
  longitud?: number | null;
};


export type Notificacion = {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  leido: boolean;
  fecha: string;
  hora: string;
  referencia_tabla?: string | null;
  referencia_id?: number | null;
};

export type Mensaje = {
  id: number;
  asunto: string;
  contenido: string;
  estado: string;
  leido: boolean;
  fecha: string;
  hora: string;
  remitente?: string | null;
  destinatario?: string | null;
  remitente_id?: number;
  destinatario_id?: number;
};

export type OrdenTrabajo = {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  fecha: string;
  hora: string;
  latitud?: number | null;
  longitud?: number | null;
  tecnico?: string | null;
  incidencia_id?: number | null;
  materiales_usados?: string | null;
  fecha_finalizacion?: string | null;
  hora_finalizacion?: string | null;
  evidencias: string[];
};

export type ConsumoSemestral = {
  etiqueta: string;
  consumo_m3: number;
  total_pagar: number;
  estado: string;
};


export type Pago = {
  id: number;
  planilla_id: number;
  socio_id?: number;
  vivienda_id?: number;
  valor_pagado: number;
  fecha_pago: string;
  hora_pago: string;
  metodo_pago?: string | null;
  referencia_pago?: string | null;
  observacion?: string | null;
  registrado_por?: string | null;
};

export type MovimientoCaja = {
  id: number;
  tipo_movimiento: string;
  categoria?: string | null;
  descripcion?: string | null;
  monto: number;
  fecha: string;
  hora: string;
  registrado_por?: string | null;
};

export type Reunion = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  lugar?: string | null;
  fecha: string;
  hora: string;
  estado: string;
};

export type Recordatorio = {
  id: number;
  usuario_id: number;
  titulo: string;
  descripcion?: string | null;
  tipo: string;
  fecha: string;
  hora: string;
  enviado: boolean;
};

export type TarifaAsignada = {
  id: number;
  socio_id?: number | null;
  vivienda_id?: number | null;
  nombre: string;
  base_consumo_m3: number;
  valor_base: number;
  valor_adicional_m3: number;
  multa_atraso: number;
  estado: string;
};

export type PuntoIncidencia = {
  id: number;
  tipo_incidencia: string;
  titulo?: string | null;
  estado: string;
  prioridad: string;
  latitud?: number | null;
  longitud?: number | null;
  sector?: string | null;
  usuario?: string | null;
  fecha_reporte: string;
  hora_reporte: string;
};


export type CajaResumen = {
  total_registros: number;
  ingresos: number;
  egresos: number;
  saldo: number;
};

export type ReclamoLectura = {
  id: number;
  lectura_id: number;
  motivo: string;
  descripcion?: string | null;
  estado: string;
  fecha: string;
  hora: string;
  reportado_por?: string | null;
};
