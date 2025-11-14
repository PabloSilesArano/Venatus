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

    private lateinit var webView: WebView
    private lateinit var tvCoordinates: TextView
    private lateinit var tvEstado: TextView
    private lateinit var btnMenu: TextView
    private lateinit var locationManager: LocationManager

    private var cotoActual: String? = null
    private var coordenadasCoto: List<List<Double>> = emptyList()
    private var ultimaUbicacion: Location? = null
    private var dentroDelCoto = false
    private var primeraVerificacion = true
    private var alertaMostrada = false
    private var progressDialog: ProgressDialog? = null

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    // Handler para enviar ubicación periódicamente
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
                // Iniciar envío de ubicación después de obtener permisos
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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Ocultar la action bar
        supportActionBar?.hide()

        webView = findViewById(R.id.mapWebView)
        tvCoordinates = findViewById(R.id.tvCoordinates)
        tvEstado = findViewById(R.id.tvEstado)
        btnMenu = findViewById(R.id.btnMenu)
        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager

        setupWebView()
        setupMenuButton()
        checkLocationPermission()

        registerReceiver(gpsReceiver, IntentFilter(LocationManager.PROVIDERS_CHANGED_ACTION))

        // Mostrar diálogo inicial
        webView.postDelayed({
            mostrarDialogoInicial()
        }, 1000)
    }

    private fun setupMenuButton() {
        btnMenu.setOnClickListener {
            mostrarMenuFlotante()
        }

        // Agregar elevación para efecto de sombra
        btnMenu.elevation = 12f
    }

    private fun mostrarMenuFlotante() {
        val estadoCoto = when {
            cotoActual == null -> "❌ Sin coto"
            dentroDelCoto -> "✅ En coto: $cotoActual"
            else -> "🚫 Fuera de: $cotoActual"
        }

        val opciones = arrayOf(
            "🌿 Cargar Cotos - $estadoCoto",
            "➕ Aumentar Zoom",
            "➖ Reducir Zoom",
            "🗑️ Limpiar Mapa",
            "📍 Centrar en mi ubicación",
            "ℹ️ Acerca de"
        )

        AlertDialog.Builder(this)
            .setTitle("Venatus - Menú")
            .setItems(opciones) { dialog, which ->
                when (which) {
                    0 -> cargarListaCotos()
                    1 -> {
                        webView.evaluateJavascript("javascript:zoomIn()", null)
                        Toast.makeText(this, "Zoom aumentado", Toast.LENGTH_SHORT).show()
                    }
                    2 -> {
                        webView.evaluateJavascript("javascript:zoomOut()", null)
                        Toast.makeText(this, "Zoom reducido", Toast.LENGTH_SHORT).show()
                    }
                    3 -> limpiarMapa()
                    4 -> centrarEnMiUbicacion()
                    5 -> mostrarAcercaDe()
                }
            }
            .setNegativeButton("Cerrar", null)
            .show()
    }

    private fun centrarEnMiUbicacion() {
        ultimaUbicacion?.let { location ->
            webView.evaluateJavascript("javascript:centrarEnUbicacion(${location.latitude}, ${location.longitude})", null)
            Toast.makeText(this, "Centrado en tu ubicación", Toast.LENGTH_SHORT).show()
        } ?: run {
            Toast.makeText(this, "Ubicación no disponible", Toast.LENGTH_SHORT).show()
        }
    }

    private fun mostrarAcercaDe() {
        AlertDialog.Builder(this)
            .setTitle("🌿 Venatus")
            .setMessage("Sistema de Monitoreo de Cotos\n\nVersión 1.0")
            .setPositiveButton("OK", null)
            .show()
    }

    private fun mostrarDialogoInicial() {
        AlertDialog.Builder(this)
            .setTitle("Bienvenido a Venatus")
            .setMessage("Seleccione el coto donde quiere cazar.")
            .setPositiveButton("Cargar Cotos") { dialog, which ->
                cargarListaCotos()
            }
            .setNegativeButton("Más tarde") { dialog, which ->
                // No hacer nada
            }
            .show()
    }

    private fun limpiarMapa() {
        coordenadasCoto = emptyList()
        cotoActual = null
        dentroDelCoto = false
        primeraVerificacion = true
        alertaMostrada = false

        webView.evaluateJavascript("javascript:limpiarCoto()", null)

        runOnUiThread {
            tvEstado.text = "⏳ Sin coto seleccionado"
            tvCoordinates.text = "Coordenadas: Esperando ubicación..."
            tvCoordinates.setBackgroundColor(0xFF757575.toInt())
        }

        Toast.makeText(this, "Mapa limpiado", Toast.LENGTH_SHORT).show()
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
                runOnUiThread {
                    tvCoordinates.text = text
                }
            }
        }, "AndroidInterface")

        webView.loadUrl("file:///android_asset/mapa_limpio.html")
    }

    // Función para enviar ubicación al servidor
    private fun enviarUbicacionAlServidor(location: Location) {
        val idUsuario = intent.getIntExtra("idUsuario", 0)
        val nombreUsuario = intent.getStringExtra("nombreUsuario") ?: "Usuario"

        if (idUsuario == 0) {
            Log.d("UBICACION", "❌ ID de usuario no disponible")
            return
        }

        val url = "http://192.168.1.64:3000/socio/ubicacion"
        val json = JSONObject().apply {
            put("idUsuario", idUsuario)
            put("nombre", nombreUsuario)
            put("lat", location.latitude)
            put("lng", location.longitude)
        }

        val body = RequestBody.create("application/json; charset=utf-8".toMediaType(), json.toString())
        val request = Request.Builder()
            .url(url)
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.d("UBICACION", "❌ Error enviando ubicación: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                Log.d("UBICACION", "✅ Ubicación enviada al servidor - ${response.code}")
            }
        })
    }

    private fun cargarListaCotos() {
        showProgressDialog("Cargando cotos...")

        val url = "http://192.168.1.64:3000/areas"
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

    private fun mostrarErrorConexion(mensaje: String) {
        AlertDialog.Builder(this)
            .setTitle("Error")
            .setMessage(mensaje)
            .setPositiveButton("Reintentar") { dialog, which ->
                cargarListaCotos()
            }
            .setNegativeButton("Cerrar", null)
            .show()
    }

    private fun mostrarSinCotosDisponibles() {
        AlertDialog.Builder(this)
            .setTitle("Sin Cotos")
            .setMessage("No hay cotos disponibles.")
            .setPositiveButton("Reintentar") { dialog, which ->
                cargarListaCotos()
            }
            .setNegativeButton("Cerrar", null)
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

        val builder = AlertDialog.Builder(this)
        builder.setTitle("Selecciona un coto")

        val adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, cotos)

        builder.setAdapter(adapter) { dialog, which ->
            val cotoSeleccionado = cotos[which]
            val idCoto = cotosMap[cotoSeleccionado]
            cotoActual = cotoSeleccionado
            Toast.makeText(this, "Cargando: $cotoSeleccionado", Toast.LENGTH_SHORT).show()
            cargarCoordenadasCoto(idCoto!!)
        }

        builder.setNegativeButton("Cancelar", null)
        builder.show()
    }

    private fun cargarCoordenadasCoto(idCoto: String) {
        showProgressDialog("Cargando coto...")

        val url = "http://192.168.1.64:3000/areas/$idCoto"
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

                                    // FORZAR INICIO DE UBICACIÓN
                                    checkLocationPermission()

                                    // Iniciar envío de ubicación al servidor
                                    ubicacionUpdateHandler.postDelayed(enviarUbicacionRunnable, 5000)

                                    // RESETEAR para nueva verificación
                                    primeraVerificacion = true
                                    dentroDelCoto = false
                                    alertaMostrada = false

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

    private fun verificarUbicacionEnCoto(location: Location) {
        if (coordenadasCoto.isEmpty()) {
            return
        }

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
            // Iniciar envío de ubicación si ya tenemos permisos
            ubicacionUpdateHandler.postDelayed(enviarUbicacionRunnable, 5000)
        }
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

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED) {
            try {
                Log.d("LOCATION", "📍 Iniciando actualizaciones de ubicación...")

                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    2000L,  // 2 segundos
                    5f,     // 5 metros
                    this
                )

                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    2000L,  // 2 segundos
                    10f,    // 10 metros
                    this
                )

                // Intentar obtener ubicación actual inmediatamente
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
    private fun obtenerUltimaUbicacionConocida(): Location? {
        val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        var location: Location? = null

        // Intentar obtener de GPS primero
        location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
        if (location == null) {
            // Si no hay GPS, intentar con red
            location = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
        }

        if (location != null) {
            Log.d("LOCATION", "📍 Última ubicación conocida: ${location.latitude}, ${location.longitude}")
        } else {
            Log.d("LOCATION", "📍 No hay ubicación conocida disponible")
        }

        return location
    }

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

        // ACTUALIZAR EL TEXTO DE ESTADO
        runOnUiThread {
            tvEstado.text = estadoTexto
        }

        webView.evaluateJavascript("javascript:actualizarPosicion($lat, $lng)", null)

        runOnUiThread {
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

    private fun Double.toFixed(digits: Int): String {
        return String.format("%.${digits}f", this)
    }

    override fun onLocationChanged(location: Location) {
        updateWebViewPosition(location)
        verificarUbicacionEnCoto(location)
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            locationManager.removeUpdates(this)
        } catch (e: Exception) {
            Log.e("MAIN", "Error removing location updates: ${e.message}")
        }
        try {
            unregisterReceiver(gpsReceiver)
        } catch (e: Exception) {
            Log.e("MAIN", "Error unregistering receiver: ${e.message}")
        }
        // Detener el envío de ubicación
        ubicacionUpdateHandler.removeCallbacks(enviarUbicacionRunnable)
        progressDialog?.dismiss()
    }

    override fun onProviderEnabled(provider: String) {}
    override fun onProviderDisabled(provider: String) {}
}