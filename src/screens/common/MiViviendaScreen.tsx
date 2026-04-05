import React, { useEffect, useState } from 'react';
import {
  Alert, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hidroService } from '../../services/hidroService';
import { MiVivienda } from '../../types';

type Props = { onLogout: () => void };

export default function MiViviendaScreen({ onLogout }: Props) {
  const [data, setData] = useState<MiVivienda | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setData(await hidroService.miVivienda());
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo cargar la vivienda.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Mi vivienda</Text>
          <Text style={s.subtitle}>Domicilio y medidor registrado</Text>
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

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#1a5fa8" />
          <Text style={s.loadingTxt}>Cargando datos...</Text>
        </View>
      ) : !data ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>🏠</Text>
          <Text style={s.emptyTxt}>No hay vivienda asociada.</Text>
          <Text style={s.emptyHint}>Contacta al administrador para registrar tu vivienda.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>

          {/* HERO VIVIENDA */}
          <View style={s.hero}>
            <View style={s.heroIcon}>
              <Text style={s.heroIconTxt}>🏠</Text>
            </View>
            <Text style={s.heroCodigo}>{data.codigo_vivienda || 'Vivienda registrada'}</Text>
            <Text style={s.heroSector}>{data.sector || 'Sin sector'}</Text>
            <View style={s.activeBadge}>
              <Text style={s.activeBadgeTxt}>✓ Vinculado al sistema</Text>
            </View>
          </View>

          {/* UBICACIÓN */}
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <Text style={s.cardIcon}>📍</Text>
              <Text style={s.cardTitle}>Ubicación</Text>
            </View>
            <DataRow label="Dirección" value={data.direccion || '-'} />
            <DataRow label="Referencia" value={data.referencia || '-'} />
            <DataRow label="Sector" value={data.sector || '-'} />
            {(data.latitud || data.longitud) && (
              <View style={s.coordsRow}>
                <View style={s.coordBox}>
                  <Text style={s.coordLabel}>Latitud</Text>
                  <Text style={s.coordVal}>{data.latitud != null ? Number(data.latitud).toFixed(6) : '-'}</Text>
                </View>
                <View style={s.coordBox}>
                  <Text style={s.coordLabel}>Longitud</Text>
                  <Text style={s.coordVal}>{data.longitud != null ? Number(data.longitud).toFixed(6) : '-'}</Text>
                </View>
              </View>
            )}
          </View>

          {/* MEDIDOR */}
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <Text style={s.cardIcon}>⚡</Text>
              <Text style={s.cardTitle}>Medidor</Text>
            </View>
            <View style={s.medidorBox}>
              <Text style={s.medidorNum}>{data.numero_medidor || 'No asignado'}</Text>
              <Text style={s.medidorLabel}>Número de medidor</Text>
            </View>
            <DataRow label="Código socio" value={data.codigo_socio || '-'} />
          </View>

          {/* INFO ADICIONAL */}
          {(data as any).tipo_vivienda && (
            <View style={s.card}>
              <View style={s.cardTitleRow}>
                <Text style={s.cardIcon}>🏘️</Text>
                <Text style={s.cardTitle}>Información adicional</Text>
              </View>
              <DataRow label="Tipo" value={(data as any).tipo_vivienda || '-'} />
              {(data as any).estado_servicio && (
                <DataRow label="Estado servicio" value={(data as any).estado_servicio} />
              )}
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DataRow({ label, value }: { label: string; value: any }) {
  return (
    <View style={dr.row}>
      <Text style={dr.label}>{label}</Text>
      <Text style={dr.value}>{String(value)}</Text>
    </View>
  );
}

const dr = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  label: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  value: { fontSize: 13, color: '#0f172a', fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 16 },
});

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
  btnRefresh: { backgroundColor: '#e0ecff', width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnRefreshTxt: { fontSize: 18, color: '#1a5fa8' },
  btnSalir: { backgroundColor: '#dc2626', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  btnSalirTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingTxt: { color: '#64748b', fontSize: 15 },
  emptyIcon: { fontSize: 48 },
  emptyTxt: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  emptyHint: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 30 },
  scroll: { padding: 16, gap: 14 },
  hero: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 8,
    shadowColor: '#0f172a', shadowOpacity: .05, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#e0ecff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroIconTxt: { fontSize: 34 },
  heroCodigo: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  heroSector: { fontSize: 14, color: '#64748b' },
  activeBadge: { backgroundColor: '#d1e7dd', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, marginTop: 4 },
  activeBadgeTxt: { color: '#0f5132', fontWeight: '700', fontSize: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 2,
    shadowColor: '#0f172a', shadowOpacity: .04, shadowRadius: 8, elevation: 2,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardIcon: { fontSize: 18 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  coordsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  coordBox: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 8, padding: 10 },
  coordLabel: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  coordVal: { fontSize: 12, fontWeight: '600', color: '#334155', fontFamily: 'monospace' },
  medidorBox: {
    backgroundColor: '#e0ecff', borderRadius: 12, padding: 16,
    alignItems: 'center', marginVertical: 8,
  },
  medidorNum: { fontSize: 24, fontWeight: '800', color: '#1a5fa8', fontFamily: 'monospace' },
  medidorLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
});