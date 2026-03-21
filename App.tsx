import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, SafeAreaView, View } from 'react-native';
import { LoginScreen } from './src/components/LoginScreen';
import { colors } from './src/components/Ui';
import { useSession } from './src/hooks/useSession';

import RoleApp from './src/screens/RoleApp';

export default function App() {
  const { user, loading, login, logout } = useSession();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <>
      {user ? <RoleApp user={user} onLogout={logout} /> : <LoginScreen onLogin={login} />}
      <StatusBar style="dark" />
    </>
  );
}
