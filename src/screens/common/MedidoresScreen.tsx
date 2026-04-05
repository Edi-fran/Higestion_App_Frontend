import React, { useEffect, useState } from 'react';
import {
  Alert, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hidroService } from '../../services/hidroService';
import { MedidorListado, UsuarioAuth } from '../../types';

export default function MedidoresScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [items, setItems] = useState<MedidorListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load(q = '') {
    try {
      setLoading(true);
      setItems(await hidroService.listMedidores(q));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar los medidores.');
    } finally {
      setLoading(false);
    }
  }

  async function desactivar(id: number, numero: string) {
    Alert.alert('Desactivar medidor', `¿Desactivar el medidor ${numero}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desactivar', style: 'destructive', onPress: async () => {
        try { await hidroService.deleteMedidor(id); await load(search); }
        catch (e: any) { Alert.alert('Error', e?.message || 'No se pudo desactivar.'); }
      }},
    ]);
  }

  const activos = items.filter(i => (i as any).estado !== 'INACTIVO').length;

  return (
    <SafeAreaView style={s.safe}>

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Medidores</Text>
          <Text style={s.subtitle}>{items.length} registrados</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.btnRefresh} onPress={() => load(search)}>
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
        <View style={[s.kpi, { borderLeftColor: '#16a34a' }]}>
          <Text style={[s.kpiVal, { color: '#16a34a' }]}>{activos}</Text>
          <Text style={s.kpiLabel}>Activos</Text>
        </View>
        <View style={[s.kpi, { borderLeftColor: '#f59e0b' }]}>
          <Text style={[s.kpiVal, { color: '#f59e0b' }]}>{items.length - activos}</Text>
          <Text style={s.kpiLabel}>Inactivos</Text>
        </View>
      </View>

      {/* BÚSQUEDA */}
      <View style={s.searchBox}>
        <View style={s.searchRow}>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cédula, nombre o N° medidor..."
            placeholderTextColor="#94a3b8"
            onSubmitEditing={() => load(search)}
          />
          <TouchableOpacity style={s.btnBuscar} onPress={() => load(search)}>
            <Text style={s.btnBuscarTxt}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LISTA */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#1a5fa8" />
          <Text style={s.loadingTxt}>Cargando medidores...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>⚡</Text>
          <Text style={s.emptyTxt}>No hay medidores para mostrar.</Text>
          <Text style={s.emptyHint}>Intenta buscar por cédula o nombre.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {items.map(item => (
            <View key={item.id} style={s.card}>

              {/* Header medidor */}
              <View style={s.cardHeader}>
                <View style={s.medidorIconBox}>
                  <Text style={s.medidorIconTxt}>⚡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.medidorNum}>{item.numero_medidor}</Text>
                  <Text style={s.medidorSector}>{item.sector || 'Sin sector'}</Text>
                </View>
                <View style={s.activoBadge}>
                  <Text style={s.activoTxt}>● Activo</Text>
                </View>
              </View>

              {/* Datos del socio */}
              <View style={s.socioRow}>
                <View style={s.socioAvatar}>
                  <Text style={s.socioAvatarTxt}>
                    {(item.socio?.charAt(0) ?? '?').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.socioNombre}>{item.socio}</Text>
                  <Text style={s.socioCedula}>{item.cedula || 'Sin cédula'}</Text>
                </View>
              </View>

              {/* Dirección */}
              <View style={s.dirRow}>
                <Text style={s.dirIcon}>📍</Text>
                <Text style={s.dirTxt}>{item.direccion || 'Sin dirección registrada'}</Text>
              </View>

              {/* Coordenadas */}
              {(item.latitud || item.longitud) && (
                <View style={s.coordsRow}>
                  <View style={s.coordBox}>
                    <Text style={s.coordLabel}>Latitud</Text>
                    <Text style={s.coordVal}>{item.latitud != null ? Number(item.latitud).toFixed(6) : '-'}</Text>
                  </View>
                  <View style={s.coordBox}>
                    <Text style={s.coordLabel}>Longitud</Text>
                    <Text style={s.coordVal}>{item.longitud != null ? Number(item.longitud).toFixed(6) : '-'}</Text>
                  </View>
                </View>
              )}

              {/* Acción admin */}
              {user.rol === 'ADMIN' && (
                <TouchableOpacity
                  style={s.btnDesactivar}
                  onPress={() => desactivar(item.id, item.numero_medidor)}
                >
                  <Text style={s.btnDesactivarTxt}>Desactivar medidor</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
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
  btnRefresh: { backgroundColor: '#e0ecff', width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnRefreshTxt: { fontSize: 18, color: '#1a5fa8' },
  btnSalir: { backgroundColor: '#dc2626', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  btnSalirTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  kpis: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  kpi: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderLeftWidth: 4 },
  kpiVal: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  kpiLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  searchBox: { backgroundColor: '#fff', padding: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    color: '#0f172a', backgroundColor: '#f8fafc',
  },
  btnBuscar: { backgroundColor: '#1a5fa8', paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnBuscarTxt: { fontSize: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingTxt: { color: '#64748b', fontSize: 15 },
  emptyIcon: { fontSize: 40 },
  emptyTxt: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  emptyHint: { color: '#94a3b8', fontSize: 13 },
  list: { padding: 14, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medidorIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#e0ecff', alignItems: 'center', justifyContent: 'center',
  },
  medidorIconTxt: { fontSize: 20 },
  medidorNum: { fontSize: 16, fontWeight: '800', color: '#1a5fa8', fontFamily: 'monospace' },
  medidorSector: { fontSize: 12, color: '#64748b', marginTop: 2 },
  activoBadge: { backgroundColor: '#d1e7dd', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  activoTxt: { color: '#0f5132', fontSize: 11, fontWeight: '700' },
  socioRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  socioAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6d28d9', alignItems: 'center', justifyContent: 'center',
  },
  socioAvatarTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  socioNombre: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  socioCedula: { fontSize: 12, color: '#64748b', marginTop: 1 },
  dirRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  dirIcon: { fontSize: 14, marginTop: 1 },
  dirTxt: { fontSize: 13, color: '#475569', flex: 1 },
  coordsRow: { flexDirection: 'row', gap: 8 },
  coordBox: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 8, padding: 8 },
  coordLabel: { fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  coordVal: { fontSize: 12, fontWeight: '600', color: '#334155', fontFamily: 'monospace' },
  btnDesactivar: {
    borderWidth: 1.5, borderColor: '#dc2626', borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
  },
  btnDesactivarTxt: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
});