import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Card, EmptyState, LoadingBlock, PrimaryButton, Screen, SectionTitle, SecondaryButton, Badge } from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { Pago, UsuarioAuth } from '../../types';

export default function PagosScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [items, setItems] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() { try { setLoading(true); setItems(await hidroService.listPagos()); } catch (e:any) { Alert.alert('Pagos', e.message || 'No se pudieron cargar.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  return <Screen title="Pagos registrados" subtitle="Comprobantes y pagos cobrados en el sistema." actions={<View style={{ flexDirection:'row', gap:8 }}><SecondaryButton label="Refrescar" onPress={() => void load()} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
    <Card><SectionTitle title="Listado" meta={`${items.length} registros`} />
    {loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState text="No hay pagos registrados." /> : items.map((p) => <Card key={p.id} soft><SectionTitle title={`Pago #${p.id}`} meta={`${p.fecha_pago} ${p.hora_pago}`} /><Text>Planilla: {p.planilla_id}</Text><Text>Valor: ${Number(p.valor_pagado || 0).toFixed(2)}</Text><Text>Método: {p.metodo_pago || '-'}</Text><Text>Referencia: {p.referencia_pago || '-'}</Text><Badge text={p.registrado_por || 'Sistema'} type="success" /></Card>)}
    </Card></Screen>;
}
