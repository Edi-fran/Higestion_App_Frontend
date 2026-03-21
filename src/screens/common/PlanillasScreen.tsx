import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Badge, Card, EmptyState, LinkButton, LoadingBlock, PrimaryButton, Screen, SectionTitle, SecondaryButton } from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { Planilla, UsuarioAuth } from '../../types';

export default function PlanillasScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [items, setItems] = useState<Planilla[]>([]);
  const [loading, setLoading] = useState(true);

  async function syncAlerts() {
    try {
      await hidroService.syncPlanillaAlerts();
      await load();
    } catch (e: any) {
      Alert.alert('Planillas', e.message || 'No se pudieron sincronizar las alertas.');
    }
  }

  async function load() {
    try {
      setLoading(true);
      setItems(await hidroService.listPlanillas());
    } catch (e: any) {
      Alert.alert('Planillas', e.message || 'No se pudieron cargar las planillas.');
    } finally {
      setLoading(false);
    }
  }

  async function marcarPagado(item: Planilla) {
    try {
      await hidroService.marcarPlanillaPagada(item.id, { valor_pagado: item.total_pagar, metodo_pago: 'EFECTIVO' });
      Alert.alert('Planillas', 'Planilla marcada como pagada.');
      await load();
    } catch (e: any) {
      Alert.alert('Planillas', e.message || 'No se pudo registrar el pago.');
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <Screen title="Planillas y comprobantes" subtitle="Consulta, cobro y descarga de planillas según el rol." actions={<View style={{ flexDirection: 'row', gap: 8 }}><SecondaryButton label="Refrescar" onPress={() => void load()} /><SecondaryButton label="Sincronizar" onPress={() => void syncAlerts()} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
      <Card>
        <SectionTitle title={user.rol === 'SOCIO' ? 'Mis planillas' : 'Planillas del sistema'} meta="El backend genera la planilla desde la lectura y el consumo." />
        {loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState text="No hay planillas registradas." /> : items.map((item) => (
          <View key={item.id} style={{ borderTopWidth: 1, borderColor: '#E7EDF3', paddingTop: 12, gap: 5 }}>
            <Text style={{ fontWeight: '800' }}>{item.numero_planilla}</Text>
            <Text>{item.socio || 'Usuario del sistema'} · Periodo {item.periodo_mes}/{item.periodo_anio}</Text>
            <Text>Consumo: {item.consumo_m3} m³</Text>
            <Text>Total: ${item.total_pagar.toFixed(2)}</Text>
            <Text>Emisión: {item.fecha_emision || '-'}</Text>
            {item.fecha_pago ? <Text>Pago: {item.fecha_pago}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Badge text={item.estado} type={item.estado === 'PAGADO' ? 'success' : 'warning'} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <LinkButton label="Planilla" url={hidroService.downloadPlanillaUrl(item.id)} />
              {item.estado === 'PAGADO' ? <LinkButton label="Comprobante" url={hidroService.obtenerComprobanteUrl(item.id)} /> : null}
              {user.rol === 'ADMIN' && item.estado !== 'PAGADO' ? <PrimaryButton label="Marcar pagada" onPress={() => void marcarPagado(item)} /> : null}
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
