import React, { useEffect, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { Badge, Card, EmptyState, Input, LoadingBlock, PhotoPreviewModal, PhotoThumb, PrimaryButton, Screen, SecondaryButton, SectionTitle } from '../../components/Ui';
import { getCurrentLocation, hidroService, pickEvidence } from '../../services/hidroService';
import { Incidencia, UsuarioAuth } from '../../types';

export default function IncidenciasScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('FUGA');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [materiales, setMateriales] = useState('');

  async function load() {
    try {
      setLoading(true);
      setIncidencias(await hidroService.listIncidencias(false));
    } catch (e: any) {
      Alert.alert('Incidencias', e.message || 'No se pudieron cargar las incidencias.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function takePhoto() {
    try {
      const asset = await pickEvidence();
      if (asset) setFoto(asset);
    } catch (e: any) {
      Alert.alert('Incidencias', e.message || 'No se pudo abrir la cámara.');
    }
  }

  async function submit() {
    try {
      const coords = await getCurrentLocation();
      if (editingId) {
        await hidroService.updateIncidencia(editingId, { tipo_incidencia: tipo, titulo, descripcion, prioridad: 'MEDIA', estado: user.rol === 'SOCIO' ? 'REPORTADA' : 'EN_PROCESO' });
        Alert.alert('Incidencias', 'Incidencia actualizada correctamente.');
      } else {
        await hidroService.createIncidencia({ tipo_incidencia: tipo, titulo, descripcion, prioridad: 'MEDIA', visible_publicamente: true, latitud: coords.latitud, longitud: coords.longitud, evidencia: foto });
        Alert.alert('Incidencias', 'Reporte enviado correctamente.');
      }
      setTipo('FUGA');
      setTitulo('');
      setDescripcion('');
      setFoto(null);
      setEditingId(null);
      await load();
    } catch (e: any) {
      Alert.alert('Incidencias', e.message || 'No se pudo reportar la incidencia.');
    }
  }

  return (
    <Screen title="Incidencias" subtitle="Reporta daños visibles, fugas, baja presión o falta de agua con foto y coordenadas." actions={<View style={{ flexDirection: 'row', gap: 8 }}><SecondaryButton label="Refrescar" onPress={() => void load()} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
      <Card>
        <SectionTitle title={user.rol === 'SOCIO' ? 'Nuevo reporte' : 'Registrar / actualizar incidencia'} meta="El backend registra fecha, hora, coordenadas y seguimiento." />
        <Input label="Tipo" value={tipo} onChangeText={(v) => setTipo(v.toUpperCase())} placeholder="FUGA / BAJA_PRESION / SIN_AGUA" />
        <Input label="Título" value={titulo} onChangeText={setTitulo} />
        <Input label="Descripción" value={descripcion} onChangeText={setDescripcion} multiline />
        {user.rol !== 'SOCIO' ? <Input label="Materiales usados (si aplica)" value={materiales} onChangeText={setMateriales} multiline /> : null}
        <SecondaryButton label={foto ? 'Cambiar fotografía' : 'Tomar fotografía'} onPress={takePhoto} />
        {foto?.uri ? <Image source={{ uri: foto.uri }} style={{ width: 120, height: 120, borderRadius: 18 }} /> : null}
        <PrimaryButton label="Enviar reporte" onPress={submit} />
      </Card>

      <Card>
        <SectionTitle title="Incidencias recientes" meta="Seguimiento visual de novedades registradas en el sistema." />
        {loading ? <LoadingBlock /> : incidencias.length === 0 ? <EmptyState text="No hay incidencias registradas." /> : incidencias.map((item) => (
          <View key={item.id} style={{ borderTopWidth: 1, borderColor: '#E7EDF3', paddingTop: 12, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800' }}>{item.titulo || item.tipo_incidencia}</Text>
                <Text>{item.descripcion}</Text>
                <Text>{item.fecha_reporte} {item.hora_reporte}</Text>
                <Text>Coordenadas: {item.latitud ?? '-'}, {item.longitud ?? '-'}</Text>
                {item.usuario ? <Text>Reportó: {item.usuario}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Badge text={item.tipo_incidencia} />
                  <Badge text={item.estado} type={item.estado === 'RESUELTA' || item.estado === 'CERRADA' ? 'success' : 'warning'} />
                </View>
                {(user.rol === 'ADMIN' || user.rol === 'TECNICO') ? <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}><SecondaryButton label="Editar" onPress={() => { setEditingId(item.id); setTipo(item.tipo_incidencia || 'FUGA'); setTitulo(item.titulo || ''); setDescripcion(item.descripcion || ''); }} /><SecondaryButton label="Completar" onPress={() => void (async () => { try { const coords = await getCurrentLocation().catch(() => ({ latitud: undefined, longitud: undefined })); await hidroService.addSeguimientoIncidencia(item.id, { accion_realizada: 'Trabajo completado', observacion: descripcion || item.descripcion, estado_nuevo: 'COMPLETADA', materiales_usados: materiales, latitud: coords.latitud, longitud: coords.longitud, evidencia: foto }); await load(); Alert.alert('Incidencias', 'Incidencia completada.'); } catch (e: any) { Alert.alert('Incidencias', e.message || 'No se pudo completar.'); } })()} /><SecondaryButton label="Cerrar" onPress={() => void (async () => { try { await hidroService.deleteIncidencia(item.id); await load(); } catch (e: any) { Alert.alert('Incidencias', e.message || 'No se pudo cerrar.'); } })()} /></View> : null}
              </View>
              <PhotoThumb path={item.evidencias?.[0]} onOpen={() => setPreview(item.evidencias?.[0] || null)} />
            </View>
          </View>
        ))}
      </Card>
      <PhotoPreviewModal visible={!!preview} path={preview} onClose={() => setPreview(null)} />
    </Screen>
  );
}
