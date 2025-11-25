const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Firebird = require("node-firebird");
const path = require("path");

const app = express();

// ========== CONFIGURACIÓN ==========
app.use(cors({
    origin: ['http://venatus.es', 'https://venatus.es', 'http://178.211.133.67', 'https://178.211.133.67'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la base de datos
const dbOptions = {
    host: "51.210.98.37",
    port: 3050,
    database: "C:\venatus\VENATUS.FDB",
    user: "SYSDBA",
    password: "masterkey",
    lowercase_keys: false,
    role: null,
    pageSize: 4096,
    wireCrypt: 1
};

// Almacén temporal para ubicaciones de socios
const ubicacionesSocios = new Map();

// ========== FUNCIONES UTILITARIAS ==========

/**
 * Parsea coordenadas desde texto a array de coordenadas
 */
function parsearCoordenadas(perimetroTexto) {
    if (!perimetroTexto) {
        console.log("❌ Texto de perímetro vacío");
        return [];
    }
    
    const coordenadas = [];
    
    try {
        if (perimetroTexto.includes(';') && perimetroTexto.includes(',')) {
            // FORMATO: "lat,lng;lat,lng;..."
            const puntos = perimetroTexto.split(';');
            puntos.forEach((punto) => {
                const [lat, lng] = punto.split(',');
                if (lat && lng) {
                    const latNum = parseFloat(lat.trim());
                    const lngNum = parseFloat(lng.trim());
                    if (!isNaN(latNum) && !isNaN(lngNum)) {
                        coordenadas.push([latNum, lngNum]);
                    }
                }
            });
        } else {
            // FORMATO: Buscar pares de coordenadas con regex
            const regex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/g;
            let match;
            while ((match = regex.exec(perimetroTexto)) !== null) {
                const lat = parseFloat(match[1]);
                const lng = parseFloat(match[2]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    coordenadas.push([lat, lng]);
                }
            }
        }
    } catch (error) {
        console.error("Error parseando coordenadas:", error);
    }
    
    console.log(`✅ ${coordenadas.length} coordenadas parseadas`);
    return coordenadas;
}

/**
 * Ejecuta consultas en la base de datos Firebird
 */
function ejecutarConsulta(sql, params = []) {
    return new Promise((resolve, reject) => {
        Firebird.attach(dbOptions, (err, db) => {
            if (err) {
                console.error('❌ Error conectando a Firebird:', err.message);
                reject(err);
                return;
            }

            db.query(sql, params, (err, result) => {
                db.detach();
                if (err) {
                    console.error('❌ Error en consulta:', err.message);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    });
}

// ========== RUTAS PÚBLICAS ==========

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/status", async (req, res) => {
    try {
        await ejecutarConsulta("SELECT 1 FROM RDB$DATABASE");
        res.json({ 
            status: "online",
            message: "Servidor y base de datos conectados correctamente",
            timestamp: new Date().toISOString(),
            domain: "venatus.es",
            database: "51.210.98.37"
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ========== AUTENTICACIÓN ==========

app.post("/admin/login-unificado", async (req, res) => {
    const { usuario, password } = req.body;
    console.log(`🔐 Login unificado solicitado - Usuario: ${usuario}`);

    if (!usuario || !password) {
        return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
    }

    try {
        const sqlAdmin = `
            SELECT a.ID, a.USUARIO, a.NOMBRE, a.EMAIL, a.ID_COTO, a.TIPO, a.ACTIVO, 
                   c.NOMBRE as COTO_NOMBRE, 
                   CAST(c.PERIMETRO AS VARCHAR(8191)) AS PERIMETRO
            FROM ADMIN_COTOS a 
            LEFT JOIN COTOS c ON a.ID_COTO = c.ID 
            WHERE a.USUARIO = ? AND a.CLAVE = ? AND a.ACTIVO = 1
        `;

        const result = await ejecutarConsulta(sqlAdmin, [usuario, password]);

        if (result.length === 0) {
            console.log("❌ Login fallido:", usuario);
            return res.status(401).json({ error: "Credenciales inválidas o usuario inactivo" });
        }

        const admin = result[0];
        console.log('✅ Admin encontrado:', admin);

        let responseData = {
            success: true,
            admin: {
                id: admin.ID,
                usuario: admin.USUARIO,
                nombre: admin.NOMBRE,
                email: admin.EMAIL
            },
            message: "Login exitoso"
        };

        if (admin.TIPO === 'superadmin') {
            responseData.tipo = 'superadmin';
            console.log(`✅ Super admin logueado: ${admin.NOMBRE}`);
        } else {
            responseData.tipo = 'admin';
            if (admin.ID_COTO) {
                const coords = parsearCoordenadas(admin.PERIMETRO);
                responseData.coto = {
                    id: admin.ID_COTO,
                    nombre: admin.COTO_NOMBRE,
                    coordenadas: coords
                };
                console.log(`✅ Admin de coto logueado: ${admin.NOMBRE} - Coto: ${admin.COTO_NOMBRE}`);
            } else {
                console.log("❌ Admin sin coto asignado:", admin.NOMBRE);
                return res.status(403).json({ error: "No tienes un coto asignado. Contacta al superadministrador." });
            }
        }

        res.json(responseData);
    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.post("/validar-login", async (req, res) => {
    const { usuario, contrasena } = req.body;
    console.log(`🔐 Login socio solicitado - Usuario: ${usuario}`);

    if (!usuario || !contrasena) {
        return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
    }

    try {
        const sqlSocio = `
            SELECT ID, NOMBRE, USUARIO, EMAIL, TELEFONO 
            FROM SOCIOS 
            WHERE USUARIO = ? AND CLAVE = ?
        `;

        const result = await ejecutarConsulta(sqlSocio, [usuario, contrasena]);

        if (result.length === 0) {
            console.log("❌ Login socio fallido:", usuario);
            return res.status(401).json({ valido: false, error: "Credenciales inválidas" });
        }

        const socio = result[0];
        console.log('✅ Socio encontrado:', socio.NOMBRE);

        res.json({
            valido: true,
            id: socio.ID,
            nombre: socio.NOMBRE,
            usuario: socio.USUARIO,
            email: socio.EMAIL,
            telefono: socio.TELEFONO
        });
    } catch (error) {
        console.error('❌ Error en login socio:', error);
        res.status(500).json({ valido: false, error: "Error interno del servidor" });
    }
});

// ========== GESTIÓN DE SOCIOS ==========

app.post("/registrar-socio", async (req, res) => {
    let { nombre, usuario, contrasena, email, telefono } = req.body;

    // Limitar longitud de campos
    usuario = usuario.substring(0, 20);
    nombre = nombre.substring(0, 50);
    contrasena = contrasena.substring(0, 20);
    email = email.substring(0, 100);
    telefono = telefono.substring(0, 20);

    if (!nombre || !usuario || !contrasena || !email || !telefono) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const checkSql = "SELECT FIRST 1 ID FROM SOCIOS WHERE USUARIO = ? OR EMAIL = ?";
        const checkResult = await ejecutarConsulta(checkSql, [usuario, email]);

        if (checkResult.length > 0) {
            return res.status(400).json({ error: "El usuario o email ya existen" });
        }

        const insertSql = `
            INSERT INTO SOCIOS (NOMBRE, TELEFONO, USUARIO, CLAVE, EMAIL, POSICION_X, POSICION_Y) 
            VALUES (?, ?, ?, ?, ?, NULL, NULL)
        `;

        await ejecutarConsulta(insertSql, [nombre, telefono, usuario, contrasena, email]);
        console.log("✅ Socio registrado correctamente:", usuario);
        res.json({ mensaje: "✅ Socio registrado correctamente" });
    } catch (error) {
        console.error('❌ Error registrando socio:', error);
        res.status(500).json({ error: "Error al registrar socio en la base de datos" });
    }
});

// ========== GESTIÓN DE COTOS ==========

app.get("/areas", async (req, res) => {
    try {
        const sql = "SELECT ID, NOMBRE, CAST(PERIMETRO AS VARCHAR(8191)) AS PERIMETRO FROM COTOS ORDER BY NOMBRE";
        const result = await ejecutarConsulta(sql);
        
        const areas = result.map(r => ({
            id: r.ID,
            nombre: r.NOMBRE,
            perimetro: r.PERIMETRO || ""
        }));

        console.log(`✅ ${areas.length} áreas cargadas correctamente`);
        res.json(areas);
    } catch (error) {
        console.error('❌ Error cargando áreas:', error);
        res.status(500).json({ error: "Error al cargar las áreas" });
    }
});

app.get("/areas/:id", async (req, res) => {
    const areaId = req.params.id;

    try {
        const sql = "SELECT ID, NOMBRE, CAST(PERIMETRO AS VARCHAR(8191)) AS PERIMETRO FROM COTOS WHERE ID = ?";
        const result = await ejecutarConsulta(sql, [areaId]);

        if (result.length === 0) {
            return res.status(404).json({ error: "Área no encontrada" });
        }

        const area = result[0];
        const coords = parsearCoordenadas(area.PERIMETRO);
        
        const areaConCoords = {
            id: area.ID,
            nombre: area.NOMBRE,
            perimetro: area.PERIMETRO,
            coords: coords
        };

        console.log(`✅ Área "${area.NOMBRE}" procesada - ${coords.length} coordenadas`);
        res.json(areaConCoords);
    } catch (error) {
        console.error('❌ Error cargando área:', error);
        res.status(500).json({ error: "Error al cargar el área" });
    }
});

app.post("/guardar", async (req, res) => {
    const { nombre, coordenadas } = req.body;

    if (!coordenadas || coordenadas.length === 0) {
        return res.status(400).json({ error: "No hay coordenadas para guardar" });
    }

    const latitudes = coordenadas.map(p => p.lat);
    const longitudes = coordenadas.map(p => p.lng);
    const centroX = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
    const centroY = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;

    const perimetroTexto = coordenadas
        .map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`)
        .join(';');

    try {
        const sql = "INSERT INTO COTOS (NOMBRE, CENTRO_X, CENTRO_Y, PERIMETRO) VALUES (?, ?, ?, ?)";
        await ejecutarConsulta(sql, [nombre || "Área sin nombre", centroX, centroY, perimetroTexto]);
        res.json({ mensaje: "✅ Área guardada correctamente en Firebird" });
    } catch (error) {
        console.error('❌ Error guardando área:', error);
        res.status(500).json({ error: "Error al guardar en la base de datos" });
    }
});

// ========== ADMINISTRACIÓN ==========

app.get("/admin/listar", async (req, res) => {
    try {
        const sql = `
            SELECT a.ID, a.USUARIO, a.NOMBRE, a.EMAIL, a.ID_COTO, a.TIPO, a.ACTIVO, 
                   c.NOMBRE as COTO_NOMBRE 
            FROM ADMIN_COTOS a 
            LEFT JOIN COTOS c ON a.ID_COTO = c.ID 
            ORDER BY a.TIPO DESC, a.NOMBRE
        `;

        const result = await ejecutarConsulta(sql);
        res.json(result);
    } catch (error) {
        console.error('❌ Error listando admins:', error);
        res.status(500).json({ error: "Error al listar administradores" });
    }
});

app.post("/admin/crear", async (req, res) => {
    const { usuario, clave, nombre, email, idCoto, tipo } = req.body;
    console.log(`👤 Creando admin: ${usuario} - Tipo: ${tipo}`);

    try {
        const checkSql = "SELECT FIRST 1 ID FROM ADMIN_COTOS WHERE USUARIO = ?";
        const checkResult = await ejecutarConsulta(checkSql, [usuario]);
        
        if (checkResult.length > 0) {
            return res.status(400).json({ error: "El usuario administrador ya existe" });
        }

        const insertSql = `
            INSERT INTO ADMIN_COTOS (USUARIO, CLAVE, NOMBRE, EMAIL, ID_COTO, TIPO, ACTIVO) 
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `;

        const idCotoValue = tipo === 'superadmin' ? null : idCoto;
        await ejecutarConsulta(insertSql, [usuario, clave, nombre, email, idCotoValue, tipo]);
        
        console.log("✅ Administrador creado correctamente:", usuario);
        res.json({ message: "✅ Administrador creado correctamente" });
    } catch (error) {
        console.error('❌ Error creando admin:', error);
        res.status(500).json({ error: "Error al crear administrador" });
    }
});

app.put("/admin/estado", async (req, res) => {
    const { id, activo } = req.body;
    console.log(`🔄 Cambiando estado admin ID: ${id} a ${activo ? 'ACTIVO' : 'INACTIVO'}`);

    try {
        const sql = "UPDATE ADMIN_COTOS SET ACTIVO = ? WHERE ID = ?";
        await ejecutarConsulta(sql, [activo, id]);
        console.log(`✅ Estado de admin ${id} actualizado a: ${activo}`);
        res.json({ message: "Estado actualizado correctamente" });
    } catch (error) {
        console.error('❌ Error actualizando admin:', error);
        res.status(500).json({ error: "Error al actualizar administrador" });
    }
});

// ========== GESTIÓN DE ANIMALES ==========

app.get("/animales", async (req, res) => {
    try {
        const sql = "SELECT ID, NOMBRE, DESCRIPCION FROM ANIMALES WHERE ACTIVO = 1 ORDER BY NOMBRE";
        const result = await ejecutarConsulta(sql);
        res.json(result);
    } catch (error) {
        console.error('❌ Error obteniendo todos los animales:', error);
        res.status(500).json({ error: "Error al obtener animales" });
    }
});

app.get("/cotos/:id/animales", async (req, res) => {
    const cotoId = req.params.id;
    console.log(`🔄 Solicitando animales para coto: ${cotoId}`);

    try {
        const checkCotoAnimales = `
            SELECT COUNT(*) as TOTAL 
            FROM COTO_ANIMALES 
            WHERE ID_COTO = ? AND ACTIVO = 1
        `;
        
        const countResult = await ejecutarConsulta(checkCotoAnimales, [cotoId]);
        console.log(`📊 Animales asignados al coto ${cotoId}: ${countResult[0].TOTAL}`);

        if (countResult[0].TOTAL === 0) {
            return res.json([]);
        }

        const sql = `
            SELECT a.ID, a.NOMBRE, a.DESCRIPCION 
            FROM ANIMALES a
            INNER JOIN COTO_ANIMALES ca ON a.ID = ca.ID_ANIMAL
            WHERE ca.ID_COTO = ? AND ca.ACTIVO = 1 AND a.ACTIVO = 1
            ORDER BY a.NOMBRE
        `;
        
        const result = await ejecutarConsulta(sql, [cotoId]);
        console.log(`✅ Animales encontrados para coto ${cotoId}: ${result.length}`);
        res.json(result);
    } catch (error) {
        console.error('❌ Error obteniendo animales:', error.message);
        
        try {
            console.log("🔄 Intentando fallback: todos los animales activos");
            const fallbackQuery = "SELECT ID, NOMBRE, DESCRIPCION FROM ANIMALES WHERE ACTIVO = 1 ORDER BY NOMBRE";
            const fallbackResult = await ejecutarConsulta(fallbackQuery);
            res.json(fallbackResult);
            console.log(`✅ Fallback exitoso: ${fallbackResult.length} animales`);
        } catch (fallbackError) {
            console.error('❌ Fallback también falló:', fallbackError.message);
            res.status(500).json({ 
                error: "Error al obtener animales",
                detalle: error.message,
                fallbackError: fallbackError.message
            });
        }
    }
});

app.post("/cotos/:id/asignar-animales", async (req, res) => {
    const cotoId = req.params.id;
    const { animales } = req.body;

    try {
        await ejecutarConsulta("DELETE FROM COTO_ANIMALES WHERE ID_COTO = ?", [cotoId]);

        for (const animalId of animales) {
            await ejecutarConsulta(
                "INSERT INTO COTO_ANIMALES (ID_COTO, ID_ANIMAL) VALUES (?, ?)",
                [cotoId, animalId]
            );
        }

        res.json({ success: true, message: "✅ Animales asignados al coto correctamente" });
    } catch (error) {
        console.error('❌ Error asignando animales:', error);
        res.status(500).json({ error: "Error asignando animales al coto: " + error.message });
    }
});

// ========== CAPTURAS ==========

app.post("/capturas", async (req, res) => {
    const { idSocio, idCoto, idAnimal, cantidad, latitud, longitud } = req.body;

    console.log(`🎯 Registrando captura - Socio: ${idSocio}, Coto: ${idCoto}, Animal: ${idAnimal}, Cantidad: ${cantidad}`);
    console.log(`📍 Coordenadas recibidas - Lat: ${latitud}, Lng: ${longitud}`);

    if (!idSocio || !idCoto || !idAnimal || !cantidad) {
        return res.status(400).json({ error: "ID Socio, Coto, Animal y Cantidad son obligatorios" });
    }

    if (cantidad <= 0) {
        return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
    }

    let latitudValida = null;
    let longitudValida = null;
    
    if (latitud && longitud && !isNaN(latitud) && !isNaN(longitud)) {
        latitudValida = parseFloat(latitud);
        longitudValida = parseFloat(longitud);
        
        if (latitudValida !== 0 && longitudValida !== 0) {
            console.log(`✅ Coordenadas válidas: ${latitudValida}, ${longitudValida}`);
        } else {
            console.log("⚠️ Coordenadas son cero, se guardarán como NULL");
            latitudValida = null;
            longitudValida = null;
        }
    } else {
        console.log("⚠️ Coordenadas no válidas o no proporcionadas");
    }

    try {
        const sql = `
            INSERT INTO CAPTURAS 
            (ID_SOCIO, ID_COTO, ID_ANIMAL, CANTIDAD, LATITUD, LONGITUD) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await ejecutarConsulta(sql, [idSocio, idCoto, idAnimal, cantidad, latitudValida, longitudValida]);
        console.log(`✅ Captura registrada correctamente con coordenadas: ${latitudValida}, ${longitudValida}`);
        
        res.json({
            success: true, 
            message: "✅ Captura registrada correctamente",
            datos: { 
                idSocio, 
                idCoto, 
                idAnimal, 
                cantidad,
                coordenadas: latitudValida && longitudValida ? 
                    `Lat: ${latitudValida}, Lng: ${longitudValida}` : 
                    "No registradas" 
            }
        });
    } catch (error) {
        console.error('❌ Error registrando captura:', error);
        res.status(500).json({ 
            error: "Error al registrar la captura",
            detalle: error.message 
        });
    }
});

app.get("/socios/:id/capturas", async (req, res) => {
    const socioId = req.params.id;
    console.log(`📋 Solicitando historial de capturas para socio: ${socioId}`);

    try {
        const sql = `
            SELECT FIRST 20
                c.ID,
                c.CANTIDAD,
                c.FECHA_TIMESTAMP,
                c.ID_ANIMAL,
                c.ID_COTO,
                c.LATITUD,
                c.LONGITUD,
                a.NOMBRE as ANIMAL_NOMBRE,
                co.NOMBRE as COTO_NOMBRE
            FROM CAPTURAS c
            LEFT JOIN ANIMALES a ON c.ID_ANIMAL = a.ID
            LEFT JOIN COTOS co ON c.ID_COTO = co.ID
            WHERE c.ID_SOCIO = ?
            ORDER BY c.FECHA_TIMESTAMP DESC
        `;
        
        const capturas = await ejecutarConsulta(sql, [socioId]);
        console.log(`✅ ${capturas.length} capturas encontradas para socio ${socioId}`);

        const capturasEnriquecidas = capturas.map((captura) => {
            const lat = captura.LATITUD;
            const lng = captura.LONGITUD;
            
            let coordenadasTexto = "Coordenadas no disponibles";
            let tieneCoordenadas = false;
            let latitudValor = null;
            let longitudValor = null;

            if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                latitudValor = parseFloat(lat);
                longitudValor = parseFloat(lng);
                coordenadasTexto = `${latitudValor.toFixed(6)}, ${longitudValor.toFixed(6)}`;
                tieneCoordenadas = true;
            }

            return {
                id: captura.ID,
                cantidad: captura.CANTIDAD,
                animal: captura.ANIMAL_NOMBRE || `Animal ${captura.ID_ANIMAL}`,
                coto: captura.COTO_NOMBRE || `Coto ${captura.ID_COTO}`,
                fecha: captura.FECHA_TIMESTAMP,
                fechaLegible: new Date(captura.FECHA_TIMESTAMP).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                latitud: latitudValor,
                longitud: longitudValor,
                coordenadas: coordenadasTexto,
                tieneCoordenadas: tieneCoordenadas
            };
        });

        const conCoordenadas = capturasEnriquecidas.filter(c => c.tieneCoordenadas).length;
        console.log(`📊 RESUMEN FINAL: ${conCoordenadas}/${capturas.length} capturas tienen coordenadas`);

        res.json(capturasEnriquecidas);
    } catch (error) {
        console.error('❌ Error obteniendo historial:', error);
        res.status(500).json({ 
            error: "Error al obtener historial de capturas",
            detalle: error.message
        });
    }
});

// ========== MONITOREO ==========

app.post("/socio/ubicacion", (req, res) => {
    const { idUsuario, lat, lng, nombre } = req.body;
    console.log(`📍 Ubicación recibida - Usuario: ${nombre} (${lat}, ${lng})`);
    
    ubicacionesSocios.set(idUsuario.toString(), {
        id: idUsuario,
        nombre: nombre,
        lat: lat,
        lng: lng,
        timestamp: new Date().toISOString()
    });
    
    res.json({ success: true, message: "Ubicación actualizada" });
});

app.get("/monitoreo/coto/:cotoId/socios", async (req, res) => {
    const cotoId = req.params.cotoId;
    
    try {
        const sql = "SELECT ID, NOMBRE, CAST(PERIMETRO AS VARCHAR(8191)) AS PERIMETRO FROM COTOS WHERE ID = ?";
        const result = await ejecutarConsulta(sql, [cotoId]);

        if (result.length === 0) {
            return res.status(404).json({ error: "Coto no encontrado" });
        }

        const area = result[0];
        const coordenadasCoto = parsearCoordenadas(area.PERIMETRO);
        
        if (coordenadasCoto.length === 0) {
            return res.status(400).json({ error: "Coto sin coordenadas válidas" });
        }

        const sociosEnCoto = Array.from(ubicacionesSocios.values()).filter(socio => {
            let inside = false;
            for (let i = 0, j = coordenadasCoto.length - 1; i < coordenadasCoto.length; j = i++) {
                const xi = coordenadasCoto[i][1], yi = coordenadasCoto[i][0];
                const xj = coordenadasCoto[j][1], yj = coordenadasCoto[j][0];
                
                const intersect = ((yi > socio.lat) !== (yj > socio.lat)) && 
                                 (socio.lng < (xj - xi) * (socio.lat - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        });

        console.log(`✅ ${sociosEnCoto.length} socios encontrados en el coto ${area.NOMBRE}`);
        res.json({
            cotoId: cotoId,
            cotoNombre: area.NOMBRE,
            totalSocios: sociosEnCoto.length,
            socios: sociosEnCoto,
            ultimaActualizacion: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error en monitoreo:', error);
        res.status(500).json({ error: "Error en el monitoreo" });
    }
});

// ========== INICIALIZACIÓN Y DIAGNÓSTICO ==========

app.post("/inicializar-datos", async (req, res) => {
    try {
        const generators = [
            "CREATE GENERATOR GEN_ANIMALES_ID",
            "CREATE GENERATOR GEN_COTO_ANIMALES_ID", 
            "CREATE GENERATOR GEN_CAPTURAS_ID"
        ];

        for (const genSql of generators) {
            try {
                await ejecutarConsulta(genSql);
                console.log(`✅ Generador creado: ${genSql}`);
            } catch (e) {
                console.log(`ℹ️ Generador ya existe: ${genSql}`);
            }
        }

        // Crear tablas
        const tablas = [
            {
                nombre: "ANIMALES",
                sql: `CREATE TABLE ANIMALES (
                    ID INTEGER NOT NULL PRIMARY KEY,
                    NOMBRE VARCHAR(50) NOT NULL,
                    DESCRIPCION VARCHAR(255),
                    ACTIVO INTEGER DEFAULT 1
                )`,
                trigger: `CREATE TRIGGER ANIMALES_BI FOR ANIMALES
                    ACTIVE BEFORE INSERT POSITION 0
                    AS
                    BEGIN
                      IF (NEW.ID IS NULL) THEN
                        NEW.ID = GEN_ID(GEN_ANIMALES_ID, 1);
                    END`
            },
            {
                nombre: "COTO_ANIMALES",
                sql: `CREATE TABLE COTO_ANIMALES (
                    ID INTEGER NOT NULL PRIMARY KEY,
                    ID_COTO INTEGER NOT NULL,
                    ID_ANIMAL INTEGER NOT NULL,
                    ACTIVO INTEGER DEFAULT 1,
                    FOREIGN KEY (ID_COTO) REFERENCES COTOS(ID),
                    FOREIGN KEY (ID_ANIMAL) REFERENCES ANIMALES(ID)
                )`,
                trigger: `CREATE TRIGGER COTO_ANIMALES_BI FOR COTO_ANIMALES
                    ACTIVE BEFORE INSERT POSITION 0
                    AS
                    BEGIN
                      IF (NEW.ID IS NULL) THEN
                        NEW.ID = GEN_ID(GEN_COTO_ANIMALES_ID, 1);
                    END`
            },
            {
                nombre: "CAPTURAS",
                sql: `CREATE TABLE CAPTURAS (
                    ID INTEGER NOT NULL PRIMARY KEY,
                    ID_SOCIO INTEGER NOT NULL,
                    ID_COTO INTEGER NOT NULL,
                    ID_ANIMAL INTEGER NOT NULL,
                    CANTIDAD INTEGER NOT NULL,
                    FECHA_TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (ID_SOCIO) REFERENCES SOCIOS(ID),
                    FOREIGN KEY (ID_COTO) REFERENCES COTOS(ID),
                    FOREIGN KEY (ID_ANIMAL) REFERENCES ANIMALES(ID)
                )`,
                trigger: `CREATE TRIGGER CAPTURAS_BI FOR CAPTURAS
                    ACTIVE BEFORE INSERT POSITION 0
                    AS
                    BEGIN
                      IF (NEW.ID IS NULL) THEN
                        NEW.ID = GEN_ID(GEN_CAPTURAS_ID, 1);
                    END`
            }
        ];

        for (const tabla of tablas) {
            try {
                await ejecutarConsulta(tabla.sql);
                console.log(`✅ Tabla ${tabla.nombre} creada`);
            } catch (e) {
                console.log(`ℹ️ Tabla ${tabla.nombre} ya existe`);
            }

            try {
                await ejecutarConsulta(tabla.trigger);
                console.log(`✅ Trigger ${tabla.nombre}_BI creado`);
            } catch (e) {
                console.log(`ℹ️ Trigger ${tabla.nombre}_BI ya existe`);
            }
        }

        // Insertar animales si no existen
        const checkAnimales = "SELECT COUNT(*) as TOTAL FROM ANIMALES";
        const result = await ejecutarConsulta(checkAnimales);
        
        if (result[0].TOTAL === 0) {
            const insertAnimales = [
                "INSERT INTO ANIMALES (NOMBRE, DESCRIPCION) VALUES ('Jabalí', 'Jabalí común')",
                "INSERT INTO ANIMALES (NOMBRE, DESCRIPCION) VALUES ('Ciervo', 'Ciervo rojo')",
                "INSERT INTO ANIMALES (NOMBRE, DESCRIPCION) VALUES ('Corzo', 'Corzo europeo')",
                "INSERT INTO ANIMALES (NOMBRE, DESCRIPCION) VALUES ('Gamo', 'Gamo común')",
                "INSERT INTO ANIMALES (NOMBRE, DESCRIPCION) VALUES ('Conejo', 'Conejo de monte')",
                "INSERT INTO ANIMALES (NOMBRE, DESCRIPCION) VALUES ('Perdiz', 'Perdiz roja')"
            ];

            for (const sql of insertAnimales) {
                try {
                    await ejecutarConsulta(sql);
                    console.log(`✅ Animal insertado: ${sql}`);
                } catch (e) {
                    console.log(`ℹ️ Error insertando animal: ${e.message}`);
                }
            }
            console.log("✅ Datos de animales insertados");
        }

        res.json({ 
            success: true, 
            message: "✅ Base de datos inicializada correctamente",
            tablasCreadas: true,
            animalesInsertados: result[0].TOTAL === 0
        });
    } catch (error) {
        console.error('❌ Error inicializando datos:', error);
        res.status(500).json({ error: "Error inicializando la base de datos: " + error.message });
    }
});

// ========== INICIALIZACIÓN DEL SERVIDOR ==========

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log("🚀 Servidor ejecutándose en:");
    console.log(`   http://venatus.es:${PORT}`);
    console.log(`   http://178.211.133.67:${PORT}`);
    console.log("✅ Sistema de administración Venatus - PRODUCCIÓN");
    console.log("📊 Base de datos remota: 51.210.98.37");
});