import React, { useEffect, useState } from 'react';
import { Alert, Text, View, Linking } from 'react-native';
import { Card, EmptyState, LoadingBlock, PrimaryButton, Screen, SectionTitle, SecondaryButton, Badge } from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { PuntoIncidencia, UsuarioAuth } from '../../types';

export default function MapaIncidenciasScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [items, setItems] = useState<PuntoIncidencia[]>([]); const [loading, setLoading] = useState(true);
  async function load() { try { setLoading(true); setItems(await hidroService.incidenciasMapa()); } catch (e:any) { Alert.alert('Mapa', e.message || 'No se pudo cargar el mapa de incidencias.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  return <Screen title="Mapa de incidencias" subtitle="Ubicaciones reportadas en el sistema." actions={<View style={{ flexDirection:'row', gap:8 }}><SecondaryButton label="Refrescar" onPress={() => void load()} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
    <Card><SectionTitle title="Puntos" meta={`${items.length} incidencias georreferenciadas`} />{loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState text="No hay incidencias con coordenadas." /> : items.map((i) => <Card key={i.id} soft><SectionTitle title={i.titulo || i.tipo_incidencia} meta={`${i.fecha_reporte} ${i.hora_reporte}`} /><Text>{i.sector || 'Sin sector'} · {i.usuario || 'Sistema'}</Text><Text>Lat/Lng: {i.latitud ?? '-'}, {i.longitud ?? '-'}</Text><View style={{ flexDirection:'row', gap:8, flexWrap:'wrap' }}><Badge text={i.estado} type={i.estado === 'COMPLETADA' || i.estado === 'CERRADA' ? 'success' : 'warning'} /><Badge text={i.prioridad} type="default" /></View>{i.latitud != null && i.longitud != null ? <SecondaryButton label="Abrir mapa" onPress={() => void Linking.openURL(`https://www.google.com/maps?q=${i.latitud},${i.longitud}`)} /> : null}</Card>)}</Card>
  </Screen>;
}
