import React, { useEffect, useState } from 'react';
import {
  Alert, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentLocation, hidroService, pickEvidence } from '../../services/hidroService';
import { Incidencia, UsuarioAuth } from '../../types';

export default function IncidenciasScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [tipo, setTipo] = useState('FUGA');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [materiales, setMateriales] = useState('');
  const [foto, setFoto] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setIncidencias(await hidroService.listIncidencias(false));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar las incidencias.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null); setTipo('FUGA'); setTitulo('');
    setDescripcion(''); setMateriales(''); setFoto(null);
  }

  async function takePhoto() {
    try {
      const asset = await pickEvidence();
      if (asset) setFoto(asset);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo abrir la cámara.');
    }
  }

  async function submit() {
    if (!titulo.trim()) { Alert.alert('Aviso', 'El título es obligatorio.'); return; }
    try {
      setSaving(true);
      const coords = await getCurrentLocation().catch(() => ({ latitud: undefined, longitud: undefined }));
      if (editingId) {
        await hidroService.updateIncidencia(editingId, {
          tipo_incidencia: tipo, titulo, descripcion,
          prioridad: 'MEDIA',
          estado: user.rol === 'SOCIO' ? 'REPORTADA' : 'EN_PROCESO',
        });
      } else {
        await hidroService.createIncidencia({
          tipo_incidencia: tipo, titulo, descripcion,
          prioridad: 'MEDIA', visible_publicamente: true,
          latitud: coords.latitud, longitud: coords.longitud,
          evidencia: foto,
        });
      }
      resetForm();
      setModalVisible(false);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function completar(item: Incidencia) {
    try {
      const coords = await getCurrentLocation().catch(() => ({ latitud: undefined, longitud: undefined }));
      await hidroService.addSeguimientoIncidencia(item.id, {
        accion_realizada: 'Trabajo completado',
        observacion: item.descripcion,
        estado_nuevo: 'COMPLETADA',
        materiales_usados: materiales,
        latitud: coords.latitud,
        longitud: coords.longitud,
        evidencia: foto,
      });
      await load();
      Alert.alert('Éxito', 'Incidencia completada.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo completar.');
    }
  }

  async function cerrar(id: number) {
    Alert.alert('Cerrar incidencia', '¿Confirmas cerrar esta incidencia?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar', style: 'destructive', onPress: async () => {
        try { await hidroService.deleteIncidencia(id); await load(); }
        catch (e: any) { Alert.alert('Error', e?.message); }
      }},
    ]);
  }

  function getEstadoStyle(estado: string) {
    if (estado === 'RESUELTA' || estado === 'CERRADA' || estado === 'COMPLETADA')
      return { bg: '#d1e7dd', txt: '#0f5132', dot: '#16a34a' };
    if (estado === 'EN_PROCESO')
      return { bg: '#cfe2ff', txt: '#084298', dot: '#0d6efd' };
    return { bg: '#fff3cd', txt: '#856404', dot: '#f59e0b' };
  }

  function getTipoIcon(tipo: string) {
    if (tipo === 'FUGA')          return '💧';
    if (tipo === 'BAJA_PRESION')  return '📉';
    if (tipo === 'SIN_AGUA')      return '🚫';
    if (tipo === 'CONTAMINACION') return '⚠️';
    return '🔧';
  }

  const abiertas = incidencias.filter(i => i.estado !== 'CERRADA' && i.estado !== 'COMPLETADA' && i.estado !== 'RESUELTA').length;

  return (
    <SafeAreaView style={s.safe}>

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Incidencias</Text>
          <Text style={s.subtitle}>{incidencias.length} registradas · {abiertas} abiertas</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.btnRefresh} onPress={load}>
            <Text style={s.btnRefreshTxt}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnNuevo} onPress={() => { resetForm(); setModalVisible(true); }}>
            <Text style={s.btnNuevoTxt}>+ Reportar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSalir} onPress={onLogout}>
            <Text style={s.btnSalirTxt}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPIs */}
      <View style={s.kpis}>
        <View style={[s.kpi, { borderLeftColor: '#1a5fa8' }]}>
          <Text style={s.kpiVal}>{incidencias.length}</Text>
          <Text style={s.kpiLabel}>Total</Text>
        </View>
        <View style={[s.kpi, { borderLeftColor: '#f59e0b' }]}>
          <Text style={[s.kpiVal, { color: '#f59e0b' }]}>{abiertas}</Text>
          <Text style={s.kpiLabel}>Abiertas</Text>
        </View>
        <View style={[s.kpi, { borderLeftColor: '#16a34a' }]}>
          <Text style={[s.kpiVal, { color: '#16a34a' }]}>
            {incidencias.length - abiertas}
          </Text>
          <Text style={s.kpiLabel}>Resueltas</Text>
        </View>
      </View>

      {/* LISTA */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#1a5fa8" />
          <Text style={s.loadingTxt}>Cargando incidencias...</Text>
        </View>
      ) : incidencias.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>✅</Text>
          <Text style={s.emptyTxt}>No hay incidencias registradas.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {incidencias.map(item => {
            const estado = getEstadoStyle(item.estado);
            return (
              <View key={item.id} style={[s.card, { borderLeftColor: estado.dot }]}>

                {/* Header */}
                <View style={s.cardHeader}>
                  <Text style={s.cardIcon}>{getTipoIcon(item.tipo_incidencia)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{item.titulo || item.tipo_incidencia}</Text>
                    <Text style={s.cardMeta}>
                      {item.fecha_reporte} {item.hora_reporte}
                      {item.usuario ? ` · ${item.usuario}` : ''}
                    </Text>
                  </View>
                  <Text style={s.cardId}>#{item.id}</Text>
                </View>

                {/* Descripción */}
                {item.descripcion ? (
                  <Text style={s.cardDesc}>{item.descripcion}</Text>
                ) : null}

                {/* Coordenadas */}
                {item.latitud && item.longitud ? (
                  <Text style={s.cardCoords}>
                    📍 {Number(item.latitud).toFixed(5)}, {Number(item.longitud).toFixed(5)}
                  </Text>
                ) : null}

                {/* Badges */}
                <View style={s.badgeRow}>
                  <View style={[s.badge, { backgroundColor: '#f1f5f9' }]}>
                    <Text style={[s.badgeTxt, { color: '#475569' }]}>{item.tipo_incidencia}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: estado.bg }]}>
                    <View style={[s.dot, { backgroundColor: estado.dot }]} />
                    <Text style={[s.badgeTxt, { color: estado.txt }]}>{item.estado}</Text>
                  </View>
                </View>

                {/* Evidencia */}
                {item.evidencias?.[0] ? (
                  <TouchableOpacity onPress={() => setPreviewImg(item.evidencias?.[0] || null)}>
                    <Image
                      source={{ uri: `http://192.168.18.25:5000/dashboard/uploads/${item.evidencias[0]}` }}
                      style={s.evidenciaThumb}
                    />
                  </TouchableOpacity>
                ) : null}

                {/* Acciones ADMIN/TECNICO */}
                {(user.rol === 'ADMIN' || user.rol === 'TECNICO') && (
                  <View style={s.cardActions}>
                    <TouchableOpacity style={s.btnEdit} onPress={() => {
                      setEditingId(item.id);
                      setTipo(item.tipo_incidencia || 'FUGA');
                      setTitulo(item.titulo || '');
                      setDescripcion(item.descripcion || '');
                      setModalVisible(true);
                    }}>
                      <Text style={s.btnEditTxt}>✏️ Editar</Text>
                    </TouchableOpacity>
                    {item.estado !== 'COMPLETADA' && item.estado !== 'CERRADA' && (
                      <TouchableOpacity style={s.btnCompletar} onPress={() => completar(item)}>
                        <Text style={s.btnCompletarTxt}>✓ Completar</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={s.btnCerrar} onPress={() => cerrar(item.id)}>
                      <Text style={s.btnCerrarTxt}>✕ Cerrar</Text>
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
              <Text style={s.modalTitle}>{editingId ? 'Editar incidencia' : 'Nuevo reporte'}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }}>
              <Text style={s.fieldLabel}>Tipo de incidencia</Text>
              <View style={s.selectorRow}>
                {['FUGA', 'BAJA_PRESION', 'SIN_AGUA', 'CONTAMINACION', 'OTRO'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.selectorBtn, tipo === t && s.selectorBtnActive]}
                    onPress={() => setTipo(t)}
                  >
                    <Text style={[s.selectorTxt, tipo === t && s.selectorTxtActive]}>
                      {getTipoIcon(t)} {t.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>Título *</Text>
              <TextInput
                style={s.fieldInput}
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Describe brevemente el problema..."
                placeholderTextColor="#94a3b8"
              />

              <Text style={s.fieldLabel}>Descripción</Text>
              <TextInput
                style={[s.fieldInput, { height: 90, textAlignVertical: 'top' }]}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                placeholder="Más detalles del problema..."
                placeholderTextColor="#94a3b8"
              />

              {user.rol !== 'SOCIO' && (
                <>
                  <Text style={s.fieldLabel}>Materiales usados</Text>
                  <TextInput
                    style={[s.fieldInput, { height: 70, textAlignVertical: 'top' }]}
                    value={materiales}
                    onChangeText={setMateriales}
                    multiline
                    placeholder="Tubo, válvula, abrazadera..."
                    placeholderTextColor="#94a3b8"
                  />
                </>
              )}

              <Text style={s.fieldLabel}>Fotografía</Text>
              <TouchableOpacity style={s.btnFoto} onPress={takePhoto}>
                <Text style={s.btnFotoTxt}>{foto ? '📷 Cambiar foto' : '📷 Tomar foto'}</Text>
              </TouchableOpacity>
              {foto?.uri && (
                <Image source={{ uri: foto.uri }} style={s.fotoPreview} />
              )}
            </ScrollView>

            <TouchableOpacity
              style={[s.btnGuardar, saving && { opacity: .6 }]}
              onPress={submit}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnGuardarTxt}>
                    {editingId ? '💾 Guardar cambios' : '📤 Enviar reporte'}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PREVIEW IMAGEN */}
      <Modal visible={!!previewImg} transparent animationType="fade">
        <TouchableOpacity style={s.previewOverlay} onPress={() => setPreviewImg(null)}>
          {previewImg && (
            <Image
              source={{ uri: `http://192.168.18.25:5000/dashboard/uploads/${previewImg}` }}
              style={s.previewImg}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
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
  btnNuevo: { backgroundColor: '#1a5fa8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
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
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardIcon: { fontSize: 22 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  cardMeta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  cardId: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#475569', lineHeight: 20 },
  cardCoords: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  dot: { width: 7, height: 7, borderRadius: 999 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  evidenciaThumb: { width: '100%', height: 140, borderRadius: 10 },
  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btnEdit: { backgroundColor: '#e0ecff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnEditTxt: { color: '#1a5fa8', fontWeight: '600', fontSize: 12 },
  btnCompletar: { backgroundColor: '#d1e7dd', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnCompletarTxt: { color: '#0f5132', fontWeight: '600', fontSize: 12 },
  btnCerrar: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnCerrarTxt: { color: '#dc2626', fontWeight: '600', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalClose: { fontSize: 18, color: '#94a3b8', padding: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6, marginTop: 12 },
  fieldInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  selectorBtnActive: { backgroundColor: '#1a5fa8', borderColor: '#1a5fa8' },
  selectorTxt: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  selectorTxtActive: { color: '#fff' },
  btnFoto: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  btnFotoTxt: { color: '#334155', fontWeight: '600', fontSize: 14 },
  fotoPreview: { width: '100%', height: 180, borderRadius: 12, marginTop: 8 },
  btnGuardar: { backgroundColor: '#1a5fa8', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  btnGuardarTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.9)', alignItems: 'center', justifyContent: 'center' },
  previewImg: { width: '95%', height: '80%' },
});