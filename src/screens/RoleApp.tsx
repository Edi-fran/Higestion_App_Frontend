import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../components/Ui';
import { UsuarioAuth } from '../types';

import AdminUsersScreen from './admin/AdminUsersScreen';
import AvisosScreen from './common/AvisosScreen';
import IncidenciasScreen from './common/IncidenciasScreen';
import IotScreen from './common/Iotscreen';
import LecturasScreen from './common/LecturasScreen';
import MedidoresScreen from './common/MedidoresScreen';
import MessagesScreen from './common/MessagesScreen';
import MiViviendaScreen from './common/MiViviendaScreen';
import NotificationsScreen from './common/NotificationsScreen';
import OrdersScreen from './common/OrdersScreen';
import PlanillasScreen from './common/PlanillasScreen';
import RecaudacionScreen from './common/RecaudacionScreen';
import StatsScreen from './common/StatsScreen';
import PagosScreen from './common/PagosScreen';
import MovimientosScreen from './common/MovimientosScreen';
import ReunionesScreen from './common/ReunionesScreen';
import RecordatoriosScreen from './common/RecordatoriosScreen';
import TarifasScreen from './common/TarifasScreen';
import MapaIncidenciasScreen from './common/MapaIncidenciasScreen';
import HomeScreen from './shared/HomeScreen';

type Props = {
  user: UsuarioAuth;
  onLogout: () => Promise<void>;
};

type TabItem = {
  key: string;
  label: string;
  icon: string;
  group: string;
};

