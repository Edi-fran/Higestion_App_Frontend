import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/authService';
import { hidroService } from '../../services/hidroService';
import { Planilla, RecaudacionResumen, UsuarioAuth } from '../../types';

type Props = { user: UsuarioAuth; onLogout: () => void };

export default function HomeScreen({ user, onLogout }: Props) {
  const [resume, setResume] = useState<RecaudacionResumen | null>(null);
  const [planillas, setPlanillas] = useState<Planilla[]>([]);
  const [pendientes, setPendientes] = useState(0);
  const [tokenJti, setTokenJti] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const primerNombre = useMemo(() =>
    user.nombre?.split(' ')[0] || user.username, [user]);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  const rolConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    ADMIN:   { color: '#1a5fa8', bg: '#e0ecff', icon: '⚙️', label: 'Administrador' },
    TECNICO: { color: '#065f46', bg: '#d1fae5', icon: '🔧', label: 'Técnico'        },
    SOCIO:   { color: '#6d28d9', bg: '#ede9fe', icon: '🏠', label: 'Socio'          },
  };
  const rol = rolConfig[user.rol] ?? rolConfig.SOCIO;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        try { const info = await authService.tokenInfo(); setTokenJti(info?.jti); } catch {}
        if (user.rol === 'ADMIN') {
          const r = await hidroService.listRecaudacionResumen();
          setResume(r);
        } else {
          const [pls, notis] = await Promise.all([
            hidroService.listPlanillas().catch(() => []),
            hidroService.listNotificaciones().catch(() => []),
          ]);
          setPlanillas(Array.isArray(pls) ? pls : []);
          setPendientes(Array.isArray(notis) ? notis.filter((n: any) => !n.leido).length : 0);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [user.rol]);

  const ultimaPlanilla = planillas[0] ?? null;
  const pagadas = planillas.filter(p => p.estado === 'PAGADO').length;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HERO ── */}
        <View style={s.hero}>
          <View style={[s.avatar, { backgroundColor: rol.color }]}>
            <Text style={s.avatarTxt}>{(primerNombre?.charAt(0) ?? '?').toUpperCase()}</Text>
          </View>
          <Text style={s.saludoTxt}>{saludo},</Text>
          <Text style={s.nombreTxt}>{primerNombre}</Text>
          <Text style={s.nombreFull}>{user.nombre}</Text>
          <View style={[s.rolPill, { backgroundColor: rol.bg }]}>
            <Text style={[s.rolTxt, { color: rol.color }]}>{rol.icon} {rol.label}</Text>
          </View>
          {user.username ? (
            <Text style={s.usernameTxt}>@{user.username}</Text>
          ) : null}
        </View>

        {/* ── MÉTRICAS ── */}
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color="#1a5fa8" />
            <Text style={s.loadingTxt}>Cargando datos...</Text>
          </View>
        ) : user.rol === 'ADMIN' && resume ? (
          <>
            <Text style={s.sectionLabel}>Resumen administrativo</Text>
            <View style={s.metricsGrid}>
              <View style={[s.metricCard, { borderLeftColor: '#16a34a' }]}>
                <Text style={[s.metricVal, { color: '#16a34a' }]}>${resume.total_recaudado.toFixed(2)}</Text>
                <Text style={s.metricLabel}>Recaudado</Text>
              </View>
              <View style={[s.metricCard, { borderLeftColor: '#f59e0b' }]}>
                <Text style={[s.metricVal, { color: '#f59e0b' }]}>${resume.total_pendiente.toFixed(2)}</Text>
                <Text style={s.metricLabel}>Pendiente</Text>
              </View>
              <View style={[s.metricCard, { borderLeftColor: '#1a5fa8' }]}>
                <Text style={[s.metricVal, { color: '#1a5fa8' }]}>{resume.planillas_pagadas}</Text>
                <Text style={s.metricLabel}>Planillas pagadas</Text>
              </View>
              <View style={[s.metricCard, { borderLeftColor: '#6d28d9' }]}>
                <Text style={[s.metricVal, { color: '#6d28d9' }]}>{resume.pagos_registrados}</Text>
                <Text style={s.metricLabel}>Pagos registrados</Text>
              </View>
            </View>
          </>
        ) : user.rol !== 'ADMIN' ? (
          <>
            <Text style={s.sectionLabel}>Mi estado actual</Text>
            <View style={s.metricsGrid}>
              <View style={[s.metricCard, { borderLeftColor: '#1a5fa8' }]}>
                <Text style={[s.metricVal, { color: '#1a5fa8' }]}>{planillas.length}</Text>
                <Text style={s.metricLabel}>Planillas</Text>
              </View>
              <View style={[s.metricCard, { borderLeftColor: '#16a34a' }]}>
                <Text style={[s.metricVal, { color: '#16a34a' }]}>{pagadas}</Text>
                <Text style={s.metricLabel}>Pagadas</Text>
              </View>
              <View style={[s.metricCard, { borderLeftColor: '#f59e0b' }]}>
                <Text style={[s.metricVal, { color: '#f59e0b' }]}>{pendientes}</Text>
                <Text style={s.metricLabel}>Alertas nuevas</Text>
              </View>
              <View style={[s.metricCard, { borderLeftColor: '#dc2626' }]}>
                <Text style={[s.metricVal, { color: '#dc2626' }]}>
                  {planillas.length - pagadas}
                </Text>
                <Text style={s.metricLabel}>Por pagar</Text>
              </View>
            </View>
          </>
        ) : null}

        {/* ── ÚLTIMA PLANILLA ── */}
        {ultimaPlanilla && user.rol !== 'ADMIN' && (
          <>
            <Text style={s.sectionLabel}>Última planilla</Text>
            <View style={s.planillaCard}>
              <View style={s.planillaTop}>
                <Text style={s.planillaNum}>{ultimaPlanilla.numero_planilla}</Text>
                <View style={[
                  s.estadoBadge,
                  { backgroundColor: ultimaPlanilla.estado === 'PAGADO' ? '#d1e7dd' : '#fff3cd' }
                ]}>
                  <Text style={[s.estadoTxt, {
                    color: ultimaPlanilla.estado === 'PAGADO' ? '#0f5132' : '#856404'
                  }]}>
                    {ultimaPlanilla.estado === 'PAGADO' ? '✓ PAGADO' : '⏳ PENDIENTE'}
                  </Text>
                </View>
              </View>
              <View style={s.planillaData}>
                <View style={s.planillaDato}>
                  <Text style={s.planillaDatoLabel}>Período</Text>
                  <Text style={s.planillaDatoVal}>{ultimaPlanilla.periodo_mes}/{ultimaPlanilla.periodo_anio}</Text>
                </View>
                <View style={s.planillaDato}>
                  <Text style={s.planillaDatoLabel}>Consumo</Text>
                  <Text style={s.planillaDatoVal}>{ultimaPlanilla.consumo_m3} m³</Text>
                </View>
                <View style={s.planillaDato}>
                  <Text style={s.planillaDatoLabel}>Total</Text>
                  <Text style={[s.planillaDatoVal, { color: '#1a5fa8', fontSize: 18, fontWeight: '800' }]}>
                    ${ultimaPlanilla.total_pagar.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* ── SESIÓN ── */}
        <Text style={s.sectionLabel}>Sesión activa</Text>
        <View style={s.sessionCard}>
          <View style={s.sessionRow}>
            <Text style={s.sessionLabel}>Estado</Text>
            <View style={s.estadoBadge2}>
              <Text style={s.estadoTxt2}>✓ {user.estado || 'ACTIVO'}</Text>
            </View>
          </View>
          <View style={s.sessionRow}>
            <Text style={s.sessionLabel}>Usuario</Text>
            <Text style={s.sessionVal}>@{user.username}</Text>
          </View>
          {user.email ? (
            <View style={s.sessionRow}>
              <Text style={s.sessionLabel}>Correo</Text>
              <Text style={s.sessionVal}>{user.email}</Text>
            </View>
          ) : null}
          {tokenJti ? (
            <View style={s.sessionRow}>
              <Text style={s.sessionLabel}>Token JTI</Text>
              <Text style={[s.sessionVal, { fontFamily: 'monospace', fontSize: 10 }]} numberOfLines={1}>
                {tokenJti}
              </Text>
            </View>
          ) : null}
          <View style={s.sessionRow}>
            <Text style={s.sessionLabel}>Fecha</Text>
            <Text style={s.sessionVal}>
              {new Date().toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* ── CERRAR SESIÓN ── */}
        <TouchableOpacity style={s.btnSalir} onPress={onLogout}>
          <Text style={s.btnSalirTxt}>🚪 Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4f8' },
  scroll: { padding: 20, gap: 16, paddingBottom: 100 },

  hero: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    alignItems: 'center', gap: 6,
    shadowColor: '#0f172a', shadowOpacity: .06, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  avatarTxt: { color: '#fff', fontSize: 36, fontWeight: '800' },
  saludoTxt: { fontSize: 14, color: '#94a3b8' },
  nombreTxt: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
  nombreFull: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  rolPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginTop: 4 },
  rolTxt: { fontSize: 13, fontWeight: '700' },
  usernameTxt: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  loadingBox: { alignItems: 'center', padding: 24, gap: 10 },
  loadingTxt: { color: '#64748b', fontSize: 14 },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .8, marginBottom: -4 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 14,
    padding: 14, borderLeftWidth: 4,
    shadowColor: '#0f172a', shadowOpacity: .04, shadowRadius: 8, elevation: 2,
  },
  metricVal: { fontSize: 26, fontWeight: '800' },
  metricLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  planillaCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12,
    shadowColor: '#0f172a', shadowOpacity: .04, shadowRadius: 8, elevation: 2,
  },
  planillaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planillaNum: { fontSize: 14, fontWeight: '800', color: '#1a5fa8', fontFamily: 'monospace' },
  planillaData: { flexDirection: 'row', gap: 8 },
  planillaDato: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, padding: 10 },
  planillaDatoLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  planillaDatoVal: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  estadoTxt: { fontSize: 11, fontWeight: '700' },

  sessionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 0,
    shadowColor: '#0f172a', shadowOpacity: .04, shadowRadius: 8, elevation: 2,
  },
  sessionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  sessionLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  sessionVal: { fontSize: 13, color: '#0f172a', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  estadoBadge2: { backgroundColor: '#d1e7dd', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  estadoTxt2: { color: '#0f5132', fontSize: 12, fontWeight: '700' },

  btnSalir: {
    borderWidth: 1.5, borderColor: '#dc2626', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  btnSalirTxt: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});