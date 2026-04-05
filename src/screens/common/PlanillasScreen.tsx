import React, { useEffect, useState } from 'react';
import {
  Alert, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { hidroService } from '../../services/hidroService';
import { storage } from '../../services/storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Planilla, UsuarioAuth } from '../../types';
const WebBrowser = require('expo-web-browser');


type Props = { user: UsuarioAuth; onLogout: () => void };

export default function PlanillasScreen({ user, onLogout }: Props) {
  const [items, setItems] = useState<Planilla[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setItems(await hidroService.listPlanillas());
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar las planillas.');
    } finally {
      setLoading(false);
    }
  }

  async function syncAlerts() {
    try {
      await hidroService.syncPlanillaAlerts();
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron sincronizar.');
    }
  }

  async function marcarPagado(item: Planilla) {
    Alert.alert(
      'Confirmar pago',
      `¿Marcar como pagada la planilla ${item.numero_planilla} por $${item.total_pagar.toFixed(2)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await hidroService.marcarPlanillaPagada(item.id, {
                valor_pagado: item.total_pagar,
                metodo_pago: 'EFECTIVO',
              });
              await load();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'No se pudo registrar el pago.');
            }
          },
        },
      ]
    );
  }
async function abrirPlanilla(planillaId: number) {
    try {
      const token = await storage.getAccessToken();
      const url = `http://192.168.18.25:5000/api/planillas/${planillaId}/descargar?access_token=${token}`;
      const { Linking } = require('react-native');
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo abrir.');
    }
  }

  async function abrirComprobante(planillaId: number) {
    try {
      const token = await storage.getAccessToken();
      const url = `http://192.168.18.25:5000/api/planillas/${planillaId}/comprobante?access_token=${token}`;
      const { Linking } = require('react-native');
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo abrir.');
    }
  }

  const pendientes = items.filter(i => i.estado !== 'PAGADO').length;
  const pagadas = items.filter(i => i.estado === 'PAGADO').length;

  return (
    <SafeAreaView style={s.safe}>

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Planillas</Text>
          <Text style={s.subtitle}>
            {user.rol === 'SOCIO' ? 'Mis planillas' : 'Planillas del sistema'}
          </Text>
        </View>
        <TouchableOpacity style={s.btnSalir} onPress={onLogout}>
          <Text style={s.btnSalirTxt}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* ACCIONES */}
      <View style={s.actions}>
        <TouchableOpacity style={s.btnSecondary} onPress={load}>
          <Text style={s.btnSecondaryTxt}>↺ Refrescar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={syncAlerts}>
          <Text style={s.btnSecondaryTxt}>⟳ Sincronizar</Text>
        </TouchableOpacity>
      </View>

      {/* KPIs */}
      <View style={s.kpis}>
        <View style={[s.kpi, { borderLeftColor: '#1a5fa8' }]}>
          <Text style={s.kpiVal}>{items.length}</Text>
          <Text style={s.kpiLabel}>Total</Text>
        </View>
        <View style={[s.kpi, { borderLeftColor: '#f59e0b' }]}>
          <Text style={[s.kpiVal, { color: '#f59e0b' }]}>{pendientes}</Text>
          <Text style={s.kpiLabel}>Pendientes</Text>
        </View>
        <View style={[s.kpi, { borderLeftColor: '#16a34a' }]}>
          <Text style={[s.kpiVal, { color: '#16a34a' }]}>{pagadas}</Text>
          <Text style={s.kpiLabel}>Pagadas</Text>
        </View>
      </View>

      {/* CONTENIDO */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#1a5fa8" />
          <Text style={s.loadingTxt}>Cargando planillas...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyTxt}>No hay planillas registradas.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {items.map(item => (
            <View
              key={item.id}
              style={[
                s.card,
                { borderLeftColor: item.estado === 'PAGADO' ? '#16a34a' : '#f59e0b' }
              ]}
            >
              {/* Número y estado */}
              <View style={s.cardHeader}>
                <Text style={s.cardNum}>{item.numero_planilla}</Text>
                <View style={[
                  s.estadoBadge,
                  { backgroundColor: item.estado === 'PAGADO' ? '#d1e7dd' : '#fff3cd' }
                ]}>
                  <Text style={[
                    s.estadoTxt,
                    { color: item.estado === 'PAGADO' ? '#0f5132' : '#856404' }
                  ]}>
                    {item.estado === 'PAGADO' ? '✓ PAGADO' : '⏳ PENDIENTE'}
                  </Text>
                </View>
              </View>

              {/* Socio y periodo */}
              <Text style={s.cardSocio}>
                {item.socio || 'Usuario del sistema'}
              </Text>
              <Text style={s.cardPeriodo}>
                Período {item.periodo_mes}/{item.periodo_anio}
              </Text>

              {/* Datos */}
              <View style={s.dataRow}>
                <View style={s.dataItem}>
                  <Text style={s.dataLabel}>Consumo</Text>
                  <Text style={s.dataVal}>{item.consumo_m3} m³</Text>
                </View>
                <View style={s.dataItem}>
                  <Text style={s.dataLabel}>Emisión</Text>
                  <Text style={s.dataVal}>{item.fecha_emision || '-'}</Text>
                </View>
                {item.fecha_pago ? (
                  <View style={s.dataItem}>
                    <Text style={s.dataLabel}>Pago</Text>
                    <Text style={s.dataVal}>{item.fecha_pago}</Text>
                  </View>
                ) : null}
              </View>

              {/* Total destacado */}
              <View style={s.totalBox}>
                <Text style={s.totalLabel}>Total a pagar</Text>
                <Text style={s.totalVal}>${item.total_pagar.toFixed(2)}</Text>
              </View>

              {/* Botones */}
              <View style={s.btnRow}>
                <TouchableOpacity
                  style={s.btnLink}
                onPress={() => abrirPlanilla(item.id)}
                >
                  <Text style={s.btnLinkTxt}>📄 Ver planilla</Text>
                </TouchableOpacity>

                {item.estado === 'PAGADO' && (
                  <TouchableOpacity
                    style={s.btnLink}
                   onPress={() => abrirComprobante(item.id)}
                  >
                    <Text style={s.btnLinkTxt}>🧾 Comprobante</Text>
                  </TouchableOpacity>
                )}

                {user.rol === 'ADMIN' && item.estado !== 'PAGADO' && (
                  <TouchableOpacity
                    style={s.btnPagar}
                    onPress={() => marcarPagado(item)}
                  >
                    <Text style={s.btnPagarTxt}>✓ Marcar pagada</Text>
                  </TouchableOpacity>
                )}
              </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  btnSalir: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnSalirTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  btnSecondary: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#1a5fa8',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnSecondaryTxt: { color: '#1a5fa8', fontWeight: '600', fontSize: 13 },
  kpis: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  kpi: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
  },
  kpiVal: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  kpiLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { color: '#64748b', fontSize: 15 },
  emptyIcon: { fontSize: 40 },
  emptyTxt: { color: '#94a3b8', fontSize: 16 },
  list: { padding: 14, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardNum: { fontSize: 14, fontWeight: '800', color: '#1a5fa8', fontFamily: 'monospace' },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  estadoTxt: { fontSize: 11, fontWeight: '700' },
  cardSocio: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  cardPeriodo: { fontSize: 12, color: '#94a3b8', marginBottom: 10 },
  dataRow: { flexDirection: 'row', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  dataItem: { flex: 1, minWidth: 80 },
  dataLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  dataVal: { fontSize: 13, fontWeight: '600', color: '#334155' },
  totalBox: {
    backgroundColor: '#f0f6ff',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 13, color: '#1a5fa8', fontWeight: '600' },
  totalVal: { fontSize: 22, fontWeight: '800', color: '#1a5fa8' },
  btnRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btnLink: {
    backgroundColor: '#e0ecff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnLinkTxt: { color: '#1a5fa8', fontWeight: '600', fontSize: 13 },
  btnPagar: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnPagarTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
});