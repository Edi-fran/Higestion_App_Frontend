import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { apiDelete, apiGet, apiPost, apiPostForm, apiPut, toRootUrl } from './api';
import {
  Aviso,
  CajaResumen,
  ConsumoSemestral,
  Incidencia,
  Lectura,
  MedidorListado,
  Mensaje,
  MiVivienda,
  MovimientoCaja,
  Notificacion,
  OrdenTrabajo,
  Pago,
  Planilla,
  RecaudacionResumen,
  ReclamoLectura,
  Recordatorio,
  Reunion,
  TarifaAsignada,
  UsuarioListado,
} from '../types';

export async function pickEvidence() {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0];
}

export async function pickImageFromLibrary() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0];
}

export async function getCurrentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Permiso de ubicación denegado.');
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitud: pos.coords.latitude,
    longitud: pos.coords.longitude,
  };
}

export const hidroService = {
  listAvisos() {
    return apiGet<Aviso[]>('/avisos', false);
  },

  createAviso(data: {
    titulo: string;
    contenido: string;
    tipo_aviso?: string;
    prioridad?: string;
  }) {
    return apiPost('/avisos', data);
  },

  updateAviso(id: number, data: Partial<Aviso> & { contenido?: string }) {
    return apiPut(`/avisos/${id}`, data);
  },

  deleteAviso(id: number) {
    return apiDelete(`/avisos/${id}`);
  },

  listLecturas() {
    return apiGet<Lectura[]>('/lecturas');
  },

  exportLecturasCsvUrl() {
    return toRootUrl('/api/lecturas/reporte.csv');
  },

  listIncidencias(publicOnly = false) {
    return apiGet<Incidencia[]>('/incidencias', !publicOnly);
  },

  listPlanillas() {
    return apiGet<Planilla[]>('/planillas');
  },

  listAportes() {
    return apiGet<any[]>('/aportes');
  },

  downloadPlanillaUrl(id: number) {
    return toRootUrl(`/api/planillas/${id}/descargar`);
  },

  listRecaudacionResumen() {
    return apiGet<RecaudacionResumen>('/aportes/recaudacion-resumen');
  },

  miVivienda() {
    return apiGet<MiVivienda>('/mi-vivienda');
  },

  listUsuarios(q = '') {
    return apiGet<UsuarioListado[]>(
      `/usuarios${q ? `?q=${encodeURIComponent(q)}` : ''}`
    );
  },

  createUsuarioSocio(data: FormData) {
    return apiPostForm('/usuarios', data);
  },

  updateUsuario(id: number, data: Record<string, any>) {
    return apiPut(`/usuarios/${id}`, data);
  },

  deleteUsuario(id: number) {
    return apiDelete(`/usuarios/${id}`);
  },

  listMedidores(q = '') {
    return apiGet<MedidorListado[]>(
      `/medidores${q ? `?q=${encodeURIComponent(q)}` : ''}`
    );
  },

  updateMedidor(id: number, data: Record<string, any>) {
    return apiPut(`/medidores/${id}`, data);
  },

  deleteMedidor(id: number) {
    return apiDelete(`/medidores/${id}`);
  },

  updateLectura(id: number, data: Record<string, any>) {
    return apiPut(`/lecturas/${id}`, data);
  },

  deleteLectura(id: number) {
    return apiDelete(`/lecturas/${id}`);
  },

  updateIncidencia(id: number, data: Record<string, any>) {
    return apiPut(`/incidencias/${id}`, data);
  },

  deleteIncidencia(id: number) {
    return apiDelete(`/incidencias/${id}`);
  },

  listNotificaciones() {
    return apiGet<Notificacion[]>('/notificaciones');
  },

  syncNotificaciones() {
    return apiPost('/notificaciones/sincronizar', {});
  },

  readNotificacion(id: number) {
    return apiPut(`/notificaciones/${id}/leer`, {});
  },

  listMensajes() {
    return apiGet<Mensaje[]>('/mensajes');
  },

  sendMensaje(data: {
    destinatario_id?: number;
    asunto: string;
    contenido: string;
  }) {
    return apiPost('/mensajes', data);
  },

  createMensaje(data: {
    destinatario_id?: number;
    asunto: string;
    contenido: string;
  }) {
    return apiPost('/mensajes', data);
  },

  readMensaje(id: number) {
    return apiPut(`/mensajes/${id}/leer`, {});
  },

  resumenMovimientosCaja(desde?: string, hasta?: string) {
    const q = new URLSearchParams();
    if (desde) q.set('desde', desde);
    if (hasta) q.set('hasta', hasta);

    return apiGet<CajaResumen & { items: MovimientoCaja[] }>(
      `/movimientos-caja/resumen${q.toString() ? `?${q.toString()}` : ''}`
    );
  },

  createEgresoCaja(data: {
    monto: number;
    categoria?: string;
    descripcion?: string;
    fecha?: string;
    hora?: string;
  }) {
    return apiPost('/movimientos-caja/egreso', data);
  },

  reclamarLectura(id: number, data: { motivo: string; descripcion?: string }) {
    return apiPost(`/lecturas/${id}/reclamar`, data);
  },

  anularRecalcularLectura(
    id: number,
    data: { motivo?: string; lectura_correcta?: number }
  ) {
    return apiPost(`/lecturas/${id}/anular-recalcular`, data);
  },

  listReclamosLectura() {
    return apiGet<ReclamoLectura[]>('/lecturas/reclamos');
  },

  listPagos() {
    return apiGet<Pago[]>('/pagos');
  },

  listMovimientosCaja() {
    return apiGet<MovimientoCaja[]>('/movimientos-caja');
  },

  listReuniones() {
    return apiGet<Reunion[]>('/reuniones');
  },

  createReunion(data: Partial<Reunion>) {
    return apiPost('/reuniones', data);
  },

  updateReunion(id: number, data: Partial<Reunion>) {
    return apiPut(`/reuniones/${id}`, data);
  },

  deleteReunion(id: number) {
    return apiDelete(`/reuniones/${id}`);
  },

  listRecordatorios() {
    return apiGet<Recordatorio[]>('/recordatorios');
  },

  createRecordatorio(data: Partial<Recordatorio> & { usuario_id: number }) {
    return apiPost('/recordatorios', data);
  },

  updateRecordatorio(id: number, data: Partial<Recordatorio>) {
    return apiPut(`/recordatorios/${id}`, data);
  },

  deleteRecordatorio(id: number) {
    return apiDelete(`/recordatorios/${id}`);
  },

  listTarifasAsignadas() {
    return apiGet<TarifaAsignada[]>('/tarifas-asignadas');
  },

  createTarifaAsignada(data: Partial<TarifaAsignada>) {
    return apiPost('/tarifas-asignadas', data);
  },

  updateTarifaAsignada(id: number, data: Partial<TarifaAsignada>) {
    return apiPut(`/tarifas-asignadas/${id}`, data);
  },

  deleteTarifaAsignada(id: number) {
    return apiDelete(`/tarifas-asignadas/${id}`);
  },

  syncPlanillaAlerts() {
    return apiPost('/planillas/sincronizar-alertas', {});
  },

  obtenerComprobanteUrl(id: number) {
    return toRootUrl(`/api/planillas/${id}/comprobante`);
  },

  getOrdenRespaldo(id: number) {
    return apiGet<any>(`/ordenes/${id}/respaldo`);
  },

  listOrdenes() {
    return apiGet<OrdenTrabajo[]>('/ordenes');
  },

  createOrden(data: FormData) {
    return apiPostForm('/ordenes', data);
  },

  finalizarOrden(id: number, data: FormData) {
    return apiPostForm(`/ordenes/${id}/finalizar`, data);
  },

  estadisticaSemestral() {
    return apiGet<ConsumoSemestral[]>('/planillas/estadistica-semestral');
  },

  incidenciasMapa() {
    return apiGet<any[]>('/incidencias/mapa');
  },

  async createLectura(data: {
    vivienda_id?: number;
    lectura_actual: number;
    observacion?: string;
    latitud?: number;
    longitud?: number;
    numero_medidor?: string;
    cedula?: string;
    evidencia?: {
      uri: string;
      fileName?: string;
      mimeType?: string;
    } | null;
  }) {
    const form = new FormData();

    if (data.vivienda_id) form.append('vivienda_id', String(data.vivienda_id));
    if (data.numero_medidor) form.append('numero_medidor', data.numero_medidor);
    if (data.cedula) form.append('cedula', data.cedula);

    form.append('lectura_actual', String(data.lectura_actual));

    if (data.observacion) form.append('observacion', data.observacion);
    if (data.latitud != null) form.append('latitud', String(data.latitud));
    if (data.longitud != null) form.append('longitud', String(data.longitud));

    if (data.evidencia?.uri) {
      form.append(
        'evidencia',
        {
          uri: data.evidencia.uri,
          name: data.evidencia.fileName || 'lectura.jpg',
          type: data.evidencia.mimeType || 'image/jpeg',
        } as any
      );
    }

    return apiPostForm('/lecturas', form);
  },

  async createIncidencia(data: {
    tipo_incidencia: string;
    titulo?: string;
    descripcion: string;
    prioridad?: string;
    visible_publicamente?: boolean;
    latitud?: number;
    longitud?: number;
    vivienda_id?: number;
    evidencia?: {
      uri: string;
      fileName?: string;
      mimeType?: string;
    } | null;
  }) {
    const form = new FormData();

    form.append('tipo_incidencia', data.tipo_incidencia);
    form.append('descripcion', data.descripcion);

    if (data.titulo) form.append('titulo', data.titulo);
    if (data.vivienda_id) form.append('vivienda_id', String(data.vivienda_id));

    form.append('prioridad', data.prioridad || 'MEDIA');
    form.append(
      'visible_publicamente',
      data.visible_publicamente ? '1' : '0'
    );

    if (data.latitud != null) form.append('latitud', String(data.latitud));
    if (data.longitud != null) form.append('longitud', String(data.longitud));

    if (data.evidencia?.uri) {
      form.append(
        'evidencia',
        {
          uri: data.evidencia.uri,
          name: data.evidencia.fileName || 'incidencia.jpg',
          type: data.evidencia.mimeType || 'image/jpeg',
        } as any
      );
    }

    return apiPostForm('/incidencias', form);
  },

  async addSeguimientoIncidencia(
    id: number,
    data: {
      accion_realizada: string;
      observacion?: string;
      estado_nuevo?: string;
      materiales_usados?: string;
      latitud?: number;
      longitud?: number;
      evidencia?: {
        uri: string;
        fileName?: string;
        mimeType?: string;
      } | null;
    }
  ) {
    const form = new FormData();

    form.append('accion_realizada', data.accion_realizada);

    if (data.observacion) form.append('observacion', data.observacion);
    if (data.estado_nuevo) form.append('estado_nuevo', data.estado_nuevo);
    if (data.materiales_usados) {
      form.append('materiales_usados', data.materiales_usados);
    }
    if (data.latitud != null) form.append('latitud', String(data.latitud));
    if (data.longitud != null) form.append('longitud', String(data.longitud));

    if (data.evidencia?.uri) {
      form.append(
        'evidencia',
        {
          uri: data.evidencia.uri,
          name: data.evidencia.fileName || 'seguimiento.jpg',
          type: data.evidencia.mimeType || 'image/jpeg',
        } as any
      );
    }

    return apiPostForm(`/incidencias/${id}/seguimiento`, form);
  },

  marcarPlanillaPagada(
    planilla_id: number,
    data: {
      valor_pagado?: number;
      metodo_pago?: string;
      referencia_pago?: string;
      observacion?: string;
    }
  ) {
    return apiPost(`/planillas/${planilla_id}/marcar-pagado`, data);
  },

  createAporte(data: {
    vivienda_id: number;
    periodo_anio: number;
    periodo_mes: number;
    valor: number;
    tipo_aporte?: string;
    fecha_vencimiento?: string;
    estado_pago?: string;
  }) {
    return apiPost('/aportes', data);
  },
};