export default function RoleApp({ user, onLogout }: Props) {
  const tabs = useMemo<TabItem[]>(() => {
    const common: TabItem[] = [
      { key: 'home', label: 'Inicio', icon: 'view-dashboard-outline', group: 'General' },
      { key: 'avisos', label: 'Comunicados', icon: 'bullhorn-outline', group: 'General' },
      { key: 'notificaciones', label: 'Alertas', icon: 'bell-ring-outline', group: 'General' },
      { key: 'mensajes', label: 'Mensajes', icon: 'message-text-outline', group: 'General' },
      { key: 'reuniones', label: 'Reuniones', icon: 'calendar-month-outline', group: 'Agenda' },
      { key: 'recordatorios', label: 'Recordatorios', icon: 'clock-alert-outline', group: 'Agenda' },
    ];

    if (user.rol === 'ADMIN') {
      return [
        ...common,
        { key: 'usuarios', label: 'Usuarios', icon: 'account-group-outline', group: 'Administración' },
        { key: 'medidores', label: 'Medidores', icon: 'gauge', group: 'Operación' },
        { key: 'lecturas', label: 'Lecturas', icon: 'water-outline', group: 'Operación' },
        { key: 'incidencias', label: 'Incidencias', icon: 'alert-octagon-outline', group: 'Operación' },
        { key: 'mapa', label: 'Mapa', icon: 'map-marker-radius-outline', group: 'Operación' },
        { key: 'ordenes', label: 'Órdenes', icon: 'clipboard-check-outline', group: 'Operación' },
        { key: 'planillas', label: 'Planillas', icon: 'file-document-outline', group: 'Cobros' },
        { key: 'pagos', label: 'Pagos', icon: 'cash-check', group: 'Cobros' },
        { key: 'recaudacion', label: 'Recaudación', icon: 'chart-line', group: 'Cobros' },
        { key: 'caja', label: 'Caja', icon: 'cash-multiple', group: 'Cobros' },
        { key: 'tarifas', label: 'Tarifas', icon: 'calculator-variant-outline', group: 'Cobros' },
        { key: 'estadisticas', label: 'Semestral', icon: 'chart-bar', group: 'Reportes' },
      ];
    }

    if (user.rol === 'TECNICO') {
      return [
        ...common,
        { key: 'miVivienda', label: 'Mi vivienda', icon: 'home-outline', group: 'Mi cuenta' },
        { key: 'lecturas', label: 'Lecturaciones', icon: 'water-plus', group: 'Campo' },
        { key: 'medidores', label: 'Medidores', icon: 'gauge', group: 'Campo' },
        { key: 'incidencias', label: 'Incidencias', icon: 'alert-octagon-outline', group: 'Campo' },
        { key: 'mapa', label: 'Mapa', icon: 'map-marker-radius-outline', group: 'Campo' },
        { key: 'ordenes', label: 'Órdenes', icon: 'clipboard-check-outline', group: 'Campo' },
      ];
    }

    // SOCIO
    return [
      ...common,
      { key: 'miVivienda', label: 'Mi vivienda', icon: 'home-outline', group: 'Mi cuenta' },
      { key: 'planillas', label: 'Planillas', icon: 'receipt-text-outline', group: 'Mi cuenta' },
      { key: 'iot', label: 'Mi Medidor IoT', icon: 'wifi', group: 'Mi cuenta' },
      { key: 'incidencias', label: 'Incidencias', icon: 'alert-octagon-outline', group: 'Mi cuenta' },
      { key: 'mapa', label: 'Mapa', icon: 'map-marker-radius-outline', group: 'Mi cuenta' },
      { key: 'estadisticas', label: 'Semestral', icon: 'chart-bar', group: 'Mi cuenta' },
    ];
  }, [user.rol]);

  const [current, setCurrent] = useState<string>('home');
  const [open, setOpen] = useState(false);

  const groupedTabs = useMemo(() => {
    const groups = new Map<string, TabItem[]>();
    tabs.forEach((tab) => {
      if (!groups.has(tab.group)) groups.set(tab.group, []);
      groups.get(tab.group)?.push(tab);
    });
    return Array.from(groups.entries());
  }, [tabs]);

  function logoutConfirm() {
    Alert.alert('Cerrar sesión', '¿Deseas salir de la aplicación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => { void onLogout(); } },
    ]);
  }

  let content = <HomeScreen user={user} onLogout={logoutConfirm} />;

  switch (current) {
    case 'usuarios':
      content = <AdminUsersScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'miVivienda':
      content = <MiViviendaScreen onLogout={logoutConfirm} />;
      break;
    case 'medidores':
      content = <MedidoresScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'avisos':
      content = <AvisosScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'lecturas':
      content = <LecturasScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'incidencias':
      content = <IncidenciasScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'planillas':
      content = <PlanillasScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'recaudacion':
      content = <RecaudacionScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'mensajes':
      content = <MessagesScreen onLogout={logoutConfirm} />;
      break;
    case 'notificaciones':
      content = <NotificationsScreen onLogout={logoutConfirm} />;
      break;
    case 'ordenes':
      content = <OrdersScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'estadisticas':
      content = <StatsScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'pagos':
      content = <PagosScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'caja':
      content = <MovimientosScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'reuniones':
      content = <ReunionesScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'recordatorios':
      content = <RecordatoriosScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'tarifas':
      content = <TarifasScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'mapa':
      content = <MapaIncidenciasScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'iot':
      content = <IotScreen user={user} onLogout={logoutConfirm} />;
      break;
    case 'home':
    default:
      content = <HomeScreen user={user} onLogout={logoutConfirm} />;
      break;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {content}

      <View pointerEvents="box-none" style={styles.fabWrap}>
        {open ? (
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        ) : null}

        <View style={styles.menuContainer}>
          {open ? (
            <ScrollView
              style={styles.menuScroll}
              contentContainerStyle={styles.menuScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {groupedTabs.map(([groupName, items]) => (
                <View key={groupName} style={styles.groupBlock}>
                  <Text style={styles.groupTitle}>{groupName}</Text>
                  {items.map((item) => (
                    <Pressable
                      key={item.key}
                      onPress={() => { setCurrent(item.key); setOpen(false); }}
                      style={[styles.menuItem, current === item.key ? styles.menuItemActive : null]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={22}
                        color={current === item.key ? '#fff' : colors.primary}
                      />
                      <Text style={[styles.menuLabel, current === item.key ? styles.menuLabelActive : null]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
          ) : null}

          <Pressable onPress={() => setOpen(!open)} style={styles.fabButton}>
            <MaterialCommunityIcons
              name={open ? 'close' : 'apps'}
              size={28}
              color="#fff"
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
    justifyContent: 'flex-end', alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.18)',
  },
  menuContainer: { alignItems: 'center', marginBottom: 18 },
  menuScroll: {
    maxHeight: 430, width: 270, marginBottom: 12, borderRadius: 22,
    backgroundColor: '#FFFFFF', shadowColor: '#0F172A', shadowOpacity: 0.14,
    shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
  menuScrollContent: { padding: 14, gap: 12 },
  groupBlock: { gap: 8 },
  groupTitle: { fontWeight: '800', fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 2, paddingHorizontal: 4 },
  fabButton: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', shadowColor: '#0F172A',
    shadowOpacity: 0.24, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  menuItem: {
    minWidth: 190, paddingHorizontal: 16, height: 50, borderRadius: 18,
    backgroundColor: '#F8FAFC', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-start', gap: 10, borderWidth: 1, borderColor: '#DCE7F7',
  },
  menuItemActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  menuLabel: { fontWeight: '800', color: colors.primary },
  menuLabelActive: { color: '#fff' },
});