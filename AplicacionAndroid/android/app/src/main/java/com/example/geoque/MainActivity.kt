package com.example.geoque

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.app.ProgressDialog
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity(), LocationListener {

    // ========== VARIABLES DE VISTA ==========
    private lateinit var webView: WebView
    private lateinit var tvCoordinates: TextView
    private lateinit var tvEstado: TextView
    private lateinit var btnMenu: TextView
    private lateinit var locationManager: LocationManager

    // ========== VARIABLES DE ESTADO ==========
    private var cotoActual: String? = null
    private var coordenadasCoto: List<List<Double>> = emptyList()
    private var ultimaUbicacion: Location? = null
    private var dentroDelCoto = false
    private var primeraVerificacion = true
    private var alertaMostrada = false
    private var progressDialog: ProgressDialog? = null
    private var idCotoActual: Int? = null

    // ========== CONFIGURACIÓN DE RED ==========
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private val SERVER_URL = "http://51.210.98.37:3000"

    // ========== MANEJO DE UBICACIÓN ==========
    private val ubicacionUpdateHandler = Handler(Looper.getMainLooper())
    private val enviarUbicacionRunnable = object : Runnable {
        override fun run() {
            ultimaUbicacion?.let { location ->
                enviarUbicacionAlServidor(location)
            }
            ubicacionUpdateHandler.postDelayed(this, 10000) // Enviar cada 10 segundos
        }
    }

    private val requestPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true) {
                startLocationUpdates()
                ubicacionUpdateHandler.postDelayed(enviarUbicacionRunnable, 5000)
            }
        }

    private val gpsReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == LocationManager.PROVIDERS_CHANGED_ACTION) {
                checkIfGpsIsEnabled()
            }
        }
    }

    // ========== CICLO DE VIDA ==========
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        supportActionBar?.hide()
        inicializarVistas()
        setupWebView()
        setupMenuButton()
        checkLocationPermission()

        registerReceiver(gpsReceiver, IntentFilter(LocationManager.PROVIDERS_CHANGED_ACTION))

        webView.postDelayed({
            mostrarDialogoInicial()
        }, 1000)
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            locationManager.removeUpdates(this)
            unregisterReceiver(gpsReceiver)
            ubicacionUpdateHandler.removeCallbacks(enviarUbicacionRunnable)
            progressDialog?.dismiss()
        } catch (e: Exception) {
            Log.e("MAIN", "Error en onDestroy: ${e.message}")
        }
    }

    override fun onLocationChanged(location: Location) {
        updateWebViewPosition(location)
        verificarUbicacionEnCoto(location)
    }

    override fun onProviderEnabled(provider: String) {}
    override fun onProviderDisabled(provider: String) {}

    // ========== INICIALIZACIÓN ==========
    private fun inicializarVistas() {
        webView = findViewById(R.id.mapWebView)
        tvCoordinates = findViewById(R.id.tvCoordinates)
        tvEstado = findViewById(R.id.tvEstado)
        btnMenu = findViewById(R.id.btnMenu)
        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
    }

    private fun setupMenuButton() {
        btnMenu.setOnClickListener { mostrarMenuFlotante() }
        btnMenu.elevation = 12f
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.setGeolocationEnabled(true)
        webView.settings.allowFileAccess = true

        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, true, false)
            }
        }

        webView.webViewClient = WebViewClient()

        webView.addJavascriptInterface(object {
            @JavascriptInterface
            fun showCoordinates(text: String) {
                runOnUiThread { tvCoordinates.text = text }
            }
        }, "AndroidInterface")

        webView.loadUrl("file:///android_asset/mapa_limpio.html")
    }

    // ========== MENÚ PRINCIPAL ==========
    private fun mostrarMenuFlotante() {

        val opciones = arrayOf(
            "🌿 Cargar Cotos",
            "➕ Aumentar Zoom",
            "➖ Reducir Zoom",
            "🗑️ Limpiar Mapa",
            "📍 Centrar en mi ubicación",
            "🐾 Ver Animales del Coto",
            "🎯 Registrar Animal Cazado",
            "📋 Mi Historial de Capturas",
            "ℹ️ Acerca de"
        )

        AlertDialog.Builder(this)
            .setTitle("Venatus - Menú")
            .setItems(opciones) { dialog, which ->
                when (which) {
                    0 -> cargarListaCotos()
                    1 -> ejecutarZoomIn()
                    2 -> ejecutarZoomOut()
                    3 -> limpiarMapa()
                    4 -> centrarEnMiUbicacion()
                    5 -> verAnimalesDelCoto()
                    6 -> registrarAnimalCazado()
                    7 -> verHistorialCapturas()
                    8 -> mostrarAcercaDe()
                }
            }
            .setNegativeButton("Cerrar", null)
            .show()
    }

    // ========== GESTIÓN DE COTOS ==========
    private fun cargarListaCotos() {
        showProgressDialog("Cargando cotos...")
        val url = "$SERVER_URL/areas"
        val request = Request.Builder().url(url).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    dismissProgressDialog()
                    mostrarErrorConexion("Error de conexión: ${e.message}")
                }
            }

            override fun onResponse(call: Call, response: Response) {
                val respuesta = response.body?.string()
                runOnUiThread {
                    dismissProgressDialog()
                    try {
                        if (!response.isSuccessful) {
                            mostrarErrorConexion("Error del servidor: ${response.code}")
                            return@runOnUiThread
                        }

                        val areasArray = JSONArray(respuesta)
                        if (areasArray.length() > 0) {
                            mostrarDialogoCotos(areasArray)
                        } else {
                            mostrarSinCotosDisponibles()
                        }
                    } catch (e: Exception) {
                        mostrarErrorConexion("Error: ${e.message}")
                    }
                }
            }
        })
    }

    private fun cargarCoordenadasCoto(idCoto: String) {
        showProgressDialog("Cargando coto...")
        idCotoActual = idCoto.toInt()
        val url = "$SERVER_URL/areas/$idCoto"
        val request = Request.Builder().url(url).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                val respuesta = response.body?.string()
                runOnUiThread {
                    dismissProgressDialog()
                    try {
                        if (response.isSuccessful && !respuesta.isNullOrEmpty()) {
                            val area = JSONObject(respuesta)
                            if (area.has("coords")) {
                                val coordsArray = area.getJSONArray("coords")
                                coordenadasCoto = (0 until coordsArray.length()).map { i ->
                                    val coord = coordsArray.getJSONArray(i)
                                    listOf(coord.getDouble(0), coord.getDouble(1))
                                }

                                if (coordenadasCoto.isNotEmpty()) {
                                    dibujarCotoEnMapa()
                                    Log.d("LOCATION", "🗺️ Coto cargado, forzando inicio de ubicación...")
                                    checkLocationPermission()
                                    ubicacionUpdateHandler.postDelayed(enviarUbicacionRunnable, 5000)
                                    resetearEstadoVerificacion()
                                    Toast.makeText(this@MainActivity, "$cotoActual cargado", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "Error cargando coto", Toast.LENGTH_SHORT).show()
                    }
                }
            }

            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    dismissProgressDialog()
                    Toast.makeText(this@MainActivity, "Error de conexión", Toast.LENGTH_SHORT).show()
                }
            }
        })
    }

    // ========== GESTIÓN DE ANIMALES ==========
    private fun verAnimalesDelCoto() {
        if (cotoActual == null || idCotoActual == null) {
            Toast.makeText(this, "Primero selecciona un coto", Toast.LENGTH_SHORT).show()
            return
        }

        showProgressDialog("Cargando animales...")
        val url = "$SERVER_URL/cotos/${idCotoActual}/animales"
        val request = Request.Builder().url(url).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    dismissProgressDialog()
                    mostrarError("Error de conexión: ${e.message}")
                }
            }

            override fun onResponse(call: Call, response: Response) {
                val respuesta = response.body?.string()
                runOnUiThread {
                    dismissProgressDialog()
                    try {
                        if (response.isSuccessful) {
                            val animalesArray = JSONArray(respuesta)
                            mostrarAnimalesDialog(animalesArray)
                        } else {
                            mostrarError("Error del servidor: ${response.code}")
                        }
                    } catch (e: Exception) {
                        mostrarError("Error: ${e.message}")
                    }
                }
            }
        })
    }

    private fun registrarAnimalCazado() {
        if (cotoActual == null || idCotoActual == null) {
            Toast.makeText(this, "Primero selecciona un coto", Toast.LENGTH_SHORT).show()
            return
        }

        showProgressDialog("Cargando animales...")
        val url = "$SERVER_URL/cotos/${idCotoActual}/animales"
        val request = Request.Builder().url(url).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    dismissProgressDialog()
                    mostrarError("Error de conexión: ${e.message}")
                }
            }

            override fun onResponse(call: Call, response: Response) {
                val respuesta = response.body?.string()
                runOnUiThread {
                    dismissProgressDialog()
                    try {
                        if (response.isSuccessful) {
                            val animalesArray = JSONArray(respuesta)
                            mostrarDialogoRegistroCaptura(animalesArray)
                        } else {
                            mostrarError("Error del servidor: ${response.code}")
                        }
                    } catch (e: Exception) {
                        mostrarError("Error: ${e.message}")
                    }
                }
            }
        })
    }

    // ========== CAPTURAS ==========
    private fun registrarCapturaEnServidor(idAnimal: Int, cantidad: Int, nombreAnimal: String) {
        val idUsuario = intent.getIntExtra("idUsuario", 0)
        val idCoto = idCotoActual ?: return

        showProgressDialog("Registrando captura...")
        val url = "$SERVER_URL/capturas"
        val ubicacion = obtenerUbicacionActual()

        val json = JSONObject().apply {
            put("idSocio", idUsuario)
            put("idCoto", idCoto)
            put("idAnimal", idAnimal)
            put("cantidad", cantidad)

            if (ubicacion != null) {
                put("latitud", ubicacion.latitude)
                put("longitud", ubicacion.longitude)
                Log.d("CAPTURAS", "📍 Enviando coordenadas actuales: ${ubicacion.latitude}, ${ubicacion.longitude}")
            } else {
                put("latitud", JSONObject.NULL)
                put("longitud", JSONObject.NULL)
                Log.d("CAPTURAS", "⚠️ Enviando coordenadas como NULL")
            }
        }

        Log.d("CAPTURAS", "📤 JSON enviado: ${json.toString()}")
        val body = RequestBody.create("application/json; charset=utf-8".toMediaType(), json.toString())
        val request = Request.Builder().url(url).post(body).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    dismissProgressDialog()
                    mostrarError("Error de conexión: ${e.message}")
                    Log.e("CAPTURAS", "❌ Error de conexión: ${e.message}")
                }
            }

            override fun onResponse(call: Call, response: Response) {
                val respuesta = response.body?.string()
                Log.d("CAPTURAS", "📥 Respuesta del servidor - Código: ${response.code}")
                Log.d("CAPTURAS", "📥 Respuesta: $respuesta")

                runOnUiThread {
                    dismissProgressDialog()
                    try {
                        if (response.isSuccessful) {
                            val jsonResponse = JSONObject(respuesta)
                            val mensaje = jsonResponse.getString("message")
                            val tieneCoordenadas = ubicacion != null
                            val mensajeFinal = if (tieneCoordenadas) {
                                "✅ $mensaje\n📍 Con coordenadas de ubicación"
                            } else {
                                "✅ $mensaje\n⚠️ Sin coordenadas (GPS no disponible)"
                            }
                            Toast.makeText(this@MainActivity, mensajeFinal, Toast.LENGTH_LONG).show()
                        } else {
                            val errorJson = JSONObject(respuesta)
                            mostrarError("Error: ${errorJson.optString("error", "Error desconocido")}")
                        }
                    } catch (e: Exception) {
                        Log.e("CAPTURAS", "❌ Error parseando respuesta: ${e.message}")
                        mostrarError("Error procesando respuesta del servidor")
                    }
                }
            }
        })
    }

    private fun verHistorialCapturas() {
        val idUsuario = intent.getIntExtra("idUsuario", 0)
        Log.d("HISTORIAL", "🔍 ID de usuario obtenido: $idUsuario")

        if (idUsuario == 0) {
            Toast.makeText(this, "Error: Usuario no identificado", Toast.LENGTH_SHORT).show()
            Log.e("HISTORIAL", "❌ ID de usuario es 0 - no se recibió del login")
            return
        }

        showProgressDialog("Cargando historial...")
        val url = "$SERVER_URL/socios/$idUsuario/capturas"
        Log.d("HISTORIAL", "📤 URL solicitada: $url")
        val request = Request.Builder().url(url).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    dismissProgressDialog()
                    mostrarError("Error de conexión: ${e.message}")
                    Log.e("HISTORIAL", "❌ Error conexión: ${e.message}")
                }
            }

            override fun onResponse(call: Call, response: Response) {
                val respuesta = response.body?.string()
                Log.d("HISTORIAL", "📥 Código HTTP: ${response.code}")
                Log.d("HISTORIAL", "📥 Respuesta cruda: $respuesta")

                runOnUiThread {
                    dismissProgressDialog()
                    try {
                        if (response.isSuccessful) {
                            Log.d("HISTORIAL", "✅ Respuesta exitosa")
                            val capturasArray = JSONArray(respuesta)
                            Log.d("HISTORIAL", "📊 Capturas recibidas: ${capturasArray.length()}")
                            mostrarHistorialCapturas(capturasArray)
                        } else {
                            Log.e("HISTORIAL", "❌ Error HTTP: ${response.code}")
                            mostrarError("Error del servidor: ${response.code} - $respuesta")
                        }
                    } catch (e: Exception) {
                        Log.e("HISTORIAL", "❌ Error parseando JSON: ${e.message}")
                        mostrarError("Error procesando respuesta: ${e.message}")
                    }
                }
            }
        })
    }

    // ========== UBICACIÓN Y GPS ==========
    private fun checkLocationPermission() {
        Log.d("LOCATION", "🔍 Verificando permisos de ubicación...")

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            Log.d("LOCATION", "📝 Solicitando permisos de ubicación...")
            requestPermissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION))
        } else {
            Log.d("LOCATION", "✅ Permisos de ubicación concedidos")
            checkIfGpsIsEnabled()
            startLocationUpdates()
            ubicacionUpdateHandler.postDelayed(enviarUbicacionRunnable, 5000)
        }
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED) {
            try {
                Log.d("LOCATION", "📍 Iniciando actualizaciones de ubicación...")

                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    2000L, 5f, this
                )

                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    2000L, 10f, this
                )

                val lastLocation = obtenerUltimaUbicacionConocida()
                if (lastLocation != null) {
                    Log.d("LOCATION", "📍 Usando última ubicación conocida")
                    onLocationChanged(lastLocation)
                }

                Log.d("LOCATION", "✅ Actualizaciones de ubicación iniciadas correctamente")
            } catch (e: Exception) {
                Log.e("LOCATION", "❌ Error iniciando ubicación: ${e.message}")
            }
        } else {
            Log.e("LOCATION", "❌ Sin permisos de ubicación para iniciar updates")
        }
    }

    @SuppressLint("MissingPermission")
    private fun obtenerUbicacionActual(): Location? {
        try {
            var location = ultimaUbicacion

            if (location == null) {
                val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
                location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                    ?: locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)

                if (location != null) {
                    Log.d("CAPTURAS", "📍 Usando última ubicación conocida: ${location.latitude}, ${location.longitude}")
                    ultimaUbicacion = location
                }
            } else {
                Log.d("CAPTURAS", "📍 Usando ubicación en tiempo real: ${location.latitude}, ${location.longitude}")
            }

            if (location == null) {
                Log.d("CAPTURAS", "❌ No se pudo obtener ninguna ubicación")
            }

            return location
        } catch (e: Exception) {
            Log.e("CAPTURAS", "❌ Error obteniendo ubicación: ${e.message}")
            return null
        }
    }

    @SuppressLint("MissingPermission")
    private fun obtenerUltimaUbicacionConocida(): Location? {
        val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        var location: Location? = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            ?: locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)

        if (location != null) {
            Log.d("LOCATION", "📍 Última ubicación conocida: ${location.latitude}, ${location.longitude}")
        } else {
            Log.d("LOCATION", "📍 No hay ubicación conocida disponible")
        }

        return location
    }

    private fun enviarUbicacionAlServidor(location: Location) {
        val idUsuario = intent.getIntExtra("idUsuario", 0)
        val nombreUsuario = intent.getStringExtra("nombreUsuario") ?: "Usuario"

        if (idUsuario == 0) {
            Log.d("UBICACION", "❌ ID de usuario no disponible")
            return
        }

        val url = "$SERVER_URL/socio/ubicacion"
        val json = JSONObject().apply {
            put("idUsuario", idUsuario)
            put("nombre", nombreUsuario)
            put("lat", location.latitude)
            put("lng", location.longitude)
        }

        val body = RequestBody.create("application/json; charset=utf-8".toMediaType(), json.toString())
        val request = Request.Builder().url(url).post(body).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.d("UBICACION", "❌ Error enviando ubicación: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                Log.d("UBICACION", "✅ Ubicación enviada al servidor - ${response.code}")
            }
        })
    }

    // ========== UTILIDADES DE INTERFAZ ==========
    private fun mostrarDialogoRegistroCaptura(animales: JSONArray) {
        if (animales.length() == 0) {
            AlertDialog.Builder(this)
                .setTitle("Registrar Captura")
                .setMessage("No hay animales registrados para este coto.")
                .setPositiveButton("OK", null)
                .show()
            return
        }

        val animalesNombres = mutableListOf<String>()
        val animalesMap = mutableMapOf<String, Int>()

        for (i in 0 until animales.length()) {
            val animal = animales.getJSONObject(i)
            val id = animal.getInt("ID")
            val nombre = animal.getString("NOMBRE")
            animalesNombres.add(nombre)
            animalesMap[nombre] = id
        }

        AlertDialog.Builder(this)
            .setTitle("🎯 Selecciona un animal")
            .setItems(animalesNombres.toTypedArray()) { dialog, which ->
                val animalSeleccionado = animalesNombres[which]
                val idAnimal = animalesMap[animalSeleccionado]
                mostrarDialogoCantidad(animalSeleccionado, idAnimal!!)
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun mostrarDialogoCantidad(nombreAnimal: String, idAnimal: Int) {
        val view = layoutInflater.inflate(R.layout.dialog_cantidad, null)
        val etCantidad = view.findViewById<EditText>(R.id.etCantidad)

        AlertDialog.Builder(this)
            .setTitle("Cantidad de $nombreAnimal")
            .setView(view)
            .setPositiveButton("Registrar") { dialog, which ->
                val cantidadStr = etCantidad.text.toString()
                val cantidad = cantidadStr.toIntOrNull()

                if (cantidad == null || cantidad <= 0) {
                    Toast.makeText(this, "Ingresa una cantidad válida", Toast.LENGTH_SHORT).show()
                } else {
                    registrarCapturaEnServidor(idAnimal, cantidad, nombreAnimal)
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun mostrarAnimalesDialog(animales: JSONArray) {
        if (animales.length() == 0) {
            AlertDialog.Builder(this)
                .setTitle("Animales del Coto")
                .setMessage("No hay animales registrados para este coto.")
                .setPositiveButton("OK", null)
                .show()
            return
        }

        val animalesList = mutableListOf<String>()
        for (i in 0 until animales.length()) {
            val animal = animales.getJSONObject(i)
            val nombre = animal.getString("NOMBRE")
            val descripcion = animal.getString("DESCRIPCION") ?: ""
            animalesList.add("$nombre${if (descripcion.isNotEmpty()) " - $descripcion" else ""}")
        }

        AlertDialog.Builder(this)
            .setTitle("🐾 Animales en $cotoActual")
            .setItems(animalesList.toTypedArray()) { dialog, which -> }
            .setPositiveButton("Cerrar", null)
            .show()
    }

    private fun mostrarHistorialCapturas(capturas: JSONArray) {
        Log.d("HISTORIAL", "🎯 Mostrando ${capturas.length()} capturas")

        if (capturas.length() == 0) {
            AlertDialog.Builder(this)
                .setTitle("📋 Mi Historial")
                .setMessage("No hay capturas registradas.")
                .setPositiveButton("OK", null)
                .show()
            return
        }

        val historial = StringBuilder()
        historial.append("Tus últimas capturas:\n\n")

        for (i in 0 until capturas.length()) {
            try {
                val captura = capturas.getJSONObject(i)
                val animal = captura.optString("animal", "Animal desconocido")
                val cantidad = captura.optInt("cantidad", 0)
                val coto = captura.optString("coto", "Coto desconocido")
                val fecha = captura.optString("fechaLegible", "Fecha desconocida")
                val coordenadas = captura.optString("coordenadas", "Coordenadas no disponibles")

                Log.d("HISTORIAL", "📝 Captura $i: $cantidad $animal - $coto - $coordenadas")
                historial.append("• $cantidad $animal - $coto\n")
                historial.append("  📅 $fecha\n")
                historial.append("  📍 $coordenadas\n\n")
            } catch (e: Exception) {
                Log.e("HISTORIAL", "❌ Error en captura $i: ${e.message}")
                try {
                    val captura = capturas.getJSONObject(i)
                    val id = captura.optInt("id", 0)
                    val cantidad = captura.optInt("cantidad", 0)
                    historial.append("• $cantidad animales - Captura #$id\n")
                    historial.append("  📅 Información no disponible\n")
                    historial.append("  📍 Coordenadas no disponibles\n\n")
                } catch (e2: Exception) {
                    historial.append("• [Error cargando captura]\n\n")
                }
            }
        }

        AlertDialog.Builder(this)
            .setTitle("📋 Mis Últimas Capturas")
            .setMessage(historial.toString())
            .setPositiveButton("Cerrar", null)
            .show()
    }

    private fun mostrarDialogoCotos(areas: JSONArray) {
        val cotos = mutableListOf<String>()
        val cotosMap = mutableMapOf<String, String>()

        for (i in 0 until areas.length()) {
            val area = areas.getJSONObject(i)
            val nombre = area.getString("nombre")
            val id = area.getString("id")
            cotos.add(nombre)
            cotosMap[nombre] = id
        }

        AlertDialog.Builder(this)
            .setTitle("Selecciona un coto")
            .setAdapter(ArrayAdapter(this, android.R.layout.simple_list_item_1, cotos)) { dialog, which ->
                val cotoSeleccionado = cotos[which]
                val idCoto = cotosMap[cotoSeleccionado]
                cotoActual = cotoSeleccionado
                Toast.makeText(this, "Cargando: $cotoSeleccionado", Toast.LENGTH_SHORT).show()
                cargarCoordenadasCoto(idCoto!!)
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    // ========== FUNCIONES AUXILIARES ==========
    private fun updateWebViewPosition(location: Location) {
        val lat = location.latitude
        val lng = location.longitude

        val dentro = if (coordenadasCoto.isNotEmpty()) {
            puntoDentroPoligono(lat, lng)
        } else {
            false
        }

        val estadoTexto = when {
            coordenadasCoto.isEmpty() -> "⏳ Sin coto seleccionado"
            dentro -> "✅ DENTRO del coto"
            else -> "🚫 FUERA del coto"
        }

        runOnUiThread {
            tvEstado.text = estadoTexto
            webView.evaluateJavascript("javascript:actualizarPosicion($lat, $lng)", null)
            tvCoordinates.text = "$estadoTexto | Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}"
            tvCoordinates.setBackgroundColor(
                when {
                    coordenadasCoto.isEmpty() -> 0xFF757575.toInt()
                    dentro -> 0xFF4CAF50.toInt()
                    else -> 0xFFF44336.toInt()
                }
            )
        }
    }

    private fun verificarUbicacionEnCoto(location: Location) {
        if (coordenadasCoto.isEmpty()) return

        val dentro = puntoDentroPoligono(location.latitude, location.longitude)

        runOnUiThread {
            when {
                primeraVerificacion && !alertaMostrada -> {
                    primeraVerificacion = false
                    alertaMostrada = true
                    if (dentro) {
                        mostrarAlertaEstado("✅ Estás dentro del coto $cotoActual", "#4CAF50")
                    } else {
                        mostrarAlertaEstado("🚫 No estás en el coto $cotoActual", "#F44336")
                    }
                }
                !dentro && dentroDelCoto && !alertaMostrada -> {
                    alertaMostrada = true
                    mostrarAlertaEstado("🚨 ¡Has salido del coto $cotoActual!", "#F44336")
                }
                dentro && !dentroDelCoto && !alertaMostrada -> {
                    alertaMostrada = true
                    mostrarAlertaEstado("✅ ¡Has entrado al coto $cotoActual!", "#4CAF50")
                }
            }
        }

        dentroDelCoto = dentro
        ultimaUbicacion = location
    }

    private fun puntoDentroPoligono(lat: Double, lng: Double): Boolean {
        if (coordenadasCoto.size < 3) return false
        var inside = false
        val poly = coordenadasCoto
        var j = poly.size - 1
        for (i in poly.indices) {
            val xi = poly[i][1]
            val yi = poly[i][0]
            val xj = poly[j][1]
            val yj = poly[j][0]
            val intersect = ((yi > lat) != (yj > lat)) &&
                    (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
            if (intersect) inside = !inside
            j = i
        }
        return inside
    }

    private fun dibujarCotoEnMapa() {
        if (coordenadasCoto.isNotEmpty()) {
            val coordenadasJson = JSONArray()
            coordenadasCoto.forEach { coord ->
                coordenadasJson.put(JSONArray().apply {
                    put(coord[0])
                    put(coord[1])
                })
            }
            webView.evaluateJavascript("javascript:dibujarCoto($coordenadasJson)", null)
        }
    }

    private fun resetearEstadoVerificacion() {
        primeraVerificacion = true
        dentroDelCoto = false
        alertaMostrada = false
    }

    private fun checkIfGpsIsEnabled() {
        val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        val networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

        Log.d("LOCATION", "📍 GPS activado: $gpsEnabled")
        Log.d("LOCATION", "📍 Network location activado: $networkEnabled")

        if (!gpsEnabled && !networkEnabled) {
            Log.d("LOCATION", "⚠️ GPS y Network desactivados, mostrando alerta...")
            AlertDialog.Builder(this)
                .setTitle("Ubicación desactivada")
                .setMessage("Para usar Venatus necesitas activar la ubicación.")
                .setPositiveButton("Activar GPS") { _, _ ->
                    startActivity(Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                }
                .setNegativeButton("Continuar", null)
                .show()
        }
    }

    // ========== FUNCIONES SIMPLES ==========
    private fun ejecutarZoomIn() {
        webView.evaluateJavascript("javascript:zoomIn()", null)
        Toast.makeText(this, "Zoom aumentado", Toast.LENGTH_SHORT).show()
    }

    private fun ejecutarZoomOut() {
        webView.evaluateJavascript("javascript:zoomOut()", null)
        Toast.makeText(this, "Zoom reducido", Toast.LENGTH_SHORT).show()
    }

    private fun centrarEnMiUbicacion() {
        ultimaUbicacion?.let { location ->
            webView.evaluateJavascript("javascript:centrarEnUbicacion(${location.latitude}, ${location.longitude})", null)
            Toast.makeText(this, "Centrado en tu ubicación", Toast.LENGTH_SHORT).show()
        } ?: run {
            Toast.makeText(this, "Ubicación no disponible", Toast.LENGTH_SHORT).show()
        }
    }

    private fun limpiarMapa() {
        coordenadasCoto = emptyList()
        cotoActual = null
        resetearEstadoVerificacion()

        webView.evaluateJavascript("javascript:limpiarCoto()", null)
        runOnUiThread {
            tvEstado.text = "⏳ Sin coto seleccionado"
            tvCoordinates.text = "Coordenadas: Esperando ubicación..."
            tvCoordinates.setBackgroundColor(0xFF757575.toInt())
        }
        Toast.makeText(this, "Mapa limpiado", Toast.LENGTH_SHORT).show()
    }

    private fun mostrarAlertaEstado(mensaje: String, color: String) {
        val toast = Toast.makeText(this, mensaje, Toast.LENGTH_LONG)
        toast.setGravity(android.view.Gravity.BOTTOM or android.view.Gravity.START, 100, 200)

        val toastView = toast.view
        toastView?.setBackgroundColor(android.graphics.Color.parseColor(color))
        val text = toastView?.findViewById<android.widget.TextView>(android.R.id.message)
        text?.setTextColor(android.graphics.Color.WHITE)
        text?.textSize = 14f

        toast.show()
    }

    private fun mostrarDialogoInicial() {
        AlertDialog.Builder(this)
            .setTitle("Bienvenido a Venatus")
            .setMessage("Seleccione el coto donde quiere cazar.")
            .setPositiveButton("Cargar Cotos") { dialog, which -> cargarListaCotos() }
            .setNegativeButton("Más tarde") { dialog, which -> }
            .show()
    }

    private fun mostrarAcercaDe() {
        AlertDialog.Builder(this)
            .setTitle("🌿 Venatus")
            .setMessage("Sistema de Monitoreo de Cotos\n\nVersión 1.0")
            .setPositiveButton("OK", null)
            .show()
    }

    private fun mostrarError(mensaje: String) {
        Toast.makeText(this, mensaje, Toast.LENGTH_LONG).show()
    }

    private fun mostrarErrorConexion(mensaje: String) {
        AlertDialog.Builder(this)
            .setTitle("Error")
            .setMessage(mensaje)
            .setPositiveButton("Reintentar") { dialog, which -> cargarListaCotos() }
            .setNegativeButton("Cerrar", null)
            .show()
    }

    private fun mostrarSinCotosDisponibles() {
        AlertDialog.Builder(this)
            .setTitle("Sin Cotos")
            .setMessage("No hay cotos disponibles.")
            .setPositiveButton("Reintentar") { dialog, which -> cargarListaCotos() }
            .setNegativeButton("Cerrar", null)
            .show()
    }

    private fun showProgressDialog(message: String) {
        runOnUiThread {
            progressDialog?.dismiss()
            progressDialog = ProgressDialog(this).apply {
                setMessage(message)
                setCancelable(false)
                show()
            }
        }
    }

    private fun dismissProgressDialog() {
        runOnUiThread {
            progressDialog?.dismiss()
            progressDialog = null
        }
    }

    private fun Double.toFixed(digits: Int): String {
        return String.format("%.${digits}f", this)
    }
}