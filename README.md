# Venatus - Sistema Integral de Gestión de Cotos de Caza

## Descripción del Proyecto

**Venatus** es una solución completa desarrollada como proyecto de prácticas para el **Grado Superior en Desarrollo de Aplicaciones Multiplataforma**.  
El sistema permite la **gestión integral** de cotos de caza, incluyendo monitoreo en tiempo real, registro de capturas y administración de especies mediante una **aplicación Android nativa** y un **panel web administrativo avanzado**.

---

### Aviso Importante sobre Propiedad Intelectual

Este proyecto fue **desarrollado íntegramente por estudiantes** como parte de sus prácticas formativas.  
El código fuente, diseño y arquitectura son **propiedad intelectual de los desarrolladores**.  
La empresa receptora tiene derechos de uso según el acuerdo de prácticas, pero la propiedad del código y las soluciones técnicas implementadas permanecen con los creadores originales.

---

## Características Principales

### 🎯 Sistema de Capturas y Especies
- **Catálogo completo** de animales por coto
- **Registro en tiempo real** de capturas con coordenadas GPS
- **Historial detallado** con ubicación y fechas
- **Gestión de inventario** de especies por área de caza
- **Estadísticas y reportes** de actividad cinegética

### 📱 Aplicación Android
- **Autenticación segura** de socios y administradores
- **Monitoreo en tiempo real** de ubicación GPS
- **Detección automática** de entrada/salida de cotos
- **Registro inmediato** de animales cazados
- **Interfaz intuitiva** con mapa interactivo
- **Notificaciones visuales** de estado
- **Envío periódico** de ubicación al servidor
- **Historial personal** de capturas

### 🖥️ Panel Web Administrativo
- **Gestión visual** de cotos mediante dibujo en mapa
- **Registro y administración** de socios y administradores
- **Monitoreo en tiempo real** de todos los socios activos
- **Gestión de especies** y asignación a cotos
- **Base de datos Firebird** integrada
- **Interfaz responsive** y moderna
- **Reportes avanzados** de actividad

---

## Tecnologías Utilizadas

### Backend
- **Node.js** con Express  
- **Firebird Database**  
- **RESTful API** completa
- **Almacenamiento en memoria** para ubicaciones en tiempo real  
- **CORS configurado** para múltiples dominios

### Frontend Web
- **HTML5, CSS3, JavaScript**  
- **Leaflet.js** para mapas interactivos
- **Leaflet Draw** para dibujo de polígonos  
- **Diseño responsive** y moderno
- **Panel administrativo** con funcionalidades completas

### Mobile
- **Kotlin** nativo para Android  
- **Android Location Services**  
- **WebView** con Leaflet para mapas  
- **OkHttp** para comunicación con API  
- **GPS y permisos de ubicación**  
- **Material Design** para interfaz de usuario

---

## Estructura del Proyecto

```
Venatus/
├──  android-app/
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/example/venatus/
│   │   │   │   ├── LoginActivity.kt
│   │   │   │   └── MainActivity.kt
│   │   │   ├── res/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── activity_login.xml
│   │   │   │   │   ├── activity_main.xml
│   │   │   │   │   └── dialog_cantidad.xml
│   │   │   │   ├── drawable/
│   │   │   │   ├── values/
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   ├── colors.xml
│   │   │   │   │   └── styles.xml
│   │   │   │   └── menu/
│   │   │   │       └── main_menu.xml
│   │   │   └── assets/
│   │   │       └── mapa_limpio.html
│   │   └── build.gradle.kts
│   └── gradle/
├──  web-admin/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├──  server/
│   ├── server.js
│   ├── package.json
│   └── node_modules/
├──  documentation/
│   ├── API_Documentation.md
│   ├── Database_Schema.md
│   └── User_Manual.md
└──  database/
    ├── schema.sql
    ├── sample_data.sql
    └── triggers.sql
```

---

