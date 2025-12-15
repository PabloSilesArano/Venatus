# 📘 Manual de Usuario - Venatus

## Índice

1. [Introducción](https://github.com/PabloSilesArano/Venatus/blob/main/Manual%20de%20Usuario.md#1-introducci%C3%B3n)
2. [Acceso al Sistema](https://github.com/PabloSilesArano/Venatus/blob/main/Manual%20de%20Usuario.md#2-acceso-al-sistema)
3. [Aplicación Android para Socios](https://github.com/PabloSilesArano/Venatus/blob/main/Manual%20de%20Usuario.md#3-aplicaci%C3%B3n-android-para-socios)
4. [Panel Web para Super Administrador](https://github.com/PabloSilesArano/Venatus/blob/main/Manual%20de%20Usuario.md#4-gesti%C3%B3n-de-perros-de-caza-app-android)
5. [Panel Web para Administrador de Coto](https://github.com/PabloSilesArano/Venatus/blob/main/Manual%20de%20Usuario.md#5-panel-web-para-super-administrador)
6. [Gestión de Perros de Caza](https://github.com/PabloSilesArano/Venatus/blob/main/Manual%20de%20Usuario.md#6-gesti%C3%B3n-de-perros-superadmin)
7. [Solución de Problemas](https://github.com/PabloSilesArano/Venatus/blob/main/Manual%20de%20Usuario.md#7-panel-web-para-administrador-de-coto)
8. [Preguntas Frecuentes](https://github.com/PabloSilesArano/Venatus/blob/main/Manual%20de%20Usuario.md#8-soluci%C3%B3n-de-problemas)
9. [Contacto y Soporte](#contacto-y-soporte)

---

## 1. Introducción

**Venatus** es un sistema integral para la gestión de cotos de caza que permite:

- ✅ **Monitoreo en tiempo real** de socios y perros
- ✅ **Registro de capturas** con geolocalización
- ✅ **Gestión completa** de cotos, socios y administradores
- ✅ **Control de acceso** mediante DNI y usuario
- ✅ **Visualización en mapas** interactivos

### Roles del Sistema

| Rol | Descripción | Acceso |
|-----|-------------|---------|
| **Socio/Cazador** | Usuario que realiza actividades de caza | Solo aplicación Android |
| **Administrador de Coto** | Gestiona un coto específico | Panel web + monitoreo limitado |
| **Super Administrador** | Control total del sistema | Panel web completo |

---

## 2. Acceso al Sistema

### 2.1 Para Socios (Aplicación Android)

1. **Descarga la aplicación** desde la tienda oficial
2. **Abre la aplicación** y completa los campos:
   ```
   Usuario: [tu usuario asignado]
   Contraseña: [tu contraseña temporal]
   ```
3. **Pulsa "Acceder"** para iniciar sesión
4. **Permisos necesarios** (primera vez):
   - ✅ Ubicación en tiempo real
   - ✅ Notificaciones
   - ✅ Almacenamiento

### 2.2 Para Administradores (Panel Web)

1. **Accede desde tu navegador**:
   ```
   http://venatus.es:3000
   ```
2. **Completa las credenciales**:
   ```
   Usuario: [superadmin o admin_coto]
   Contraseña: [tu contraseña]
   ```
3. **Redirección automática** según tu rol

---

## 3. Aplicación Android para Socios

### 3.1 Pantalla Principal

**Elementos visibles:**
- 🗺️ **Mapa interactivo** con tu ubicación actual
- 📍 **Indicador de estado** (dentro/fuera del coto)
- 📊 **Coordenadas GPS** en tiempo real
- 🎯 **Botón de menú** (esquina superior derecha)

### 3.2 Menú Principal

Accede tocando el botón **☰** en la esquina superior derecha:

```
🌿 Cargar Cotos
➕ Aumentar Zoom
➖ Reducir Zoom
🗑️ Limpiar Mapa
📍 Centrar en mi ubicación
🐕 Mis Perros de Caza
🐾 Ver Animales del Coto
🎯 Registrar Animal Cazado
📋 Mi Historial de Capturas
ℹ️ Acerca de
```

### 3.3 Selección de Coto

**Primer uso - REQUERIDO:**

1. Toca **🌿 Cargar Cotos**
2. Selecciona tu coto de la lista
3. Espera a que se cargue el polígono en el mapa
4. El sistema comenzará el monitoreo automático

### 3.4 Monitoreo Automático

Una vez seleccionado el coto:

- 🔄 **Actualización automática** cada 10 segundos
- 🟢 **Estado "DENTRO"** cuando estás en el coto
- 🔴 **Estado "FUERA"** cuando sales del coto
- 🔊 **Notificaciones** visuales de cambios de estado

### 3.5 Registrar una Captura

**Proceso paso a paso:**

```
1. Toca 🎯 "Registrar Animal Cazado"
2. Selecciona el animal de la lista
3. Ingresa la cantidad cazada (número)
4. Pulsa "Registrar"
5. Confirmación automática con ubicación GPS
```

**⚠️ Importante:** Debes estar DENTRO del coto para registrar capturas.

### 3.6 Ver Historial de Capturas

1. Toca **📋 Mi Historial de Capturas**
2. Visualiza tus últimas 20 capturas
3. Información mostrada:
   - 🐗 Animal cazado
   - 🔢 Cantidad
   - 📅 Fecha y hora
   - 📍 Coordenadas (si disponibles)
   - 🏞️ Coto donde se realizó

---

## 4. Gestión de Perros de Caza (App Android)

### 4.1 Acceso al Menú de Perros

1. Toca **🐕 Mis Perros de Caza** en el menú principal
2. Opciones disponibles:
   ```
   📋 Ver mis perros
   ➕ Registrar nuevo perro
   📍 Actualizar ubicación de perros
   🗺️ Mostrar perros en mapa
   🔄 Iniciar monitoreo automático
   ⏹️ Detener monitoreo
   ```

### 4.2 Registrar un Nuevo Perro

**Datos requeridos:**
- 🐶 **Nombre del perro** (máx. 30 caracteres)
- 🔢 **Identificador único** (chip, código, máx. 50 caracteres)

**Proceso:**
```
1. Selecciona "➕ Registrar nuevo perro"
2. Completa nombre e identificador
3. La ubicación actual se asignará automáticamente
4. Pulsa "Registrar"
5. ✅ Confirmación de registro
```

### 4.3 Ver Mis Perros

1. Selecciona **📋 Ver mis perros**
2. Lista mostrada por cada perro:
   ```
   [Número]. [Nombre] ([Identificador]) [📍 o ❌]
   ```
   - **📍** = Tiene ubicación registrada
   - **❌** = Sin ubicación registrada

3. **Toca cualquier perro** para ver opciones:
   ```
   ✏️ Editar información
   📍 Actualizar ubicación
   🗺️ Mostrar en mapa
   🗑️ Eliminar perro
   ```

### 4.4 Actualizar Ubicación de Perros

**Opciones disponibles:**

1. **📍 Actualizar ubicación** (perro específico):
   - Asigna tu ubicación actual al perro seleccionado

2. **📍 Actualizar ubicación de perros** (todos):
   - Actualiza la ubicación de TODOS tus perros
   - Usa tu ubicación actual para todos

### 4.5 Visualización en Mapa

1. **🗺️ Mostrar perros en mapa**:
   - Muestra TODOS tus perros con ubicación
   - Iconos naranjas 🐕 para perros
   - Centra el mapa para ver todos los perros

2. **🗺️ Mostrar en mapa** (perro específico):
   - Muestra solo el perro seleccionado
   - Centra el mapa en ese perro

### 4.6 Monitoreo Automático de Perros

**Funcionalidades:**
- 🔄 **Actualización automática** cada 15 segundos
- 📍 **Sincronización** con servidor central
- 🗺️ **Visualización en tiempo real** en paneles web
- 📊 **Estadísticas actualizadas** para administradores

**Para activar:**
1. Toca **🔄 Iniciar monitoreo automático**
2. El sistema comenzará a enviar ubicaciones
3. Para detener: **⏹️ Detener monitoreo**

---

## 5. Panel Web para Super Administrador

### 5.1 Acceso e Inicio

1. **URL de acceso**: `http://venatus.es:3000`
2. **Credenciales por defecto**:
   ```
   Usuario: superadmin
   Contraseña: admin123
   ```
3. **Pantalla inicial**: Mapa interactivo + menú lateral

### 5.2 Menú Principal (SuperAdmin)

```
🗺️ Delimitar coto
🗑️ Borrar coto
📋 -- Selecciona un coto --
💾 Guardar coto
👤 Registrar Socio
👥 Monitorear Socios
✏️ Modificar Coto
🐕 Gestionar Perros
👑 Gestionar Administradores
🚪 Cerrar Sesión
```

### 5.3 Crear un Nuevo Coto

**Proceso completo:**

```
1. Toca "🗺️ Delimitar coto"
2. Dibuja el polígono en el mapa (clic para puntos)
3. Doble clic para finalizar
4. Introduce nombre del coto
5. Toca "💾 Guardar coto"
6. ✅ Confirmación de guardado
```

### 5.4 Modificar un Coto Existente

**Nueva funcionalidad avanzada:**

```
1. Toca "✏️ Modificar Coto"
2. Selecciona el coto de la lista
3. Toca "🗺️ Cargar Coto"
4. Toca "✏️ Editar Coto"
5. Modifica el polígono:
   - Arrastra puntos para moverlos
   - Clic en línea para añadir punto
   - Eliminar puntos con botón
6. Toca "✅ Finalizar Edición"
7. Toca "💾 Guardar Cambios"
```

### 5.5 Registrar Nuevo Socio

**Datos obligatorios:**

1. **Nombre completo** (máx. 50 caracteres)
2. **DNI** (documento único, máx. 20 caracteres)
3. **Usuario** (único, máx. 20 caracteres)
4. **Contraseña** (máx. 20 caracteres)
5. **Email** (opcional, máx. 100 caracteres)
6. **Teléfono** (9 dígitos)

**Proceso:**
```
1. Toca "👤 Registrar Socio"
2. Completa todos los campos
3. Toca "Registrar Socio"
4. ✅ Confirmación y limpieza automática
```

### 5.6 Monitorear Socios

**Funcionalidades:**

1. **Selecciona un coto** del dropdown
2. **Toca "▶️ Iniciar Monitoreo"**
3. **Visualización en tiempo real**:
   - 👤 Socios dentro del coto
   - 📍 Ubicación exacta en mapa
   - 🔄 Actualización cada 5 segundos
4. **Para detener**: ⏹️ Detener Monitoreo

---

## 6. Gestión de Perros (SuperAdmin)

### 6.1 Acceso al Panel de Perros

1. Toca **🐕 Gestionar Perros** en el menú
2. **Panel emergente** con dos secciones:
   - 📝 Formulario de registro/edición
   - 📋 Lista de perros existentes

### 6.2 Registrar Nuevo Perro

**Formulario completo:**

```
NOMBRE DEL PERRO: [Texto, máx. 30 caracteres]
IDENTIFICADOR ÚNICO: [Texto, máx. 50 caracteres]
SOCIO PROPIETARIO: [Dropdown con socios]
UBICACIÓN INICIAL: [Opcional]
  • Coordenada X (longitud)
  • Coordenada Y (latitud)
  • 📍 Usar mi ubicación
  • 🗑️ Limpiar
```

**Botones de acción:**
- ✅ **Registrar Perro** (nuevo)
- 🔄 **Actualizar Perro** (edición)
- ❌ **Cancelar Edición** (modo edición)

### 6.3 Asignar Perro a Socio

**Proceso de asignación:**

1. **En el formulario de perro**:
   - Selecciona socio del dropdown
   - Opción "-- Sin asignar --" disponible
2. **Para cambiar asignación**:
   - Edita el perro existente
   - Cambia el socio en el dropdown
   - Guarda cambios

### 6.4 Monitoreo de Perros en Tiempo Real

**Panel de monitoreo específico:**

```
1. Toca "🎯 Monitorear Perros"
2. Panel emergente en esquina inferior derecha
3. Estado: "Monitoreo activo" / "Monitoreo detenido"
4. Controles:
   • ▶️ Iniciar (actualiza cada 5 segundos)
   • ⏹️ Detener
5. Lista de perros activos con ubicación
6. Contador de perros monitoreados
```

### 6.5 Visualización en Mapa

**Características:**

- 🐕 **Iconos naranjas** para perros
- 📍 **Popup informativo** al hacer clic:
  ```
  🐕 [Nombre del perro]
  🆔 [Identificador]
  📍 [Coordenadas]
  👤 [Socio propietario]
  ⏰ [Hora de actualización]
  ```
- 🔄 **Actualización automática** en monitoreo activo

### 6.6 Gestión de Perros Existentes

**Para cada perro en la lista:**

```
NOMBRE: [Nombre del perro]
IDENTIFICADOR: [Código único]
UBICACIÓN: [Coordenadas o "Sin ubicación"]
PROPIETARIO: [Nombre del socio]
ESTADO: ACTIVO
ACCIONES:
  • Editar (✏️)
  • Ubicación (📍)
  • Ver en mapa (🗺️) - solo con ubicación
```

---

## 7. Panel Web para Administrador de Coto

### 7.1 Acceso e Inicio

1. **Mismo URL**: `http://venatus.es:3000`
2. **Credenciales específicas** para tu coto
3. **Redirección automática** a tu panel de control

### 7.2 Panel de Control Principal

**Elementos visibles:**

```
👋 BIENVENIDO
[Coto asignado]
👑 Administrador: [Tu nombre]

📊 ESTADÍSTICAS
• Total Socios: [Número]
• En el Coto: [Número]
• Perros: [Número] - NUEVO

👥 SOCIOS MONITOREADOS
[Lista de socios en el coto]
[Información de perros por socio] - NUEVO

🎯 CONTROLES
• ▶️ Iniciar Monitoreo
• ⏹️ Detener Monitoreo

📱 ESTADO
[Estado del monitoreo]
[Última actualización]
```

### 7.3 Monitoreo de Socios y Perros

**Funcionalidad mejorada:**

1. **Toca "▶️ Iniciar Monitoreo"**
2. **Visualización combinada** en mapa:
   - 👤 **Socios**: Marcadores azules estándar
   - 🐕 **Perros**: Marcadores naranjas especiales
3. **Información detallada** por socio:
   ```
   [Nombre del socio]
   📍 [Coordenadas]
   
   🐕 PERROS (X):
   • [Nombre perro] ([Identificador])
     📍 [Coordenadas perro]
   ```
4. **Actualización automática** cada 5 segundos

### 7.4 Visualización en Mapa

**Diferenciación clara:**

- **Socios**:
  - Icono: 👤
  - Color: Azul (#2A9DF4)
  - Popup: Información básica del socio

- **Perros**:
  - Icono: 🐕
  - Color: Naranja (#FF6B35)
  - Popup: Información del perro + socio dueño
  - Animación: Latido suave

### 7.5 Estadísticas Actualizadas

**Nuevos datos incluidos:**

```
📊 RESUMEN EN TIEMPO REAL
• Total de socios registrados: [N]
• Socios actualmente en el coto: [N]
• Total de perros asignados: [N] ← NUEVO
• Perros con ubicación activa: [N] ← NUEVO
• Última actualización: [HH:MM:SS]
```

---

## 8. Solución de Problemas

### 8.1 Problemas Comunes - App Android

#### ❌ "No puedo iniciar sesión"
```
1. Verifica tu conexión a internet
2. Confirma usuario y contraseña
3. Contacta con administrador para reset
4. Reinstala la aplicación si persiste
```

#### ❌ "El mapa no se carga"
```
1. Verifica conexión a internet
2. Activa ubicación/GPS
3. Sal y reingresa a la aplicación
4. Reinicia el dispositivo
```

#### ❌ "No puedo registrar capturas"
```
1. Verifica que estés DENTRO del coto
2. Confirma que hayas seleccionado un coto
3. Verifica permisos de ubicación
4. Intenta registrar un animal diferente
```

#### ❌ "Mis perros no aparecen"
```
1. Verifica que hayas registrado perros
2. Confirma que tengan ubicación asignada
3. Activa "Monitoreo automático"
4. Contacta con administrador si persiste
```

### 8.2 Problemas Comunes - Panel Web

#### ❌ "No puedo acceder al panel"
```
1. Verifica la URL: http://venatus.es:3000
2. Confirma usuario y contraseña
3. Verifica que tengas permisos de administrador
4. Contacta con superadministrador
```

#### ❌ "No se dibuja el polígono"
```
1. Asegúrate de hacer clic para crear puntos
2. Doble clic para finalizar
3. Verifica que JavaScript esté habilitado
4. Prueba en otro navegador (Chrome/Firefox)
```

#### ❌ "El monitoreo no funciona"
```
1. Verifica que hay socios activos en el coto
2. Confirma que el monitoreo esté iniciado
3. Verifica conexión a internet
4. Revisa consola del navegador (F12)
```

### 8.3 Problemas con Perros

#### ❌ "No puedo asignar perro a socio"
```
1. Verifica que el socio exista en el sistema
2. Confirma que el perro no esté ya asignado
3. Intenta asignar desde edición del perro
4. Contacta con superadministrador
```

#### ❌ "Ubicación de perros no se actualiza"
```
App Android:
1. Verifica permisos de ubicación
2. Activa "Monitoreo automático"
3. Confirma conexión a internet

Panel Web:
1. Verifica que el monitoreo esté activo
2. Confirma que los perros tengan ubicación
3. Revisa intervalo de actualización
```

---

## 9. Preguntas Frecuentes

### 🤔 ¿Necesito internet para usar la app?
**Sí, pero:** 
- Para registro de capturas: ✅ Internet requerido
- Para monitoreo básico: ⚠️ Funciona con GPS solo
- Para sincronización: ✅ Necesario internet

### 🤔 ¿Puedo usar la app sin seleccionar coto?
**No.** Debes seleccionar un coto para:
- Registrar capturas
- Monitoreo de ubicación
- Verificaciones de estado

### 🤔 ¿Cuántos perros puedo registrar?
**No hay límite.** Puedes registrar todos los perros que necesites.

### 🤔 ¿Puedo cambiar de coto?
**Sí, pero:**
1. Limpia el mapa actual
2. Carga el nuevo coto
3. El sistema actualizará el monitoreo

### 🤔 ¿Los datos de ubicación son privados?
**Sí.** Solo:
- Administradores de tu coto pueden ver tu ubicación
- Superadministradores tienen acceso global
- Los datos no se comparten externamente

### 🤔 ¿Qué pasa si pierdo conexión?
**Comportamiento:**
- La app sigue funcionando con GPS
- Las capturas se guardan localmente
- Se sincronizan al recuperar conexión
- Notificaciones pendientes se envían después

### 🤔 ¿Puedo editar mis capturas?
**No directamente.** Contacta con:
- Administrador de tu coto para correcciones
- Superadministrador para eliminaciones

### 🤔 ¿Cómo cambio mi contraseña?
**Contacta con:**
- Administrador de tu coto (socios)
- Superadministrador (administradores)

---

## 10. Contacto y Soporte

### 🆘 Soporte Técnico

**Para problemas técnicos:**

```
📧 Email: soporte@venatus.es
📱 Teléfono: +34 900 123 456
🕒 Horario: L-V 9:00-18:00
```

### 👨‍💼 Contacto Administrativo

**Para gestiones administrativas:**

```
📧 Email: admin@venatus.es
📱 Teléfono: +34 911 222 333
📍 Oficina: C/ Principal, 123, Sevilla
```

### 📋 Reportar Problemas

**Incluye siempre:**
1. 📱 Dispositivo y modelo
2. 📲 Versión de la app
3. 📅 Fecha y hora del problema
4. 🔄 Pasos para reproducirlo
5. 📸 Capturas de pantalla (opcional)

### 🔄 Actualizaciones del Sistema

**Recibirás:**
- 🔔 Notificaciones en la app
- 📧 Email informativo
- 📱 Mensaje en el panel de administración
- 📋 Notas de versión en la web

---

## 📋 Checklist de Configuración Inicial

### Para Nuevos Socios:
- [ ] Descargar app Android
- [ ] Obtener credenciales de administrador
- [ ] Configurar permisos de ubicación
- [ ] Seleccionar coto asignado
- [ ] Probar registro de captura
- [ ] Registrar perros (si aplica)

### Para Nuevos Administradores:
- [ ] Acceder al panel web
- [ ] Configurar coto asignado
- [ ] Probar monitoreo de socios
- [ ] Verificar estadísticas
- [ ] Probar gestión de perros (SuperAdmin)

### Para Super Administradores:
- [ ] Configurar todos los cotos
- [ ] Registrar administradores
- [ ] Establecer especies por coto
- [ ] Probar modificación de cotos
- [ ] Verificar sistema de perros completo

---

## ⭐ Consejos y Mejores Prácticas

### Para Socios:
- ✅ **Actualiza ubicación de perros** antes de salir de caza
- ✅ **Verifica estado** antes de registrar capturas
- ✅ **Usa monitoreo automático** para perros activos
- ✅ **Cierra sesión** en dispositivos compartidos

### Para Administradores:
- ✅ **Revisa estadísticas** diariamente
- ✅ **Comunica cambios** a los socios
- ✅ **Verifica ubicaciones** en tiempo real
- ✅ **Mantén datos actualizados**

### Para Super Administradores:
- ✅ **Realiza backups** semanales
- ✅ **Audita accesos** regularmente
- ✅ **Actualiza documentación** con cambios
- ✅ **Capacita a nuevos administradores**

---

**Última actualización:** Diciembre 2025  

---
