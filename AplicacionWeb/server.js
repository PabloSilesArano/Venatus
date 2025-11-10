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

// Función mejorada para parsear coordenadas del texto del perímetro
function parsearCoordenadas(perimetroTexto) {
    if (!perimetroTexto) {
        console.log("❌ Texto de perímetro vacío");
        return [];
    }
    
    console.log("📝 Parseando perímetro:", perimetroTexto.substring(0, 100) + "...");
    
    const coordenadas = [];
    
    // FORMATO 1: "lat,lng;lat,lng;..." (nuevo formato)
    if (perimetroTexto.includes(';') && perimetroTexto.includes(',')) {
        console.log("🔍 Detectado formato: lat,lng;lat,lng");
        const puntos = perimetroTexto.split(';');
        puntos.forEach((punto, index) => {
            const [lat, lng] = punto.split(',');
            if (lat && lng) {
                const latNum = parseFloat(lat.trim());
                const lngNum = parseFloat(lng.trim());
                if (!isNaN(latNum) && !isNaN(lngNum)) {
                    coordenadas.push([latNum, lngNum]);
                    console.log(`   Punto ${index + 1}: ${latNum}, ${lngNum}`);
                }
            }
        });
    } 
    // FORMATO 2: "Punto 1:lat, lngPunto 2:lat, lng..." (formato actual de la BD)
    else if (perimetroTexto.includes('Punto')) {
        console.log("🔍 Detectado formato: Punto X:lat, lng");
        const regex = /Punto\s*\d+:(-?\d+\.\d+),\s*(-?\d+\.\d+)/g;
        let match;
        let puntoCount = 0;
        
        while ((match = regex.exec(perimetroTexto)) !== null) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            if (!isNaN(lat) && !isNaN(lng)) {
                coordenadas.push([lat, lng]);
                puntoCount++;
                console.log(`   Punto ${puntoCount}: ${lat}, ${lng}`);
            }
        }
        
        if (coordenadas.length === 0) {
            console.log("🔍 Intentando patrón alternativo...");
            const regexAlternativo = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/g;
            let matchAlt;
            let puntoCountAlt = 0;
            
            while ((matchAlt = regexAlternativo.exec(perimetroTexto)) !== null) {
                const lat = parseFloat(matchAlt[1]);
                const lng = parseFloat(matchAlt[2]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    coordenadas.push([lat, lng]);
                    puntoCountAlt++;
                    console.log(`   Punto ${puntoCountAlt}: ${lat}, ${lng}`);
                }
            }
        }
    }
    else {
        console.log("🔍 Buscando pares de coordenadas con regex...");
        const regex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/g;
        let match;
        let puntoCount = 0;
        
        while ((match = regex.exec(perimetroTexto)) !== null) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            if (!isNaN(lat) && !isNaN(lng)) {
                coordenadas.push([lat, lng]);
                puntoCount++;
                console.log(`   Punto ${puntoCount}: ${lat}, ${lng}`);
            }
        }
    }
    
    console.log(`✅ ${coordenadas.length} coordenadas parseadas`);
    return coordenadas;
}

