
let nombre = "";
let apellido = "";
let equipo = "";
let curso = "";
let paso = "equipo"; // 🔥 control de flujo

const beep = new Audio("https://www.soundjay.com/buttons/beep-07.wav");

// SW
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
}

/* ---------------- LOGIN ---------------- */

function guardarUsuario() {
    nombre = document.getElementById("nombre").value.trim();
    apellido = document.getElementById("apellido").value.trim();

    if (!nombre || !apellido) {
        alert("Completa datos");
        return;
    }

    localStorage.setItem("usuario", JSON.stringify({ nombre, apellido }));
    iniciarApp();
}

function cambiarUsuario() {
    localStorage.removeItem("usuario");
    location.reload();
}

/* ---------------- APP ---------------- */

function iniciarApp() {
    const user = JSON.parse(localStorage.getItem("usuario"));
    if (!user) return;

    nombre = user.nombre;
    apellido = user.apellido;

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    document.getElementById("usuario").innerText =
        `👤 ${nombre} ${apellido}`;

    cargarHistorial();
    iniciarEscaneo();
}

/* ---------------- ESCANEO ---------------- */

async function iniciarEscaneo() {
    const qr = new Html5Qrcode("reader");

    const devices = await Html5Qrcode.getCameras();

    if (!devices.length) {
        alert("No hay cámara disponible");
        return;
    }

    // 🔥 FORZAR CÁMARA TRASERA REAL
    let cameraId = devices[0].id;

    for (let d of devices) {
        const label = d.label.toLowerCase();
        if (
            label.includes("back") ||
            label.includes("rear") ||
            label.includes("environment") ||
            label.includes("trasera") ||
            label.includes("posterior")
        ) {
            cameraId = d.id;
            break;
        }
    }

    qr.start(
        cameraId,
        { fps: 10, aspectRatio: 1.777 },
        async (text) => {

            if (text.length < 2) return;

            beep.play();

            // 🔥 FLUJO SECUENCIAL
            if (paso === "equipo") {

                equipo = text;
                document.getElementById("resultado").innerText =
                    "Equipo: " + text;

                paso = "curso";

                qr.stop();
                setTimeout(() => iniciarEscaneo(), 500);
            }

            else if (paso === "curso") {

                curso = text;
                document.getElementById("resultado").innerText =
                    `Equipo: ${equipo} | Curso: ${curso}`;

                guardarRegistro();

                paso = "equipo";

                qr.stop();
                setTimeout(() => iniciarEscaneo(), 500);
            }
        }
    );
}

/* ---------------- GUARDAR ---------------- */

function guardarRegistro() {
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

/* ---------------- HISTORIAL ---------------- */

function cargarHistorial() {
    let registros = JSON.parse(localStorage.getItem("registros")) || [];

    let html = "";

    registros.slice(-10).reverse().forEach(r => {
        html += `<div>${r.nombre} ${r.apellido} | ${r.equipo} | ${r.curso}</div>`;
    });

    document.getElementById("historial").innerHTML = html;
}

/* ---------------- EXPORT EXCEL ---------------- */

function exportarCSV() {
    let registros = JSON.parse(localStorage.getItem("registros")) || [];

    let csv = "Nombre;Apellido;Equipo;Curso;Fecha\n";

    registros.forEach(r => {
        let fecha = new Date(r.fecha).toLocaleString();
        csv += `${r.nombre};${r.apellido};${r.equipo};${r.curso};${fecha}\n`;
    });

    let blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "registros.csv";
    a.click();
}

function finalizarRegistro() {
    if (confirm("Exportar Excel?")) {
        exportarCSV();
    }
}

/* ---------------- AUTO LOGIN ---------------- */

window.onload = () => {
    if (localStorage.getItem("usuario")) {
        iniciarApp();
    }
};
