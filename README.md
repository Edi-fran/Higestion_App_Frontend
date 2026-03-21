# HidroGestión Frontend

Frontend Expo Go alineado con el backend Flask de HidroGestión.

## Incluye
- Autenticación JWT con validación de sesión y refresh automático
- Roles ADMIN / TECNICO / SOCIO
- Usuarios, medidores, lecturas, incidencias, avisos, planillas y recaudación
- Captura de foto y coordenadas para lecturas e incidencias
- Diseño móvil más limpio y profesional

## Ejecutar
```bash
npm install
npx expo install expo-image-picker expo-location expo-status-bar @react-native-async-storage/async-storage react-native
npx expo start -c
```

Configura la IP del backend en `src/config.ts`.
