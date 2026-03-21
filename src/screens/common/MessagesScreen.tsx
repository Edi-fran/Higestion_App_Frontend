import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { hidroService } from '../../services/hidroService';
import { Mensaje } from '../../types';
import {
  Card,
  EmptyState,
  Input,
  LoadingBlock,
  PrimaryButton,
  Screen,
  SectionTitle,
  SecondaryButton,
} from '../../components/Ui';

type Props = {
  onLogout: () => void;
};

export default function MessagesScreen({ onLogout }: Props) {
  const [items, setItems] = useState<Mensaje[]>([]);
  const [asunto, setAsunto] = useState('');
  const [contenido, setContenido] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await hidroService.listMensajes();
      setItems(data ?? []);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const send = useCallback(async () => {
    if (!asunto.trim() || !contenido.trim()) {
      return;
    }

    try {
      setSending(true);
      await hidroService.createMensaje({
        asunto: asunto.trim(),
        contenido: contenido.trim(),
      });
      setAsunto('');
      setContenido('');
      await load();
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    } finally {
      setSending(false);
    }
  }, [asunto, contenido, load]);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await hidroService.readMensaje(id);
        await load();
      } catch (error) {
        console.error('Error marcando mensaje como leído:', error);
      }
    },
    [load]
  );

  return (
    <Screen
      title="Mensajes"
      subtitle="Comunícate con administración y revisa respuestas."
      actions={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SecondaryButton label="Refrescar" onPress={() => void load()} />
          <PrimaryButton label="Salir" onPress={onLogout} danger />
        </View>
      }
    >
      <Card>
        <SectionTitle
          title="Nuevo mensaje"
          meta="Se envía al administrador por defecto."
        />
        <Input label="Asunto" value={asunto} onChangeText={setAsunto} />
        <Input
          label="Contenido"
          value={contenido}
          onChangeText={setContenido}
          multiline
        />
        <PrimaryButton
          label={sending ? 'Enviando...' : 'Enviar'}
          onPress={() => void send()}
        />
      </Card>

      <Card>
        <SectionTitle title="Historial" meta={`${items.length} mensajes`} />

        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState text="Sin mensajes." />
        ) : (
          items.map((m) => (
            <Card key={m.id} soft>
              <Text style={{ fontWeight: '800' }}>{m.asunto}</Text>
              <Text>{m.contenido}</Text>
              <Text style={{ color: '#64748B' }}>
                {m.fecha} {m.hora} · {m.remitente} → {m.destinatario}
              </Text>

              {!m.leido ? (
                <SecondaryButton
                  label="Marcar leído"
                  onPress={() => void markAsRead(m.id)}
                />
              ) : null}
            </Card>
          ))
        )}
      </Card>
    </Screen>
  );
}