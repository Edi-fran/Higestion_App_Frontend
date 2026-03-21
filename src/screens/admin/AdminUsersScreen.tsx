import React, { useEffect, useState } from 'react';

import { Alert, Image, Text, View } from 'react-native';
import {
  Badge,
  Card,
  EmptyState,
  Input,
  LoadingBlock,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionTitle,
} from '../../components/Ui';
import { hidroService, pickImageFromLibrary } from '../../services/hidroService';
import { UsuarioAuth, UsuarioListado } from '../../types';

type Props = {
  user: UsuarioAuth;
  onLogout: () => void;
};

type FormState = {
  rol: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  username: string;
  password: string;
  direccion: string;
  referencia: string;
  numero_medidor: string;
  codigo_socio: string;
  sector_id: string;
  latitud: string;
  longitud: string;
  marca_medidor: string;
  modelo_medidor: string;
};

const initialForm: FormState = {
  rol: 'SOCIO',
  cedula: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  email: '',
  username: '',
  password: 'Temporal123*',
  direccion: '',
  referencia: '',
  numero_medidor: '',
  codigo_socio: '',
  sector_id: '1',
  latitud: '',
  longitud: '',
  marca_medidor: '',
  modelo_medidor: '',
};

export default function AdminUsersScreen({ user, onLogout }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [foto, setFoto] = useState<any>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  async function load(q = '') {
    try {
      setLoading(true);
      const data = await hidroService.listUsuarios(q);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('Usuarios', e?.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function choosePhoto() {
    const asset = await pickImageFromLibrary();
    if (asset) setFoto(asset);
  }

  async function save() {
    try {
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value !== '') {
          data.append(key, value);
        }
      });

      if (foto?.uri) {
        data.append(
          'foto_perfil',
          {
            uri: foto.uri,
            name: foto.fileName || 'perfil.jpg',
            type: foto.mimeType || 'image/jpeg',
          } as any
        );
      }

      await hidroService.createUsuarioSocio(data);

      Alert.alert('Usuarios', 'Usuario creado correctamente.');
      setForm(initialForm);
      setFoto(null);
      await load(search);
    } catch (e: any) {
      Alert.alert('Usuarios', e?.message || 'No se pudo crear el usuario.');
    }
  }

  async function deactivateUser(id: number) {
    try {
      await hidroService.deleteUsuario(id);
      await load(search);
    } catch (e: any) {
      Alert.alert('Usuarios', e?.message || 'No se pudo desactivar.');
    }
  }

  return (
    <Screen
      title="Usuarios y socios"
      subtitle="Alta rápida de ADMIN, TECNICO y SOCIO con vivienda y medidor."
      actions={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SecondaryButton label="Refrescar" onPress={() => void load(search)} />
          <PrimaryButton label="Salir" onPress={onLogout} danger />
        </View>
      }
    >
      <Card>
        <SectionTitle
          title="Crear usuario"
          meta="El backend crea socio, vivienda y medidor para roles SOCIO."
        />

        <Input
          label="Rol"
          value={form.rol}
          onChangeText={(v) => setForm({ ...form, rol: v.toUpperCase() })}
          placeholder="ADMIN / TECNICO / SOCIO"
        />
        <Input
          label="Cédula"
          value={form.cedula}
          onChangeText={(v) => setForm({ ...form, cedula: v })}
        />
        <Input
          label="Nombres"
          value={form.nombres}
          onChangeText={(v) => setForm({ ...form, nombres: v })}
        />
        <Input
          label="Apellidos"
          value={form.apellidos}
          onChangeText={(v) => setForm({ ...form, apellidos: v })}
        />
        <Input
          label="Teléfono"
          value={form.telefono}
          onChangeText={(v) => setForm({ ...form, telefono: v })}
        />
        <Input
          label="Correo"
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          keyboardType="email-address"
        />
        <Input
          label="Username"
          value={form.username}
          onChangeText={(v) => setForm({ ...form, username: v })}
        />
        <Input
          label="Contraseña temporal"
          value={form.password}
          onChangeText={(v) => setForm({ ...form, password: v })}
          secureTextEntry
        />
        <Input
          label="Dirección"
          value={form.direccion}
          onChangeText={(v) => setForm({ ...form, direccion: v })}
        />
        <Input
          label="Referencia"
          value={form.referencia}
          onChangeText={(v) => setForm({ ...form, referencia: v })}
        />
        <Input
          label="Código socio"
          value={form.codigo_socio}
          onChangeText={(v) => setForm({ ...form, codigo_socio: v })}
        />
        <Input
          label="Número de medidor"
          value={form.numero_medidor}
          onChangeText={(v) => setForm({ ...form, numero_medidor: v })}
        />
        <Input
          label="Sector ID"
          value={form.sector_id}
          onChangeText={(v) => setForm({ ...form, sector_id: v })}
          keyboardType="numeric"
        />
        <Input
          label="Latitud"
          value={form.latitud}
          onChangeText={(v) => setForm({ ...form, latitud: v })}
          keyboardType="numeric"
        />
        <Input
          label="Longitud"
          value={form.longitud}
          onChangeText={(v) => setForm({ ...form, longitud: v })}
          keyboardType="numeric"
        />
        <Input
          label="Marca del medidor"
          value={form.marca_medidor}
          onChangeText={(v) => setForm({ ...form, marca_medidor: v })}
        />
        <Input
          label="Modelo del medidor"
          value={form.modelo_medidor}
          onChangeText={(v) => setForm({ ...form, modelo_medidor: v })}
        />

        <SecondaryButton
          label={foto ? 'Cambiar foto' : 'Seleccionar foto'}
          onPress={choosePhoto}
        />

        {foto?.uri ? (
          <Image
            source={{ uri: foto.uri }}
            style={{ width: 92, height: 92, borderRadius: 16 }}
          />
        ) : null}

        <PrimaryButton label="Guardar usuario" onPress={save} />
      </Card>

      <Card>
        <SectionTitle
          title="Usuarios creados"
          meta={`Búsqueda por nombre, cédula o username. Total: ${usuarios.length}`}
        />

        <Input
          label="Buscar"
          value={search}
          onChangeText={setSearch}
          placeholder="Ej. 1104, medidor o nombre"
        />
        <PrimaryButton label="Filtrar" onPress={() => void load(search)} />

        {loading ? (
          <LoadingBlock />
        ) : usuarios.length === 0 ? (
          <EmptyState text="No hay usuarios cargados." />
        ) : (
          usuarios.map((item) => (
            <View
              key={item.id}
              style={{
                borderTopWidth: 1,
                borderColor: '#E7EDF3',
                paddingTop: 12,
                gap: 5,
              }}
            >
              <Text style={{ fontWeight: '800' }}>{item.nombre}</Text>
              <Text>
                {item.username} · {item.cedula || '-'}
              </Text>
              <Text>{item.direccion || 'Sin dirección'}</Text>
              <Text>Medidor: {item.numero_medidor || '-'}</Text>

              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Badge text={item.rol} />
                <Badge
                  text={item.estado}
                  type={item.estado === 'ACTIVO' ? 'success' : 'warning'}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <SecondaryButton
                  label="Desactivar"
                  onPress={() => void deactivateUser(item.id)}
                />
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}