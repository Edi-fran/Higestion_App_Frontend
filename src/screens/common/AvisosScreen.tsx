import React, { useEffect, useState } from 'react';
import {
  Alert, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hidroService } from '../../services/hidroService';
import { Aviso, UsuarioAuth } from '../../types';

export default function AvisosScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ titulo: '', contenido: '', tipo_aviso: 'COMUNICADO', prioridad: 'MEDIA' });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setAvisos(await hidroService.listAvisos());
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar los avisos.');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!form.titulo.trim()) { Alert.alert('Aviso', 'El título es obligatorio.'); return; }
    try {
      setSaving(true);
      if (editingId) await hidroService.updateAviso(editingId, form);
      else await hidroService.createAviso(form);
      resetForm();
      setModalVisible(false);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    Alert.alert('Eliminar aviso', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await hidroService.deleteAviso(id); await load(); }
        catch (e: any) { Alert.alert('Error', e?.message); }
      }},
    ]);
  }

  function resetForm() {
    setForm({ titulo: '', contenido: '', tipo_aviso: 'COMUNICADO', prioridad: 'MEDIA' });
    setEditingId(null);
  }

  function editAviso(item: Aviso) {
    setEditingId(item.id);
    setForm({ titulo: item.titulo, contenido: item.contenido, tipo_aviso: item.tipo_aviso, prioridad: item.prioridad });
    setModalVisible(true);
  }

  function getPrioridadStyle(prioridad: string) {
    if (prioridad === 'URGENTE') return { bg: '#fee2e2', txt: '#dc2626', border: '#dc2626' };
    if (prioridad === 'ALTA')    return { bg: '#fff3cd', txt: '#856404', border: '#f59e0b' };
    if (prioridad === 'MEDIA')   return { bg: '#e0ecff', txt: '#1d4ed8', border: '#1a5fa8' };
    return { bg: '#f1f5f9', txt: '#475569', border: '#94a3b8' };
  }

  function getTipoIcon(tipo: string) {
    if (tipo === 'CORTE')     return '🚿';
    if (tipo === 'REUNION')   return '📅';
    if (tipo === 'TRABAJO')   return '🔧';
    if (tipo === 'URGENTE')   return '🚨';
    return '📢';
  }

  const urgentes = avisos.filter(a => a.prioridad === 'URGENTE' || a.prioridad === 'ALTA').length;

  return (
    <SafeAreaView style={s.safe}>

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Avisos</Text>
          <Text style={s.subtitle}>{avisos.length} publicados · {urgentes} urgentes</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.btnRefresh} onPress={load}>
            <Text style={s.btnRefreshTxt}>↺</Text>
          </TouchableOpacity>
          {user.rol === 'ADMIN' && (
            <TouchableOpacity style={s.btnNuevo} onPress={() => { resetForm(); setModalVisible(true); }}>
              <Text style={s.btnNuevoTxt}>+ Nuevo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.btnSalir} onPress={onLogout}>
            <Text style={s.btnSalirTxt}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPIs */}
      <View style={s.kpis}>
        <View style={[s.kpi, { borderLeftColor: '#1a5fa8' }]}>
          <Text style={s.kpiVal}>{avisos.length}</Text>
          <Text style={s.kpiLabel}>Total</Text>
        </View>
        <View style={[s.kpi, { borderLeftColor: '#dc2626' }]}>
          <Text style={[s.kpiVal, { color: '#dc2626' }]}>{urgentes}</Text>
          <Text style={s.kpiLabel}>Urgentes</Text>
        </View>
        <View style={[s.kpi, { borderLeftColor: '#16a34a' }]}>
          <Text style={[s.kpiVal, { color: '#16a34a' }]}>
            {avisos.filter(a => a.estado === 'PUBLICADO').length}
          </Text>
          <Text style={s.kpiLabel}>Publicados</Text>
        </View>
      </View>

      {/* LISTA */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#1a5fa8" />
          <Text style={s.loadingTxt}>Cargando avisos...</Text>
        </View>
      ) : avisos.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>📢</Text>
          <Text style={s.emptyTxt}>No hay avisos publicados.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {avisos.map(item => {
            const prio = getPrioridadStyle(item.prioridad);
            return (
              <View key={item.id} style={[s.card, { borderLeftColor: prio.border }]}>
                <View style={s.cardHeader}>
                  <Text style={s.cardIcon}>{getTipoIcon(item.tipo_aviso)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{item.titulo}</Text>
                    <Text style={s.cardFecha}>{item.fecha_publicacion} {item.hora_publicacion}</Text>
                  </View>
                </View>

                <Text style={s.cardContenido}>{item.contenido}</Text>

                <View style={s.badgeRow}>
                  <View style={[s.badge, { backgroundColor: '#f1f5f9' }]}>
                    <Text style={[s.badgeTxt, { color: '#475569' }]}>{item.tipo_aviso}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: prio.bg }]}>
                    <Text style={[s.badgeTxt, { color: prio.txt }]}>{item.prioridad}</Text>
                  </View>
                </View>

                {user.rol === 'ADMIN' && (
                  <View style={s.cardActions}>
                    <TouchableOpacity style={s.btnEdit} onPress={() => editAviso(item)}>
                      <Text style={s.btnEditTxt}>✏️ Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.btnDelete} onPress={() => remove(item.id)}>
                      <Text style={s.btnDeleteTxt}>🗑 Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* MODAL FORMULARIO */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingId ? 'Editar aviso' : 'Nuevo aviso'}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalScroll}>
              <Text style={s.fieldLabel}>Título *</Text>
              <TextInput
                style={s.fieldInput}
                value={form.titulo}
                onChangeText={v => setForm({ ...form, titulo: v })}
                placeholder="Título del aviso..."
                placeholderTextColor="#94a3b8"
              />

              <Text style={s.fieldLabel}>Contenido</Text>
              <TextInput
                style={[s.fieldInput, { height: 100, textAlignVertical: 'top' }]}
                value={form.contenido}
                onChangeText={v => setForm({ ...form, contenido: v })}
                multiline
                placeholder="Descripción del aviso..."
                placeholderTextColor="#94a3b8"
              />

              <Text style={s.fieldLabel}>Tipo</Text>
              <View style={s.selectorRow}>
                {['COMUNICADO', 'CORTE', 'REUNION', 'TRABAJO', 'URGENTE'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.selectorBtn, form.tipo_aviso === t && s.selectorBtnActive]}
                    onPress={() => setForm({ ...form, tipo_aviso: t })}
                  >
                    <Text style={[s.selectorTxt, form.tipo_aviso === t && s.selectorTxtActive]}>
                      {getTipoIcon(t)} {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>Prioridad</Text>
              <View style={s.selectorRow}>
                {['BAJA', 'MEDIA', 'ALTA', 'URGENTE'].map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[s.selectorBtn, form.prioridad === p && s.selectorBtnActive]}
                    onPress={() => setForm({ ...form, prioridad: p })}
                  >
                    <Text style={[s.selectorTxt, form.prioridad === p && s.selectorTxtActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[s.btnGuardar, saving && { opacity: .6 }]}
              onPress={save}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnGuardarTxt}>{editingId ? '💾 Guardar cambios' : '📢 Publicar aviso'}</Text>
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
  list: { padding: 14, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardIcon: { fontSize: 24 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  cardFecha: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  cardContenido: { fontSize: 13, color: '#475569', lineHeight: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 8 },
  btnEdit: { backgroundColor: '#e0ecff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnEditTxt: { color: '#1a5fa8', fontWeight: '600', fontSize: 12 },
  btnDelete: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnDeleteTxt: { color: '#dc2626', fontWeight: '600', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalClose: { fontSize: 18, color: '#94a3b8', padding: 4 },
  modalScroll: { maxHeight: 420 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6, marginTop: 12 },
  fieldInput: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: '#0f172a', backgroundColor: '#f8fafc',
  },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  selectorBtnActive: { backgroundColor: '#1a5fa8', borderColor: '#1a5fa8' },
  selectorTxt: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  selectorTxtActive: { color: '#fff' },
  btnGuardar: { backgroundColor: '#1a5fa8', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  btnGuardarTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});