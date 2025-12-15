# Venatus - Sistema Integral de Gestión de Cotos de Caza

## Descripción del Proyecto

**Venatus** es una solución completa desarrollada para la **gestión integral** de cotos de caza, incluyendo monitoreo en tiempo real, registro de capturas, gestión de perros de caza y administración de especies mediante una **aplicación Android nativa** y un **panel web administrativo avanzado**.

---

## ✨ Novedades del Proyecto (Actualización)

### 🐕 **Sistema Completo de Gestión de Perros de Caza**
- **Registro y gestión de perros** asignados a socios
- **Monitoreo en tiempo real** de ubicación de perros
- **Paneles dedicados** en SuperAdmin, Admin de Coto y App Android
- **Marcadores diferenciados** en mapas para visualización de perros
- **Estadísticas combinadas** (socios + perros) en tiempo real

### 🔄 **Modificación Avanzada de Cotos**
- **Edición visual en tiempo real** de polígonos de caza
- **Herramientas completas** de modificación: mover puntos, añadir vértices, eliminar secciones
- **Modo de edición dedicado** con indicadores visuales
- **Guardado diferencial** de cambios con confirmación

### 👥 **Gestión Completa de Administradores**
- **Sistema multirol** (Super Admin / Admin de Coto)
- **CRUD completo** de administradores
- **Activación/desactivación** de cuentas
- **Asignación granular** de cotos a administradores
- **Edición en línea** con formulario dinámico

### 📄 **Registro de Socios Ampliado**
- **Campo DNI** para identificación de socios (varchar 20)
- **Validación de unicidad** de documentos
- **Manejo de diferentes formatos** de identificación
- **Integración completa** con sistema existente

---

## Características Principales

### 🎯 Sistema de Capturas y Especies
- **Catálogo completo** de animales por coto
- **Registro en tiempo real** de capturas con coordenadas GPS
- **Historial detallado** con ubicación y fechas
- **Gestión de inventario** de especies por área de caza
- **Estadísticas y reportes** de actividad cinegética

### 🐕 Sistema de Perros de Caza
- **Registro completo** de perros con identificador único
- **Asignación a socios** propietarios
- **Monitoreo GPS** en tiempo real de perros activos
- **Visualización en mapas** con iconos personalizados
- **Gestión multi-plataforma** (Web SuperAdmin, Web Admin Coto, Android)

### 📱 Aplicación Android
- **Autenticación segura** de socios y administradores
- **Monitoreo en tiempo real** de ubicación GPS
- **Detección automática** de entrada/salida de cotos
- **Registro inmediato** de animales cazados
- **Gestión completa** de perros propios
- **Interfaz intuitiva** con mapa interactivo
- **Notificaciones visuales** de estado
- **Envío periódico** de ubicación al servidor
- **Historial personal** de capturas

### 🖥️ Panel Web Administrativo
#### Super Administrador
- **Gestión visual** de cotos mediante dibujo en mapa
- **Registro y administración** de socios y administradores
- **Monitoreo en tiempo real** de todos los socios activos
- **Gestión completa de perros** (CRUD, asignación, monitoreo)
- **Modificación avanzada** de polígonos de cotos
- **Base de datos Firebird** integrada

#### Administrador de Coto
- **Monitoreo combinado** de socios y perros en su coto
- **Visualización diferenciada** en mapa (socios 👤, perros 🐕)
- **Estadísticas actualizadas** incluyendo conteo de perros
- **Panel de control específico** para su área asignada

---

## 🏗️ Arquitectura Técnica Mejorada

### Backend (Node.js + Express)
- **API RESTful** con arquitectura modular
- **Endpoints específicos** para gestión de perros
- **Middleware** de autenticación por roles
- **Validación de datos** en todas las entradas
- **Manejo de errores** estructurado
- **Logs detallados** para auditoría
- **CORS configurado** para múltiples orígenes

