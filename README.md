# Venatus - Sistema de Monitoreo de Cotos

## Descripción del Proyecto

**Venatus** es una solución completa desarrollada como proyecto de prácticas para el **Grado Superior en Desarrollo de Aplicaciones Multiplataforma**.  
El sistema permite el **monitoreo en tiempo real** de ubicaciones dentro de cotos de caza mediante una **aplicación Android nativa** y un **panel web administrativo**.

---

### Aviso Importante sobre Propiedad Intelectual

Este proyecto fue **desarrollado íntegramente por estudiantes** como parte de sus prácticas formativas.  
El código fuente, diseño y arquitectura son **propiedad intelectual de los desarrolladores**.  
La empresa receptora tiene derechos de uso según el acuerdo de prácticas, pero la propiedad del código y las soluciones técnicas implementadas permanecen con los creadores originales.

---

## Características Principales

### Aplicación Android
- **Autenticación segura** de socios  
- **Monitoreo en tiempo real** de ubicación GPS  
- **Detección automática** de entrada/salida de cotos  
- **Interfaz intuitiva** con mapa interactivo  
- **Notificaciones visuales** de estado  
- **Envío periódico** de ubicación al servidor  

### Panel Web Administrativo
- **Gestión visual** de cotos mediante dibujo en mapa  
- **Registro y administración** de socios  
- **Monitoreo en tiempo real** de todos los socios activos  
- **Base de datos Firebird** integrada  
- **Interfaz responsive** y moderna  

---

## Tecnologías Utilizadas

### Backend
- **Node.js** con Express  
- **Firebird Database**  
- **RESTful API**  
- **Almacenamiento en memoria** para ubicaciones en tiempo real  

### Frontend Web
- **HTML5, CSS3, JavaScript**  
- **Leaflet.js** para mapas  
- **Leaflet Draw** para dibujo de polígonos  
- **Diseño responsive**  

### Mobile
- **Kotlin** nativo para Android  
- **Android Location Services**  
- **WebView** con Leaflet para mapas  
- **OkHttp** para comunicación con API  
- **GPS y permisos de ubicación**  

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
│   │   │   │   │   └── activity_main.xml
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
    └── sample_data.sql
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

### 2. Estructura de Tablas
```sql
CREATE TABLE COTOS (
    ID INTEGER NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(100),
    CENTRO_X DOUBLE PRECISION,
    CENTRO_Y DOUBLE PRECISION,
    PERIMETRO BLOB SUB_TYPE TEXT
);

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
```

### 3. Configuración de Conexión
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
1. Iniciar sesión con credenciales de socio  
2. Seleccionar coto activo del listado  
3. Permitir permisos de ubicación  
4. El sistema monitorea automáticamente la ubicación  
5. Recibir notificaciones al entrar/salir del coto  

### Para Administradores (Web)
1. Acceder al panel administrativo  
2. Dibujar cotos en el mapa interactivo  
3. Registrar nuevos socios en el sistema  
4. Monitorear ubicaciones en tiempo real de todos los socios  
5. Gestionar áreas y configuraciones  

---

## API Endpoints Principales

### Autenticación
- `POST /validar-login` → Validar credenciales de socio  
- `POST /registrar-socio` → Registrar nuevo socio  

### Gestión de Cotos
- `GET /areas` → Obtener listado de todos los cotos  
- `GET /areas/:id` → Obtener información específica de un coto  
- `POST /guardar` → Guardar nuevo coto en la base de datos  

### Monitoreo en Tiempo Real
- `POST /socio/ubicacion` → Envío de ubicación desde app Android  
- `GET /monitoreo/coto/:id/socios` → Obtener socios en un coto específico  
- `GET /monitoreo/todos-socios` → Obtener todas las ubicaciones (debug)  

---

## Funcionalidades Técnicas Destacadas

### Sistema de Autenticación
- Validación segura de credenciales en base de datos Firebird  
- Manejo de sesiones y tokens  
- Protección de endpoints sensibles  

### Algoritmo de Geofencing
- Detección precisa de polígonos mediante algoritmo punto-en-polígono  
- Optimizado para polígonos complejos con múltiples vértices  
- Notificaciones instantáneas de cambios de estado  

### Comunicación en Tiempo Real
- Actualizaciones periódicas cada 10 segundos desde Android  
- Sincronización bidireccional entre app y panel web  
- Manejo robusto de conexiones intermitentes  

### Gestión de Mapas
- Integración con **OpenStreetMap** mediante **Leaflet.js**  
- Dibujo interactivo de polígonos para definir cotos  
- Visualización en tiempo real de ubicaciones  

---

## Desarrollo Técnico

### Arquitectura del Sistema
```
Clientes Android ←→ API REST ←→ Node.js Server ←→ Firebird DB
         ↑
Panel Web Admin ↗
```

### Características de Seguridad
- Validación de entrada en todos los endpoints  
- Manejo seguro de permisos de ubicación  
- Protección contra inyección SQL  
- Validación de formatos de coordenadas  

### Optimizaciones Implementadas
- Caché de ubicaciones en memoria para rápido acceso  
- Algoritmos eficientes para detección en polígonos grandes  
- Manejo de desconexiones y reconexiones automáticas  
- Logs detallados para diagnóstico de problemas  

---

## Solución de Problemas Comunes

### Error de Conexión a Base de Datos
- Verificar que Firebird esté ejecutándose  
- Confirmar ruta correcta de la base de datos  
- Validar credenciales de SYSDBA  

### Problemas de Ubicación en Android
- Verificar permisos de ubicación concedidos  
- Confirmar que el GPS esté activado  
- Revisar configuración de alta precisión  

### El Mapa no se Carga
- Verificar conexión a internet  
- Confirmar que los archivos HTML estén en la carpeta **assets**  
- Revisar consola de desarrollador para errores  

---

## Contribución

Este proyecto fue desarrollado como trabajo de prácticas por estudiantes del **Grado Superior en Desarrollo de Aplicaciones Multiplataforma**.

### Desarrolladores
- [Pablo Nicolás Siles Arano]  
- [Enrique Pérez González]  

Derechos de autor y propiedad intelectual reservados para los desarrolladores.

---

## Licencia

Este proyecto se comparte con fines **educativos y de portfolio**.  
El código es propiedad de sus desarrolladores y se requiere **permiso explícito** para su uso comercial.

---

## Contacto

Para información sobre licencias o uso del código:

- [pablonsiles@gmail.com / epergon2008@g.educaand.es]  
- [LinkedIn/Perfil profesional]  
