import React, { useEffect, useState } from 'react';
import {
  Alert, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView, Image,
  TextInput, Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getCurrentLocation, hidroService, pickEvidence } from '../../services/hidroService';
import { Lectura, MedidorListado, UsuarioAuth } from '../../types';

export default function LecturasScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {

  const [items, setItems] = useState<Lectura[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [search, setSearch] = useState('');
  const [medidores, setMedidores] = useState<MedidorListado[]>([]);
  const [searching, setSearching] = useState(false);
  const [medidorSel, setMedidorSel] = useState<MedidorListado | null>(null);
  const [viviendaId, setViviendaId] = useState('');
  const [numeroMedidor, setNumeroMedidor] = useState('');

  const [lecturaActual, setLecturaActual] = useState('');
  const [observacion, setObservacion] = useState('');
  const [foto, setFoto] = useState<any>(null);
  const [coords, setCoords] = useState<{ latitud: number; longitud: number } | null>(null);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const puedeRegistrar = user.rol === 'ADMIN' || user.rol === 'TECNICO';

  useEffect(() => { loadList(); }, []);

  async function loadList() {
    try {
      setLoadingList(true);
      setItems(await hidroService.listLecturas());
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar las lecturas.');
    } finally {
      setLoadingList(false);
    }
  }

  async function buscarMedidores() {
    if (!search.trim()) { Alert.alert('Aviso', 'Ingresa una cédula o número de medidor.'); return; }
    try {
      setSearching(true);
      const meds = await hidroService.listMedidores(search.trim());
      setMedidores(meds);
      if (meds.length === 0) Alert.alert('Sin resultados', 'No se encontraron medidores.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Error al buscar.');
    } finally {
      setSearching(false);
    }
  }

  async function abrirScanner() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) { Alert.alert('Permiso requerido', 'Necesitas permitir el acceso a la cámara.'); return; }
    }
    setScannerVisible(true);
  }

  function onBarcodeScanned({ data }: { data: string }) {
    setScannerVisible(false);
    setSearch(data);
    setTimeout(() => buscarMedidoresConTexto(data), 300);
  }

  async function buscarMedidoresConTexto(texto: string) {
    try {
      setSearching(true);
      const meds = await hidroService.listMedidores(texto.trim());
      setMedidores(meds);
      if (meds.length === 1) seleccionarMedidor(meds[0]);
      else if (meds.length === 0) Alert.alert('Sin resultados', 'No se encontró medidor con ese código.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Error al buscar.');
    } finally {
      setSearching(false);
    }
  }

  function seleccionarMedidor(m: MedidorListado) {
    setMedidorSel(m);
    setViviendaId(String((m as any).vivienda_id || ''));
    setNumeroMedidor(m.numero_medidor);
    setMedidores([]);
    obtenerCoordenadas();
  }

  function limpiar() {
    setMedidorSel(null); setViviendaId(''); setNumeroMedidor('');
    setLecturaActual(''); setObservacion(''); setFoto(null);
    setCoords(null); setEditingId(null); setSearch(''); setMedidores([]);
  }

  async function obtenerCoordenadas() {
    try {
      setLoadingCoords(true);
      setCoords(await getCurrentLocation());
    } catch (e: any) {
      Alert.alert('Ubicación', e?.message || 'No se pudo obtener la ubicación.');
    } finally {
      setLoadingCoords(false);
    }
  }

  async function tomarFoto() {
    try {
      const asset = await pickEvidence();
      if (asset) setFoto(asset);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo abrir la cámara.');
    }
  }

  async function submit() {
    if (!numeroMedidor && !viviendaId) { Alert.alert('Aviso', 'Selecciona un medidor.'); return; }
    if (!lecturaActual.trim()) { Alert.alert('Aviso', 'Ingresa la lectura actual.'); return; }
    let finalCoords = coords;
    if (!finalCoords) {
      try { finalCoords = await getCurrentLocation(); setCoords(finalCoords); } catch {}
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await hidroService.updateLectura(editingId, { lectura_actual: Number(lecturaActual), observacion, estado: 'REGISTRADA' });
        Alert.alert('Éxito', 'Lectura actualizada correctamente.');
      } else {
        await hidroService.createLectura({
          vivienda_id: viviendaId ? Number(viviendaId) : undefined,
          numero_medidor: numeroMedidor || undefined,
          lectura_actual: Number(lecturaActual),
          observacion,
          latitud: finalCoords?.latitud,
          longitud: finalCoords?.longitud,
          evidencia: foto,
        });
        Alert.alert('Éxito', 'Lectura registrada correctamente.');
      }
      limpiar();
      await loadList();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar la lectura.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>{user.rol === 'SOCIO' ? 'Mis lecturas' : 'Lecturación'}</Text>
          <Text style={s.subtitle}>{items.length} registros</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.btnRefresh} onPress={loadList}>
            <Text style={s.btnRefreshTxt}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSalir} onPress={onLogout}>
            <Text style={s.btnSalirTxt}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* ── FORMULARIO (solo ADMIN/TECNICO) ── */}
        {puedeRegistrar && (
          <>
            {/* PASO 1 */}
            <View style={s.card}>
              <View style={s.stepHeader}>
                <View style={s.stepBadge}><Text style={s.stepNum}>1</Text></View>
                <View>
                  <Text style={s.stepTitle}>Buscar medidor</Text>
                  <Text style={s.stepSub}>Cédula, número de medidor o escanea el código</Text>
                </View>
              </View>

              <View style={s.searchRow}>
                <TextInput
                  style={s.input}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Cédula o N° medidor..."
                  placeholderTextColor="#94a3b8"
                  onSubmitEditing={buscarMedidores}
                />
                <TouchableOpacity style={s.btnScan} onPress={abrirScanner}>
                  <Text style={s.btnScanTxt}>📷 QR</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={s.btnPrimary} onPress={buscarMedidores} disabled={searching}>
                {searching
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.btnPrimaryTxt}>🔍 Buscar medidor</Text>
                }
              </TouchableOpacity>

              {medidores.map(m => (
                <TouchableOpacity key={m.id} style={s.medidorCard} onPress={() => seleccionarMedidor(m)}>
                  <View style={s.medidorRow}>
                    <View style={s.medidorIcon}><Text style={s.medidorIconTxt}>⚡</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.medidorNum}>{m.numero_medidor}</Text>
                      <Text style={s.medidorSocio}>{m.socio}</Text>
                      <Text style={s.medidorDir}>{m.direccion || '-'}</Text>
                    </View>
                    <Text style={s.medidorArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* PASO 2 */}
            {medidorSel && (
              <View style={s.card}>
                <View style={s.stepHeader}>
                  <View style={[s.stepBadge, { backgroundColor: '#16a34a' }]}><Text style={s.stepNum}>2</Text></View>
                  <View>
                    <Text style={s.stepTitle}>Medidor seleccionado</Text>
                    <Text style={s.stepSub}>Verifica que sea el correcto</Text>
                  </View>
                </View>

                <View style={s.medidorSelCard}>
                  <Text style={s.medidorSelNum}>{medidorSel.numero_medidor}</Text>
                  <Text style={s.medidorSelSocio}>{medidorSel.socio}</Text>
                  <Text style={s.medidorSelDir}>{medidorSel.direccion || '-'}</Text>
                  <View style={s.badgeSuccess}><Text style={s.badgeSuccessTxt}>✓ Seleccionado</Text></View>
                </View>

                <TouchableOpacity style={s.btnSecondary} onPress={limpiar}>
                  <Text style={s.btnSecondaryTxt}>↩ Cambiar medidor</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PASO 3 */}
            {medidorSel && (
              <View style={s.card}>
                <View style={s.stepHeader}>
                  <View style={[s.stepBadge, { backgroundColor: '#1a5fa8' }]}><Text style={s.stepNum}>3</Text></View>
                  <View>
                    <Text style={s.stepTitle}>Registrar lectura</Text>
                    <Text style={s.stepSub}>Ingresa el valor, foto y ubicación</Text>
                  </View>
                </View>

                {/* Lectura actual */}
                <Text style={s.inputLabel}>Lectura actual (m³) *</Text>
                <TextInput
                  style={s.input}
                  value={lecturaActual}
                  onChangeText={setLecturaActual}
                  keyboardType="numeric"
                  placeholder="Ej. 1234"
                  placeholderTextColor="#94a3b8"
                />

                {/* Observación */}
                <Text style={s.inputLabel}>Observación (opcional)</Text>
                <TextInput
                  style={[s.input, { height: 80, textAlignVertical: 'top' }]}
                  value={observacion}
                  onChangeText={setObservacion}
                  multiline
                  placeholder="Alguna novedad del medidor..."
                  placeholderTextColor="#94a3b8"
                />

                {/* Foto */}
                <Text style={s.inputLabel}>Fotografía del medidor</Text>
                <TouchableOpacity style={s.btnFoto} onPress={tomarFoto}>
                  <Text style={s.btnFotoTxt}>{foto ? '📷 Cambiar fotografía' : '📷 Tomar fotografía'}</Text>
                </TouchableOpacity>
                {foto?.uri && (
                  <Image source={{ uri: foto.uri }}
                    style={s.fotoPreview} />
                )}

                {/* Coordenadas */}
                <Text style={s.inputLabel}>Ubicación GPS</Text>
                {loadingCoords ? (
                  <View style={s.coordBox}>
                    <ActivityIndicator size="small" color="#1a5fa8" />
                    <Text style={s.coordTxt}>Obteniendo ubicación...</Text>
                  </View>
                ) : coords ? (
                  <View style={[s.coordBox, { backgroundColor: '#f0fdf4', borderColor: '#16a34a' }]}>
                    <Text style={[s.coordTxt, { color: '#16a34a' }]}>
                      ✓ Lat: {coords.latitud.toFixed(6)}
                    </Text>
                    <Text style={[s.coordTxt, { color: '#16a34a' }]}>
                      Lng: {coords.longitud.toFixed(6)}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity style={s.btnSecondary} onPress={obtenerCoordenadas}>
                    <Text style={s.btnSecondaryTxt}>📍 Obtener ubicación GPS</Text>
                  </TouchableOpacity>
                )}

                {/* Botón guardar */}
                <TouchableOpacity
                  style={[s.btnPrimary, submitting && { opacity: .6 }]}
                  onPress={submit}
                  disabled={submitting}
                >
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.btnPrimaryTxt}>
                        {editingId ? '💾 Guardar cambios' : '✓ Guardar lectura'}
                      </Text>
                  }
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ── LISTADO ── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>
            {user.rol === 'SOCIO' ? 'Historial personal' : 'Lecturas registradas'}
          </Text>

          {loadingList ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color="#1a5fa8" />
              <Text style={s.loadingTxt}>Cargando...</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={s.center}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTxt}>No hay lecturas registradas.</Text>
            </View>
          ) : (
            items.map(item => (
              <View key={item.id} style={s.lecturaCard}>
                <View style={s.lecturaHeader}>
                  <View>
                    <Text style={s.lecturaSocio}>{item.socio || 'Lectura'}</Text>
                    <Text style={s.lecturaMedidor}>{item.medidor || '-'} · {item.cedula || '-'}</Text>
                  </View>
                  <View style={[s.estadoBadge, { backgroundColor: item.estado === 'REGISTRADA' ? '#e0ecff' : '#fee2e2' }]}>
                    <Text style={[s.estadoTxt, { color: item.estado === 'REGISTRADA' ? '#1d4ed8' : '#dc2626' }]}>
                      {item.estado}
                    </Text>
                  </View>
                </View>

                <View style={s.lecturaData}>
                  <View style={s.lecturaDataItem}>
                    <Text style={s.dataLabel}>Anterior</Text>
                    <Text style={s.dataVal}>{item.lectura_anterior ?? '-'}</Text>
                  </View>
                  <View style={s.lecturaDataItem}>
                    <Text style={s.dataLabel}>Actual</Text>
                    <Text style={s.dataVal}>{item.lectura_actual}</Text>
                  </View>
                  <View style={s.lecturaDataItem}>
                    <Text style={s.dataLabel}>Consumo</Text>
                    <Text style={[s.dataVal, { color: '#1a5fa8' }]}>{item.consumo_calculado ?? '-'} m³</Text>
                  </View>
                </View>

                <Text style={s.lecturaFecha}>📅 {item.fecha_lectura} {item.hora_lectura}</Text>

                {item.latitud && item.longitud && (
                  <Text style={s.lecturaCoords}>
                    📍 {Number(item.latitud).toFixed(5)}, {Number(item.longitud).toFixed(5)}
                  </Text>
                )}

                {item.evidencias?.[0] && (
                  <Image
                    source={{ uri: `http://192.168.18.25:5000/dashboard/uploads/${item.evidencias[0]}` }}
                    style={s.evidenciaThumb}
                  />
                )}

                {puedeRegistrar && (
                  <View style={s.lecturaActions}>
                    <TouchableOpacity style={s.btnSmall} onPress={() => {
                      setMedidorSel({ id: 0, numero_medidor: item.medidor || '', socio: item.socio || '', direccion: item.direccion } as any);
                      setNumeroMedidor(item.medidor || '');
                      setEditingId(item.id);
                      setLecturaActual(String(item.lectura_actual ?? ''));
                      setObservacion(item.observacion || '');
                    }}>
                      <Text style={s.btnSmallTxt}>✏️ Editar</Text>
                    </TouchableOpacity>

                    {user.rol === 'ADMIN' && (
                      <TouchableOpacity style={[s.btnSmall, { backgroundColor: '#fee2e2' }]}
                        onPress={async () => {
                          try {
                            await hidroService.deleteLectura(item.id);
                            await loadList();
                          } catch (e: any) {
                            Alert.alert('Error', e?.message || 'No se pudo anular.');
                          }
                        }}>
                        <Text style={[s.btnSmallTxt, { color: '#dc2626' }]}>🗑 Anular</Text>
                      </TouchableOpacity>
                    )}

                    {user.rol === 'SOCIO' && (
                      <TouchableOpacity style={[s.btnSmall, { backgroundColor: '#fff3cd' }]}
                        onPress={async () => {
                          try {
                            await hidroService.reclamarLectura(item.id, { motivo: 'Lectura incorrecta', descripcion: 'Solicito revisión.' });
                            Alert.alert('Éxito', 'Reclamo enviado correctamente.');
                          } catch (e: any) {
                            Alert.alert('Error', e?.message);
                          }
                        }}>
                        <Text style={[s.btnSmallTxt, { color: '#856404' }]}>⚠️ Reclamar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* MODAL ESCÁNER */}
      <Modal visible={scannerVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={s.scannerHeader}>
            <Text style={s.scannerTitle}>Escanear código</Text>
            <TouchableOpacity onPress={() => setScannerVisible(false)}>
              <Text style={s.scannerClose}>✕ Cerrar</Text>
            </TouchableOpacity>
          </View>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={onBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'] }}
          />
          <View style={s.scannerOverlay}>
            <View style={s.scannerFrame} />
            <Text style={s.scannerHint}>Apunta la cámara al código QR o de barras</Text>
          </View>
        </SafeAreaView>
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
  btnSalir: { backgroundColor: '#dc2626', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  btnSalirTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { padding: 14, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge: { width: 32, height: 32, borderRadius: 999, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  stepSub: { fontSize: 12, color: '#64748b' },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: .5 },
  btnScan: { backgroundColor: '#0f2d5c', paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnScanTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnPrimary: { backgroundColor: '#1a5fa8', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnPrimaryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondary: { borderWidth: 1.5, borderColor: '#1a5fa8', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  btnSecondaryTxt: { color: '#1a5fa8', fontWeight: '600', fontSize: 14 },
  btnFoto: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  btnFotoTxt: { color: '#334155', fontWeight: '600', fontSize: 14 },
  fotoPreview: { width: '100%', height: 200, borderRadius: 12, marginTop: 4 },
  coordBox: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, gap: 4, backgroundColor: '#f8fafc' },
  coordTxt: { fontSize: 13, color: '#64748b', fontFamily: 'monospace' },
  medidorCard: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden' },
  medidorRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  medidorIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#e0ecff', alignItems: 'center', justifyContent: 'center' },
  medidorIconTxt: { fontSize: 18 },
  medidorNum: { fontSize: 14, fontWeight: '800', color: '#1a5fa8', fontFamily: 'monospace' },
  medidorSocio: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  medidorDir: { fontSize: 12, color: '#94a3b8' },
  medidorArrow: { fontSize: 24, color: '#94a3b8' },
  medidorSelCard: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, gap: 4, borderWidth: 1, borderColor: '#16a34a' },
  medidorSelNum: { fontSize: 16, fontWeight: '800', color: '#1a5fa8', fontFamily: 'monospace' },
  medidorSelSocio: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  medidorSelDir: { fontSize: 12, color: '#64748b' },
  badgeSuccess: { backgroundColor: '#d1e7dd', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start', marginTop: 4 },
  badgeSuccessTxt: { color: '#0f5132', fontWeight: '700', fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  loadingTxt: { color: '#64748b', fontSize: 15 },
  emptyIcon: { fontSize: 36 },
  emptyTxt: { color: '#94a3b8', fontSize: 15 },
  lecturaCard: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, gap: 8, marginBottom: 10 },
  lecturaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  lecturaSocio: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  lecturaMedidor: { fontSize: 12, color: '#64748b', marginTop: 2 },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  estadoTxt: { fontSize: 11, fontWeight: '700' },
  lecturaData: { flexDirection: 'row', gap: 8 },
  lecturaDataItem: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 8, padding: 8 },
  dataLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  dataVal: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  lecturaFecha: { fontSize: 12, color: '#64748b' },
  lecturaCoords: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },
  evidenciaThumb: { width: '100%', height: 140, borderRadius: 10 },
  lecturaActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  btnSmall: { backgroundColor: '#e0ecff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnSmallTxt: { color: '#1a5fa8', fontWeight: '600', fontSize: 12 },
  scannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#0f2d5c' },
  scannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scannerClose: { color: '#93c5fd', fontSize: 15, fontWeight: '600' },
  scannerOverlay: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center', gap: 16 },
  scannerFrame: { width: 220, height: 220, borderWidth: 3, borderColor: '#3b82f6', borderRadius: 16, backgroundColor: 'transparent' },
  scannerHint: { color: '#fff', fontSize: 14, textAlign: 'center', backgroundColor: 'rgba(0,0,0,.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
});