## Instalación y Configuración

### Prerrequisitos
- Node.js 16+
- Firebird Database 3.0+
- Android Studio (para desarrollo móvil)
- Java JDK 11+

---

### Servidor Backend
```bash
cd server
npm install
npm start
```

El servidor se ejecutará en **http://localhost:3000**

---

### Panel Web
```bash
cd web-admin
# Servir los archivos estáticos con un servidor web local
python -m http.server 8080
# o usar Live Server en VS Code
```

---

### Aplicación Android
1. Abrir **Android Studio**  
2. `File → Open → Seleccionar carpeta android-app`  
3. Esperar a que Gradle sincronice las dependencias  
4. Conectar dispositivo o emulador  
5. `Run → Run 'app'`

---

## Configuración de Base de Datos

### 1. Instalación de Firebird
- Descargar e instalar **Firebird 3.0+**
- Crear base de datos: `venatus.fdb`

### 2. Estructura de Tablas Principales
```sql
-- Tabla de cotos/áreas de caza
CREATE TABLE COTOS (
    ID INTEGER NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(100),
    CENTRO_X DOUBLE PRECISION,
    CENTRO_Y DOUBLE PRECISION,
    PERIMETRO BLOB SUB_TYPE TEXT
);

-- Tabla de socios/cazadores
CREATE TABLE SOCIOS (
    ID INTEGER NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(50),
    TELEFONO VARCHAR(20),
    USUARIO VARCHAR(20),
    CLAVE VARCHAR(20),
    EMAIL VARCHAR(100),
    POSICION_X DOUBLE PRECISION,
    POSICION_Y DOUBLE PRECISION
);

-- Tabla de especies animales
CREATE TABLE ANIMALES (
    ID INTEGER NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(50) NOT NULL,
    DESCRIPCION VARCHAR(255),
    ACTIVO INTEGER DEFAULT 1
);

-- Relación de animales por coto
CREATE TABLE COTO_ANIMALES (
    ID INTEGER NOT NULL PRIMARY KEY,
    ID_COTO INTEGER NOT NULL,
    ID_ANIMAL INTEGER NOT NULL,
    ACTIVO INTEGER DEFAULT 1,
    FOREIGN KEY (ID_COTO) REFERENCES COTOS(ID),
    FOREIGN KEY (ID_ANIMAL) REFERENCES ANIMALES(ID)
);

-- Registro de capturas
CREATE TABLE CAPTURAS (
    ID INTEGER NOT NULL PRIMARY KEY,
    ID_SOCIO INTEGER NOT NULL,
    ID_COTO INTEGER NOT NULL,
    ID_ANIMAL INTEGER NOT NULL,
    CANTIDAD INTEGER NOT NULL,
    FECHA_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LATITUD DOUBLE PRECISION,
    LONGITUD DOUBLE PRECISION,
    FOREIGN KEY (ID_SOCIO) REFERENCES SOCIOS(ID),
    FOREIGN KEY (ID_COTO) REFERENCES COTOS(ID),
    FOREIGN KEY (ID_ANIMAL) REFERENCES ANIMALES(ID)
);

-- Administradores del sistema
CREATE TABLE ADMIN_COTOS (
    ID INTEGER NOT NULL PRIMARY KEY,
    USUARIO VARCHAR(50),
    CLAVE VARCHAR(50),
    NOMBRE VARCHAR(100),
    EMAIL VARCHAR(100),
    ID_COTO INTEGER,
    TIPO VARCHAR(20),
    ACTIVO INTEGER DEFAULT 1
);
```

### 3. Inicialización de Datos
El sistema incluye un endpoint de inicialización que crea:
- **Generadores automáticos** de IDs
- **Tablas** con triggers para auto-incremento
- **Especies predefinidas** (Jabalí, Ciervo, Corzo, Gamo, Conejo, Perdiz)
- **Estructura completa** de la base de datos

