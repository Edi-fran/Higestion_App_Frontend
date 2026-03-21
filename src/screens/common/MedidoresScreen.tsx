import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Badge, Card, EmptyState, Input, LoadingBlock, PrimaryButton, Screen, SectionTitle, SecondaryButton } from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { MedidorListado, UsuarioAuth } from '../../types';

export default function MedidoresScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [items, setItems] = useState<MedidorListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load(q = '') {
    try {
      setLoading(true);
      setItems(await hidroService.listMedidores(q));
    } catch (e: any) {
      Alert.alert('Medidores', e.message || 'No se pudieron cargar los medidores.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <Screen title="Medidores" subtitle="Consulta por cédula, nombre o número de medidor. El backend filtra según tus permisos y rutas." actions={<View style={{ flexDirection: 'row', gap: 8 }}><SecondaryButton label="Refrescar" onPress={() => void load(search)} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
      <Card>
        <SectionTitle title="Búsqueda operativa" meta="Ideal para lecturación por zona o búsqueda directa." />
        <Input label="Buscar" value={search} onChangeText={setSearch} placeholder="Cédula, nombre o medidor" />
        <PrimaryButton label="Buscar medidores" onPress={() => void load(search)} />
      </Card>

      <Card>
        {loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState text="No hay medidores para mostrar." /> : items.map((item) => (
          <View key={item.id} style={{ borderTopWidth: 1, borderColor: '#E7EDF3', paddingTop: 12, gap: 4 }}>
            <Text style={{ fontWeight: '800' }}>{item.numero_medidor}</Text>
            <Text>{item.socio}</Text>
            <Text>{item.cedula || '-'} · {item.sector || '-'}</Text>
            <Text>{item.direccion || 'Sin dirección'}</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Badge text={`Lat ${item.latitud ?? '-'}`} />
              <Badge text={`Lon ${item.longitud ?? '-'}`} />
            </View>
            {user.rol === 'ADMIN' ? <SecondaryButton label="Desactivar" onPress={() => void (async () => { try { await hidroService.deleteMedidor(item.id); await load(search); } catch (e: any) { Alert.alert('Medidores', e.message || 'No se pudo desactivar.'); } })()} /> : null}
          </View>
        ))}
      </Card>
    </Screen>
  );
}
