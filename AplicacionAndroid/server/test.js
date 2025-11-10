const Firebird = require("node-firebird2");

const dbOptions = {
  host: "127.0.0.1",
  port: 3050,
  database: "C:/DATOS/VENATUS.FDB",
  user: "SYSDBA",
  password: "masterkey",
  wireCrypt: false
};

Firebird.attach(dbOptions, (err, db) => {
  if (err) return console.error("Error de conexión:", err.message);
  console.log("Conectado a Firebird ✅");
  db.detach();
});
