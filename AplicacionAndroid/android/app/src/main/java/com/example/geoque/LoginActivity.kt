package com.example.geoque

import android.Manifest
import android.app.AlertDialog
import android.app.ProgressDialog
import android.content.Context
import android.content.Intent
import android.location.LocationManager
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class LoginActivity : AppCompatActivity() {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private lateinit var btnLogin: Button
    private var progressDialog: ProgressDialog? = null

    private val requestPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true) {
                checkLocationEnabled()
            } else {
                Toast.makeText(this, "Se requiere permiso de ubicación", Toast.LENGTH_LONG).show()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val etUsuario = findViewById<EditText>(R.id.etUsuario)
        val etContrasena = findViewById<EditText>(R.id.etContrasena)
        btnLogin = findViewById<Button>(R.id.btnLogin)

        btnLogin.setOnClickListener {
            val usuario = etUsuario.text.toString().trim()
            val contrasena = etContrasena.text.toString().trim()

            if (usuario.isEmpty() || contrasena.isEmpty()) {
                Toast.makeText(this, "Ingresa usuario y contraseña", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnLogin.isEnabled = false
            btnLogin.text = "Verificando..."
            showProgressDialog("Validando credenciales...")

            validarCredenciales(usuario, contrasena)
        }

        checkLocationPermission()
    }

    private fun validarCredenciales(usuario: String, contrasena: String) {
        val url = "http://192.168.1.64:3000/validar-login"

        val json = JSONObject().apply {
            put("usuario", usuario)
            put("contrasena", contrasena)
        }

        Log.d("LOGIN", "🔐 Intentando login...")
        Log.d("LOGIN", "📤 URL: $url")
        Log.d("LOGIN", "📤 JSON enviado: $json")

        val body = RequestBody.create("application/json; charset=utf-8".toMediaType(), json.toString())

        val request = Request.Builder()
            .url(url)
            .post(body)
            .addHeader("Content-Type", "application/json")
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("LOGIN", "❌ Error de conexión: ${e.message}")
                runOnUiThread {
                    dismissProgressDialog()
                    resetLoginButton()
                    mostrarErrorConexion("Error de conexión al servidor: ${e.message}")
                }
            }

            override fun onResponse(call: Call, response: Response) {
                val respuesta = response.body?.string() ?: ""
                Log.d("LOGIN", "📥 Código HTTP: ${response.code}")
                Log.d("LOGIN", "📥 Respuesta CRUDA: $respuesta")
                Log.d("LOGIN", "📥 Headers: ${response.headers}")

                runOnUiThread {
                    dismissProgressDialog()
                    resetLoginButton()

                    when {
                        response.isSuccessful -> {
                            try {
                                Log.d("LOGIN", "✅ Respuesta exitosa, procesando JSON...")
                                val jsonResponse = JSONObject(respuesta)

                                if (jsonResponse.getBoolean("valido")) {
                                    val nombreUsuario = jsonResponse.getString("nombre")
                                    val idUsuario = jsonResponse.getInt("id")

                                    Log.d("LOGIN", "✅ Login exitoso - Usuario: $nombreUsuario, ID: $idUsuario")

                                    Toast.makeText(this@LoginActivity, "✅ Bienvenido $nombreUsuario", Toast.LENGTH_SHORT).show()

                                    val intent = Intent(this@LoginActivity, MainActivity::class.java)
                                    intent.putExtra("nombreUsuario", nombreUsuario)
                                    intent.putExtra("idUsuario", idUsuario)
                                    startActivity(intent)
                                    finish()
                                } else {
                                    Log.d("LOGIN", "❌ Login fallido - credenciales inválidas")
                                    Toast.makeText(this@LoginActivity, "❌ Usuario o contraseña incorrectos", Toast.LENGTH_LONG).show()
                                }
                            } catch (e: Exception) {
                                Log.e("LOGIN", "❌ Error parseando JSON: ${e.message}")
                                Toast.makeText(this@LoginActivity, "Error procesando respuesta: ${e.message}", Toast.LENGTH_LONG).show()
                            }
                        }
                        else -> {
                            Log.e("LOGIN", "❌ Error HTTP: ${response.code} - $respuesta")
                            when (response.code) {
                                401 -> Toast.makeText(this@LoginActivity, "❌ Usuario o contraseña incorrectos", Toast.LENGTH_LONG).show()
                                else -> mostrarErrorConexion("Error del servidor: ${response.code} - $respuesta")
                            }
                        }
                    }
                }
            }
        })
    }

    private fun mostrarErrorConexion(mensaje: String) {
        AlertDialog.Builder(this)
            .setTitle("❌ Error de Conexión")
            .setMessage("$mensaje\n\nAsegúrate de que el servidor esté ejecutándose.")
            .setPositiveButton("Reintentar", null)
            .show()
    }

    private fun showProgressDialog(message: String) {
        progressDialog = ProgressDialog(this).apply {
            setMessage(message)
            setCancelable(false)
            show()
        }
    }

    private fun dismissProgressDialog() {
        progressDialog?.dismiss()
        progressDialog = null
    }

    private fun resetLoginButton() {
        btnLogin.isEnabled = true
        btnLogin.text = "Iniciar Sesión"
    }

    private fun checkLocationPermission() {
        val finePermission = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
        val coarsePermission = checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)

        if (finePermission != android.content.pm.PackageManager.PERMISSION_GRANTED &&
            coarsePermission != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        } else {
            checkLocationEnabled()
        }
    }

    private fun checkLocationEnabled() {
        val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        val networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

        if (!gpsEnabled && !networkEnabled) {
            AlertDialog.Builder(this)
                .setTitle("Ubicación desactivada")
                .setMessage("Por favor, activa la ubicación para continuar usando Venatus.")
                .setPositiveButton("Activar") { _, _ ->
                    startActivity(Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                }
                .setNegativeButton("Continuar", null)
                .show()
        }
    }
}