// Función para verificar punto en polígono (mismo algoritmo que Android)
function puntoDentroPoligono(lat, lng, polyCoords) {
    if (!polyCoords || polyCoords.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = polyCoords.length - 1; i < polyCoords.length; j = i++) {
        const xi = polyCoords[i][1], yi = polyCoords[i][0];
        const xj = polyCoords[j][1], yj = polyCoords[j][0];
        
        const intersect = ((yi > lat) !== (yj > lat)) && 
                         (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Función para probar la conexión a Firebird
function probarConexionFirebird() {
  return new Promise((resolve, reject) => {
    console.log("🔍 Probando conexión a Firebird...");

    Firebird.attach(dbOptions, (err, db) => {
      if (err) {
        console.error("❌ Error de conexión a Firebird:", err.message);
        reject(err);
        return;
      }

      console.log("✅ Conexión a Firebird exitosa");
      
      db.query("SELECT COUNT(*) as TOTAL FROM RDB$RELATIONS", (err, result) => {
        db.detach();
        if (err) {
          console.error("❌ Error en consulta de prueba:", err.message);
          reject(err);
        } else {
          console.log("✅ Consulta de prueba exitosa. Tablas en BD:", result[0].TOTAL);
          resolve(true);
        }
      });
    });
  });
}

// Middleware para log de todas las peticiones
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Endpoint para verificar estado del servidor y BD
app.get("/status", async (req, res) => {
  try {
    await probarConexionFirebird();
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

// Endpoint para listar todas las áreas
app.get("/areas", (req, res) => {
  console.log("📋 Solicitando lista de áreas...");

  Firebird.attach(dbOptions, (err, db) => {
    if (err) {
      console.error("❌ Error conectando a Firebird:", err.message);
      return res.status(500).json({ error: `Error de conexión a Firebird: ${err.message}` });
    }

    console.log("✅ Conexión a Firebird establecida, ejecutando consulta...");

    const sql = "SELECT ID, NOMBRE, CAST(PERIMETRO AS VARCHAR(8191)) AS PERIMETRO FROM COTOS ORDER BY NOMBRE";
    db.query(sql, (err, result) => {
      db.detach();
      if (err) {
        console.error("❌ Error en consulta Firebird:", err.message);
        return res.status(500).json({ error: `Error al leer la base de datos: ${err.message}` });
      }

      const areas = result.map(r => ({
        id: r.ID,
        nombre: r.NOMBRE,
        perimetro: r.PERIMETRO || "",
        info: `Perímetro: ${r.PERIMETRO ? r.PERIMETRO.length + ' caracteres' : 'vacío'}`
      }));

      console.log(`✅ ${areas.length} áreas cargadas correctamente`);
      
      res.json(areas);
    });
  });
});

// Endpoint para obtener un área específica por ID
app.get("/areas/:id", (req, res) => {
  const areaId = req.params.id;
  console.log(`📍 Solicitando área ID: ${areaId}`);

  Firebird.attach(dbOptions, (err, db) => {
    if (err) {
      console.error("❌ Error conectando a Firebird:", err);
      return res.status(500).json({ error: "Error de conexión a Firebird" });
    }

    const sql = "SELECT ID, NOMBRE, CAST(PERIMETRO AS VARCHAR(8191)) AS PERIMETRO FROM COTOS WHERE ID = ?";
    db.query(sql, [areaId], (err, result) => {
      db.detach();
      if (err) {
        console.error("❌ Error leyendo área:", err);
        return res.status(500).json({ error: "Error al leer el área" });
      }

      if (result.length === 0) {
        console.log("❌ Área no encontrada:", areaId);
        return res.status(404).json({ error: "Área no encontrada" });
      }

      const area = result[0];
      const coords = parsearCoordenadas(area.PERIMETRO);
      
      const areaConCoords = {
        id: area.ID,
        nombre: area.NOMBRE,
        perimetro: area.PERIMETRO,
        coords: coords,
        info: {
          totalCoordenadas: coords.length,
          formatoDetectado: coords.length > 0 ? "éxito" : "error"
        }
      };

      console.log(`✅ Área "${area.NOMBRE}" procesada - ${coords.length} coordenadas extraídas`);
      res.json(areaConCoords);
    });
  });
});

// ========== ENDPOINTS PARA MONITOREO EN TIEMPO REAL ==========

// Endpoint para que Android envíe ubicación
app.post("/socio/ubicacion", (req, res) => {
    const { idUsuario, lat, lng, nombre } = req.body;
    
    console.log(`📍 Ubicación recibida - Usuario: ${nombre} (${lat}, ${lng})`);
    
    // Guardar ubicación del socio
    ubicacionesSocios.set(idUsuario.toString(), {
        id: idUsuario,
        nombre: nombre,
        lat: lat,
        lng: lng,
        timestamp: new Date().toISOString()
    });
    
    res.json({ success: true, message: "Ubicación actualizada" });
});

// Endpoint para que la web obtenga ubicaciones de socios en un coto
app.get("/monitoreo/coto/:cotoId/socios", (req, res) => {
    const cotoId = req.params.cotoId;
    
    console.log(`👥 Solicitando socios para coto: ${cotoId}`);
    
    // Primero obtener las coordenadas del coto
    Firebird.attach(dbOptions, (err, db) => {
        if (err) {
            console.error("❌ Error conectando a Firebird:", err);
            return res.status(500).json({ error: "Error de conexión" });
        }

        const sql = "SELECT ID, NOMBRE, CAST(PERIMETRO AS VARCHAR(8191)) AS PERIMETRO FROM COTOS WHERE ID = ?";
        db.query(sql, [cotoId], (err, result) => {
            db.detach();
            if (err || result.length === 0) {
                return res.status(404).json({ error: "Coto no encontrado" });
            }

            const area = result[0];
            const perimetro = area.PERIMETRO;
            const coordenadasCoto = parsearCoordenadas(perimetro);
            
            if (coordenadasCoto.length === 0) {
                return res.status(400).json({ error: "Coto sin coordenadas válidas" });
            }

            // Filtrar socios que están dentro del coto
            const sociosEnCoto = [];
            
            ubicacionesSocios.forEach((socio, idUsuario) => {
                const dentro = puntoDentroPoligono(socio.lat, socio.lng, coordenadasCoto);
                
                if (dentro) {
                    sociosEnCoto.push({
                        ...socio,
                        dentroCoto: true
                    });
                }
            });

            console.log(`✅ ${sociosEnCoto.length} socios encontrados en el coto ${area.NOMBRE}`);
            res.json({
                cotoId: cotoId,
                cotoNombre: area.NOMBRE,
                totalSocios: sociosEnCoto.length,
                socios: sociosEnCoto,
                ultimaActualizacion: new Date().toISOString()
            });
        });
    });
});

// Endpoint para obtener todas las ubicaciones (para debug)
app.get("/monitoreo/todos-socios", (req, res) => {
    const todosSocios = Array.from(ubicacionesSocios.values());
    res.json({
        total: todosSocios.length,
        socios: todosSocios
    });
});

// Endpoint para registrar socios
app.post("/registrar-socio", (req, res) => {
  console.log("📱 Petición de registro recibida");
  
  let { nombre, usuario, contrasena, email, telefono } = req.body;

  // Asegurar que los datos no excedan los límites de la tabla
  usuario = usuario.substring(0, 20);
  nombre = nombre.substring(0, 50);
  contrasena = contrasena.substring(0, 20);
  email = email.substring(0, 100);
  telefono = telefono.substring(0, 20);

  // Validaciones básicas
  if (!nombre || !usuario || !contrasena || !email || !telefono) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  Firebird.attach(dbOptions, (err, db) => {
    if (err) {
      console.error("❌ Error conectando a Firebird:", err.message);
      return res.status(500).json({ error: "Error de conexión a Firebird" });
    }

    // Verificar si el usuario ya existe
    const checkSql = "SELECT COUNT(*) as \"COUNT\" FROM SOCIOS WHERE USUARIO = ? OR EMAIL = ?";
    
    db.query(checkSql, [usuario, email], (err, result) => {
      if (err) {
        db.detach();
        console.error("❌ Error verificando usuario:", err.message);
        return res.status(500).json({ error: "Error al verificar usuario" });
      }

      if (result[0].COUNT > 0) {
        db.detach();
        console.log("❌ Usuario o email ya existen:", usuario, email);
        return res.status(400).json({ error: "El usuario o email ya existen" });
      }

      // Insertar nuevo socio
      const insertSql = `
        INSERT INTO SOCIOS (NOMBRE, TELEFONO, USUARIO, CLAVE, EMAIL, POSICION_X, POSICION_Y) 
        VALUES (?, ?, ?, ?, ?, NULL, NULL)
      `;

      db.query(insertSql, [nombre, telefono, usuario, contrasena, email], (err) => {
        db.detach();
        if (err) {
          console.error("❌ Error insertando socio:", err.message);
          return res.status(500).json({ error: "Error al registrar socio en la base de datos" });
        }
        
        console.log("✅ Socio registrado correctamente:", usuario);
        res.json({ mensaje: "✅ Socio registrado correctamente" });
      });
    });
  });
});

// Endpoint para guardar áreas/cotos
app.post("/guardar", (req, res) => {
  const { nombre, coordenadas } = req.body;

  if (!coordenadas || coordenadas.length === 0) {
    return res.status(400).json({ error: "No hay coordenadas para guardar" });
  }

  const latitudes = coordenadas.map(p => p.lat);
  const longitudes = coordenadas.map(p => p.lng);
  const centroX = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
  const centroY = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;

  // Crear un formato más fácil de parsear
  const perimetroTexto = coordenadas
    .map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`)
    .join(';');

  Firebird.attach(dbOptions, (err, db) => {
    if (err) {
      console.error("❌ Error conectando a Firebird:", err);
      return res.status(500).json({ error: "Error de conexión a Firebird" });
    }

    const sql = "INSERT INTO COTOS (NOMBRE, CENTRO_X, CENTRO_Y, PERIMETRO) VALUES (?, ?, ?, ?)";
    db.query(sql, [nombre || "Área sin nombre", centroX, centroY, perimetroTexto], (err) => {
      db.detach();
      if (err) {
        console.error("❌ Error insertando en Firebird:", err);
        return res.status(500).json({ error: "Error al guardar en la base de datos" });
      }
      res.json({ mensaje: "✅ Área guardada correctamente en Firebird" });
    });
  });
});

// Endpoint para validar login
app.post("/validar-login", (req, res) => {
  console.log("🔐 Petición de login recibida");
  
  const { usuario, contrasena } = req.body;

  // Validaciones básicas
  if (!usuario || !contrasena) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
  }

  Firebird.attach(dbOptions, (err, db) => {
    if (err) {
      console.error("❌ Error conectando a Firebird:", err.message);
      return res.status(500).json({ error: "Error de conexión a Firebird" });
    }

    // Buscar usuario en la base de datos
    const sql = "SELECT ID, NOMBRE, USUARIO, CLAVE FROM SOCIOS WHERE USUARIO = ? AND CLAVE = ?";
    
    db.query(sql, [usuario, contrasena], (err, result) => {
      db.detach();
      
      if (err) {
        console.error("❌ Error en consulta de login:", err.message);
        return res.status(500).json({ error: "Error al verificar credenciales" });
      }

      if (result.length === 0) {
        console.log("❌ Login fallido para usuario:", usuario);
        return res.status(401).json({ 
          valido: false,
          error: "Usuario o contraseña incorrectos" 
        });
      }

      // Login exitoso
      const usuarioEncontrado = result[0];
      console.log("✅ Login exitoso para:", usuario);
      
      res.json({
        valido: true,
        id: usuarioEncontrado.ID,
        nombre: usuarioEncontrado.NOMBRE,
        usuario: usuarioEncontrado.USUARIO,
        mensaje: "Login exitoso"
      });
    });
  });
});

// Iniciar servidor con verificación de BD
app.listen(3000, async () => {
  console.log("🚀 Servidor ejecutándose en http://localhost:3000");
  console.log("🔍 Verificando conexión a base de datos...");
  
  try {
    await probarConexionFirebird();
    console.log("✅ Servidor listo y conectado a la base de datos");
  } catch (error) {
    console.error("❌ ADVERTENCIA: El servidor inició pero no puede conectar con la base de datos");
    console.error("💡 Solución: Verifica que Firebird esté ejecutándose y la configuración sea correcta");
  }
});