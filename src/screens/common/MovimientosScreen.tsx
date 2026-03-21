import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Card, EmptyState, Input, LoadingBlock, PrimaryButton, Screen, SectionTitle, SecondaryButton, Badge } from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { CajaResumen, MovimientoCaja, UsuarioAuth } from '../../types';

export default function MovimientosScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [items, setItems] = useState<MovimientoCaja[]>([]);
  const [resumen, setResumen] = useState<CajaResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('GENERAL');
  const [descripcion, setDescripcion] = useState('');

  async function load() {
    try {
      setLoading(true);
      const [listado, resumenResp] = await Promise.all([
        hidroService.listMovimientosCaja(),
        hidroService.resumenMovimientosCaja().catch(() => null),
      ]);
      setItems(listado);
      setResumen(resumenResp as any);
    } catch (e:any) {
      Alert.alert('Caja', e.message || 'No se pudieron cargar los movimientos.');
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function crearEgreso() {
    try {
      await hidroService.createEgresoCaja({ monto: Number(monto), categoria, descripcion });
      setMonto(''); setCategoria('GENERAL'); setDescripcion('');
      await load();
      Alert.alert('Caja', 'Egreso registrado correctamente.');
    } catch (e:any) {
      Alert.alert('Caja', e.message || 'No se pudo registrar el egreso.');
    }
  }

  return <Screen title="Caja y recaudación" subtitle="Movimientos económicos registrados por el sistema." actions={<View style={{ flexDirection:'row', gap:8 }}><SecondaryButton label="Refrescar" onPress={() => void load()} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
    <Card>
      <SectionTitle title="Resumen" meta={resumen ? `Saldo: $${Number(resumen.saldo || 0).toFixed(2)}` : 'Sin resumen'} />
      {resumen ? <View style={{ gap: 6 }}><Text>Ingresos: ${Number(resumen.ingresos || 0).toFixed(2)}</Text><Text>Egresos: ${Number(resumen.egresos || 0).toFixed(2)}</Text><Text>Registros: {resumen.total_registros}</Text></View> : <EmptyState text="No hay resumen disponible." />}
    </Card>
    {user.rol === 'ADMIN' ? <Card>
      <SectionTitle title="Registrar egreso" meta="Caja administrativa" />
      <Input label="Monto" value={monto} onChangeText={setMonto} keyboardType="numeric" />
      <Input label="Categoría" value={categoria} onChangeText={setCategoria} />
      <Input label="Descripción" value={descripcion} onChangeText={setDescripcion} multiline />
      <PrimaryButton label="Guardar egreso" onPress={() => void crearEgreso()} />
    </Card> : null}
    <Card><SectionTitle title="Movimientos" meta={`${items.length} movimientos`} />
    {loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState text="No hay movimientos registrados." /> : items.map((m) => <Card key={m.id} soft><SectionTitle title={m.descripcion || `Movimiento #${m.id}`} meta={`${m.fecha} ${m.hora}`} /><Text>Categoría: {m.categoria || '-'}</Text><Text>Monto: ${Number(m.monto || 0).toFixed(2)}</Text><Badge text={m.tipo_movimiento} type={m.tipo_movimiento === 'INGRESO' ? 'success' : 'warning'} /></Card>)}
    </Card></Screen>;
}
