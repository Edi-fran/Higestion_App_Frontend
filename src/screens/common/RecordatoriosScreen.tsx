import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Card, EmptyState, Input, LoadingBlock, PrimaryButton, Screen, SectionTitle, SecondaryButton, Badge } from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { Recordatorio, UsuarioAuth } from '../../types';

export default function RecordatoriosScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [items, setItems] = useState<Recordatorio[]>([]); const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState(''); const [descripcion, setDescripcion] = useState('');
  async function load() { try { setLoading(true); setItems(await hidroService.listRecordatorios()); } catch (e:any) { Alert.alert('Recordatorios', e.message || 'No se pudieron cargar.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function crear() { try { await hidroService.createRecordatorio({ usuario_id: user.id, titulo, descripcion, tipo: 'SISTEMA' }); setTitulo(''); setDescripcion(''); await load(); } catch (e:any) { Alert.alert('Recordatorios', e.message || 'No se pudo crear.'); } }
  return <Screen title="Recordatorios" subtitle="Alertas manuales y recordatorios del sistema." actions={<View style={{ flexDirection:'row', gap:8 }}><SecondaryButton label="Refrescar" onPress={() => void load()} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
    {user.rol === 'ADMIN' ? <Card><SectionTitle title="Nuevo recordatorio" /><Input label="Título" value={titulo} onChangeText={setTitulo} /><Input label="Descripción" value={descripcion} onChangeText={setDescripcion} multiline /><PrimaryButton label="Guardar recordatorio" onPress={() => void crear()} /></Card> : null}
    <Card><SectionTitle title="Listado" meta={`${items.length} recordatorios`} />{loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState text="No hay recordatorios." /> : items.map((r) => <Card key={r.id} soft><SectionTitle title={r.titulo} meta={`${r.fecha} ${r.hora}`} /><Text>{r.descripcion || 'Sin descripción'}</Text><Badge text={r.tipo} type={r.enviado ? 'success' : 'warning'} /></Card>)}</Card>
  </Screen>;
}
