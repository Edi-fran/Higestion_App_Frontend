# 💧 HidroGestión App  Frontend

<div align="center">

![HidroGestión](https://img.shields.io/badge/HidroGestión-App%20Móvil-1A5FA8?style=for-the-badge&logo=water&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-Expo%20SDK%2054-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-Go-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

**Frontend móvil del Sistema Comunitario de Gestión de Agua Potable**

App desarrollada con **Expo Go + React Native**, alineada con el backend Flask de HidroGestión.

</div>

---

## 🔗 Complemento del Sistema

Este repositorio corresponde a la parte **frontend móvil** del sistema.  
Debe trabajar en conjunto con el repositorio del backend:

> 🖥️ **Backend oficial del proyecto:**  
> https://github.com/Edi-fran/Proyecto_Hidrogestion_Backend.git

---

## ✅ Incluye

- 🔐 Autenticación JWT con validación de sesión y refresh automático
- 👥 Roles **ADMIN / TECNICO / SOCIO** con vistas diferenciadas
- 📋 Gestión de usuarios, medidores, lecturas, incidencias, avisos, planillas y recaudación
- 📷 Captura de fotografía y coordenadas GPS para lecturas e incidencias
- 📡 Integración con API Flask para consumo de datos en tiempo real
- 🎨 Interfaz móvil limpia, ordenada y profesional

---

## 📁 Estructura del Proyecto

---

## ⚙️ Requisitos

- Node.js
- npm
- Expo Go (instalado en tu celular Android o iOS)
- Backend HidroGestión ejecutándose correctamente

---

## 🚀 Instalación y Ejecución

**1. Clonar el repositorio**
```bash
git clone https://github.com/Edi-fran/Proyecto_Hidrogestion_Frontend.git
cd hidrogestion_frontend
```

**2. Instalar dependencias npm**
```bash
npm install
```

**3. Instalar dependencias nativas de Expo**
```bash
npx expo install expo-image-picker expo-location expo-status-bar @react-native-async-storage/async-storage react-native
npx expo install expo-camera expo-web-browser expo-sharing
```

**4. Configurar la IP del backend**

Edita el archivo `src/config.ts`:
```typescript
// Cambia esta IP por la IP de tu PC en la red local
export const API_BASE_URL = 'http://192.168.X.X:5000';
```

> 💡 Para encontrar tu IP local ejecuta `ipconfig` en Windows y busca la dirección IPv4.

**5. Iniciar Expo**
```bash
npx expo start -c
```

Escanea el QR con la app **Expo Go** en tu celular.

---

## 🔑 Credenciales de Prueba

> ⚠️ Solo para entorno de desarrollo. Cámbialas en producción.

| Rol | Username | Contraseña | Acceso |
|---|---|---|---|
| ADMIN | `admin` | `Admin123*` | Todo el sistema |
| TECNICO | `tecnico` | `Tecnico123*` | Operaciones de campo |
| SOCIO | `socio` | `Socio123*` | Consultas personales |

---

## 🛠️ Stack Tecnológico

| Librería | Versión | Uso |
|---|---|---|
| Expo SDK | ~54.0.0 | Plataforma de desarrollo |
| React Native | 0.81.5 | Framework móvil |
| TypeScript | 5.x | Tipado estático |
| expo-camera | ~17.0.10 | Escáner QR para lecturas |
| expo-location | ~19.0.8 | GPS para incidencias |
| expo-web-browser | ~15.0.10 | Abrir planillas PDF |
| expo-image-picker | ~17.0.10 | Fotos de evidencia |
| @react-native-async-storage | 2.2.0 | Almacenamiento local JWT |

---

## 🌐 Pantallas por Rol

| Rol | Pantallas disponibles |
|---|---|
| **ADMIN** | Dashboard · Usuarios · Medidores · Lecturas · Planillas · Recaudación · Incidencias · Avisos |
| **TECNICO** | Lecturas · Incidencias · Órdenes de trabajo · Medidores |
| **SOCIO** | Mi vivienda · Mis planillas · Mis lecturas · Incidencias · Avisos |

---

## 🔗 Endpoints que consume la app

---

## 👨‍💻 Desarrollador

<div align="center">

**Edilson Francisco Guillín Carrión**

[![GitHub](https://img.shields.io/badge/GitHub-Edi--fran-181717?style=for-the-badge&logo=github)](https://github.com/Edi-fran)

*Tecnólogo en Desarrollo de Aplicaciones Web*  
*Universidad Estatal Amazónica — UEA*  
*Puyo, Pastaza, Ecuador*

</div>

---

## 👥 Equipo del Proyecto

| Nombre | Rol |
|---|---|
| Edilson Francisco Guillín Carrión | Backend · IoT · App Móvil |
| David Paul Guerra Delgado | Frontend · Diseño UI |
| Luis Eduardo Argudo Guzmán | Testing · Documentación |

**Docente:** Ing. Julio César Hurtado Jerves  
**Asignatura:** 2526 - Aplicaciones Móviles (B) — UEA-L-UFPTI-008-B  
**Período:** 2025 – 2026 · Universidad Estatal Amazónica

---

## 📄 Licencia

Proyecto académico desarrollado para la Universidad Estatal Amazónica.

---

<div align="center">
💧 Desarrollado con ❤️ para las juntas comunitarias de agua potable
</div>