### 4. Configuración de Conexión
En `server.js`:
```javascript
const dbOptions = {
  host: "localhost",
  port: 3050,
  database: "C:/datos/venatus.fdb",
  user: "SYSDBA",
  password: "masterkey",
  lowercase_keys: false,
  role: null,
  pageSize: 4096
};
```

---

## Uso del Sistema

### Para Socios (Android)
1. **Iniciar sesión** con credenciales de socio  
2. **Seleccionar coto activo** del listado disponible
3. **Permitir permisos** de ubicación GPS
4. **Monitoreo automático** de ubicación dentro del coto
5. **Registrar capturas** en tiempo real con coordenadas
6. **Consultar historial** personal de actividad
7. **Recibir notificaciones** al entrar/salir del coto  

### Para Administradores (Web)
1. **Acceder al panel** administrativo  
2. **Dibujar cotos** en el mapa interactivo  
3. **Gestionar socios** y permisos del sistema
4. **Administrar especies** y asignación a cotos
5. **Monitorear ubicaciones** en tiempo real
6. **Ver reportes** de actividad y capturas
7. **Configurar administradores** por coto

---

## API Endpoints Principales

### 🔐 Autenticación
- `POST /validar-login` → Validar credenciales de socio  
- `POST /registrar-socio` → Registrar nuevo socio
- `POST /admin/login-unificado` → Login unificado para administradores

### 🗺️ Gestión de Cotos
- `GET /areas` → Obtener listado de todos los cotos  
- `GET /areas/:id` → Obtener información específica de un coto  
- `POST /guardar` → Guardar nuevo coto en la base de datos

### 🐾 Gestión de Animales
- `GET /animales` → Obtener todas las especies disponibles
- `GET /cotos/:id/animales` → Obtener animales asignados a un coto
- `POST /cotos/:id/asignar-animales` → Asignar especies a un coto

### 🎯 Sistema de Capturas
- `POST /capturas` → Registrar nueva captura con coordenadas
- `GET /socios/:id/capturas` → Obtener historial de capturas de un socio

### 📍 Monitoreo en Tiempo Real
- `POST /socio/ubicacion` → Envío de ubicación desde app Android  
- `GET /monitoreo/coto/:id/socios` → Obtener socios en un coto específico

### ⚙️ Administración
- `GET /admin/listar` → Listar administradores del sistema
- `POST /admin/crear` → Crear nuevo administrador
- `PUT /admin/estado` → Cambiar estado de administrador

### 🔧 Utilidades
- `POST /inicializar-datos` → Inicializar estructura de base de datos
- `GET /diagnostico-animales` → Diagnóstico del sistema de animales
- `GET /status` → Estado del servidor y conexión a BD

---

## Funcionalidades Técnicas Destacadas

### 🎯 Sistema Avanzado de Capturas
- **Registro con geolocalización** automática
- **Validación en tiempo real** de especies por coto
- **Historial enriquecido** con coordenadas y fechas
- **Manejo robusto** de capturas sin GPS disponible

### 🔐 Sistema de Autenticación Multirol
- **Validación segura** en base de datos Firebird  
- **Múltiples tipos de usuario** (socio, admin, superadmin)
- **Protección de endpoints** sensibles por rol
- **Manejo de sesiones** y permisos granulares

### 🗺️ Algoritmo de Geofencing Avanzado
- **Detección precisa** de polígonos mediante algoritmo punto-en-polígono
- **Optimizado** para polígonos complejos con múltiples vértices  
- **Notificaciones instantáneas** de cambios de estado
- **Cálculo eficiente** para múltiples usuarios simultáneos

### 📡 Comunicación en Tiempo Real
- **Actualizaciones periódicas** cada 10 segundos desde Android  
- **Sincronización bidireccional** entre app y panel web  
- **Manejo robusto** de conexiones intermitentes
- **Almacenamiento temporal** en memoria para máximo rendimiento

