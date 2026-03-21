import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Badge, Card, EmptyState, LoadingBlock, MetricCard, PrimaryButton, Screen, SectionTitle, SecondaryButton } from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { ConsumoSemestral, UsuarioAuth } from '../../types';

export default function StatsScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [items, setItems] = useState<ConsumoSemestral[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() { try { setLoading(true); setItems(await hidroService.estadisticaSemestral()); } catch (e:any) { Alert.alert('Estadística', e.message || 'No se pudo cargar.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  return <Screen title="Consumo semestral" subtitle="Resumen de consumo y valores a pagar de los últimos seis períodos." actions={<View style={{ flexDirection:'row', gap:8 }}><SecondaryButton label="Refrescar" onPress={() => void load()} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
    <Card><SectionTitle title="Indicadores" meta={user.nombre} />{loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState text="No hay historial suficiente." /> : items.map((i) => <Card key={i.etiqueta} soft><View style={{ flexDirection:'row', gap:12, flexWrap:'wrap' }}><MetricCard label={i.etiqueta} value={`${i.consumo_m3} m³`} /><MetricCard label="Total" value={`$${i.total_pagar.toFixed(2)}`} /><Badge text={i.estado} type={i.estado === 'PAGADO' ? 'success' : 'warning'} /></View></Card>)}</Card></Screen>;
}
