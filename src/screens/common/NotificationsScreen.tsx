import React, { useEffect, useState } from 'react';
import {
  Alert, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView
} from 'react-native';
import { hidroService } from '../../services/hidroService';
import { Notificacion } from '../../types';

type Props = { onLogout: () => void };

export default function NotificationsScreen({ onLogout }: Props) {
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await hidroService.listNotificaciones();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar.');
    } finally {
      setLoading(false);
    }
  }

  async function sincronizar() {
    try {
      await hidroService.syncNotificaciones();
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo sincronizar.');
    }
  }

  async function marcarLeida(id: number) {
    try {
      await hidroService.readNotificacion(id);
      setItems(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo marcar como leída.');
    }
  }

  const tipoColor: Record<string, string> = {
    LECTURA: '#1a5fa8',
    PAGO: '#16a34a',
    ALERTA: '#dc2626',
    INCIDENCIA: '#f59e0b',
    SISTEMA: '#64748b',
    MENSAJE: '#6366f1',
  };

  return (
    <SafeAreaView style={s.safe}>

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Notificaciones</Text>
          <Text style={s.subtitle}>
            {items.length} {items.length === 1 ? 'notificación' : 'notificaciones'}
          </Text>
        </View>
        <TouchableOpacity style={s.btnSalir} onPress={onLogout}>
          <Text style={s.btnSalirTxt}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* BOTONES */}
      <View style={s.actions}>
        <TouchableOpacity style={s.btnSecondary} onPress={load}>
          <Text style={s.btnSecondaryTxt}>↺ Refrescar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={sincronizar}>
          <Text style={s.btnSecondaryTxt}>⟳ Sincronizar</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENIDO */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#1a5fa8" />
          <Text style={s.loadingTxt}>Cargando...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>🔔</Text>
          <Text style={s.emptyTxt}>No hay notificaciones.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {items.map(n => (
            <View
              key={n.id}
              style={[
                s.card,
                { borderLeftColor: tipoColor[n.tipo] || '#94a3b8' },
                !n.leido && s.cardUnread,
              ]}
            >
              {/* Tipo + estado */}
              <View style={s.cardRow}>
                <View style={[s.tipoBadge, { backgroundColor: (tipoColor[n.tipo] || '#94a3b8') + '20' }]}>
                  <Text style={[s.tipoTxt, { color: tipoColor[n.tipo] || '#64748b' }]}>
                    {n.tipo}
                  </Text>
                </View>
                {!n.leido && (
                  <View style={s.nuevaBadge}>
                    <Text style={s.nuevaTxt}>● Nueva</Text>
                  </View>
                )}
                <Text style={s.fecha}>{n.fecha} {n.hora}</Text>
              </View>

              {/* Título y mensaje */}
              <Text style={s.cardTitle}>{n.titulo}</Text>
              <Text style={s.cardMsg}>{n.mensaje}</Text>

              {/* Botón marcar leída */}
              {!n.leido && (
                <TouchableOpacity
                  style={s.btnLeer}
                  onPress={() => marcarLeida(n.id)}
                >
                  <Text style={s.btnLeerTxt}>✓ Marcar como leída</Text>
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
    paddingVertical: 12,
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
  btnSecondaryTxt: { color: '#1a5fa8', fontWeight: '600', fontSize: 14 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { color: '#64748b', fontSize: 15 },
  emptyIcon: { fontSize: 40 },
  emptyTxt: { color: '#94a3b8', fontSize: 16 },

  list: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#94a3b8',
  },
  cardUnread: { backgroundColor: '#fafcff' },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  tipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tipoTxt: { fontSize: 11, fontWeight: '700' },
  nuevaBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nuevaTxt: { color: '#dc2626', fontSize: 11, fontWeight: '700' },
  fecha: { color: '#94a3b8', fontSize: 11, marginLeft: 'auto' },

  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  cardMsg: { fontSize: 13, color: '#475569', lineHeight: 20 },

  btnLeer: {
    marginTop: 10,
    backgroundColor: '#e0f2fe',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnLeerTxt: { color: '#0369a1', fontWeight: '600', fontSize: 13 },
});