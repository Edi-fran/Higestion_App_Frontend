import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import {
  Badge,
  Card,
  MetricCard,
  PrimaryButton,
  Screen,
  SectionTitle,
} from '../../components/Ui';
import { authService } from '../../services/authService';
import { hidroService } from '../../services/hidroService';
import { Planilla, RecaudacionResumen, UsuarioAuth } from '../../types';

type Props = {
  user: UsuarioAuth;
  onLogout: () => void;
};

export default function HomeScreen({ user, onLogout }: Props) {
  const [tokenJti, setTokenJti] = useState<string | undefined>();
  const [resume, setResume] = useState<RecaudacionResumen | null>(null);
  const [planillas, setPlanillas] = useState<Planilla[]>([]);
  const [pendientes, setPendientes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        try {
          const info = await authService.tokenInfo();
          setTokenJti(info?.jti);
        } catch {}

        if (user.rol === 'ADMIN') {
          const resumen = await hidroService.listRecaudacionResumen();
          setResume(resumen);
        } else {
          const pls = await hidroService.listPlanillas();
          setPlanillas(Array.isArray(pls) ? pls : []);

          try {
            const notis = await hidroService.listNotificaciones();
            setPendientes(
              Array.isArray(notis) ? notis.filter((n) => !n.leido).length : 0
            );
          } catch {
            setPendientes(0);
          }
        }
      } catch (e: any) {
        Alert.alert('Inicio', e?.message || 'No se pudo cargar el resumen.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user.rol]);

  const primerNombre = useMemo(() => {
    return user.nombre?.split(' ')[0] || user.username;
  }, [user.nombre, user.username]);

  const ultimaPlanilla = planillas.length > 0 ? planillas[0] : null;

  const modulosRol = useMemo(() => {
    if (user.rol === 'ADMIN') {
      return [
        'Usuarios',
        'Medidores',
        'Lecturas',
        'Incidencias',
        'Planillas',
        'Pagos',
        'Caja',
        'Tarifas',
        'Mensajes',
        'Alertas',
      ];
    }

    if (user.rol === 'TECNICO') {
      return [
        'Mi vivienda',
        'Planillas',
        'Lecturaciones',
        'Medidores',
        'Incidencias',
        'Órdenes',
        'Mensajes',
        'Alertas',
      ];
    }

    return [
      'Mi vivienda',
      'Planillas',
      'Incidencias',
      'Mensajes',
      'Alertas',
      'Comunicados',
    ];
  }, [user.rol]);

  return (
    <Screen
      title={`Hola, ${primerNombre}`}
      subtitle={`Sesión activa como ${user.rol}. Usa el menú central para navegar por tus módulos.`}
      actions={<PrimaryButton label="Salir" onPress={onLogout} danger />}
    >
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <MetricCard label="Rol" value={user.rol} hint="Permisos activos" />
        <MetricCard
          label="Usuario"
          value={user.username}
          hint={user.email || 'Sin correo'}
        />
        <MetricCard
          label="Alertas"
          value={pendientes}
          hint="Pendientes por revisar"
        />
      </View>

      <Card soft>
        <SectionTitle
          title="Sesión y seguridad"
          meta="Autenticación JWT conectada al backend"
        />
        <Text>JTI activo: {tokenJti || 'No disponible'}</Text>
        <View style={{ marginTop: 10 }}>
          <Badge text={user.estado || 'ACTIVO'} type="success" />
        </View>
      </Card>

      <Card>
        <SectionTitle
          title="Módulos disponibles"
          meta="Se muestran según tu rol dentro del sistema"
        />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {modulosRol.map((item) => (
            <Badge key={item} text={item} />
          ))}
        </View>
      </Card>

      {user.rol === 'ADMIN' ? (
        <Card>
          <SectionTitle
            title="Resumen administrativo"
            meta={loading ? 'Cargando datos...' : 'Recaudación y estado general'}
          />
          {resume ? (
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <MetricCard
                label="Total recaudado"
                value={`$${resume.total_recaudado.toFixed(2)}`}
              />
              <MetricCard
                label="Pendiente"
                value={`$${resume.total_pendiente.toFixed(2)}`}
              />
              <MetricCard
                label="Planillas pagadas"
                value={resume.planillas_pagadas}
              />
              <MetricCard
                label="Pagos"
                value={resume.pagos_registrados}
              />
            </View>
          ) : (
            <Text>No hay resumen administrativo disponible.</Text>
          )}
        </Card>
      ) : (
        <Card>
          <SectionTitle
            title="Mi estado rápido"
            meta={loading ? 'Cargando planillas...' : 'Resumen de consumo y cobro'}
          />
          <Text>Planillas registradas: {planillas.length}</Text>
          <Text>
            Última planilla: {ultimaPlanilla?.numero_planilla || 'Sin registros'}
          </Text>
          <Text>Estado reciente: {ultimaPlanilla?.estado || 'Sin datos'}</Text>
          <Text>
            Total última planilla:{' '}
            {ultimaPlanilla ? `$${ultimaPlanilla.total_pagar.toFixed(2)}` : '-'}
          </Text>
        </Card>
      )}
    </Screen>
  );
}