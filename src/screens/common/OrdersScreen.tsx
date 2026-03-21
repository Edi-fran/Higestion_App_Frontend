import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Badge, Card, EmptyState, Input, LoadingBlock, PrimaryButton, Screen, SectionTitle, SecondaryButton } from '../../components/Ui';
import { getCurrentLocation, hidroService, pickEvidence } from '../../services/hidroService';
import { OrdenTrabajo, UsuarioAuth } from '../../types';

export default function OrdersScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [items, setItems] = useState<OrdenTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState('');
  const [materiales, setMateriales] = useState('');
  const [foto, setFoto] = useState<any>(null);
  async function load() { try { setLoading(true); setItems(await hidroService.listOrdenes()); } catch (e:any) { Alert.alert('Órdenes', e.message || 'No se pudieron cargar.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function finalizar(id:number) {
    try { const geo = await getCurrentLocation().catch(() => ({ latitud: undefined, longitud: undefined })); const form = new FormData(); form.append('detalle_finalizacion', detalle || 'Actividad completada'); form.append('materiales_usados', materiales); if (geo.latitud != null) form.append('latitud', String(geo.latitud)); if (geo.longitud != null) form.append('longitud', String(geo.longitud)); if (foto?.uri) form.append('evidencia', { uri: foto.uri, name: foto.fileName || 'orden.jpg', type: foto.mimeType || 'image/jpeg' } as any); await hidroService.finalizarOrden(id, form); setDetalle(''); setMateriales(''); setFoto(null); await load(); Alert.alert('Órdenes', 'Actividad finalizada.'); } catch (e:any) { Alert.alert('Órdenes', e.message || 'No se pudo finalizar.'); }
  }
  return <Screen title="Órdenes técnicas" subtitle="Actividades encomendadas por administración o detectadas en campo." actions={<View style={{ flexDirection:'row', gap:8 }}><SecondaryButton label="Refrescar" onPress={() => void load()} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
    <Card><SectionTitle title="Registrar evidencia de trabajo" meta="Aplica al finalizar una actividad." /><Input label="Detalle de finalización" value={detalle} onChangeText={setDetalle} multiline /><Input label="Materiales usados" value={materiales} onChangeText={setMateriales} multiline /><SecondaryButton label={foto ? 'Cambiar foto' : 'Tomar foto'} onPress={() => void pickEvidence().then(setFoto)} /></Card>
    <Card><SectionTitle title="Mis órdenes" meta={`${items.length} actividades`} />{loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState text="No tienes órdenes." /> : items.map((o) => <Card key={o.id} soft><SectionTitle title={o.titulo} meta={`${o.fecha} ${o.hora}`} /><Text>{o.descripcion}</Text><View style={{ flexDirection:'row', gap:8, flexWrap:'wrap' }}><Badge text={o.estado} type={o.estado === 'FINALIZADA' ? 'success' : 'warning'} /><Badge text={o.prioridad} type='default' /></View><Text style={{ color:'#64748B' }}>{o.latitud ?? '-'}, {o.longitud ?? '-'}</Text>{o.estado !== 'FINALIZADA' ? <PrimaryButton label="Finalizar" onPress={() => void finalizar(o.id)} /> : null}</Card>)}</Card>
  </Screen>;
}
