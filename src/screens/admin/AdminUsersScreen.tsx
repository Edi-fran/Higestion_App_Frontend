import React, { useEffect, useState } from 'react';
import {
  Alert, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView, Image,
  TextInput,
} from 'react-native';
import { hidroService, pickImageFromLibrary } from '../../services/hidroService';
import { UsuarioAuth, UsuarioListado } from '../../types';

type Props = { user: UsuarioAuth; onLogout: () => void };

type FormState = {
  rol: string; cedula: string; nombres: string; apellidos: string;
  telefono: string; email: string; username: string; password: string;
  direccion: string; referencia: string; numero_medidor: string;
  codigo_socio: string; sector_id: string; latitud: string; longitud: string;
  marca_medidor: string; modelo_medidor: string;
};

const initialForm: FormState = {
  rol: 'SOCIO', cedula: '', nombres: '', apellidos: '', telefono: '',
  email: '', username: '', password: 'Temporal123*', direccion: '',
  referencia: '', numero_medidor: '', codigo_socio: '', sector_id: '1',
  latitud: '', longitud: '', marca_medidor: '', modelo_medidor: '',
};

export default function AdminUsersScreen({ user, onLogout }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [foto, setFoto] = useState<any>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [tab, setTab] = useState<'crear' | 'lista'>('lista');

  useEffect(() => { load(); }, []);

  async function load(q = '') {
    try {
      setLoading(true);
      const data = await hidroService.listUsuarios(q);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }

  async function choosePhoto() {
    const asset = await pickImageFromLibrary();
    if (asset) setFoto(asset);
  }

  async function save() {
    if (!form.nombres || !form.apellidos || !form.username) {
      Alert.alert('Aviso', 'Nombres, apellidos y username son obligatorios.');
      return;
    }
    try {
      setSaving(true);
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '') data.append(key, value);
      });
      if (foto?.uri) {
        data.append('foto_perfil', { uri: foto.uri, name: foto.fileName || 'perfil.jpg', type: foto.mimeType || 'image/jpeg' } as any);
      }
      await hidroService.createUsuarioSocio(data);
      Alert.alert('Éxito', 'Usuario creado correctamente.');
      setForm(initialForm);
      setFoto(null);
      setTab('lista');
      await load(search);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo crear el usuario.');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: number) {
    Alert.alert('Confirmar', '¿Desactivar este usuario?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desactivar', style: 'destructive', onPress: async () => {
        try {
          await hidroService.deleteUsuario(id);
          await load(search);
        } catch (e: any) {
          Alert.alert('Error', e?.message || 'No se pudo desactivar.');
        }
      }},
    ]);
  }

  const F = (key: keyof FormState, label: string, opts?: { keyboard?: any; secure?: boolean; placeholder?: string }) => (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.fieldInput}
        value={form[key]}
        onChangeText={v => setForm({ ...form, [key]: v })}
        keyboardType={opts?.keyboard || 'default'}
        secureTextEntry={opts?.secure}
        placeholder={opts?.placeholder || ''}
        placeholderTextColor="#94a3b8"
      />
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Usuarios</Text>
          <Text style={s.subtitle}>{usuarios.length} registrados</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.btnRefresh} onPress={() => load(search)}>
            <Text style={s.btnRefreshTxt}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSalir} onPress={onLogout}>
            <Text style={s.btnSalirTxt}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPIs */}
      <View style={s.kpis}>
        <View style={[s.kpi, { borderLeftColor: '#1a5fa8' }]}>
          <Text style={s.kpiVal}>{usuarios.length}</Text>
          <Text style={s.kpiLabel}>Total</Text>
        </View>
        <View style={[s.kpi, { borderLeftColor: '#16a34a' }]}>
          <Text style={[s.kpiVal, { color: '#16a34a' }]}>
            {usuarios.filter(u => u.estado === 'ACTIVO').length}
          </Text>
          <Text style={s.kpiLabel}>Activos</Text>
        </View>
        <View style={[s.kpi, { borderLeftColor: '#f59e0b' }]}>
          <Text style={[s.kpiVal, { color: '#f59e0b' }]}>
            {usuarios.filter(u => u.rol === 'SOCIO').length}
          </Text>
          <Text style={s.kpiLabel}>Socios</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'lista' && s.tabActive]}
          onPress={() => setTab('lista')}
        >
          <Text style={[s.tabTxt, tab === 'lista' && s.tabTxtActive]}>
            👥 Lista ({usuarios.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'crear' && s.tabActive]}
          onPress={() => setTab('crear')}
        >
          <Text style={[s.tabTxt, tab === 'crear' && s.tabTxtActive]}>
            ➕ Nuevo usuario
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* ── FORMULARIO ── */}
        {tab === 'crear' && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Datos del usuario</Text>

            {/* Selector de rol */}
            <Text style={s.fieldLabel}>Rol</Text>
            <View style={s.rolRow}>
              {['SOCIO', 'TECNICO', 'ADMIN'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[s.rolBtn, form.rol === r && s.rolBtnActive]}
                  onPress={() => setForm({ ...form, rol: r })}
                >
                  <Text style={[s.rolBtnTxt, form.rol === r && s.rolBtnTxtActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.divider}><Text style={s.dividerTxt}>Datos personales</Text></View>
            {F('cedula', 'Cédula', { keyboard: 'numeric' })}
            {F('nombres', 'Nombres *')}
            {F('apellidos', 'Apellidos *')}
            {F('telefono', 'Teléfono', { keyboard: 'phone-pad' })}
            {F('email', 'Correo electrónico', { keyboard: 'email-address' })}

            <View style={s.divider}><Text style={s.dividerTxt}>Acceso al sistema</Text></View>
            {F('username', 'Username *')}
            {F('password', 'Contraseña', { secure: true })}

            <View style={s.divider}><Text style={s.dividerTxt}>Vivienda / Medidor</Text></View>
            {F('direccion', 'Dirección')}
            {F('referencia', 'Referencia')}
            {F('codigo_socio', 'Código socio')}
            {F('numero_medidor', 'Número de medidor')}
            {F('sector_id', 'Sector ID', { keyboard: 'numeric', placeholder: '1' })}
            {F('latitud', 'Latitud', { keyboard: 'numeric', placeholder: '-0.0000' })}
            {F('longitud', 'Longitud', { keyboard: 'numeric', placeholder: '-78.0000' })}
            {F('marca_medidor', 'Marca del medidor')}
            {F('modelo_medidor', 'Modelo del medidor')}

            <View style={s.divider}><Text style={s.dividerTxt}>Foto de perfil</Text></View>
            <TouchableOpacity style={s.btnFoto} onPress={choosePhoto}>
              <Text style={s.btnFotoTxt}>{foto ? '📷 Cambiar foto' : '📷 Seleccionar foto'}</Text>
            </TouchableOpacity>
            {foto?.uri && (
              <Image source={{ uri: foto.uri }} style={s.fotoPreview} />
            )}

            <TouchableOpacity
              style={[s.btnPrimary, saving && { opacity: .6 }]}
              onPress={save}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnPrimaryTxt}>✓ Guardar usuario</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── LISTA ── */}
        {tab === 'lista' && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Usuarios registrados</Text>

            <View style={s.searchRow}>
              <TextInput
                style={s.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar por nombre, cédula o medidor..."
                placeholderTextColor="#94a3b8"
                onSubmitEditing={() => load(search)}
              />
              <TouchableOpacity style={s.btnSearch} onPress={() => load(search)}>
                <Text style={s.btnSearchTxt}>🔍</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={s.center}>
                <ActivityIndicator size="large" color="#1a5fa8" />
                <Text style={s.loadingTxt}>Cargando...</Text>
              </View>
            ) : usuarios.length === 0 ? (
              <View style={s.center}>
                <Text style={s.emptyIcon}>👥</Text>
                <Text style={s.emptyTxt}>No hay usuarios registrados.</Text>
              </View>
            ) : (
              usuarios.map(item => (
                <View key={item.id} style={s.userCard}>
                  <View style={s.userRow}>
                    <View style={s.avatar}>
                      <Text style={s.avatarTxt}>
                        {(item.nombre?.charAt(0) || '?').toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.userName}>{item.nombre}</Text>
                      <Text style={s.userMeta}>{item.username} · {item.cedula || '-'}</Text>
                      <Text style={s.userDir}>{item.direccion || 'Sin dirección'}</Text>
                      {item.numero_medidor ? (
                        <Text style={s.userMedidor}>⚡ {item.numero_medidor}</Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={s.userBadges}>
                    <View style={[s.badge, {
                      backgroundColor: item.rol === 'ADMIN' ? '#e0ecff' : item.rol === 'TECNICO' ? '#fff3cd' : '#f1f5f9'
                    }]}>
                      <Text style={[s.badgeTxt, {
                        color: item.rol === 'ADMIN' ? '#1d4ed8' : item.rol === 'TECNICO' ? '#856404' : '#475569'
                      }]}>{item.rol}</Text>
                    </View>
                    <View style={[s.badge, {
                      backgroundColor: item.estado === 'ACTIVO' ? '#d1e7dd' : '#fee2e2'
                    }]}>
                      <Text style={[s.badgeTxt, {
                        color: item.estado === 'ACTIVO' ? '#0f5132' : '#dc2626'
                      }]}>
                        {item.estado === 'ACTIVO' ? '✓ ACTIVO' : '✗ INACTIVO'}
                      </Text>
                    </View>
                  </View>

                  {item.estado === 'ACTIVO' && (
                    <TouchableOpacity
                      style={s.btnDesactivar}
                      onPress={() => deactivate(item.id)}
                    >
                      <Text style={s.btnDesactivarTxt}>Desactivar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnRefresh: { backgroundColor: '#e0ecff', width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnRefreshTxt: { fontSize: 18, color: '#1a5fa8' },
  btnSalir: { backgroundColor: '#dc2626', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  btnSalirTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  kpis: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  kpi: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderLeftWidth: 4 },
  kpiVal: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  kpiLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#1a5fa8' },
  tabTxt: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  tabTxtActive: { color: '#1a5fa8' },
  scroll: { padding: 14, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  rolRow: { flexDirection: 'row', gap: 8 },
  rolBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center' },
  rolBtnActive: { backgroundColor: '#1a5fa8', borderColor: '#1a5fa8' },
  rolBtnTxt: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  rolBtnTxtActive: { color: '#fff' },
  divider: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
  dividerTxt: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5 },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: .5 },
  fieldInput: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: '#0f172a', backgroundColor: '#f8fafc',
  },
  btnFoto: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  btnFotoTxt: { color: '#334155', fontWeight: '600', fontSize: 14 },
  fotoPreview: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center' },
  btnPrimary: { backgroundColor: '#1a5fa8', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnPrimaryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: '#0f172a', backgroundColor: '#f8fafc',
  },
  btnSearch: { backgroundColor: '#1a5fa8', paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnSearchTxt: { fontSize: 16 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  loadingTxt: { color: '#64748b', fontSize: 15 },
  emptyIcon: { fontSize: 36 },
  emptyTxt: { color: '#94a3b8', fontSize: 15 },
  userCard: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, gap: 8 },
  userRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1a5fa8', alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontWeight: '800', fontSize: 18 },
  userName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  userMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  userDir: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  userMedidor: { fontSize: 12, color: '#1a5fa8', fontWeight: '600', marginTop: 2 },
  userBadges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  btnDesactivar: { borderWidth: 1.5, borderColor: '#dc2626', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  btnDesactivarTxt: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
});