document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map', { zoomControl: true }).setView([40.4168, -3.7038], 6);
  map.zoomControl.setPosition('topright');

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let puntos = [], marcadores = [];
  let poligono = L.polygon([], { color: '#ff4757', fillColor:'#ff6b6b', fillOpacity: 0.2 }).addTo(map);
  const areaTooltip = document.getElementById('areaTooltip');

  const menuBtn = document.getElementById('menuBtn');
  const menuOpciones = document.getElementById('menuOpciones');
  const inputCSV = document.getElementById('archivoCSV');
  const botonCargarCSV = document.getElementById('botonCargarCSV');
  const botonGuardar = document.getElementById('guardarCSV');
  const botonBorrar = document.getElementById('borrarTodo');
  const botonGuardarFirebird = document.getElementById('guardarFirebird'); // 🔥 nuevo botón

  let marcadorUsuario = null, circuloPrecision = null, posicionActual = null;

  menuBtn.addEventListener('click', () => menuOpciones.classList.toggle('show'));
  document.addEventListener('click', e => {
    if (!document.getElementById('panel').contains(e.target)) menuOpciones.classList.remove('show');
  });

  const smallIcon = L.divIcon({
    className: 'small-div-icon',
    html: '<span class="small-dot" style="background:#2A93EE;"></span>',
    iconSize: [10,10],
    iconAnchor: [5,5]
  });

  function actualizarPoligono() {
    const coords = marcadores.map(m => [m.getLatLng().lat, m.getLatLng().lng]);
    poligono.setLatLngs(coords);

    if (coords.length >= 3) {
      const turfCoords = coords.map(c => [c[1], c[0]]);
      const poly = turf.polygon([[...turfCoords, turfCoords[0]]]);
      const area = turf.area(poly)/1_000_000;
      areaTooltip.textContent = `Área: ${area.toFixed(2)} km²`;
    } else {
      areaTooltip.textContent = 'Área: 0 km²';
      if (marcadorUsuario) marcadorUsuario.remove(), marcadorUsuario=null;
      if (circuloPrecision) circuloPrecision.remove(), circuloPrecision=null;
    }

    verificarUbicacionEnArea();
  }

  function crearMarcador(latlng) {
    const marcador = L.marker(latlng, { draggable:true, icon:smallIcon }).addTo(map);

    marcador.on('drag', () => {
      puntos = marcadores.map(m => [m.getLatLng().lng, m.getLatLng().lat]);
      actualizarPoligono();
    });

    marcador.on('contextmenu', () => {
      marcador.remove();
      marcadores = marcadores.filter(m => m !== marcador);
      puntos = marcadores.map(m => [m.getLatLng().lng, m.getLatLng().lat]);
      actualizarPoligono();
    });

    let lastTap = 0;
    marcador.on('click', () => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 400 && window.innerWidth <= 768) {
        marcador.remove();
        marcadores = marcadores.filter(m => m !== marcador);
        puntos = marcadores.map(m => [m.getLatLng().lng, m.getLatLng().lat]);
        actualizarPoligono();
      }
      lastTap = currentTime;
    });

    return marcador;
  }

  map.on('click', e => {
    const lnglat = [e.latlng.lng, e.latlng.lat];
    puntos.push(lnglat);
    const marcador = crearMarcador(e.latlng);
    marcadores.push(marcador);
    actualizarPoligono();
  });

  function limpiarMapa() {
    marcadores.forEach(m => m.remove());
    puntos = []; marcadores = [];
    poligono.remove();
    poligono = L.polygon([], { color:'#ff4757', fillColor:'#ff6b6b', fillOpacity:0.2 }).addTo(map);
    areaTooltip.textContent = 'Área: 0 km²';
    if (marcadorUsuario) marcadorUsuario.remove(), marcadorUsuario=null;
    if (circuloPrecision) circuloPrecision.remove(), circuloPrecision=null;
  }

  botonCargarCSV.addEventListener('click',()=>inputCSV.click());
  inputCSV.addEventListener('change', ev => {
    const file = ev.target.files[0];
    if(!file) return;
    limpiarMapa();
    Papa.parse(file,{header:true,dynamicTyping:true,complete: res=>{
      res.data.forEach(r=>{
        if(typeof r.latitud==='number' && typeof r.longitud==='number'){
          const p=[r.longitud, r.latitud];
          puntos.push(p);
          const m = crearMarcador([p[1],p[0]]);
          marcadores.push(m);
        }
      });
      actualizarPoligono();
      if(marcadores.length>0) map.fitBounds(poligono.getBounds());
    }});
  });

  // 🟢 GUARDAR COMO CSV
  botonGuardar.addEventListener('click', () => {
    if(puntos.length===0) return alert('No hay puntos para guardar');
    const nombreArchivo = prompt("Introduce un nombre para el archivo CSV:", "area");
    if(!nombreArchivo) return;
    const data=puntos.map((p,i)=>({id:i+1,latitud:p[1],longitud:p[0]}));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${nombreArchivo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  });

  // 🟡 GUARDAR EN FIREBIRD
  botonGuardarFirebird.addEventListener('click', () => {
    if (puntos.length === 0) return alert('No hay puntos para guardar');

    const nombre = prompt("Introduce un nombre para el área:", "Nuevo Coto");
    if (!nombre) return;

    // Calcular el centro
    const lats = puntos.map(p => p[1]);
    const lngs = puntos.map(p => p[0]);
    const centro_x = lngs.reduce((a,b)=>a+b,0) / lngs.length;
    const centro_y = lats.reduce((a,b)=>a+b,0) / lats.length;

    fetch('http://localhost:5000/guardar_firebird', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        nombre,
        centro_x,
        centro_y,
        perimetro: JSON.stringify(puntos)
      })
    })
    .then(res => res.json())
    .then(data => alert(data.mensaje))
    .catch(err => {
      console.error('Error al guardar en Firebird:', err);
      alert("Error al conectar con el servidor Node.js");
    });
  });

  botonBorrar.addEventListener('click', () => {
    limpiarMapa();
    menuOpciones.classList.remove('show');
  });

  function verificarUbicacionEnArea(){
    if(!posicionActual || puntos.length<3){
      if(marcadorUsuario) marcadorUsuario.remove(), marcadorUsuario=null;
      if(circuloPrecision) circuloPrecision.remove(), circuloPrecision=null;
      return;
    }

    const {latitude:lat, longitude:lng, accuracy}=posicionActual;
    const pt=turf.point([lng,lat]);
    const poly=turf.polygon([[...puntos,puntos[0]]]);
    const inside=turf.booleanPointInPolygon(pt,poly);

    if(inside){
      if(!marcadorUsuario){
        marcadorUsuario = L.marker([lat, lng], {
          icon:L.divIcon({
            html:`<div style="
              width:20px;height:20px;
              background:#2ecc71;
              border:2px solid white;
              border-radius:50%;
              pointer-events:none;
            "></div>`,
            className:'',
            iconSize:[20,20],
            iconAnchor:[10,10]
          })
        }).addTo(map);
      } else marcadorUsuario.setLatLng([lat, lng]);

      if(!circuloPrecision){
        circuloPrecision=L.circle([lat, lng],{
          radius: Math.max(accuracy,30),
          color:'#05d75cb5',
          fillColor:'#05d75cb5',
          fillOpacity:0.1,
          weight:1
        }).addTo(map);
      } else circuloPrecision.setLatLng([lat, lng]).setRadius(Math.max(accuracy,30));
    } else {
      if(marcadorUsuario) marcadorUsuario.remove(), marcadorUsuario=null;
      if(circuloPrecision) circuloPrecision.remove(), circuloPrecision=null;
    }
  }

  // Geolocalización
  if(navigator.geolocation){
    navigator.geolocation.watchPosition(
      pos => {
        posicionActual = pos.coords;
        verificarUbicacionEnArea();
      },
      err => {
        if(err.code === 1) alert("Permiso denegado. Activa la ubicación para ver tu posición.");
        else if(err.code === 2) alert("Ubicación no disponible. Activa el GPS de tu dispositivo.");
        else if(err.code === 3) alert("Tiempo de espera agotado al obtener ubicación.");
      },
      { enableHighAccuracy:true, maximumAge:5000, timeout:10000 }
    );
  } else {
    alert("Tu navegador no soporta geolocalización.");
  }
});
