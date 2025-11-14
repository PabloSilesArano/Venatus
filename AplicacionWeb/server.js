const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Firebird = require("node-firebird");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const dbOptions = {
  host: "localhost",
  port: 3050,
  database: "C:/datos/venatus.fdb",
  user: "SYSDBA",
  password: "masterkey",
  lowercase_keys: false,
  role: null,
  pageSize: 4096,
  wireCrypt: 1
};

// Almacén temporal para ubicaciones de socios
const ubicacionesSocios = new Map();

// Función para parsear coordenadas
function parsearCoordenadas(perimetroTexto) {
    if (!perimetroTexto) {
        console.log("❌ Texto de perímetro vacío");
        return [];
    }
    
    const coordenadas = [];
    
    try {
        // FORMATO 1: "lat,lng;lat,lng;..."
        if (perimetroTexto.includes(';') && perimetroTexto.includes(',')) {
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
        } 
        // FORMATO 2: Buscar pares de coordenadas
        else {
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

// Función para ejecutar consultas
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

// ========== ENDPOINT DE LOGIN UNIFICADO ==========
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

        // Determinar tipo de usuario
        if (admin.TIPO === 'superadmin') {
            responseData.tipo = 'superadmin';
            console.log(`✅ Super admin logueado: ${admin.NOMBRE}`);
        } else {
            responseData.tipo = 'admin';
            
            // Obtener información del coto
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

// ========== ENDPOINTS PARA SUPER ADMIN ==========

// Listar administradores
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

// Listar áreas/cotos
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

// Obtener área específica
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

// Crear administrador
app.post("/admin/crear", async (req, res) => {
    const { usuario, clave, nombre, email, idCoto, tipo } = req.body;

    console.log(`👤 Creando admin: ${usuario} - Tipo: ${tipo}`);

    try {
        // SIN COUNT - Verificar existencia directamente
        const checkSql = "SELECT FIRST 1 ID FROM ADMIN_COTOS WHERE USUARIO = ?";
        const checkResult = await ejecutarConsulta(checkSql, [usuario]);
        
        if (checkResult.length > 0) {
            return res.status(400).json({ error: "El usuario administrador ya existe" });
        }

        // Insertar nuevo administrador
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

// Cambiar estado de administrador
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

// ========== ENDPOINTS PARA MONITOREO ==========

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

        // Filtrar socios que están dentro del coto
        const sociosEnCoto = Array.from(ubicacionesSocios.values()).filter(socio => {
            // Función simple para verificar si está dentro del polígono
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

// ========== ENDPOINT PARA LOGIN DE SOCIOS ==========
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

// ========== ENDPOINTS EXISTENTES ==========

app.post("/registrar-socio", async (req, res) => {
    let { nombre, usuario, contrasena, email, telefono } = req.body;

    usuario = usuario.substring(0, 20);
    nombre = nombre.substring(0, 50);
    contrasena = contrasena.substring(0, 20);
    email = email.substring(0, 100);
    telefono = telefono.substring(0, 20);

    if (!nombre || !usuario || !contrasena || !email || !telefono) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        // SIN COUNT - Verificar existencia directamente
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

// Endpoint de estado
app.get("/status", async (req, res) => {
    try {
        await ejecutarConsulta("SELECT 1 FROM RDB$DATABASE");
        res.json({ 
            status: "online",
            message: "Servidor y base de datos conectados correctamente",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Iniciar servidor
app.listen(3000, () => {
    console.log("🚀 Servidor ejecutándose en http://localhost:3000");
    console.log("✅ Sistema de login unificado activo");
});