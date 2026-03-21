import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import {
  Badge,
  Card,
  EmptyState,
  LoadingBlock,
  PrimaryButton,
  Screen,
  SectionTitle,
  SecondaryButton,
} from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { Notificacion } from '../../types';

type Props = {
  onLogout: () => void;
};

export default function NotificationsScreen({ onLogout }: Props) {
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await hidroService.listNotificaciones();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('Notificaciones', e?.message || 'No se pudieron cargar.');
    } finally {
      setLoading(false);
    }
  }

  async function sincronizarAlertas() {
    try {
      await hidroService.syncNotificaciones();
      await load();
    } catch (e: any) {
      Alert.alert(
        'Notificaciones',
        e?.message || 'No se pudieron sincronizar las alertas.'
      );
    }
  }

  async function marcarLeida(id: number) {
    try {
      await hidroService.readNotificacion(id);
      await load();
    } catch (e: any) {
      Alert.alert(
        'Notificaciones',
        e?.message || 'No se pudo marcar como leída.'
      );
    }
  }

  return (
    <Screen
      title="Notificaciones"
      subtitle="Alertas de pago, incidencias y tareas según tu rol."
      actions={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SecondaryButton label="Refrescar" onPress={() => void load()} />
          <SecondaryButton
            label="Sincronizar"
            onPress={() => void sincronizarAlertas()}
          />
          <PrimaryButton label="Salir" onPress={onLogout} danger />
        </View>
      }
    >
      <Card>
        <SectionTitle title="Bandeja" meta={`${items.length} notificaciones`} />

        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState text="No hay notificaciones." />
        ) : (
          items.map((n) => (
            <Card key={n.id} soft>
              <SectionTitle title={n.titulo} meta={`${n.fecha} ${n.hora}`} />
              <Badge
                text={n.tipo}
                type={n.leido ? 'default' : 'warning'}
              />
              <PrimaryButton
                label={n.leido ? 'Leída' : 'Marcar leída'}
                onPress={() => void marcarLeida(n.id)}
                disabled={n.leido}
              />
            </Card>
          ))
        )}
      </Card>
    </Screen>
  );
}