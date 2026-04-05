import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { hidroService } from '../../services/hidroService';
import { UsuarioAuth } from '../../types';

type Props = { user: UsuarioAuth; onLogout: () => void };

export default function HomeScreen({ user, onLogout }: Props) {
  const [notifs, setNotifs] = useState<number>(0);
  const [planillas, setPlanillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [n, p] = await Promise.all([
        hidroService.listNotificaciones().catch(() => []),
        hidroService.listPlanillas().catch(() => []),
      ]);
      setNotifs(Array.isArray(n) ? n.filter((x: any) => !x.leido).length : 0);
      setPlanillas(Array.isArray(p) ? p.slice(0, 3) : []);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  const rolColor: Record<string, string> = {
    ADMIN: '#1a5fa8',
    TECNICO: '#0f5132',
    SOCIO: '#6d28d9',
  };
  const rolBg: Record<string, string> = {
    ADMIN: '#e0ecff',
    TECNICO: '#d1e7dd',
    SOCIO: '#ede9fe',
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* HERO */}
        <View style={s.hero}>
          <View style={[s.avatar, { backgroundColor: rolColor[user.rol] ?? '#1a5fa8' }]}>
            <Text style={s.avatarTxt}>
              {(user.nombre?.charAt(0) ?? '?').toUpperCase()}
            </Text>
          </View>
          <Text style={s.saludo}>{saludo},</Text>
          <Text style={s.nombre}>{user.nombre}</Text>
          <View style={[s.rolBadge, { backgroundColor: rolBg[user.rol] ?? '#e0ecff' }]}>
            <Text style={[s.rolTxt, { color: rolColor[user.rol] ?? '#1a5fa8' }]}>
              {user.rol === 'ADMIN' ? '⚙️ Administrador' : user.rol === 'TECNICO' ? '🔧 Técnico' : '🏠 Socio'}
            </Text>
          </View>
        </View>

        {/* STATS RÁPIDOS */}
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color="#1a5fa8" />
          </View>
        ) : (
          <View style={s.statsRow}>
            <View style={[s.statCard, { borderLeftColor: '#f59e0b' }]}>
              <Text style={[s.statVal, { color: '#f59e0b' }]}>{notifs}</Text>
              <Text style={s.statLabel}>Sin leer</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#1a5fa8' }]}>
              <Text style={[s.statVal, { color: '#1a5fa8' }]}>{planillas.length}</Text>
              <Text style={s.statLabel}>Planillas</Text>
            </View>
            <View style={[s.statCard, { borderLeftColor: '#16a34a' }]}>
              <Text style={[s.statVal, { color: '#16a34a' }]}>
                {planillas.filter((p: any) => p.estado === 'PAGADO').length}
              </Text>
              <Text style={s.statLabel}>Pagadas</Text>
            </View>
          </View>
        )}

        {/* ÚLTIMAS PLANILLAS */}
        {planillas.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>📋 Últimas planillas</Text>
           {planillas.map((p: any, index: number) => (
  <View key={`planilla-${p.id}-${index}`} style={s.planillaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.planillaNum}>{p.numero_planilla}</Text>
                  <Text style={s.planillaPeriodo}>
                    Período {p.periodo_mes}/{p.periodo_anio} · {p.consumo_m3} m³
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={s.planillaTotal}>${Number(p.total_pagar).toFixed(2)}</Text>
                  <View style={[
                    s.estadoBadge,
                    { backgroundColor: p.estado === 'PAGADO' ? '#d1e7dd' : '#fff3cd' }
                  ]}>
                    <Text style={[
                      s.estadoTxt,
                      { color: p.estado === 'PAGADO' ? '#0f5132' : '#856404' }
                    ]}>
                      {p.estado === 'PAGADO' ? '✓ Pagado' : '⏳ Pendiente'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* INFO DEL SISTEMA */}
        <View style={s.card}>
          <Text style={s.cardTitle}>💧 HidroGestión</Text>
          <Text style={s.cardDesc}>
            Sistema comunitario de gestión de agua potable. Administra lecturas, planillas, incidencias y más desde la app.
          </Text>
          <View style={s.infoRow}>
            <View style={s.infoItem}>
              <Text style={s.infoIcon}>📅</Text>
              <Text style={s.infoTxt}>{new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </View>
          </View>
        </View>

        {/* BOTÓN SALIR */}
        <TouchableOpacity style={s.btnSalir} onPress={onLogout}>
          <Text style={s.btnSalirTxt}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4f8' },
  scroll: { padding: 20, gap: 16 },

  hero: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0f172a',
    shadowOpacity: .06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  avatarTxt: { color: '#fff', fontSize: 32, fontWeight: '800' },
  saludo: { fontSize: 14, color: '#64748b' },
  nombre: { fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  rolBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, marginTop: 4 },
  rolTxt: { fontSize: 13, fontWeight: '700' },

  loadingBox: { alignItems: 'center', padding: 20 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, borderLeftWidth: 4,
    shadowColor: '#0f172a', shadowOpacity: .04,
    shadowRadius: 8, elevation: 2,
  },
  statVal: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12,
    shadowColor: '#0f172a', shadowOpacity: .04, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  cardDesc: { fontSize: 13, color: '#64748b', lineHeight: 20 },

  planillaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  planillaNum: { fontSize: 13, fontWeight: '700', color: '#1a5fa8', fontFamily: 'monospace' },
  planillaPeriodo: { fontSize: 12, color: '#64748b', marginTop: 2 },
  planillaTotal: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  estadoTxt: { fontSize: 10, fontWeight: '700' },

  infoRow: { gap: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIcon: { fontSize: 16 },
  infoTxt: { fontSize: 13, color: '#64748b' },

  btnSalir: {
    borderWidth: 1.5, borderColor: '#dc2626', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  btnSalirTxt: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});