### Base de Datos (Firebird) - Tablas Nuevas
```sql
-- Tabla de perros de caza
CREATE TABLE PERROS (
    ID INTEGER NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(30) NOT NULL,
    IDENTIFICADOR VARCHAR(50) NOT NULL UNIQUE,
    POS_X DOUBLE PRECISION,
    POS_Y DOUBLE PRECISION,
    ACTIVO INTEGER DEFAULT 1
);

-- Relación socios-perros
CREATE TABLE SOCIO_PERROS (
    ID INTEGER NOT NULL PRIMARY KEY,
    ID_SOCIO INTEGER NOT NULL,
    ID_PERRO INTEGER NOT NULL,
    FOREIGN KEY (ID_SOCIO) REFERENCES SOCIOS(ID),
    FOREIGN KEY (ID_PERRO) REFERENCES PERROS(ID)
);
```

### Frontend Web - Nuevas Funcionalidades
- **Panel de gestión de perros** en SuperAdmin
- **Sistema de monitoreo** en tiempo real de perros
- **Select dinámico** de socios para asignación de perros
- **Iconos personalizados** para marcadores de perros
- **Estadísticas actualizadas** incluyendo conteo de perros

### Mobile (Android Kotlin) - Nuevas Funcionalidades
- **Menú específico** para gestión de perros
- **Diálogos de registro/edición** de perros
- **Visualización en mapa** con marcadores especiales
- **Monitoreo automático** de ubicación de perros
- **Actualización automática** de lista de perros

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js 18+** con Express 4.x  
- **Firebird Database 3.0+**  
- **Body-parser** para manejo de JSON
- **CORS** para comunicación segura entre dominios

### Frontend Web
- **HTML5** semántico  
- **CSS3** con variables y animaciones  
- **JavaScript ES6+** con módulos
- **Leaflet 1.9.4** + **Leaflet Draw 1.0.4**  
- **Font Awesome** para iconos

### Mobile
- **Kotlin 1.8+**  
- **Android SDK 33+**  
- **Android Location Services**  
- **OkHttp 4.x** para networking  
- **WebView** con JavaScript habilitado
- **Material Components** para UI

---

## 📁 Estructura del Proyecto Actualizada

```
Venatus/
├── 📱 android-app/
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/example/venatus/
│   │   │   │   ├── LoginActivity.kt
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── LocationService.kt
│   │   │   │   └── utils/
│   │   │   │       ├── NetworkHelper.kt
│   │   │   │       ├── PermissionManager.kt
│   │   │   │       └── DogManager.kt         
│   │   │   ├── res/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── activity_login.xml
│   │   │   │   │   ├── activity_main.xml
│   │   │   │   │   ├── fragment_map.xml
│   │   │   │   │   ├── dialog_cantidad.xml
│   │   │   │   │   ├── dialog_nuevo_perro.xml   
│   │   │   │   │   └── dialog_editar_perro.xml  
│   │   │   │   ├── values/
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   ├── colors.xml
│   │   │   │   │   └── themes.xml
│   │   │   │   └── menu/
│   │   │   └── assets/
│   │   │       └── mapa_limpio.html
│   │   └── build.gradle.kts
│   └── gradle/
│       └── wrapper/
│           └── gradle-wrapper.properties
├── 🌐 web-admin/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── assets/
│       ├── leaflet/
│       └── icons/
├── 🖥️ server/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── routes/
│   │   ├── auth.js
│   │   ├── cotos.js
│   │   ├── socios.js
│   │   ├── admin.js
│   │   └── perros.js     
│   └── utils/
│       ├── database.js
│       ├── validators.js
│       └── geofencing.js   
├── 🗄️ database/
│   ├── schema_venatus.sql
│   ├── sample_data.sql
│   ├── triggers.sql
│   ├── views.sql
│   └── perros_schema.sql     
├── 📚 documentation/
│   ├── API_Documentation.md
│   ├── Database_Schema.md
│   ├── Installation_Guide.md
│   ├── User_Manual_Socio.md
│   ├── User_Manual_Admin.md
│   ├── Dog_Management_Guide.md 
│   └── Technical_Specifications.md
└── 🔧 scripts/
    ├── backup_database.sh
    ├── setup_firebird.sql
    └── deploy_server.sh
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js 18+** LTS
- **Firebird Database 3.0+** con ODBC
- **Android Studio 2022+** (Flamingo o superior)
- **Java JDK 17+**
- **Git** para control de versiones

---

### Servidor Backend
```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/venatus.git
cd venatus/server

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Inicializar base de datos (incluye tablas de perros)
npm run init-db

