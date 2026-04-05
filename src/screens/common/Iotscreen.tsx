import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storage } from '../../services/storage';
import { UsuarioAuth } from '../../types';



const FLASK_BASE = 'http://192.168.18.25:5000';

type Props = { user: UsuarioAuth; onLogout: () => void };

type MedidorInfo = {
  medidor_id: number;
  numero_medidor: string;
  vivienda_id: number;
  socio_id: number;
  esp32_ip: string;
};

type Esp32Data = {
  caudal_lpm: number;
  caudal_m3h: number;
  litros_totales: number;
  m3_totales: number;
  litros_periodo: number;
  m3_periodo: number;
  flujo_activo: boolean;
  total_envios: number;
  uptime_min: number;
  ip: string;
  ultima_hora: string;
};

type Estadistica = {
  total_lecturas: number;
  total_m3: number;
  total_litros: number;
  por_dia: { fecha: string; m3: number; litros: number }[];
  ultimas: { id: number; fecha: string; hora: string; m3: number; litros: number; observacion: string }[];
};

export default function IotScreen({ user, onLogout }: Props) {
  const [medidor, setMedidor] = useState<MedidorInfo | null>(null);
  const [esp32, setEsp32] = useState<Esp32Data | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadistica | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [esp32Online, setEsp32Online] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState('--');
  const [error, setError] = useState<string | null>(null);

  // ── Obtener medidor del socio desde Flask con JWT ──
  const obtenerMedidor = useCallback(async (): Promise<MedidorInfo | null> => {
    try {
      const token = await storage.getAccessToken();
      const resp = await fetch(`${FLASK_BASE}/api/iot/mi-medidor`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) return await resp.json();
      return null;
    } catch {
      return null;
    }
  }, []);

  // ── Cargar todos los datos ──
  const cargarDatos = useCallback(async () => {
    try {
      setError(null);

      // 1. Obtener medidor del socio
      const med = medidor || await obtenerMedidor();
      if (!med) {
        setError('No tienes un medidor IoT asociado.');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (!medidor) setMedidor(med);

      const esp32Url = `http://${med.esp32_ip}/datos`;
      const statsUrl = `${FLASK_BASE}/api/iot/estadisticas/${med.medidor_id}`;
      const token    = await storage.getAccessToken();

      // 2. Consultar ESP32 y estadísticas en paralelo
      const [respEsp32, respStats] = await Promise.allSettled([
        fetch(esp32Url, { signal: AbortSignal.timeout(5000) }),
        fetch(statsUrl, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(8000),
        }),
      ]);

     if (respEsp32.status === 'fulfilled' && respEsp32.value.ok) {
  const data = await respEsp32.value.json();
  setEsp32(data);
  // Notificar si acaba de reconectarse
  if (!esp32Online) {
    Alert.alert(
      '✅ Sistema embebido conectado',
      `ESP32 en línea · IP: ${data.ip}\nMedidor: ${medidor?.numero_medidor}`,
      [{ text: 'OK' }]
    );
  }
  setEsp32Online(true);
} else {
  setEsp32Online(false);
}

      if (respStats.status === 'fulfilled' && respStats.value.ok) {
        setEstadisticas(await respStats.value.json());
      }

      const ahora = new Date();
      setUltimaActualizacion(
        `${ahora.getHours().toString().padStart(2,'0')}:${ahora.getMinutes().toString().padStart(2,'0')}:${ahora.getSeconds().toString().padStart(2,'0')}`
      );
    } catch {
      setEsp32Online(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [medidor, obtenerMedidor]);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarDatos();
  }, [cargarDatos]);

  return (
    <SafeAreaView style={s.safe}>

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>💧 Mi Medidor IoT</Text>
          <Text style={s.subtitle}>
            {medidor ? `Medidor ${medidor.numero_medidor}` : 'Cargando...'} · {ultimaActualizacion}
          </Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.btnRefresh} onPress={cargarDatos}>
            <Text style={s.btnRefreshTxt}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSalir} onPress={onLogout}>
            <Text style={s.btnSalirTxt}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ESTADO ESP32 */}
      <View style={[s.estadoBanner, { backgroundColor: esp32Online ? '#052e16' : '#1f0a0a' }]}>
        <View style={[s.estadoDot, { backgroundColor: esp32Online ? '#16a34a' : '#dc2626' }]} />
        <Text style={[s.estadoTxt, { color: esp32Online ? '#4ade80' : '#f87171' }]}>
          {esp32Online ? '● ESP32 EN LÍNEA — Datos en tiempo real' : '● ESP32 DESCONECTADO — Mostrando últimos datos'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
      >
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={s.loadingTxt}>Conectando al medidor...</Text>
          </View>
        ) : error ? (
          <View style={s.center}>
            <Text style={s.emptyIcon}>📡</Text>
            <Text style={s.errorTxt}>{error}</Text>
          </View>
        ) : (
          <>
            {/* CAUDAL EN TIEMPO REAL */}
            <View style={s.caudalHero}>
              <Text style={s.caudalLabel}>CAUDAL ACTUAL</Text>
              <Text style={s.caudalVal}>
                {esp32 ? esp32.caudal_lpm.toFixed(2) : '0.00'}
              </Text>
              <Text style={s.caudalUnit}>Litros / minuto</Text>
              <Text style={s.caudalM3}>
                {esp32 ? esp32.caudal_m3h.toFixed(4) : '0.0000'} m³/h
              </Text>
              <View style={[
                s.flujobadge,
                {
                  backgroundColor: esp32?.flujo_activo ? 'rgba(74,222,128,.15)' : 'rgba(248,113,113,.15)',
                  borderColor: esp32?.flujo_activo ? '#4ade80' : '#f87171',
                }
              ]}>
                <Text style={[s.flujotxt, { color: esp32?.flujo_activo ? '#4ade80' : '#f87171' }]}>
                  {esp32?.flujo_activo ? '● FLUJO ACTIVO' : '● FLUJO DETENIDO'}
                </Text>
              </View>
            </View>

            {/* KPIs SESIÓN */}
            <Text style={s.sectionLabel}>Consumo sesión actual</Text>
            <View style={s.kpisGrid}>
              <View style={[s.kpi, { borderTopColor: '#0ea5e9' }]}>
                <Text style={s.kpiIcon}>🪣</Text>
                <Text style={[s.kpiVal, { color: '#0ea5e9' }]}>
                  {esp32 ? esp32.litros_totales.toFixed(1) : '0.0'}
                </Text>
                <Text style={s.kpiLabel}>Litros totales</Text>
              </View>
              <View style={[s.kpi, { borderTopColor: '#10b981' }]}>
                <Text style={s.kpiIcon}>📐</Text>
                <Text style={[s.kpiVal, { color: '#10b981' }]}>
                  {esp32 ? esp32.m3_totales.toFixed(4) : '0.0000'}
                </Text>
                <Text style={s.kpiLabel}>m³ totales</Text>
              </View>
              <View style={[s.kpi, { borderTopColor: '#f59e0b' }]}>
                <Text style={s.kpiIcon}>📈</Text>
                <Text style={[s.kpiVal, { color: '#f59e0b' }]}>
                  {esp32 ? esp32.litros_periodo.toFixed(1) : '0.0'}
                </Text>
                <Text style={s.kpiLabel}>Litros período</Text>
              </View>
              <View style={[s.kpi, { borderTopColor: '#6366f1' }]}>
                <Text style={s.kpiIcon}>🧮</Text>
                <Text style={[s.kpiVal, { color: '#6366f1' }]}>
                  {esp32 ? esp32.m3_periodo.toFixed(5) : '0.00000'}
                </Text>
                <Text style={s.kpiLabel}>m³ período</Text>
              </View>
            </View>

            {/* ESTADÍSTICAS HISTÓRICAS */}
            {estadisticas && (
              <>
                <Text style={s.sectionLabel}>Consumo histórico total</Text>
                <View style={s.histCard}>
                  <View style={s.histRow}>
                    <Text style={s.histLabel}>Total litros registrados</Text>
                    <Text style={[s.histVal, { color: '#0ea5e9' }]}>
                      {estadisticas.total_litros.toFixed(1)} L
                    </Text>
                  </View>
                  <View style={s.histRow}>
                    <Text style={s.histLabel}>Total m³ registrados</Text>
                    <Text style={[s.histVal, { color: '#10b981' }]}>
                      {estadisticas.total_m3.toFixed(5)} m³
                    </Text>
                  </View>
                  <View style={s.histRow}>
                    <Text style={s.histLabel}>Total lecturas IoT</Text>
                    <Text style={[s.histVal, { color: '#f59e0b' }]}>
                      {estadisticas.total_lecturas}
                    </Text>
                  </View>
                </View>

                {estadisticas.por_dia.length > 0 && (
                  <>
                    <Text style={s.sectionLabel}>Consumo por día</Text>
                    <View style={s.diaCard}>
                      {estadisticas.por_dia.slice(0, 7).map((d, i) => (
                        <View key={i} style={s.diaRow}>
                          <Text style={s.diaFecha}>{d.fecha}</Text>
                          <View style={s.diaBarWrap}>
                            <View style={[s.diaBar, {
                              width: `${Math.min(100, (d.litros / (estadisticas.por_dia[0]?.litros || 1)) * 100)}%` as any
                            }]} />
                          </View>
                          <Text style={s.diaVal}>{d.litros.toFixed(1)} L</Text>
                          <Text style={s.diaM3}>{d.m3.toFixed(4)} m³</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {estadisticas.ultimas.length > 0 && (
                  <>
                    <Text style={s.sectionLabel}>Últimas lecturas</Text>
                    {estadisticas.ultimas.slice(0, 5).map((l, i) => (
                      <View key={i} style={s.lecturaCard}>
                        <View style={s.lecturaHeader}>
                          <Text style={s.lecturaFecha}>📅 {l.fecha} {l.hora}</Text>
                          <View style={s.iotBadge}><Text style={s.iotBadgeTxt}>IoT</Text></View>
                        </View>
                        <View style={s.lecturaData}>
                          <View style={s.lecturaDato}>
                            <Text style={s.datoLabel}>Litros</Text>
                            <Text style={[s.datoVal, { color: '#0ea5e9' }]}>{l.litros.toFixed(2)}</Text>
                          </View>
                          <View style={s.lecturaDato}>
                            <Text style={s.datoLabel}>m³</Text>
                            <Text style={[s.datoVal, { color: '#10b981' }]}>{l.m3.toFixed(5)}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}

            {/* INFO DISPOSITIVO */}
            <Text style={s.sectionLabel}>Información del dispositivo</Text>
            <View style={s.deviceCard}>
              <DeviceRow label="Medidor" value={medidor?.numero_medidor || '--'} />
              <DeviceRow label="IP del ESP32" value={esp32?.ip || medidor?.esp32_ip || '--'} />
              <DeviceRow label="Uptime" value={`${esp32?.uptime_min || 0} minutos`} />
              <DeviceRow label="Envíos al servidor" value={String(esp32?.total_envios || 0)} />
              <DeviceRow label="Última lectura" value={esp32?.ultima_hora || '--'} />
              <DeviceRow label="Sensor" value="YF-S201 — GPIO4" />
              <DeviceRow label="Calibración" value="7.5 pulsos/L" />
              <DeviceRow label="Intervalo envío" value="5 minutos" />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DeviceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={dr.row}>
      <Text style={dr.label}>{label}</Text>
      <Text style={dr.value}>{value}</Text>
    </View>
  );
}

const dr = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(51,65,85,.5)' },
  label: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  value: { fontSize: 13, color: '#e2e8f0', fontWeight: '700', fontFamily: 'monospace' },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  title: { fontSize: 20, fontWeight: '800', color: '#f1f5f9' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnRefresh: { backgroundColor: 'rgba(14,165,233,.15)', width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#0ea5e9' },
  btnRefreshTxt: { fontSize: 18, color: '#0ea5e9' },
  btnSalir: { backgroundColor: '#dc2626', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  btnSalirTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  estadoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  estadoDot: { width: 8, height: 8, borderRadius: 4 },
  estadoTxt: { fontSize: 12, fontWeight: '700' },
  scroll: { padding: 16, gap: 14, paddingBottom: 100 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  loadingTxt: { color: '#64748b', fontSize: 15 },
  emptyIcon: { fontSize: 40 },
  errorTxt: { color: '#f87171', fontSize: 15, textAlign: 'center' },
  caudalHero: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#334155' },
  caudalLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: .8 },
  caudalVal: { fontSize: 52, fontWeight: '800', color: '#0ea5e9', lineHeight: 60 },
  caudalUnit: { fontSize: 14, color: '#94a3b8' },
  caudalM3: { fontSize: 13, color: '#10b981', fontFamily: 'monospace' },
  flujobadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5, marginTop: 8 },
  flujotxt: { fontSize: 13, fontWeight: '800' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: .8 },
  kpisGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: { width: '47%', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, borderTopWidth: 3, gap: 4 },
  kpiIcon: { fontSize: 22 },
  kpiVal: { fontSize: 20, fontWeight: '800' },
  kpiLabel: { fontSize: 11, color: '#64748b' },
  histCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(51,65,85,.5)' },
  histLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  histVal: { fontSize: 15, fontWeight: '800', fontFamily: 'monospace' },
  diaCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: '#334155' },
  diaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diaFecha: { fontSize: 11, color: '#64748b', width: 80 },
  diaBarWrap: { flex: 1, height: 8, backgroundColor: '#0f172a', borderRadius: 999, overflow: 'hidden' },
  diaBar: { height: '100%', backgroundColor: '#0ea5e9', borderRadius: 999 },
  diaVal: { fontSize: 11, color: '#0ea5e9', fontWeight: '700', width: 55, textAlign: 'right' },
  diaM3: { fontSize: 10, color: '#10b981', width: 65, textAlign: 'right' },
  lecturaCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: '#334155' },
  lecturaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lecturaFecha: { fontSize: 12, color: '#64748b' },
  iotBadge: { backgroundColor: 'rgba(14,165,233,.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: '#0ea5e9' },
  iotBadgeTxt: { color: '#0ea5e9', fontSize: 10, fontWeight: '700' },
  lecturaData: { flexDirection: 'row', gap: 8 },
  lecturaDato: { flex: 1, backgroundColor: '#0f172a', borderRadius: 8, padding: 10 },
  datoLabel: { fontSize: 9, color: '#475569', textTransform: 'uppercase', marginBottom: 2 },
  datoVal: { fontSize: 16, fontWeight: '800', fontFamily: 'monospace' },
  deviceCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
});