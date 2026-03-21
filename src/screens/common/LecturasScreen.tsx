import React, { useEffect, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import {
  Badge,
  Card,
  EmptyState,
  Input,
  LinkButton,
  LoadingBlock,
  PhotoPreviewModal,
  PhotoThumb,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionTitle,
} from '../../components/Ui';
import {
  getCurrentLocation,
  hidroService,
  pickEvidence,
} from '../../services/hidroService';
import { Lectura, MedidorListado, UsuarioAuth } from '../../types';

export default function LecturasScreen({
  user,
  onLogout,
}: {
  user: UsuarioAuth;
  onLogout: () => void;
}) {
  // ── listado ──────────────────────────────────────────────
  const [items, setItems] = useState<Lectura[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // ── paso 1: búsqueda ─────────────────────────────────────
  const [search, setSearch] = useState('');
  const [medidores, setMedidores] = useState<MedidorListado[]>([]);
  const [searching, setSearching] = useState(false);

  // ── paso 2: medidor seleccionado ─────────────────────────
  const [medidorSel, setMedidorSel] = useState<MedidorListado | null>(null);
  const [viviendaId, setViviendaId] = useState('');
  const [numeroMedidor, setNumeroMedidor] = useState('');

  // ── paso 3: datos lectura ────────────────────────────────
  const [lecturaActual, setLecturaActual] = useState('');
  const [observacion, setObservacion] = useState('');
  const [foto, setFoto] = useState<any>(null);
  const [coords, setCoords] = useState<{ latitud: number; longitud: number } | null>(null);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── carga inicial ────────────────────────────────────────
  async function loadList() {
    try {
      setLoadingList(true);
      const lects = await hidroService.listLecturas();
      setItems(lects);
    } catch (e: any) {
      Alert.alert('Lecturas', e.message || 'No se pudieron cargar las lecturas.');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => { void loadList(); }, []);

  // ── paso 1: buscar medidores ─────────────────────────────
  async function buscarMedidores() {
    if (!search.trim()) {
      Alert.alert('Lecturas', 'Ingresa una cédula o número de medidor para buscar.');
      return;
    }
    try {
      setSearching(true);
      const meds = await hidroService.listMedidores(search.trim());
      setMedidores(meds);
      if (meds.length === 0) {
        Alert.alert('Lecturas', 'No se encontraron medidores con ese criterio.');
      }
    } catch (e: any) {
      Alert.alert('Lecturas', e.message || 'Error al buscar medidores.');
    } finally {
      setSearching(false);
    }
  }

  // ── paso 2: seleccionar medidor ──────────────────────────
  function seleccionarMedidor(m: MedidorListado) {
    setMedidorSel(m);
    setViviendaId(String((m as any).vivienda_id || ''));
    setNumeroMedidor(m.numero_medidor);
    setMedidores([]);
    // obtener coordenadas automáticamente al seleccionar
    void obtenerCoordenadas();
  }

  function limpiarSeleccion() {
    setMedidorSel(null);
    setViviendaId('');
    setNumeroMedidor('');
    setLecturaActual('');
    setObservacion('');
    setFoto(null);
    setCoords(null);
    setEditingId(null);
  }

  // ── paso 3: coordenadas ──────────────────────────────────
  async function obtenerCoordenadas() {
    try {
      setLoadingCoords(true);
      const c = await getCurrentLocation();
      setCoords(c);
    } catch (e: any) {
      Alert.alert('Ubicación', e.message || 'No se pudo obtener la ubicación.');
    } finally {
      setLoadingCoords(false);
    }
  }

  // ── paso 3: foto ─────────────────────────────────────────
  async function tomarFoto() {
    try {
      const asset = await pickEvidence();
      if (asset) setFoto(asset);
    } catch (e: any) {
      Alert.alert('Lecturas', e.message || 'No se pudo abrir la cámara.');
    }
  }

  // ── enviar ────────────────────────────────────────────────
  async function submit() {
    if (!numeroMedidor && !viviendaId) {
      Alert.alert('Lecturas', 'Selecciona un medidor antes de continuar.');
      return;
    }
    if (!lecturaActual.trim()) {
      Alert.alert('Lecturas', 'Ingresa la lectura actual.');
      return;
    }

    // si no tenemos coordenadas aún, obtenerlas ahora
    let finalCoords = coords;
    if (!finalCoords) {
      try {
        finalCoords = await getCurrentLocation();
        setCoords(finalCoords);
      } catch {
        // coordenadas opcionales, continuar sin ellas
      }
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await hidroService.updateLectura(editingId, {
          lectura_actual: Number(lecturaActual),
          observacion,
          estado: 'REGISTRADA',
        });
        Alert.alert('Lecturas', 'Lectura actualizada correctamente.');
      } else {
        await hidroService.createLectura({
          vivienda_id: viviendaId ? Number(viviendaId) : undefined,
          numero_medidor: numeroMedidor || undefined,
          lectura_actual: Number(lecturaActual),
          observacion,
          latitud: finalCoords?.latitud,
          longitud: finalCoords?.longitud,
          evidencia: foto,
        });
        Alert.alert('Lecturas', 'Lectura registrada correctamente.');
      }
      limpiarSeleccion();
      await loadList();
    } catch (e: any) {
      Alert.alert('Lecturas', e.message || 'No se pudo guardar la lectura.');
    } finally {
      setSubmitting(false);
    }
  }

  const puedeRegistrar = user.rol === 'ADMIN' || user.rol === 'TECNICO';

  return (
    <Screen
      title={user.rol === 'SOCIO' ? 'Mis lecturas' : 'Lecturación'}
      subtitle="Busca el medidor, ingresa la lectura, toma la foto y guarda."
      actions={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SecondaryButton label="Refrescar" onPress={() => void loadList()} />
          <PrimaryButton label="Salir" onPress={onLogout} danger />
        </View>
      }
    >
      {puedeRegistrar && (
        <>
          {/* ── PASO 1: Búsqueda ── */}
          <Card>
            <SectionTitle
              title="Paso 1 · Buscar medidor"
              meta="Ingresa la cédula del socio o el número de medidor."
            />
            <Input
              label="Cédula o número de medidor"
              value={search}
              onChangeText={setSearch}
              placeholder="Ej. 1104659742 o MED-001"
            />
            <PrimaryButton
              label={searching ? 'Buscando…' : 'Buscar'}
              onPress={buscarMedidores}
            />

            {medidores.map((m) => (
              <Card key={m.id} soft>
                <Text style={{ fontWeight: '800' }}>{m.numero_medidor}</Text>
                <Text>{m.socio}</Text>
                <Text>{m.direccion || '-'}</Text>
                <SecondaryButton
                  label="Seleccionar este medidor"
                  onPress={() => seleccionarMedidor(m)}
                />
              </Card>
            ))}
          </Card>

          {/* ── PASO 2: Medidor seleccionado ── */}
          {medidorSel && (
            <Card>
              <SectionTitle
                title="Paso 2 · Medidor seleccionado"
                meta="Verifica que sea el medidor correcto."
              />
              <View style={{ gap: 4 }}>
                <Text style={{ fontWeight: '800', fontSize: 16 }}>
                  {medidorSel.numero_medidor}
                </Text>
                <Text>{medidorSel.socio}</Text>
                <Text>{medidorSel.direccion || '-'}</Text>
                <Badge text="Seleccionado" type="success" />
              </View>
              <SecondaryButton label="Cambiar medidor" onPress={limpiarSeleccion} />
            </Card>
          )}

          {/* ── PASO 3: Registro de lectura ── */}
          {medidorSel && (
            <Card>
              <SectionTitle
                title="Paso 3 · Registrar lectura"
                meta="Ingresa el valor del medidor, toma la foto y guarda."
              />

              <Input
                label="Lectura actual (m³)"
                value={lecturaActual}
                onChangeText={setLecturaActual}
                keyboardType="numeric"
                placeholder="Ej. 1234"
              />

              <Input
                label="Observación (opcional)"
                value={observacion}
                onChangeText={setObservacion}
                multiline
                placeholder="Alguna novedad del medidor…"
              />

              {/* Foto */}
              <SecondaryButton
                label={foto ? 'Cambiar fotografía' : 'Tomar fotografía del medidor'}
                onPress={tomarFoto}
              />
              {foto?.uri ? (
                <Image
                  source={{ uri: foto.uri }}
                  style={{ width: 140, height: 140, borderRadius: 18, marginTop: 4 }}
                />
              ) : null}

              {/* Coordenadas */}
              <View style={{ gap: 4 }}>
                {loadingCoords ? (
                  <Text style={{ color: '#64748B' }}>Obteniendo ubicación…</Text>
                ) : coords ? (
                  <Text style={{ color: '#22C55E', fontWeight: '700' }}>
                    ✓ Ubicación: {coords.latitud.toFixed(5)}, {coords.longitud.toFixed(5)}
                  </Text>
                ) : (
                  <SecondaryButton
                    label="Obtener ubicación GPS"
                    onPress={obtenerCoordenadas}
                  />
                )}
              </View>

              <PrimaryButton
                label={submitting ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar lectura'}
                onPress={submit}
              />

              <LinkButton
                label="Descargar respaldo CSV"
                url={hidroService.exportLecturasCsvUrl()}
              />
            </Card>
          )}
        </>
      )}

      {/* ── LISTADO ── */}
      <Card>
        <SectionTitle
          title={user.rol === 'SOCIO' ? 'Historial personal' : 'Lecturas registradas'}
          meta="Incluye indicador de consumo y evidencia fotográfica."
        />
        {loadingList ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState text="No hay lecturas registradas." />
        ) : (
          items.map((item) => (
            <View
              key={item.id}
              style={{ borderTopWidth: 1, borderColor: '#E7EDF3', paddingTop: 12, gap: 6 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800' }}>
                    {item.socio || 'Lectura'} · {item.medidor || '-'}
                  </Text>
                  <Text>{item.cedula || '-'} · {item.direccion || '-'}</Text>
                  <Text>{item.fecha_lectura} {item.hora_lectura}</Text>
                  <Text>Anterior: {item.lectura_anterior ?? '-'} · Actual: {item.lectura_actual}</Text>
                  <Text>Consumo: {item.consumo_calculado ?? '-'} m³</Text>
                  <Text>
                    Coordenadas: {item.latitud ?? '-'}, {item.longitud ?? '-'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <Badge text={item.estado} />
                    {item.indicador ? (
                      <Badge
                        text={item.indicador}
                        type={item.indicador?.toUpperCase().includes('ALTO') ? 'warning' : 'success'}
                      />
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {puedeRegistrar ? (
                      <SecondaryButton
                        label="Editar"
                        onPress={() => {
                          setMedidorSel({ id: 0, numero_medidor: item.medidor || '', socio: item.socio || '', direccion: item.direccion } as any);
                          setNumeroMedidor(item.medidor || '');
                          setEditingId(item.id);
                          setLecturaActual(String(item.lectura_actual ?? ''));
                          setObservacion(item.observacion || '');
                        }}
                      />
                    ) : null}
                    {user.rol === 'ADMIN' ? (
                      <SecondaryButton
                        label="Anular"
                        onPress={() =>
                          void (async () => {
                            try {
                              await hidroService.deleteLectura(item.id);
                              await loadList();
                            } catch (e: any) {
                              Alert.alert('Lecturas', e.message || 'No se pudo anular.');
                            }
                          })()
                        }
                      />
                    ) : null}
                    {user.rol === 'ADMIN' ? (
                      <SecondaryButton
                        label="Recalcular"
                        onPress={() =>
                          void (async () => {
                            try {
                              await hidroService.anularRecalcularLectura(item.id, {
                                motivo: 'Corrección manual',
                                lectura_correcta: Number(item.lectura_actual),
                              });
                              await loadList();
                              Alert.alert('Lecturas', 'Se anuló y regeneró la planilla.');
                            } catch (e: any) {
                              Alert.alert('Lecturas', e.message || 'No se pudo recalcular.');
                            }
                          })()
                        }
                      />
                    ) : null}
                    {user.rol === 'SOCIO' ? (
                      <SecondaryButton
                        label="Reclamar"
                        onPress={() =>
                          void (async () => {
                            try {
                              await hidroService.reclamarLectura(item.id, {
                                motivo: 'Lectura incorrecta',
                                descripcion: 'Solicito revisión de lectura.',
                              });
                              Alert.alert('Lecturas', 'Reclamo enviado correctamente.');
                            } catch (e: any) {
                              Alert.alert('Lecturas', e.message || 'No se pudo enviar el reclamo.');
                            }
                          })()
                        }
                      />
                    ) : null}
                  </View>
                </View>
                <PhotoThumb
                  path={item.evidencias?.[0]}
                  onOpen={() => setPreview(item.evidencias?.[0] || null)}
                />
              </View>
            </View>
          ))
        )}
      </Card>

      <PhotoPreviewModal
        visible={!!preview}
        path={preview}
        onClose={() => setPreview(null)}
      />
    </Screen>
  );
}
