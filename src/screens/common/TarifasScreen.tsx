import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Card, EmptyState, Input, LoadingBlock, PrimaryButton, Screen, SectionTitle, SecondaryButton, Badge } from '../../components/Ui';
import { hidroService } from '../../services/hidroService';
import { TarifaAsignada, UsuarioAuth } from '../../types';

export default function TarifasScreen({ user, onLogout }: { user: UsuarioAuth; onLogout: () => void }) {
  const [items, setItems] = useState<TarifaAsignada[]>([]); const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState(''); const [base, setBase] = useState('10'); const [valorBase, setValorBase] = useState('5'); const [adicional, setAdicional] = useState('0.45'); const [multa, setMulta] = useState('1');
  async function load() { try { setLoading(true); setItems(await hidroService.listTarifasAsignadas()); } catch (e:any) { Alert.alert('Tarifas', e.message || 'No se pudieron cargar.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function crear() { try { await hidroService.createTarifaAsignada({ nombre, base_consumo_m3: Number(base), valor_base: Number(valorBase), valor_adicional_m3: Number(adicional), multa_atraso: Number(multa), estado: 'ACTIVA' }); setNombre(''); await load(); } catch (e:any) { Alert.alert('Tarifas', e.message || 'No se pudo crear.'); } }
  async function eliminar(id:number) { try { await hidroService.deleteTarifaAsignada(id); await load(); } catch (e:any) { Alert.alert('Tarifas', e.message || 'No se pudo eliminar.'); } }
  return <Screen title="Tarifas personalizadas" subtitle="Base de consumo, valor adicional y multa por atraso." actions={<View style={{ flexDirection:'row', gap:8 }}><SecondaryButton label="Refrescar" onPress={() => void load()} /><PrimaryButton label="Salir" onPress={onLogout} danger /></View>}>
    {user.rol === 'ADMIN' ? <Card><SectionTitle title="Nueva tarifa" /><Input label="Nombre" value={nombre} onChangeText={setNombre} /><Input label="Base consumo m³" value={base} onChangeText={setBase} keyboardType="numeric" /><Input label="Valor base" value={valorBase} onChangeText={setValorBase} keyboardType="numeric" /><Input label="Valor adicional m³" value={adicional} onChangeText={setAdicional} keyboardType="numeric" /><Input label="Multa atraso" value={multa} onChangeText={setMulta} keyboardType="numeric" /><PrimaryButton label="Guardar tarifa" onPress={() => void crear()} /></Card> : null}
    <Card><SectionTitle title="Tarifas registradas" meta={`${items.length} tarifas`} />{loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState text="No hay tarifas personalizadas." /> : items.map((t) => <Card key={t.id} soft><SectionTitle title={t.nombre} meta={`Base ${t.base_consumo_m3} m³`} /><Text>Valor base: ${Number(t.valor_base || 0).toFixed(2)}</Text><Text>Adicional m³: ${Number(t.valor_adicional_m3 || 0).toFixed(2)}</Text><Text>Multa: ${Number(t.multa_atraso || 0).toFixed(2)}</Text><Badge text={t.estado} type={t.estado === 'ACTIVA' ? 'success' : 'warning'} />{user.rol === 'ADMIN' ? <SecondaryButton label="Eliminar" onPress={() => void eliminar(t.id)} /> : null}</Card>)}</Card>
  </Screen>;
}