### 🗃️ Gestión de Mapas y Geodatos
- **Integración con OpenStreetMap** mediante **Leaflet.js**  
- **Dibujo interactivo** de polígonos para definir cotos  
- **Visualización en tiempo real** de ubicaciones y capturas
- **Parseo inteligente** de coordenadas desde múltiples formatos

---

## Desarrollo Técnico

### Arquitectura del Sistema
```
Clientes Android ←→ API REST ←→ Node.js Server ←→ Firebird DB
         ↑                               ↑
Panel Web Admin ↗              Monitoreo en Tiempo Real
```

### Características de Seguridad
- **Validación de entrada** en todos los endpoints  
- **Manejo seguro** de permisos de ubicación  
- **Protección contra inyección SQL**  
- **Validación de formatos** de coordenadas
- **Autenticación por roles** y permisos

### Optimizaciones Implementadas
- **Caché de ubicaciones** en memoria para rápido acceso  
- **Algoritmos eficientes** para detección en polígonos grandes  
- **Manejo de desconexiones** y reconexiones automáticas  
- **Logs detallados** para diagnóstico de problemas
- **Consultas optimizadas** a base de datos Firebird

---

## Solución de Problemas Comunes

### 🗄️ Error de Conexión a Base de Datos
- Verificar que **Firebird esté ejecutándose**  
- Confirmar **ruta correcta** de la base de datos  
- Validar **credenciales de SYSDBA**  
- Revisar **permisos de archivo** de la BD

### 📍 Problemas de Ubicación en Android
- Verificar **permisos de ubicación** concedidos  
- Confirmar que el **GPS esté activado**  
- Revisar configuración de **alta precisión**  
- Probar en **exterior** para mejor señal GPS

### 🗺️ El Mapa no se Carga
- Verificar **conexión a internet**  
- Confirmar que los archivos HTML estén en la carpeta **assets**  
- Revisar **consola de desarrollador** para errores  
- Verificar **permisos de almacenamiento**

### 🎯 Problemas con Capturas
- Verificar que el **coto esté seleccionado**  
- Confirmar **conexión al servidor**  
- Revisar **especies disponibles** para el coto
- Verificar **coordenadas GPS** en el registro

---

## Flujo de Trabajo de Capturas

1. **Selección de coto** → El socio elige el área de caza activa
2. **Verificación de ubicación** → Sistema confirma que está dentro del coto
3. **Registro de captura** → Selección de especie y cantidad
4. **Geolocalización automática** → Coordenadas GPS se registran automáticamente
5. **Confirmación en servidor** → Datos se almacenan en base de datos
6. **Historial disponible** → Captura aparece en el historial personal

---

## Contribución

Este proyecto fue desarrollado como trabajo de prácticas por estudiantes del **Grado Superior en Desarrollo de Aplicaciones Multiplataforma**.

### Desarrolladores
- **Pablo Nicolás Siles Arano**  
- **Enrique Pérez González**  

Derechos de autor y propiedad intelectual reservados para los desarrolladores.

---

## Licencia

Este proyecto se comparte con fines **educativos y de portfolio**.  
El código es propiedad de sus desarrolladores y se requiere **permiso explícito** para su uso comercial.

---

## Contacto

Para información sobre licencias o uso del código:

- **Email**: pablonsiles@gmail.com / epergon2008@g.educaand.es  
- **LinkedIn**: Perfil profesional  

---

## Próximas Características (Roadmap)

- [ ] **App iOS** nativa con Swift
- [ ] **Panel de estadísticas** avanzadas
- [ ] **Sistema de notificaciones** push
- [ ] **Exportación de reportes** en PDF/Excel
- [ ] **Integración con SIG** (Sistemas de Información Geográfica)
- [ ] **Modo offline** para zonas sin cobertura
- [ ] **Sistema de cupos** y límites de captura

---

*Venatus - Gestión Inteligente de Cotos de Caza* 🦌🎯