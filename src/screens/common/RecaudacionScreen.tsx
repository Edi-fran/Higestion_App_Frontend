import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { MetricCard, PrimaryButton, Screen, SectionTitle, SecondaryButton } from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { RecaudacionResumen, UsuarioAuth } from '../../types';

export default function RecaudacionScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [data, setData] = useState<RecaudacionResumen | null>(null);

  async function load() {
    try {
      setData(await hidroService.listRecaudacionResumen());
    } catch (e: any) {
      Alert.alert('Recaudación', e.message || 'No se pudo cargar el resumen.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Screen title="Recaudación" subtitle="Resumen de caja e ingresos registrados por el backend." actions={<View style={{ flexDirection: 'row', gap: 8 }}><SecondaryButton label="Refrescar" onPress={() => void load()} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
      <SectionTitle title="Indicadores contables" meta={`Usuario actual: ${user.nombre}`} />
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <MetricCard label="Recaudado" value={`$${(data?.total_recaudado || 0).toFixed(2)}`} />
        <MetricCard label="Pendiente" value={`$${(data?.total_pendiente || 0).toFixed(2)}`} />
        <MetricCard label="Planillas pagadas" value={data?.planillas_pagadas || 0} />
        <MetricCard label="Pagos" value={data?.pagos_registrados || 0} />
      </View>
    </Screen>
  );
}