# 5. Iniciar servidor
npm start
# o para desarrollo con recarga automática
npm run dev
```

El servidor se ejecutará en **http://localhost:3000**

---

### Panel Web Administrativo
```bash
cd venatus/web-admin

# Usar cualquier servidor HTTP estático
# Opción 1: Python
python -m http.server 8080

# Opción 2: Node.js (http-server)
npx http-server -p 8080

# Opción 3: Live Server de VS Code
```

Acceder a **http://venatus.es:3000**

---

### Aplicación Android
```bash
# 1. Abrir proyecto en Android Studio
File → Open → Seleccionar venatus/android-app

# 2. Configurar URL del servidor
# Editar: app/src/main/res/values/strings.xml
<string name="server_url">http://51.210.98.37:3000</string>

# 3. Sincronizar Gradle
File → Sync Project with Gradle Files

# 4. Ejecutar en emulador o dispositivo
Run → Run 'app'
```

**Nota**: Para desarrollo local, usar IP local en lugar de localhost.

---

## 🗃️ Configuración de Base de Datos Actualizada

### 1. Estructura de Tablas Actualizada
```sql
-- Tabla de cotos/áreas de caza (actualizada)
CREATE TABLE COTOS (
    ID INTEGER NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(100) NOT NULL,
    CENTRO_X DOUBLE PRECISION,
    CENTRO_Y DOUBLE PRECISION,
    PERIMETRO BLOB SUB_TYPE TEXT,
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FECHA_MODIFICACION TIMESTAMP
);

