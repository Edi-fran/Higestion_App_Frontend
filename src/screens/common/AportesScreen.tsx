import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import {
  Badge,
  Card,
  EmptyState,
  Input,
  LoadingBlock,
  PrimaryButton,
  Screen,
} from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { UsuarioAuth } from '../../types';

type AporteItem = {
  id: number;
  vivienda_id: number;
  periodo_anio: number;
  periodo_mes: number;
  tipo_aporte: string;
  valor: number;
  estado_pago: string;
  fecha_emision?: string | null;
  fecha_vencimiento?: string | null;
  fecha_pago?: string | null;
  hora_pago?: string | null;
  metodo_pago?: string | null;
  referencia_pago?: string | null;
  observacion?: string | null;
};

type Props = {
  user: UsuarioAuth;
  onLogout: () => void;
};

export default function AportesScreen({ user, onLogout }: Props) {
  const [aportes, setAportes] = useState<AporteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    vivienda_id: '1',
    periodo_anio: '2026',
    periodo_mes: '3',
    valor: '10.00',
    tipo_aporte: 'AGUA',
    fecha_vencimiento: '',
  });

  async function load() {
    try {
      setLoading(true);
      const data = await hidroService.listAportes();
      setAportes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar los aportes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    try {
      await hidroService.createAporte({
        vivienda_id: Number(form.vivienda_id),
        periodo_anio: Number(form.periodo_anio),
        periodo_mes: Number(form.periodo_mes),
        tipo_aporte: form.tipo_aporte,
        valor: Number(form.valor),
        fecha_vencimiento: form.fecha_vencimiento,
        estado_pago: 'PENDIENTE',
      });

      Alert.alert('Correcto', 'Aporte registrado.');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo registrar el aporte.');
    }
  }

  return (
    <Screen
      title="Aportes y pagos"
      subtitle="Consulta y registro básico de aportes mensuales."
      actions={<PrimaryButton label="Salir" onPress={onLogout} danger />}
    >
      {(user.rol === 'ADMIN' || user.rol === 'TECNICO') && (
        <Card>
          <Text style={{ fontSize: 18, fontWeight: '800' }}>
            Registrar aporte
          </Text>

          <Input
            label="Vivienda ID"
            value={form.vivienda_id}
            onChangeText={(v) => setForm({ ...form, vivienda_id: v })}
            keyboardType="numeric"
          />
          <Input
            label="Año"
            value={form.periodo_anio}
            onChangeText={(v) => setForm({ ...form, periodo_anio: v })}
            keyboardType="numeric"
          />
          <Input
            label="Mes"
            value={form.periodo_mes}
            onChangeText={(v) => setForm({ ...form, periodo_mes: v })}
            keyboardType="numeric"
          />
          <Input
            label="Valor"
            value={form.valor}
            onChangeText={(v) => setForm({ ...form, valor: v })}
            keyboardType="numeric"
          />
          <Input
            label="Tipo"
            value={form.tipo_aporte}
            onChangeText={(v) =>
              setForm({ ...form, tipo_aporte: v.toUpperCase() })
            }
          />
          <Input
            label="Fecha vencimiento"
            value={form.fecha_vencimiento}
            onChangeText={(v) => setForm({ ...form, fecha_vencimiento: v })}
            placeholder="2026-03-30"
          />

          <PrimaryButton label="Guardar aporte" onPress={save} />
        </Card>
      )}

      <Card>
        <Text style={{ fontSize: 18, fontWeight: '800' }}>
          {user.rol === 'SOCIO' ? 'Mis aportes' : 'Listado de aportes'}
        </Text>

        {loading ? (
          <LoadingBlock />
        ) : aportes.length === 0 ? (
          <EmptyState text="No hay aportes registrados." />
        ) : (
          aportes.map((item) => (
            <View
              key={item.id}
              style={{
                borderTopWidth: 1,
                borderColor: '#E7EDF3',
                paddingTop: 12,
                gap: 6,
              }}
            >
              <Text style={{ fontWeight: '800' }}>
                Periodo {item.periodo_mes}/{item.periodo_anio}
              </Text>
              <Text>Tipo: {item.tipo_aporte}</Text>
              <Text>Valor: ${Number(item.valor).toFixed(2)}</Text>
              <Text>Emisión: {item.fecha_emision || '-'}</Text>
              <Text>Vencimiento: {item.fecha_vencimiento || '-'}</Text>
              <Badge
                text={item.estado_pago}
                type={item.estado_pago === 'PAGADO' ? 'success' : 'warning'}
              />
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}