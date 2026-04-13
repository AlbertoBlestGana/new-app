let equipo = "";
let curso = "";
let nombre = "";
let apellido = "";

const beep = new Audio("https://www.soundjay.com/buttons/beep-07.wav");

// Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
}

// Guardar usuario
function guardarUsuario() {
    nombre = document.getElementById("nombre").value.trim();
    apellido = document.getElementById("apellido").value.trim();

    if (!nombre || !apellido) {
        alert("Completa nombre y apellido");
        return;
    }

    localStorage.setItem("usuario", JSON.stringify({ nombre, apellido }));
    iniciarApp();
}

// Cambiar usuario
function cambiarUsuario() {
    localStorage.removeItem("usuario");
    location.reload();
}

// Iniciar app
function iniciarApp() {
    let usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) return;

    nombre = usuario.nombre;
    apellido = usuario.apellido;

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    document.getElementById("usuario").innerText =
        `👤 ${nombre} ${apellido}`;

    cargarHistorial();

    iniciarQR("reader-equipo", "equipo");
    iniciarQR("reader-curso", "curso");
}

// Validación básica QR
function validarQR(texto) {
    return texto.length > 2;
}

// Iniciar QR
async function iniciarQR(id, tipo) {
    const qr = new Html5Qrcode(id);

    const devices = await Html5Qrcode.getCameras();

    if (devices && devices.length) {
        const camaraTrasera = devices.find(d =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear")
        );

        const cameraId = camaraTrasera ? camaraTrasera.id : devices[0].id;

        qr.start(
            cameraId,
            { fps: 10 },
            (decodedText) => {

                if (!validarQR(decodedText)) return;

                beep.play();

                if (tipo === "equipo") {
                    equipo = decodedText;
                    document.getElementById("equipo").innerText = decodedText;
                } else {
                    curso = decodedText;
                    document.getElementById("curso").innerText = decodedText;
                }

                qr.stop();

                if (equipo && curso) {
                    guardar();
                    reiniciarEscaneo();
                }
            }
        );
    }
}

// Guardar registro
function guardar() {
    let registros = JSON.parse(localStorage.getItem("registros")) || [];

    registros.push({
        nombre,
        apellido,
        equipo,
        curso,
        fecha: new Date().toISOString()
    });

    localStorage.setItem("registros", JSON.stringify(registros));

    equipo = "";
    curso = "";

    cargarHistorial();
}

// Historial
function cargarHistorial() {
    let registros = JSON.parse(localStorage.getItem("registros")) || [];

    let html = "";

    registros.slice(-10).reverse().forEach(r => {
        html += `<div>${r.nombre} ${r.apellido} | ${r.equipo} | ${r.curso}</div>`;
    });

    document.getElementById("historial").innerHTML = html;
}

// Reiniciar escaneo
function reiniciarEscaneo() {
    document.getElementById("equipo").innerText = "";
    document.getElementById("curso").innerText = "";

    iniciarQR("reader-equipo", "equipo");
    iniciarQR("reader-curso", "curso");
}

// Exportar CSV
function exportarCSV() {
    let registros = JSON.parse(localStorage.getItem("registros")) || [];

    let csv = "Nombre;Apellido;Equipo;Curso;Fecha\n";

    registros.forEach(r => {
        let fecha = new Date(r.fecha).toLocaleString();
        csv += `${r.nombre};${r.apellido};${r.equipo};${r.curso};${fecha}\n`;
    });

    let blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });

    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "registros.csv";
    a.click();
}

// Finalizar registro
function finalizarRegistro() {
    if (confirm("¿Finalizar y exportar Excel?")) {
        exportarCSV();
    }
}

// Auto inicio
window.onload = () => {
    if (localStorage.getItem("usuario")) {
        iniciarApp();
    }
};
