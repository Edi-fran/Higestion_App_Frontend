import React from 'react';
import { ActivityIndicator, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { toApiImage } from '../services/api';

export const colors = {
  primary: '#1D4ED8',
  primarySoft: '#E8F0FF',
  secondary: '#0F172A',
  background: '#F4F7FB',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#CA8A04',
  border: '#E2E8F0',
  chip: '#EFF6FF'
};

export function Screen({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode; }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 110 }}>
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actions}
      </View>
      {children}
    </ScrollView>
  );
}

export function Card({ children, soft = false }: { children: React.ReactNode; soft?: boolean }) {
  return <View style={[styles.card, soft ? { backgroundColor: '#F8FBFF' } : null]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, danger, disabled }: { label: string; onPress?: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.button, danger ? { backgroundColor: colors.danger } : null, disabled ? { opacity: 0.45 } : null]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function Input({ label, value, onChangeText, placeholder, keyboardType, multiline, secureTextEntry }: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; keyboardType?: 'default' | 'numeric' | 'email-address'; multiline?: boolean; secureTextEntry?: boolean; }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType} multiline={multiline} secureTextEntry={secureTextEntry} style={[styles.input, multiline ? { minHeight: 102, textAlignVertical: 'top' } : null]} placeholderTextColor="#94A3B8" />
    </View>
  );
}

export function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {hint ? <Text style={styles.metricHint}>{hint}</Text> : null}
    </Card>
  );
}

export function Badge({ text, type = 'default' }: { text: string; type?: 'default' | 'success' | 'danger' | 'warning' }) {
  const bg = type === 'success' ? '#DCFCE7' : type === 'danger' ? '#FEE2E2' : type === 'warning' ? '#FEF3C7' : '#DBEAFE';
  const fg = type === 'success' ? colors.success : type === 'danger' ? colors.danger : type === 'warning' ? colors.warning : colors.primary;
  return <View style={[styles.badge, { backgroundColor: bg }]}><Text style={[styles.badgeText, { color: fg }]}>{text}</Text></View>;
}

export function EmptyState({ text }: { text: string }) {
  return <Card soft><Text style={styles.empty}>{text}</Text></Card>;
}

export function LoadingBlock() {
  return <Card soft><View style={{ padding: 24 }}><ActivityIndicator size="large" color={colors.primary} /></View></Card>;
}

export function SectionTitle({ title, meta }: { title: string; meta?: string }) {
  return <View style={{ gap: 2 }}><Text style={styles.sectionTitle}>{title}</Text>{meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}</View>;
}

export function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value == null || value === '' ? '-' : String(value)}</Text>
    </View>
  );
}

export function PhotoThumb({ path, onOpen }: { path?: string | null; onOpen?: () => void }) {
  const uri = toApiImage(path || undefined);
  if (!uri) return <View style={styles.photoPlaceholder}><Text style={styles.photoPlaceholderText}>Sin foto</Text></View>;
  return <Pressable onPress={onOpen}><Image source={{ uri }} style={styles.thumb} /></Pressable>;
}

export function PhotoPreviewModal({ visible, path, onClose }: { visible: boolean; path?: string | null; onClose: () => void }) {
  const uri = toApiImage(path || undefined);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalWrap} onPress={onClose}>
        <View style={styles.modalBody}>
          {uri ? <Image source={{ uri }} style={styles.zoomImage} resizeMode="contain" /> : <Text>No hay imagen</Text>}
        </View>
      </Pressable>
    </Modal>
  );
}

export function LinkButton({ label, url }: { label: string; url: string }) {
  return <SecondaryButton label={label} onPress={() => void Linking.openURL(url)} />;
}

export function TabBar({ items, current, onChange }: { items: { key: string; label: string }[]; current: string; onChange: (k: string) => void; }) {
  return (
    <View style={styles.tabBar}>
      {items.map((item) => (
        <Pressable key={item.key} onPress={() => onChange(item.key)} style={[styles.tabItem, current === item.key ? styles.tabItemActive : null]}>
          <Text style={[styles.tabText, current === item.key ? styles.tabTextActive : null]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  button: { backgroundColor: colors.primary, minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryButton: { minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  secondaryButtonText: { color: colors.primary, fontWeight: '800' },
  label: { color: colors.text, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, color: colors.text, fontSize: 15 },
  metricLabel: { color: colors.muted, fontWeight: '600' },
  metricValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  metricHint: { color: colors.muted, fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontWeight: '800', fontSize: 12 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionMeta: { color: colors.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: colors.muted, flex: 1 },
  rowValue: { color: colors.text, fontWeight: '700', flex: 1, textAlign: 'right' },
  thumb: { width: 82, height: 82, borderRadius: 16, backgroundColor: '#EEF3F7' },
  photoPlaceholder: { width: 82, height: 82, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF3F7' },
  photoPlaceholderText: { color: colors.muted, fontSize: 12 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalBody: { width: '100%', height: '72%', backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  zoomImage: { width: '100%', height: '100%' },
  tabBar: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 10, gap: 8 },
  tabItem: { paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14, backgroundColor: '#F1F5F9' },
  tabItemActive: { backgroundColor: '#DBEAFE' },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  tabTextActive: { color: colors.primary }
});
