import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Card, EmptyState, Input, LoadingBlock, PrimaryButton, Screen, SectionTitle, SecondaryButton, Badge } from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { Reunion, UsuarioAuth } from '../../types';

export default function ReunionesScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [items, setItems] = useState<Reunion[]>([]); const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState(''); const [descripcion, setDescripcion] = useState(''); const [lugar, setLugar] = useState('');
  async function load() { try { setLoading(true); setItems(await hidroService.listReuniones()); } catch (e:any) { Alert.alert('Reuniones', e.message || 'No se pudieron cargar.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function crear() { try { await hidroService.createReunion({ titulo, descripcion, lugar }); setTitulo(''); setDescripcion(''); setLugar(''); await load(); } catch (e:any) { Alert.alert('Reuniones', e.message || 'No se pudo crear.'); } }
  async function eliminar(id:number) { try { await hidroService.deleteReunion(id); await load(); } catch (e:any) { Alert.alert('Reuniones', e.message || 'No se pudo eliminar.'); } }
  return <Screen title="Reuniones" subtitle="Agenda y comunicados de reuniones del sistema." actions={<View style={{ flexDirection:'row', gap:8 }}><SecondaryButton label="Refrescar" onPress={() => void load()} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
    {user.rol === 'ADMIN' ? <Card><SectionTitle title="Nueva reunión" /><Input label="Título" value={titulo} onChangeText={setTitulo} /><Input label="Descripción" value={descripcion} onChangeText={setDescripcion} multiline /><Input label="Lugar" value={lugar} onChangeText={setLugar} /><PrimaryButton label="Guardar reunión" onPress={() => void crear()} /></Card> : null}
    <Card><SectionTitle title="Agenda" meta={`${items.length} reuniones`} />{loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState text="No hay reuniones programadas." /> : items.map((r) => <Card key={r.id} soft><SectionTitle title={r.titulo} meta={`${r.fecha} ${r.hora}`} /><Text>{r.descripcion || 'Sin descripción'}</Text><Text>Lugar: {r.lugar || '-'}</Text><Badge text={r.estado} type={r.estado === 'REALIZADA' ? 'success' : 'warning'} />{user.rol === 'ADMIN' ? <SecondaryButton label="Eliminar" onPress={() => void eliminar(r.id)} /> : null}</Card>)}</Card>
  </Screen>;
}
