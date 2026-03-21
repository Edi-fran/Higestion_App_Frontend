
import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Badge, Card, EmptyState, Input, LoadingBlock, PrimaryButton, Screen, SectionTitle, SecondaryButton } from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { Aviso, UsuarioAuth } from '../../types';

export default function AvisosScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ titulo: '', contenido: '', tipo_aviso: 'COMUNICADO', prioridad: 'MEDIA' });

  async function load() {
    try { setLoading(true); setAvisos(await hidroService.listAvisos()); } catch (e: any) { Alert.alert('Avisos', e.message || 'No se pudieron cargar los avisos.'); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function save() {
    try {
      if (editingId) await hidroService.updateAviso(editingId, form);
      else await hidroService.createAviso(form);
      Alert.alert('Avisos', editingId ? 'Aviso actualizado correctamente.' : 'Aviso publicado correctamente.');
      setForm({ titulo: '', contenido: '', tipo_aviso: 'COMUNICADO', prioridad: 'MEDIA' });
      setEditingId(null);
      await load();
    } catch (e: any) { Alert.alert('Avisos', e.message || 'No se pudo guardar el aviso.'); }
  }

  async function remove(id: number) {
    try { await hidroService.deleteAviso(id); await load(); } catch (e: any) { Alert.alert('Avisos', e.message || 'No se pudo eliminar el aviso.'); }
  }

  return (
    <Screen title="Avisos oficiales" subtitle="Cortes programados, trabajos, reuniones y comunicados de la junta." actions={<View style={{ flexDirection: 'row', gap: 8 }}><SecondaryButton label="Refrescar" onPress={() => void load()} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
      {user.rol === 'ADMIN' && (
        <Card>
          <SectionTitle title={editingId ? 'Editar aviso' : 'Publicar aviso'} meta="CRUD de avisos desde la app y el dashboard." />
          <Input label="Título" value={form.titulo} onChangeText={(v) => setForm({ ...form, titulo: v })} />
          <Input label="Contenido" value={form.contenido} onChangeText={(v) => setForm({ ...form, contenido: v })} multiline />
          <Input label="Tipo" value={form.tipo_aviso} onChangeText={(v) => setForm({ ...form, tipo_aviso: v.toUpperCase() })} />
          <Input label="Prioridad" value={form.prioridad} onChangeText={(v) => setForm({ ...form, prioridad: v.toUpperCase() })} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PrimaryButton label={editingId ? 'Guardar cambios' : 'Publicar'} onPress={save} />
            {editingId ? <SecondaryButton label="Cancelar" onPress={() => { setEditingId(null); setForm({ titulo: '', contenido: '', tipo_aviso: 'COMUNICADO', prioridad: 'MEDIA' }); }} /> : null}
          </View>
        </Card>
      )}
      <Card>
        <SectionTitle title="Tablón de avisos" meta="Información oficial para toda la comunidad." />
        {loading ? <LoadingBlock /> : avisos.length === 0 ? <EmptyState text="No hay avisos publicados." /> : avisos.map((item) => (
          <View key={item.id} style={{ borderTopWidth: 1, borderColor: '#E7EDF3', paddingTop: 12, gap: 6 }}>
            <Text style={{ fontWeight: '800' }}>{item.titulo}</Text>
            <Text>{item.contenido}</Text>
            <Text>{item.fecha_publicacion} {item.hora_publicacion}</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Badge text={item.tipo_aviso} />
              <Badge text={item.prioridad} type={item.prioridad === 'ALTA' || item.prioridad === 'URGENTE' ? 'warning' : 'default'} />
            </View>
            {user.rol === 'ADMIN' ? <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}><SecondaryButton label="Editar" onPress={() => { setEditingId(item.id); setForm({ titulo: item.titulo, contenido: item.contenido, tipo_aviso: item.tipo_aviso, prioridad: item.prioridad }); }} /><SecondaryButton label="Eliminar" onPress={() => void remove(item.id)} /></View> : null}
          </View>
        ))}
      </Card>
    </Screen>
  );
}
