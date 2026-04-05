import React, { useEffect, useState } from 'react';
import {
  Alert, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView, Linking,
} from 'react-native';
import { hidroService } from '../../services/hidroService';
import { PuntoIncidencia, UsuarioAuth } from '../../types';

export default function MapaIncidenciasScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [items, setItems] = useState<PuntoIncidencia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setItems(await hidroService.incidenciasMapa());
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo cargar el mapa de incidencias.');
    } finally {
      setLoading(false);
    }
  }

  const abiertas = items.filter(i => i.estado !== 'CERRADA' && i.estado !== 'COMPLETADA').length;
  const cerradas = items.filter(i => i.estado === 'CERRADA' || i.estado === 'COMPLETADA').length;

  function getEstadoColor(estado: string) {
    if (estado === 'CERRADA' || estado === 'COMPLETADA') return { bg: '#d1e7dd', txt: '#0f5132', dot: '#16a34a' };
    if (estado === 'EN_PROCESO') return { bg: '#cfe2ff', txt: '#084298', dot: '#0d6efd' };
    return { bg: '#fff3cd', txt: '#856404', dot: '#f59e0b' };
  }

  function getPrioridadColor(prioridad: string) {
    if (prioridad === 'ALTA') return { bg: '#fee2e2', txt: '#dc2626' };
    if (prioridad === 'MEDIA') return { bg: '#fff3cd', txt: '#856404' };
    return { bg: '#d1e7dd', txt: '#0f5132' };
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Mapa de incidencias</Text>
          <Text style={s.subtitle}>Ubicaciones reportadas</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.btnRefresh} onPress={load}>
            <Text style={s.btnRefreshTxt}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSalir} onPress={onLogout}>
            <Text style={s.btnSalirTxt}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPIs */}
      <View style={s.kpis}>
        <View style={[s.kpi, { borderLeftColor: '#1a5fa8' }]}>
          <Text style={s.kpiVal}>{items.length}</Text>
          <Text style={s.kpiLabel}>Total</Text>
        </View>
        <View style={[s.kpi, { borderLeftColor: '#f59e0b' }]}>
          <Text style={[s.kpiVal, { color: '#f59e0b' }]}>{abiertas}</Text>
          <Text style={s.kpiLabel}>Abiertas</Text>
        </View>
        <View style={[s.kpi, { borderLeftColor: '#16a34a' }]}>
          <Text style={[s.kpiVal, { color: '#16a34a' }]}>{cerradas}</Text>
          <Text style={s.kpiLabel}>Cerradas</Text>
        </View>
      </View>

      {/* CONTENIDO */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#1a5fa8" />
          <Text style={s.loadingTxt}>Cargando incidencias...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>🗺️</Text>
          <Text style={s.emptyTxt}>No hay incidencias con coordenadas.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {items.map(item => {
            const estado = getEstadoColor(item.estado);
            const prioridad = getPrioridadColor(item.prioridad);
            return (
              <View key={item.id} style={[s.card, { borderLeftColor: estado.dot }]}>

                {/* Header de la tarjeta */}
                <View style={s.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle} numberOfLines={1}>
                      {item.titulo || item.tipo_incidencia}
                    </Text>
                    <Text style={s.cardMeta}>
                      {item.sector || 'Sin sector'} · {item.usuario || 'Sistema'}
                    </Text>
                  </View>
                  <Text style={s.cardId}>#{item.id}</Text>
                </View>

                {/* Badges */}
                <View style={s.badgeRow}>
                  <View style={[s.badge, { backgroundColor: estado.bg }]}>
                    <View style={[s.badgeDot, { backgroundColor: estado.dot }]} />
                    <Text style={[s.badgeTxt, { color: estado.txt }]}>{item.estado}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: prioridad.bg }]}>
                    <Text style={[s.badgeTxt, { color: prioridad.txt }]}>
                      {item.prioridad === 'ALTA' ? '🔴' : item.prioridad === 'MEDIA' ? '🟡' : '🟢'} {item.prioridad}
                    </Text>
                  </View>
                </View>

                {/* Fecha */}
                <Text style={s.cardFecha}>
                  📅 {item.fecha_reporte} {item.hora_reporte}
                </Text>

                {/* Coordenadas */}
                {item.latitud != null && item.longitud != null ? (
                  <View style={s.coordRow}>
                    <View style={s.coordBox}>
                      <Text style={s.coordLabel}>Latitud</Text>
                      <Text style={s.coordVal}>{Number(item.latitud).toFixed(6)}</Text>
                    </View>
                    <View style={s.coordBox}>
                      <Text style={s.coordLabel}>Longitud</Text>
                      <Text style={s.coordVal}>{Number(item.longitud).toFixed(6)}</Text>
                    </View>
                    <TouchableOpacity
                      style={s.btnMapa}
                      onPress={() => Linking.openURL(`https://www.google.com/maps?q=${item.latitud},${item.longitud}`)}
                    >
                      <Text style={s.btnMapaTxt}>🗺️ Ver mapa</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={s.sinCoords}>📍 Sin coordenadas GPS</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnRefresh: {
    backgroundColor: '#e0ecff', width: 36, height: 36,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  btnRefreshTxt: { fontSize: 18, color: '#1a5fa8' },
  btnSalir: { backgroundColor: '#dc2626', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  btnSalirTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  kpis: {
    flexDirection: 'row', gap: 10, padding: 14,
    backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  kpi: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderLeftWidth: 4 },
  kpiVal: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  kpiLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { color: '#64748b', fontSize: 15 },
  emptyIcon: { fontSize: 40 },
  emptyTxt: { color: '#94a3b8', fontSize: 16 },
  list: { padding: 14, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderLeftWidth: 4, gap: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1 },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  cardId: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginLeft: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeDot: { width: 7, height: 7, borderRadius: 999 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  cardFecha: { fontSize: 12, color: '#64748b' },
  coordRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  coordBox: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 8, padding: 8, minWidth: 100 },
  coordLabel: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  coordVal: { fontSize: 12, fontWeight: '600', color: '#334155', fontFamily: 'monospace' },
  btnMapa: { backgroundColor: '#1a5fa8', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  btnMapaTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sinCoords: { fontSize: 12, color: '#94a3b8' },
});