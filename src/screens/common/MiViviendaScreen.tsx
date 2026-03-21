import React, { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import {
  Badge,
  Card,
  LoadingBlock,
  PrimaryButton,
  Row,
  Screen,
  SectionTitle,
} from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { MiVivienda } from '../../types';

type Props = {
  onLogout: () => void;
};

export default function MiViviendaScreen({ onLogout }: Props) {
  const [data, setData] = useState<MiVivienda | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const vivienda = await hidroService.miVivienda();
        setData(vivienda);
      } catch (e: any) {
        Alert.alert('Mi vivienda', e?.message || 'No se pudo cargar la vivienda.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Screen
      title="Mi vivienda"
      subtitle="Domicilio y medidor asociados al sistema de agua."
      actions={<PrimaryButton label="Salir" onPress={onLogout} danger />}
    >
      <Card>
        {loading ? (
          <LoadingBlock />
        ) : data ? (
          <>
            <SectionTitle
              title={data.codigo_vivienda || 'Vivienda registrada'}
              meta="Información base para lecturas y planillas."
            />
            <Row label="Dirección" value={data.direccion || '-'} />
            <Row label="Referencia" value={data.referencia || '-'} />
            <Row label="Sector" value={data.sector || '-'} />
            <Row label="Medidor" value={data.numero_medidor || '-'} />
            <Row label="Código socio" value={data.codigo_socio || '-'} />
            <Row label="Latitud" value={data.latitud ?? '-'} />
            <Row label="Longitud" value={data.longitud ?? '-'} />
            <Badge text="Vinculado al backend" type="success" />
          </>
        ) : (
          <Text>No hay vivienda asociada.</Text>
        )}
      </Card>
    </Screen>
  );
}