import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { APP_NAME } from '../config';
import { colors, Input, PrimaryButton } from './Ui';

export function LoginScreen({ onLogin }: { onLogin: (u: string, p: string) => Promise<void> }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin123*');
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      await onLogin(username.trim(), password);
    } catch (e: any) {
      Alert.alert('Inicio de sesión', e.message || 'No fue posible iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.wrap}>
      <View style={styles.hero}>
        <View style={styles.brandBubble}><Text style={styles.brandBubbleText}>HG</Text></View>
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.lead}>Gestión comunitaria del agua con roles, lecturas, incidencias, planillas y control administrativo.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Ingresa con tu usuario para acceder a las funciones permitidas por tu rol.</Text>
        <Input label="Usuario" value={username} onChangeText={setUsername} placeholder="admin / tecnico / socio" />
        <Input label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholder="********" />
        <PrimaryButton label={loading ? 'Ingresando...' : 'Entrar al sistema'} onPress={submit} disabled={loading} />
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>Accesos demo</Text>
          <Text style={styles.tip}>Administrador: admin / Admin123*</Text>
          <Text style={styles.tip}>Técnico: tecnico / Tecnico123*</Text>
          <Text style={styles.tip}>Socio: socio / Socio123*</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#EAF2FF', padding: 20, justifyContent: 'center', gap: 20 },
  hero: { gap: 8 },
  brandBubble: { width: 60, height: 60, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandBubbleText: { color: '#fff', fontWeight: '900', fontSize: 22 },
  brand: { fontSize: 30, fontWeight: '900', color: colors.secondary },
  lead: { color: colors.muted, lineHeight: 22 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 20, gap: 14, borderWidth: 1, borderColor: '#D6E4FF', shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 2 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: { color: colors.muted },
  tipBox: { marginTop: 8, backgroundColor: '#F8FBFF', borderRadius: 18, borderWidth: 1, borderColor: '#D8EAFE', padding: 14, gap: 4 },
  tipTitle: { fontWeight: '800', color: colors.text },
  tip: { color: colors.muted }
});
