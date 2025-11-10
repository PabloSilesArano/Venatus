const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Firebird = require("node-firebird");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔧 Configuración Firebird
const dbOptions = {
  host: "127.0.0.1", // si la DB está local
  port: 3050,
  database: "C:/datos/VENATUS.FDB",
  user: "SYSDBA",
  password: "masterkey",
  lowercase_keys: false,
  role: null,
  pageSize: 4096,
  wireCrypt: 0
};

// 🔹 Función para conectar con reconexión
function connectToFirebird(retries = 3) {
  return new Promise((resolve, reject) => {
    function attempt(count) {
      Firebird.attach(dbOptions, (err, db) => {
        if (err) {
          console.error(`Error al conectar con Firebird (intento ${count}):`, err.message);
          if (count < retries) setTimeout(() => attempt(count + 1), 1000);
          else reject(err);
        } else {
          db.query("SELECT 1 FROM RDB$DATABASE", (err2) => {
            if (err2) { db.detach(); reject(err2); }
            else resolve(db);
          });
        }
      });
    }
    attempt(1);
  });
}

// ==========================
// 🔹 Endpoints
// ==========================

// 1️⃣ Guardar un coto (solo desde web)
app.post("/guardar_firebird", async (req, res) => {
  const { nombre, centro_x, centro_y, perimetro } = req.body;
  if (!nombre || centro_x == null || centro_y == null || !perimetro) {
    return res.status(400).json({ mensaje: "Faltan datos en la solicitud" });
  }

  let db;
  try { db = await connectToFirebird(); } 
  catch (err) { return res.status(500).json({ mensaje: "No se pudo conectar a Firebird: " + err.message }); }

  // Convertimos el array de coordenadas a texto por líneas
  let perimetroTexto = '';
  try {
    const puntos = Array.isArray(perimetro) ? perimetro : JSON.parse(perimetro);
    puntos.forEach((p, i) => {
      const x = p[0] ?? p.x ?? 0;
      const y = p[1] ?? p.y ?? 0;
      perimetroTexto += `Punto ${i + 1}: (X ${x})(Y ${y})\r\n`;
    });
  } catch (e) {
    db.detach();
    return res.status(400).json({ mensaje: "Perímetro inválido" });
  }

  const sql = `INSERT INTO COTOS (NOMBRE, CENTRO_X, CENTRO_Y, PERIMETRO) VALUES (?, ?, ?, ?)`;
  db.query(sql, [nombre, centro_x, centro_y, perimetroTexto], (err) => {
    db.detach();
    if (err) return res.status(500).json({ mensaje: "Error al guardar el coto" });
    res.json({ mensaje: "Coto guardado correctamente ✅" });
  });
});

// 2️⃣ Obtener cotos (Android / Web)
app.get("/get_cotos", async (req, res) => {
  let db;
  try { db = await connectToFirebird(); } 
  catch (err) { return res.status(500).json({ mensaje: "No se pudo conectar a Firebird: " + err.message }); }

  const sql = `SELECT ID, NOMBRE, PERIMETRO FROM COTOS`;
  db.query(sql, [], (err, result) => {
    db.detach();
    if (err) return res.status(500).json({ mensaje: "Error al obtener cotos" });

    const cotos = result.map(c => ({
      id: c.ID,
      nombre: c.NOMBRE,
      // 🔹 Convertimos a string y luego a array de líneas
      perimetro: (c.PERIMETRO ? c.PERIMETRO.toString() : "").split(/\r?\n/).filter(line => line)
    }));

    res.json(cotos);
  });
});

// 3️⃣ Registrar usuario (Android)
app.post("/register_user", async (req, res) => {
  const { nombre, usuario, contrasena, email, telefono } = req.body;
  if (!nombre || !usuario || !contrasena || !email || !telefono) {
    return res.status(400).json({ mensaje: "Faltan datos" });
  }

  let db;
  try { db = await connectToFirebird(); } 
  catch (err) { return res.status(500).json({ mensaje: "No se pudo conectar a Firebird: " + err.message }); }

  const sql = `INSERT INTO SOCIOS (NOMBRE, USUARIO, CLAVE, EMAIL, TELEFONO) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [nombre, usuario, contrasena, email, telefono], (err) => {
    db.detach();
    if (err) return res.status(500).json({ mensaje: "Error al registrar usuario" });
    res.json({ mensaje: "Usuario registrado correctamente ✅" });
  });
});

// 4️⃣ Login usuario (Android)
app.post("/login_user", async (req, res) => {
  const { usuario, contrasena } = req.body;
  if (!usuario || !contrasena) return res.status(400).json({ mensaje: "Faltan datos" });

  let db;
  try { db = await connectToFirebird(); } 
  catch (err) { return res.status(500).json({ mensaje: "No se pudo conectar a Firebird: " + err.message }); }

  const sql = `SELECT * FROM SOCIOS WHERE USUARIO = ? AND CLAVE = ?`;
  db.query(sql, [usuario, contrasena], (err, result) => {
    db.detach();
    if (err) return res.status(500).json({ mensaje: "Error al iniciar sesión" });
    if (result.length === 0) return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });

    res.json({ mensaje: "Login exitoso ✅", usuario: result[0] });
  });
});

// 🔹 Inicializar servidor
(async () => {
  try {
    const db = await connectToFirebird();
    console.log("Conexión inicial con Firebird exitosa ✅");
    db.detach();
  } catch (err) {
    console.error("Error de conexión inicial a Firebird:", err.message);
  }

  // 🔹 Escuchar en todas las interfaces de red
  app.listen(5000, '0.0.0.0', () =>
    console.log("Servidor escuchando en http://0.0.0.0:5000")
  );
})();