-- Tabla de socios/cazadores (con DNI)
CREATE TABLE SOCIOS (
    ID INTEGER NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(50) NOT NULL,
    DNI VARCHAR(20) UNIQUE,
    TELEFONO VARCHAR(20),
    USUARIO VARCHAR(20) UNIQUE NOT NULL,
    CLAVE VARCHAR(100) NOT NULL,
    EMAIL VARCHAR(100) UNIQUE,
    POSICION_X DOUBLE PRECISION,
    POSICION_Y DOUBLE PRECISION,
    ACTIVO INTEGER DEFAULT 1,
    FECHA_REGISTRO TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de perros de caza
CREATE TABLE PERROS (
    ID INTEGER NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(30) NOT NULL,
    IDENTIFICADOR VARCHAR(50) NOT NULL UNIQUE,
    POS_X DOUBLE PRECISION,
    POS_Y DOUBLE PRECISION,
    ACTIVO INTEGER DEFAULT 1,
    FECHA_REGISTRO TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relación socios-perros
CREATE TABLE SOCIO_PERROS (
    ID INTEGER NOT NULL PRIMARY KEY,
    ID_SOCIO INTEGER NOT NULL,
    ID_PERRO INTEGER NOT NULL,
    FECHA_ASIGNACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_SOCIO) REFERENCES SOCIOS(ID) ON DELETE CASCADE,
    FOREIGN KEY (ID_PERRO) REFERENCES PERROS(ID) ON DELETE CASCADE,
    UNIQUE (ID_PERRO) -- Un perro solo puede tener un dueño
);

-- Tabla de especies animales
CREATE TABLE ANIMALES (
    ID INTEGER NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(50) NOT NULL,
    DESCRIPCION VARCHAR(255),
    ACTIVO INTEGER DEFAULT 1,
    ICONO VARCHAR(50)
);

-- Relación de animales por coto
CREATE TABLE COTO_ANIMALES (
    ID INTEGER NOT NULL PRIMARY KEY,
    ID_COTO INTEGER NOT NULL,
    ID_ANIMAL INTEGER NOT NULL,
    ACTIVO INTEGER DEFAULT 1,
    CANTIDAD_MAXIMA INTEGER,
    TEMPORADA VARCHAR(50),
    FOREIGN KEY (ID_COTO) REFERENCES COTOS(ID) ON DELETE CASCADE,
    FOREIGN KEY (ID_ANIMAL) REFERENCES ANIMALES(ID) ON DELETE CASCADE
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
    VALIDADA INTEGER DEFAULT 0,
    OBSERVACIONES VARCHAR(500),
    FOREIGN KEY (ID_SOCIO) REFERENCES SOCIOS(ID) ON DELETE CASCADE,
    FOREIGN KEY (ID_COTO) REFERENCES COTOS(ID) ON DELETE CASCADE,
    FOREIGN KEY (ID_ANIMAL) REFERENCES ANIMALES(ID) ON DELETE CASCADE
);

-- Administradores del sistema (mejorada)
CREATE TABLE ADMIN_COTOS (
    ID INTEGER NOT NULL PRIMARY KEY,
    USUARIO VARCHAR(50) UNIQUE NOT NULL,
    CLAVE VARCHAR(100) NOT NULL,
    NOMBRE VARCHAR(100) NOT NULL,
    EMAIL VARCHAR(100) UNIQUE,
    ID_COTO INTEGER,
    TIPO VARCHAR(20) CHECK (TIPO IN ('superadmin', 'admin')) NOT NULL,
    ACTIVO INTEGER DEFAULT 1,
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ULTIMO_ACCESO TIMESTAMP,
    FOREIGN KEY (ID_COTO) REFERENCES COTOS(ID) ON DELETE SET NULL
);
```

### 2. Script de Inicialización
```bash
# Ejecutar desde línea de comandos de Firebird
isql -user SYSDBA -password masterkey
SQL> INPUT 'database/schema_venatus.sql';
SQL> INPUT 'database/perros_schema.sql';
SQL> COMMIT;
SQL> EXIT;
```

### 3. Datos de Ejemplo
```sql
-- Insertar especies por defecto
INSERT INTO ANIMALES (NOMBRE, DESCRIPCION, ICONO) VALUES
('Jabalí', 'Sus scrofa - Jabalí común', '🐗'),
('Ciervo', 'Cervus elaphus - Ciervo rojo', '🦌'),
('Corzo', 'Capreolus capreolus - Corzo europeo', '🦌'),
('Gamo', 'Dama dama - Gamo común', '🦌'),
('Conejo', 'Oryctolagus cuniculus - Conejo de monte', '🐇'),
('Perdiz', 'Alectoris rufa - Perdiz roja', '🐦'),
('Zorro', 'Vulpes vulpes - Zorro rojo', '🦊'),
('Liebre', 'Lepus europaeus - Liebre europea', '🐇');

-- Crear usuario superadmin por defecto
INSERT INTO ADMIN_COTOS (USUARIO, CLAVE, NOMBRE, EMAIL, TIPO) VALUES
('superadmin', 'admin123', 'Administrador Principal', 'admin@venatus.com', 'superadmin');

-- Datos de ejemplo para perros
INSERT INTO PERROS (NOMBRE, IDENTIFICADOR, ACTIVO) VALUES
('Rex', 'CHIP-001', 1),
('Luna', 'CHIP-002', 1),
('Thor', 'CHIP-003', 1);
```

---

## 🎯 Uso del Sistema

### 👤 Para Socios (Aplicación Android)

#### 1. Gestión de Perros Propios
- **Ver mis perros**: Listado de todos los perros asignados
- **Registrar nuevo perro**: Con nombre e identificador único
- **Actualizar ubicación**: Asignar ubicación GPS actual al perro
- **Mostrar en mapa**: Visualizar ubicación de perros en el mapa
- **Monitoreo automático**: Actualización periódica de ubicaciones

#### 2. Flujo de Registro de Perro
```
1. Seleccionar "🐕 Mis Perros" en el menú
2. Elegir "➕ Registrar nuevo perro"
3. Completar nombre e identificador
4. La ubicación actual se asignará automáticamente
5. Confirmar registro
```

#### 3. Monitoreo de Ubicación
- **Activación automática** de GPS para socios y perros
- **Actualizaciones periódicas** cada 10 segundos
- **Indicadores visuales** diferenciados (👤 socio, 🐕 perro)
- **Notificaciones** de entrada/salida

#### 4. Registro de Capturas
```
Flujo:
1. Botón "Registrar Captura"
2. Selección de especie del listado
3. Especificación de cantidad
4. Confirmación con geolocalización automática
5. Envío al servidor y confirmación
```

#### 5. Historial Personal
- **Lista cronológica** de todas las capturas
- **Filtros** por fecha y especie
- **Visualización de coordenadas** en mapa
- **Exportación** de datos (en desarrollo)

### 👑 Para Administradores (Panel Web)

#### Super Administrador
```
Funciones disponibles:
• Creación y modificación avanzada de cotos
• Gestión completa de socios (con DNI)
• Administración completa de perros de caza
• Gestión de otros administradores (CRUD completo)
• Monitoreo global de todos los cotos, socios y perros
• Modificación visual de polígonos de caza
• Reportes y estadísticas combinadas
```

#### Administrador de Coto
```
Funciones disponibles:
• Monitoreo combinado de socios y perros en su coto
• Visualización diferenciada en mapa
• Estadísticas actualizadas (socios + perros)
• Validación de capturas
• Gestión de especies específicas de su coto
```

#### Gestión de Perros (SuperAdmin)
```
Proceso completo:
1. Acceder a "🐕 Gestionar Perros" en el menú
2. Registrar nuevo perro con formulario
3. Asignar a socio propietario (opcional)
4. Configurar ubicación inicial (opcional)
5. Activar monitoreo en tiempo real
6. Visualizar todos los perros en el mapa
```

#### Modificación de Cotos
```
Proceso avanzado:
1. Seleccionar "✏️ Modificar Coto" en el menú
2. Elegir coto existente de la lista
3. Cargar polígono en el mapa
4. Activar modo edición dedicado
5. Modificar puntos (arrastrar, añadir, eliminar)
6. Finalizar edición y guardar cambios
```

---

## 🔧 API Endpoints Principales Actualizados

### 🐕 **Gestión de Perros**
- `GET /perros` → Listar todos los perros
- `GET /perros/:id` → Obtener perro específico
- `POST /perros` → Crear nuevo perro
- `PUT /perros/:id` → Actualizar perro
- `PUT /perros/:id/estado` → Cambiar estado (activo/inactivo)
- `GET /socios/:id/perros` → Perros de un socio específico
- `GET /perros/:id/propietario` → Obtener propietario de un perro
- `GET /perros/ubicaciones` → Ubicaciones en tiempo real de perros

### 🗺️ Gestión de Cotos (Mejorada)
- `GET /areas` → Listado completo de cotos  
- `GET /areas/:id` → Información específica de un coto  
- `POST /guardar` → Crear nuevo coto
- `PUT /modificar-coto` → **Editar coto existente**

### 👥 Gestión de Socios (Ampliado)
- `GET /socios` → Listar todos los socios (incluye DNI)
- `POST /registrar-socio` → Registrar socio con DNI
- `PUT /socios/:id` → Actualizar datos de socio
- `DELETE /socios/:id` → Desactivar socio

### 📍 Monitoreo en Tiempo Real (Ampliado)
- `GET /monitoreo/coto/:id/socios-con-perros` → Socios + perros en coto
- `POST /socio/ubicacion` → Envío de ubicación desde app  
- `GET /monitoreo/global` → Visión global (superadmin)

### ⚙️ Administración del Sistema (Completo)
- `GET /admin/listar` → Listar administradores
- `POST /admin/crear` → Crear nuevo administrador
- `PUT /admin/estado` → Cambiar estado de admin
- `PUT /admin/actualizar` → Editar administrador (formulario completo)
- `DELETE /admin/:id` → Eliminar administrador

---

## 🛡️ Funcionalidades de Seguridad Mejoradas

### Autenticación y Autorización
- **Hash de contraseñas** con bcrypt
- **Tokens de sesión** con expiración
- **Validación de roles** por endpoint
- **Log de accesos** para auditoría
- **Bloqueo tras intentos fallidos**

### Protección de Datos
- **Validación de entrada** en todos los endpoints
- **Sanitización** de datos antes de almacenar
- **Encriptación** de datos sensibles
- **Backups automáticos** programados
- **Política de retención** de logs

### Seguridad en Comunicaciones
- **HTTPS recomendado** para producción
- **CORS configurado** específicamente
- **Rate limiting** para evitar abusos
- **Timeout** en conexiones largas
- **Validación de certificados** SSL

---

## 📊 Sistema de Monitoreo Avanzado

### Algoritmo de Geofencing para Socios y Perros
```javascript
// Algoritmo punto-en-polígono optimizado
function verificarUbicacionEnCoto(lat, lng, poligono, tipo = 'socio') {
    let inside = false;
    const n = poligono.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = poligono[i].lng, yi = poligono[i].lat;
        const xj = poligono[j].lng, yj = poligono[j].lat;
        
        const intersect = ((yi > lat) !== (yj > lat)) && 
                         (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    // Log específico según tipo (socio o perro)
    console.log(`📍 ${tipo.toUpperCase()} en coto: ${inside}`);
    return inside;
}
```

### Optimizaciones Implementadas
- **Caché de polígonos** en memoria para consultas rápidas
- **Procesamiento por lotes** para múltiples usuarios y perros
- **Detección por cuadros delimitadores** (bounding boxes) previa
- **Algoritmos diferenciados** para socios y perros

### Notificaciones en Tiempo Real
- **Cambios de estado** (entrada/salida de coto)
- **Alerta de captura** para administradores
- **Monitoreo de perros** con actualizaciones periódicas
- **Registro histórico** de movimientos de socios y perros

---

## 🎨 Interfaz de Usuario Mejorada

### Panel Web Administrativo - SuperAdmin
- **Panel de perros dedicado** con CRUD completo
- **Select dinámico** de socios para asignación
- **Mapa interactivo** con marcadores diferenciados
- **Modo edición de cotos** con herramientas visuales
- **Estadísticas combinadas** en tiempo real

### Panel Web Administrativo - Admin de Coto
- **Visualización unificada** de socios y perros
- **Iconos diferenciados** (👤 socio, 🐕 perro)
- **Estadísticas específicas** de su coto
- **Panel de control simplificado** y eficiente

### Aplicación Android
- **Menú específico para perros** con todas las funciones
- **Diálogos de gestión** (registrar, editar, ubicación)
- **Mapa interactivo** con marcadores personalizados
- **Monitoreo automático** de ubicaciones
- **Material Design 3** con componentes modernos

---

## 🔄 Flujos de Trabajo Principales Actualizados

### 1. Registro y Monitoreo de Perro
```
Socio Android → Menú "🐕 Mis Perros" → "➕ Registrar nuevo perro" → 
Completar datos → Ubicación automática → Confirmar → 
Servidor registra perro → Asigna a socio → 
Monitoreo automático cada 15 segundos → 
Actualización en paneles web en tiempo real
```

### 2. Monitoreo Combinado (Admin de Coto)
```
Admin accede panel → Inicia monitoreo → 
Servidor obtiene: socios en coto + sus perros → 
Procesa ubicaciones → Actualiza mapa con iconos diferenciados → 
Muestra estadísticas combinadas → 
Notifica cambios de estado
```

### 3. Modificación de Coto (SuperAdmin)
```
SuperAdmin → "✏️ Modificar Coto" → Selecciona coto → 
Carga polígono → Activa modo edición → Modifica puntos → 
Finaliza edición → Confirma cambios → 
Servidor actualiza perímetro → Notifica a socios afectados
```

### 4. Gestión Completa de Administradores
```
SuperAdmin → "👑 Gestionar Administradores" → 
Lista existentes → "➕ Crear Nuevo" → 
Completa formulario (incluye tipo y coto) → 
Guarda → Edición en línea disponible → 
Activación/desactivación granular
```

---

## 🚨 Solución de Problemas

### Problemas Comunes y Soluciones

#### 1. Perros no aparecen en el mapa
```bash
# Verificar que el perro tenga ubicación registrada
SELECT * FROM PERROS WHERE POS_X IS NOT NULL AND POS_Y IS NOT NULL;

# Verificar asignación a socio
SELECT * FROM SOCIO_PERROS WHERE ID_PERRO = [ID_PERRO];

# Verificar que el monitoreo esté activo
# En SuperAdmin: Panel de monitoreo → Estado activo
```

#### 2. Error en modificación de coto
```
1. Verificar que el polígono tenga al menos 3 puntos
2. Confirmar que se haya finalizado la edición antes de guardar
3. Revisar consola del navegador para errores JavaScript
4. Verificar permisos de SuperAdmin
```

#### 3. Problemas con asignación de perros a socios
```sql
-- Verificar relaciones existentes
SELECT s.NOMBRE as Socio, p.NOMBRE as Perro
FROM SOCIOS s
INNER JOIN SOCIO_PERROS sp ON s.ID = sp.ID_SOCIO
INNER JOIN PERROS p ON sp.ID_PERRO = p.ID;

-- Limpiar asignaciones si es necesario
DELETE FROM SOCIO_PERROS WHERE ID_PERRO = [ID_PERRO];
```

#### 4. El monitoreo de perros no se actualiza
```
App Android:
1. Verificar permisos de ubicación
2. Confirmar que el monitoreo automático esté iniciado
3. Revisar conexión a internet

Panel Web:
1. Verificar que el intervalo de actualización esté activo
2. Revisar consola para errores de JavaScript
3. Confirmar que el endpoint /perros/ubicaciones funcione
```

---

## 🧪 Testing y Calidad

### Suite de Pruebas Implementada
- **Pruebas unitarias** para algoritmos de geofencing
- **Pruebas de integración** para endpoints de perros
- **Pruebas de UI** para flujos de gestión de perros
- **Pruebas de rendimiento** para monitoreo simultáneo

### Casos de Prueba Específicos para Perros
1. **Registro de perro** con y sin ubicación
2. **Asignación a socio** y cambio de propietario
3. **Monitoreo en tiempo real** con múltiples perros
4. **Visualización en mapa** con iconos diferenciados
5. **Integración con sistema de socios** existente

---

## 🌟 Características Únicas del Proyecto

### Innovaciones Técnicas
1. **Sistema híbrido de monitoreo** que combina socios + perros en tiempo real
2. **Modificación visual de polígonos** con herramientas profesionales
3. **Gestión multi-rol completa** con permisos granulares
4. **Integración DNI** para identificación única de socios
5. **Arquitectura tri-plataforma** (Web SuperAdmin, Web Admin, Android) sincronizada

### Valor Educativo
- **Ejemplo real** de sistema empresarial completo
- **Integración de 8 tecnologías diferentes** en un solo proyecto
- **Documentación exhaustiva** con ejemplos prácticos
- **Código comentado** siguiendo estándares industriales
- **Arquitectura escalable** preparada para producción

### Aplicaciones Prácticas Extendidas
- **Gestión de equipos de caza** con socios y perros
- **Monitoreo de fauna** en reservas naturales
- **Control de accesos** con geolocalización
- **Seguimiento logístico** de equipos y animales
- **Sistema de emergencia** para localización en campo

---