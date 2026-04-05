import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hidroService } from '../../services/hidroService';
import { Mensaje } from '../../types';

type Props = { onLogout: () => void };

export default function MessagesScreen({ onLogout }: Props) {
  const [items, setItems] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [contenido, setContenido] = useState('');

  useEffect(() => { load(); }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await hidroService.listMensajes();
      setItems(data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const send = useCallback(async () => {
    if (!asunto.trim() || !contenido.trim()) {
      return;
    }
    try {
      setSending(true);
      await hidroService.createMensaje({ asunto: asunto.trim(), contenido: contenido.trim() });
      setAsunto('');
      setContenido('');
      setModalVisible(false);
      await load();
    } catch (e: any) {
      console.error('Error enviando mensaje:', e);
    } finally {
      setSending(false);
    }
  }, [asunto, contenido, load]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await hidroService.readMensaje(id);
      setItems(prev => prev.map(m => m.id === id ? { ...m, leido: true } : m));
    } catch {}
  }, []);

  const noLeidos = items.filter(m => !m.leido).length;

  return (
    <SafeAreaView style={s.safe}>

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Mensajes</Text>
          <Text style={s.subtitle}>{items.length} en bandeja · {noLeidos} sin leer</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.btnRefresh} onPress={load}>
            <Text style={s.btnRefreshTxt}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnNuevo} onPress={() => setModalVisible(true)}>
            <Text style={s.btnNuevoTxt}>+ Nuevo</Text>
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
          <Text style={[s.kpiVal, { color: '#f59e0b' }]}>{noLeidos}</Text>
          <Text style={s.kpiLabel}>Sin leer</Text>
        </View>
        <View style={[s.kpi, { borderLeftColor: '#16a34a' }]}>
          <Text style={[s.kpiVal, { color: '#16a34a' }]}>{items.length - noLeidos}</Text>
          <Text style={s.kpiLabel}>Leídos</Text>
        </View>
      </View>

      {/* LISTA */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#1a5fa8" />
          <Text style={s.loadingTxt}>Cargando mensajes...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>💬</Text>
          <Text style={s.emptyTxt}>No tienes mensajes aún.</Text>
          <TouchableOpacity style={s.btnNuevoEmpty} onPress={() => setModalVisible(true)}>
            <Text style={s.btnNuevoEmptyTxt}>Enviar primer mensaje</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {items.map(m => (
            <View
              key={m.id}
              style={[s.card, !m.leido && s.cardUnread]}
            >
              {/* Header */}
              <View style={s.cardHeader}>
                <View style={[s.avatar, { backgroundColor: m.leido ? '#e2e8f0' : '#1a5fa8' }]}>
                  <Text style={[s.avatarTxt, { color: m.leido ? '#64748b' : '#fff' }]}>
                    {(m.remitente?.charAt(0) ?? '?').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.asunto}>{m.asunto}</Text>
                  <Text style={s.ruta}>
                    {m.remitente ?? 'Yo'} → {m.destinatario ?? 'Admin'}
                  </Text>
                </View>
                {!m.leido && (
                  <View style={s.unreadDot} />
                )}
              </View>

              {/* Contenido */}
              <Text style={s.contenido}>{m.contenido}</Text>

              {/* Footer */}
              <View style={s.cardFooter}>
                <Text style={s.fecha}>🕐 {m.fecha} {m.hora}</Text>
                {!m.leido && (
                  <TouchableOpacity style={s.btnLeer} onPress={() => markAsRead(m.id)}>
                    <Text style={s.btnLeerTxt}>✓ Marcar leído</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* MODAL NUEVO MENSAJE */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nuevo mensaje</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.fieldLabel}>Asunto</Text>
            <TextInput
              style={s.fieldInput}
              value={asunto}
              onChangeText={setAsunto}
              placeholder="¿Sobre qué es el mensaje?"
              placeholderTextColor="#94a3b8"
            />

            <Text style={s.fieldLabel}>Contenido</Text>
            <TextInput
              style={[s.fieldInput, { height: 120, textAlignVertical: 'top' }]}
              value={contenido}
              onChangeText={setContenido}
              multiline
              placeholder="Escribe tu mensaje aquí..."
              placeholderTextColor="#94a3b8"
            />

            <Text style={s.destinatarioHint}>📨 Se enviará al administrador por defecto.</Text>

            <TouchableOpacity
              style={[s.btnEnviar, sending && { opacity: .6 }]}
              onPress={send}
              disabled={sending}
            >
              {sending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnEnviarTxt}>📤 Enviar mensaje</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  btnNuevo: { backgroundColor: '#1a5fa8', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  btnNuevoTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnSalir: { backgroundColor: '#dc2626', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  btnSalirTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  kpis: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  kpi: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderLeftWidth: 4 },
  kpiVal: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  kpiLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { color: '#64748b', fontSize: 15 },
  emptyIcon: { fontSize: 40 },
  emptyTxt: { color: '#94a3b8', fontSize: 16 },
  btnNuevoEmpty: { backgroundColor: '#1a5fa8', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  btnNuevoEmptyTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { padding: 14, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10 },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: '#1a5fa8', backgroundColor: '#fafcff' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontWeight: '800', fontSize: 16 },
  asunto: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  ruta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1a5fa8' },
  contenido: { fontSize: 13, color: '#475569', lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fecha: { fontSize: 11, color: '#94a3b8' },
  btnLeer: { backgroundColor: '#e0ecff', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  btnLeerTxt: { color: '#1a5fa8', fontWeight: '600', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalClose: { fontSize: 18, color: '#94a3b8', padding: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6, marginTop: 8 },
  fieldInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' },
  destinatarioHint: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  btnEnviar: { backgroundColor: '#1a5fa8', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  btnEnviarTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});