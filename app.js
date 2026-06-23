const fuentesGrupos = gruposPorSemestre;

// ── URLs ─────────────────────────────────────────────────────────────────────
// Apps Script de ESTE proyecto (Eval Transversal) — donde se guardan y leen las notas individuales
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxex8Wmr0FjnsVDeS9NRncbTTpkvj6xD3gojsM_AO4wgam8ew6tvpM0FOW87uEKXD-_Mw/exec";

// ── DOM ───────────────────────────────────────────────────────────────────────
const menuPrincipal          = document.getElementById('menuPrincipal');
const btnModCalificar        = document.getElementById('btnModCalificar');
const btnModConsultar        = document.getElementById('btnModConsultar');
const secCalificar           = document.getElementById('secCalificar');
const secConsultar           = document.getElementById('secConsultar');
const initialModal           = document.getElementById('initialModal');
const confirmModal           = document.getElementById('confirmModal');
const successModal           = document.getElementById('successModal');
const modalSemestre          = document.getElementById('modalSemestre');
const modalMateria           = document.getElementById('modalMateria');
const modalGrupo             = document.getElementById('modalGrupo');
const modalEquipo            = document.getElementById('modalEquipo');
const btnIniciar             = document.getElementById('btnIniciar');
const integrantesContainer   = document.getElementById('integrantesContainer');
const listaIntegrantesTexto  = document.getElementById('listaIntegrantesTexto');
const mainContainer          = document.getElementById('mainContainer');
const subTitle               = document.getElementById('subTitle');
const btnCambiarEquipo       = document.getElementById('btnCambiarEquipo');
const btnConfirmarEvaluacion = document.getElementById('btnConfirmarEvaluacion');
const slidersContainer       = document.getElementById('slidersContainer');
const confirmEquipoText      = document.getElementById('confirmEquipoText');
const confirmBaseText        = document.getElementById('confirmBaseText');
const confirmAlumnosResumen  = document.getElementById('confirmAlumnosResumen');
const btnRegresarConfirm     = document.getElementById('btnRegresarConfirm');
const btnGuardarConfirm      = document.getElementById('btnGuardarConfirm');

// ── Estado ────────────────────────────────────────────────────────────────────
let estadoActual = { semestre: "", materia: "", grupo: "", equipo: "" };
let baseScore = null;
let slidersPorAlumno = {};

// ── Helpers ───────────────────────────────────────────────────────────────────
// La base ya viene ponderada al 60% desde la Rúbrica General.
// Solo se suma el 40% personal del slider. Redondeo estándar (.5 sube).
function calcularNota(base, slider) {
    const raw = base + (slider * 0.4);
    const rounded = Math.round(raw);
    return Math.min(10, Math.max(5, rounded));
}

function colorBadge(nota) {
    if (nota >= 9.5) return "background:#00e676;color:#000";
    if (nota >= 8.0) return "background:#aeea00;color:#000";
    if (nota >= 6.0) return "background:#ffb300;color:#000";
    return "background:#f44336;color:#fff";
}

// ── Cargar base del Sheet de Rúbrica General (solo lectura) ───────────────────
async function cargarBaseScore() {
    const { semestre, grupo, equipo } = estadoActual;
    const badge  = document.getElementById('baseScoreBadge');
    const status = document.getElementById('baseScoreStatus');
    const contrib= document.getElementById('baseScoreContrib');
    baseScore = null;

    badge.textContent  = "…";
    badge.style.cssText = "font-size:1.6rem;font-weight:800;padding:6px 18px;border-radius:10px;background:#e2e8f0;color:#334155;min-width:64px;text-align:center;";
    status.textContent = "Consultando calificación base...";
    contrib.textContent = "";

    try {
        const url = `${URL_APPS_SCRIPT}?accion=base&semestre=${encodeURIComponent(semestre)}&grupo=${encodeURIComponent(grupo)}&equipo=${encodeURIComponent(equipo)}`;
        const resp = await fetch(url);
        const data = await resp.json();

        if (data.status === "success" && data.calificacionBase !== undefined) {
            baseScore = parseFloat(data.calificacionBase);
            badge.textContent  = baseScore.toFixed(1);
            badge.style.cssText = `font-size:1.6rem;font-weight:800;padding:6px 18px;border-radius:10px;min-width:64px;text-align:center;${colorBadge(baseScore)}`;
            status.textContent  = "Calificación base cargada correctamente.";
            contrib.textContent = `Ya ponderada al 60% · Suma con 40% personal = nota final`;
        } else {
            status.textContent = "⚠️ No se encontró calificación base. Verifica que Rúbrica General ya guardó este equipo.";
        }
    } catch (e) {
        status.textContent = "❌ Error al conectar. Verifica conexión y usa 🔄 Recargar.";
        console.error(e);
    }
}

// ── Sliders individuales ──────────────────────────────────────────────────────
function generarSliders(alumnos) {
    slidersContainer.innerHTML = "";
    slidersPorAlumno = {};

    alumnos.forEach(nombre => {
        slidersPorAlumno[nombre] = 5;

        const card = document.createElement('div');
        card.className = "criterion-card slider-alumno-card";
        card.dataset.alumno = nombre;
        card.innerHTML = `
            <label style="font-size:0.88rem;font-weight:700;color:var(--primary-color);margin-bottom:6px;display:block;">${nombre}</label>
            <div style="display:flex;align-items:center;gap:12px;">
                <input type="range" class="slider-alumno" min="0" max="10" step="1" value="5" style="flex:1;" data-alumno="${nombre}">
                <span class="slider-alumno-val" style="font-size:1.1rem;font-weight:800;min-width:28px;text-align:right;">5</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:#94a3b8;padding:0 2px;margin-top:2px;">
                <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
            </div>
            <div style="margin-top:6px;font-size:0.82rem;color:#64748b;">
                Nota estimada: <strong class="nota-preview-val">—</strong>
            </div>`;
        slidersContainer.appendChild(card);

        const sliderEl  = card.querySelector('.slider-alumno');
        const valEl     = card.querySelector('.slider-alumno-val');
        const previewEl = card.querySelector('.nota-preview-val');

        sliderEl.addEventListener('input', () => {
            const val = parseInt(sliderEl.value);
            slidersPorAlumno[nombre] = val;
            valEl.textContent = val;
            actualizarPreview(card, val, previewEl);
        });
    });
}

function actualizarPreview(card, sliderVal, previewEl) {
    if (baseScore === null) { previewEl.textContent = "—"; card.className = "criterion-card slider-alumno-card"; return; }
    const nota = calcularNota(baseScore, sliderVal);
    // MEJORA 1: mostrar sin decimales ya que ahora es entero
    previewEl.textContent = nota.toString();
    card.className = "criterion-card slider-alumno-card";
    if (nota >= 9)    card.classList.add("excelente");
    else if (nota >= 7.5) card.classList.add("bueno");
    else if (nota >= 6)   card.classList.add("regular");
    else card.classList.add("insuficiente");
}

function actualizarTodasLasPreviews() {
    document.querySelectorAll('.slider-alumno-card').forEach(card => {
        const sliderEl  = card.querySelector('.slider-alumno');
        const previewEl = card.querySelector('.nota-preview-val');
        actualizarPreview(card, parseInt(sliderEl.value), previewEl);
    });
}

// ── Cascadas modal configuración ──────────────────────────────────────────────
modalSemestre.addEventListener('change', () => {
    const sem = modalSemestre.value;
    modalMateria.innerHTML = '<option value="">Seleccione una materia...</option>';
    modalGrupo.innerHTML   = '<option value="">Seleccione un grupo...</option>';
    modalEquipo.innerHTML  = '<option value="">Seleccione un equipo...</option>';
    integrantesContainer.style.display = 'none';
    modalMateria.disabled = true; modalGrupo.disabled = true; modalEquipo.disabled = true;
    if (sem) {
        asignaturasPorSemestre[sem].forEach(m => { modalMateria.innerHTML += `<option value="${m}">${m}</option>`; });
        modalMateria.disabled = false;
    }
    validarFormModal();
});

modalMateria.addEventListener('change', () => {
    const sem = modalSemestre.value;
    modalGrupo.innerHTML  = '<option value="">Seleccione un grupo...</option>';
    modalEquipo.innerHTML = '<option value="">Seleccione un equipo...</option>';
    integrantesContainer.style.display = 'none';
    modalGrupo.disabled = true; modalEquipo.disabled = true;
    if (modalMateria.value) {
        fuentesGrupos[sem].forEach(g => { modalGrupo.innerHTML += `<option value="${g}">Grupo ${g}</option>`; });
        modalGrupo.disabled = false;
    }
    validarFormModal();
});

modalGrupo.addEventListener('change', () => {
    modalEquipo.innerHTML = '<option value="">Seleccione un equipo...</option>';
    integrantesContainer.style.display = 'none';
    const grupo = modalGrupo.value;
    if (grupo) {
        const dic = equiposPorGrupo[grupo] || {};
        Object.keys(dic).forEach(eq => { modalEquipo.innerHTML += `<option value="${eq}">${eq}</option>`; });
        modalEquipo.disabled = false;
    }
    validarFormModal();
});

modalEquipo.addEventListener('change', () => {
    const grupo = modalGrupo.value, equipo = modalEquipo.value;
    if (grupo && equipo && equiposPorGrupo[grupo]?.[equipo]) {
        listaIntegrantesTexto.innerText = equiposPorGrupo[grupo][equipo].join(', ');
        integrantesContainer.style.display = 'block';
    } else {
        integrantesContainer.style.display = 'none';
    }
    validarFormModal();
});

function validarFormModal() {
    btnIniciar.disabled = !(modalSemestre.value && modalMateria.value && modalGrupo.value && modalEquipo.value);
}

btnIniciar.addEventListener('click', async () => {
    estadoActual.semestre = modalSemestre.value;
    estadoActual.materia  = modalMateria.value;
    estadoActual.grupo    = modalGrupo.value;
    estadoActual.equipo   = modalEquipo.value;

    subTitle.innerText = `Materia: ${estadoActual.materia} | Grupo: ${estadoActual.grupo} | ${estadoActual.equipo}`;

    const alumnos = equiposPorGrupo[estadoActual.grupo]?.[estadoActual.equipo] || [];
    generarSliders(alumnos);

    initialModal.style.display  = 'none';
    mainContainer.style.display = 'block';

    await cargarBaseScore();
    actualizarTodasLasPreviews();
});

document.getElementById('btnRecargarBase').addEventListener('click', async () => {
    await cargarBaseScore();
    actualizarTodasLasPreviews();
});

btnCambiarEquipo.addEventListener('click', () => {
    mainContainer.style.display = 'none';
    slidersContainer.innerHTML = "";
    slidersPorAlumno = {};
    baseScore = null;
    modalEquipo.value = "";
    integrantesContainer.style.display = 'none';
    validarFormModal();
    initialModal.style.display = 'block';
});

// ── Confirmar ─────────────────────────────────────────────────────────────────
btnConfirmarEvaluacion.addEventListener('click', () => {
    if (baseScore === null) {
        alert("La calificación base no se ha cargado. Usa 🔄 Recargar e intenta de nuevo.");
        return;
    }
    const alumnos = equiposPorGrupo[estadoActual.grupo]?.[estadoActual.equipo] || [];
    confirmEquipoText.textContent = estadoActual.equipo;
    confirmBaseText.textContent   = `${baseScore.toFixed(1)} / 10`;
    confirmAlumnosResumen.innerHTML = "";

    alumnos.forEach(nombre => {
        const slider = slidersPorAlumno[nombre] ?? 5;
        const nota   = calcularNota(baseScore, slider);
        const row = document.createElement('div');
        row.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;";
        row.innerHTML = `
            <span style="font-size:0.85rem;color:#334155;flex:1;">${nombre}</span>
            <span style="font-size:0.8rem;color:#64748b;margin:0 10px;">Slider: ${slider}/10</span>
            <span style="font-size:1rem;font-weight:800;padding:2px 12px;border-radius:12px;${colorBadge(nota)}">${nota}</span>`;
        confirmAlumnosResumen.appendChild(row);
    });
    confirmModal.style.display = 'flex';
});

btnRegresarConfirm.addEventListener('click', () => { confirmModal.style.display = 'none'; });

// ── Guardar (una fila por alumno en el Sheet de Eval Transversal) ─────────────
btnGuardarConfirm.addEventListener('click', async () => {
    btnGuardarConfirm.disabled = true;

    const alumnos = equiposPorGrupo[estadoActual.grupo]?.[estadoActual.equipo] || [];
    const filas = alumnos.map(nombre => ({
        semestre:         estadoActual.semestre,
        materia:          estadoActual.materia,
        grupo:            estadoActual.grupo,
        equipo:           estadoActual.equipo,
        alumno:           nombre,
        calificacionBase: baseScore,
        sliderPersonal:   slidersPorAlumno[nombre] ?? 5,
        notaFinal:        calcularNota(baseScore, slidersPorAlumno[nombre] ?? 5)
    }));

    confirmModal.style.display = 'none';

    const iconEl   = document.getElementById('modalIconContainer');
    const titleEl  = document.getElementById('modalStatusTitle');
    const textEl   = document.getElementById('modalStatusText');
    iconEl.innerHTML = `<div class="loader-spinner"></div>`;
    titleEl.innerText = "Guardando calificaciones...";
    textEl.innerText  = `Registrando ${filas.length} alumnos.`;
    successModal.style.display = 'flex';

    try {
        await fetch(URL_APPS_SCRIPT, {
            method: "POST", mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accion: "guardar", filas })
        });

        iconEl.innerHTML = `<div class="success-checkmark"><div class="check-icon"><span class="icon-line line-tip"></span><span class="icon-line line-long"></span></div></div>`;
        titleEl.innerText = "¡Calificaciones guardadas!";
        textEl.innerText  = `${filas.length} registros individuales enviados.`;

        setTimeout(() => {
            successModal.style.display  = 'none';
            mainContainer.style.display = 'none';
            slidersContainer.innerHTML  = "";
            slidersPorAlumno = {};
            baseScore = null;
            integrantesContainer.style.display = 'none';
            listaIntegrantesTexto.innerText = "";

            modalEquipo.innerHTML = '<option value="">Seleccione un equipo...</option>';
            const dic = equiposPorGrupo[estadoActual.grupo] || {};
            Object.keys(dic).forEach(eq => { modalEquipo.innerHTML += `<option value="${eq}">${eq}</option>`; });
            modalEquipo.value = "";
            modalEquipo.disabled = false;

            validarFormModal();
            btnGuardarConfirm.disabled = false;
            initialModal.style.display = 'block';
        }, 2200);

    } catch (error) {
        console.error(error);
        iconEl.innerHTML = `<div style="width:80px;height:80px;margin:0 auto;border:4px solid var(--reset-color);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--reset-color);font-size:3rem;font-weight:bold;">✕</div>`;
        titleEl.innerText = "Error de Conexión";
        textEl.innerText  = "No se pudo sincronizar. Regresando...";
        setTimeout(() => {
            successModal.style.display = 'none';
            confirmModal.style.display = 'flex';
            btnGuardarConfirm.disabled = false;
        }, 2500);
    }
});

// ── Módulo Consulta ───────────────────────────────────────────────────────────
const readSemestre            = document.getElementById('readSemestre');
const readMateria             = document.getElementById('readMateria');
const readGrupo               = document.getElementById('readGrupo');
const btnBuscarCalificaciones = document.getElementById('btnBuscarCalificaciones');
const loaderConsulta          = document.getElementById('loaderConsulta');
const containerResultados     = document.getElementById('containerResultados');
let datosConsultaCache = [];

btnModCalificar.addEventListener('click', () => {
    menuPrincipal.style.display = 'none';
    secCalificar.classList.add('active');
    initialModal.style.display  = 'block';
    mainContainer.style.display = 'none';
});

btnModConsultar.addEventListener('click', () => {
    menuPrincipal.style.display = 'none';
    secConsultar.classList.add('active');
    containerResultados.innerHTML = "";
    readSemestre.value = "";
    readMateria.innerHTML = '<option value="">Seleccione una materia...</option>';
    readMateria.disabled = true;
    readGrupo.innerHTML  = '<option value="">Seleccione un grupo...</option>';
    readGrupo.disabled   = true;
    btnBuscarCalificaciones.disabled = true;
    // MEJORA 2: ocultar el botón exportar hasta que haya datos cargados
    document.getElementById('btnExportarCURA').style.display = 'none';
});

document.querySelectorAll('.btn-back-menu').forEach(btn => {
    btn.addEventListener('click', () => {
        secCalificar.classList.remove('active');
        secConsultar.classList.remove('active');
        menuPrincipal.style.display = 'flex';
    });
});

readSemestre.addEventListener('change', () => {
    datosConsultaCache = [];
    const sem = readSemestre.value;
    readMateria.innerHTML = '<option value="">Seleccione una materia...</option>';
    readGrupo.innerHTML   = '<option value="">Seleccione un grupo...</option>';
    readMateria.disabled = true; readGrupo.disabled = true; btnBuscarCalificaciones.disabled = true;
    containerResultados.innerHTML = "";
    document.getElementById('btnExportarCURA').style.display = 'none';
    if (sem && asignaturasPorSemestre[sem]) {
        asignaturasPorSemestre[sem].forEach(m => { readMateria.innerHTML += `<option value="${m}">${m}</option>`; });
        readMateria.disabled = false;
    }
});

readMateria.addEventListener('change', () => {
    datosConsultaCache = [];
    const sem = readSemestre.value;
    readGrupo.innerHTML = '<option value="">Seleccione un grupo...</option>';
    readGrupo.disabled = true; btnBuscarCalificaciones.disabled = true;
    containerResultados.innerHTML = "";
    document.getElementById('btnExportarCURA').style.display = 'none';
    if (readMateria.value && fuentesGrupos[sem]) {
        fuentesGrupos[sem].forEach(g => { readGrupo.innerHTML += `<option value="${g}">Grupo ${g}</option>`; });
        readGrupo.disabled = false;
    }
});

readGrupo.addEventListener('change', () => {
    btnBuscarCalificaciones.disabled = !readGrupo.value;
    containerResultados.innerHTML = "";
    datosConsultaCache = [];
    document.getElementById('btnExportarCURA').style.display = 'none';
});

btnBuscarCalificaciones.addEventListener('click', () => {
    const semestre = readSemestre.value, materia = readMateria.value, grupo = readGrupo.value;
    if (!semestre || !grupo) { alert("Selecciona los campos requeridos."); return; }

    containerResultados.innerHTML = "";
    document.getElementById('btnExportarCURA').style.display = 'none';
    loaderConsulta.style.display  = "block";
    const ley = document.createElement('p');
    ley.id = "leyendaCargando";
    ley.style.cssText = "text-align:center;color:#64748b;font-size:0.9rem;margin-top:-10px;margin-bottom:20px;";
    ley.innerText = "Recuperando registros...";
    loaderConsulta.parentNode.insertBefore(ley, loaderConsulta.nextSibling);

    fetch(`${URL_APPS_SCRIPT}?accion=consultar&semestre=${encodeURIComponent(semestre)}&grupo=${encodeURIComponent(grupo)}`)
        .then(r => r.json())
        .then(data => {
            loaderConsulta.style.display = "none";
            document.getElementById('leyendaCargando')?.remove();
            if (data.status === "success" && data.data.length > 0) {
                datosConsultaCache = data.data;
                ejecutarFiltroYRenderizado(materia);
                // MEJORA 3: mostrar botón exportar CURA si hay materia y datos
                if (materia) {
                    document.getElementById('btnExportarCURA').style.display = 'block';
                }
            } else {
                containerResultados.innerHTML = `<p style="text-align:center;color:#64748b;margin-top:20px;">No se encontraron evaluaciones registradas.</p>`;
            }
        })
        .catch(err => {
            loaderConsulta.style.display = "none";
            document.getElementById('leyendaCargando')?.remove();
            containerResultados.innerHTML = `<p style="text-align:center;color:var(--reset-color);margin-top:20px;">Error al conectar.</p>`;
        });
});

// MEJORA 2: la consulta siempre renderiza por alumnos, ya no hay radio buttons
function ejecutarFiltroYRenderizado(materia) {
    containerResultados.innerHTML = "";
    const filtrados = materia ? datosConsultaCache.filter(i => i.materia === materia) : datosConsultaCache;
    if (!filtrados.length) {
        containerResultados.innerHTML = `<p style="text-align:center;color:#64748b;margin-top:20px;">No hay evaluaciones para esta materia.</p>`;
        document.getElementById('btnExportarCURA').style.display = 'none';
        return;
    }
    renderizarPorAlumnos(filtrados);
}

function renderizarPorAlumnos(lista) {
    [...lista].sort((a,b) => a.alumno.localeCompare(b.alumno)).forEach(item => {
        const nota = parseFloat(item.notaFinal);
        const card = document.createElement('div');
        card.className = "card-view";
        card.innerHTML = `
            <div class="card-header-view">
                <div style="flex:1;padding-right:8px;">
                    <h3 style="margin:0 0 2px 0;color:var(--text-main);font-size:1rem;font-weight:700;">${item.alumno}</h3>
                    <span style="font-size:0.78rem;color:#94a3b8;">${item.equipo} · ${item.materia}</span>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                    <span class="score-badge" style="margin:0;${colorBadge(nota)}">${nota}</span>
                    <span style="font-size:0.75rem;color:#64748b;">Slider: ${item.sliderPersonal}/10 · Base: ${item.calificacionBase}</span>
                </div>
            </div>`;
        containerResultados.appendChild(card);
    });
}

// ── MEJORA 3: Exportar Script CURA (P4) ──────────────────────────────────────
// Genera un .txt con el mismo formato que el Generador de Scripts CURA,
// usando la notaFinal de cada alumno como calificación CUR, para columna P4.
// El nombre del archivo: Grupo{grupo}_{materia}.txt

function buildScriptCURA(grupo, materia, alumnos) {
    // alumnos: [{ nombre, notaFinal }]
    const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const datos = alumnos.map(a => `${a.nombre}\t${a.notaFinal}`).join('\n');

    const TEMPLATE_LINES = [
        '// ============================================================',
        '// CONFIGURA AQUI',
        '// ============================================================',
        `// Grupo: ${grupo}  ·  Materia: ${materia}  ·  generado automaticamente, ${fecha}`,
        'const COLUMNA = "P4"; // cambia a P1, P2, P3 o P4 si es necesario',
        '',
        '// Nombre [TAB] Calificacion, uno por linea (ya viene listo, no lo toques)',
        `const DATOS = \`${datos}\`;`,
        '',
        '// ============================================================',
        '// NO NECESITAS TOCAR NADA DE AQUI PARA ABAJO',
        '// ============================================================',
        '',
        'function normalizarCura(texto) {',
        '  return texto',
        '    .normalize("NFKD")',
        '    .replace(/[\\u0300-\\u036f]/g, "")',
        '    .replace(/\\s+/g, " ")',
        '    .trim()',
        '    .toUpperCase();',
        '}',
        '',
        'function setNativeValueCura(input, value) {',
        '  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;',
        '  setter.call(input, value);',
        '  input.dispatchEvent(new Event("input", { bubbles: true }));',
        '  input.dispatchEvent(new Event("change", { bubbles: true }));',
        '}',
        '',
        'function cargarCalificacionesCura() {',
        '  // 1. localizar la columna real (data-field) a partir de la etiqueta visible',
        '  const headers = Array.from(document.querySelectorAll(\'div[role="columnheader"]\'));',
        '  const header = headers.find(h => h.getAttribute("aria-label") === COLUMNA);',
        '  if (!header) {',
        '    console.error(`No encontre la columna "${COLUMNA}". Columnas disponibles:`,',
        '      headers.map(h => h.getAttribute("aria-label")));',
        '    return;',
        '  }',
        '  const dataField = header.getAttribute("data-field");',
        '  console.log(`Columna "${COLUMNA}" -> data-field="${dataField}"`);',
        '',
        '  // 2. indexar filas de la tabla por nombre normalizado',
        '  const filas = Array.from(document.querySelectorAll("div.MuiDataGrid-row"));',
        '  const indice = new Map();',
        '  filas.forEach(fila => {',
        '    const celdaNombre = fila.querySelector(\'div[data-field="student"]\');',
        '    if (!celdaNombre) return;',
        '    indice.set(normalizarCura(celdaNombre.innerText), fila);',
        '  });',
        '  console.log(`Filas detectadas en la tabla: ${indice.size}`);',
        '',
        '  // 3. parsear los datos pegados arriba',
        '  const lineas = DATOS.trim().split("\\n").filter(l => l.trim());',
        '  const alumnos = lineas.map(l => {',
        '    const [nombre, calif] = l.split("\\t");',
        '    return { nombre: nombre.trim(), calificacion: (calif || "").trim() };',
        '  });',
        '  console.log(`Alumnos leidos: ${alumnos.length}`);',
        '',
        '  // 4. capturar',
        '  const noEncontrados = [];',
        '  const bloqueados = [];',
        '  let capturados = 0;',
        '',
        '  alumnos.forEach(({ nombre, calificacion }) => {',
        '    if (!calificacion) { noEncontrados.push(`${nombre} (sin calificacion)`); return; }',
        '    const fila = indice.get(normalizarCura(nombre));',
        '    if (!fila) { noEncontrados.push(nombre); return; }',
        '',
        '    const celda = fila.querySelector(`div[data-field="${dataField}"]`);',
        '    const input = celda ? celda.querySelector("input") : null;',
        '    if (!input) { noEncontrados.push(`${nombre} (sin input en esa columna)`); return; }',
        '    if (input.disabled) { bloqueados.push(nombre); return; }',
        '',
        '    setNativeValueCura(input, calificacion);',
        '    capturados++;',
        '    console.log(`OK  ${nombre} -> ${calificacion}`);',
        '  });',
        '',
        '  console.log("\\n--- RESUMEN ---");',
        '  console.log(`Capturados: ${capturados}`);',
        '  console.log("No encontrados:", noEncontrados);',
        '  console.log("Bloqueados (celda deshabilitada):", bloqueados);',
        '  console.log("\\nRevisa la tabla en pantalla. Si todo se ve bien, corre: guardarCalificacionesCura()");',
        '}',
        '',
        'function guardarCalificacionesCura() {',
        '  const botones = Array.from(document.querySelectorAll("button"));',
        '  const boton = botones.find(b => b.textContent.trim() === "Guardar");',
        '  if (!boton) {',
        '    console.error("No encontre el boton \'Guardar\'. Guardalo manualmente.");',
        '    return;',
        '  }',
        '  boton.click();',
        '  console.log("Clic en \'Guardar\' realizado. Verifica que se haya confirmado en pantalla.");',
        '}',
        '',
        'cargarCalificacionesCura();'
    ];

    return TEMPLATE_LINES.join('\n');
}

document.getElementById('btnExportarCURA').addEventListener('click', () => {
    const grupo   = readGrupo.value;
    const materia = readMateria.value;
    if (!grupo || !materia) { alert("Selecciona grupo y materia antes de exportar."); return; }

    const filtrados = datosConsultaCache.filter(i => i.materia === materia);
    if (!filtrados.length) { alert("No hay datos para exportar."); return; }

    // Tomar el registro más reciente por alumno (si hay duplicados, quedarse con el último)
    const porAlumno = {};
    filtrados.forEach(item => { porAlumno[item.alumno] = item; });

    // Ordenar A-Z
    const alumnos = Object.values(porAlumno)
        .sort((a, b) => a.alumno.localeCompare(b.alumno))
        .map(item => ({
            nombre:    item.alumno.trim().replace(/\s+/g, ' ').replace(/`/g, "'").replace(/\$\{/g, '$ {'),
            notaFinal: parseFloat(item.notaFinal)
        }));

    const texto    = buildScriptCURA(grupo, materia, alumnos);
    // Nombre: Grupo{grupo}_{materia}.txt — se reemplazan caracteres no permitidos en nombre de archivo
    const nombreArchivo = `Grupo${grupo}_${materia.replace(/[/\\:*?"<>|]/g, '_')}.txt`;

    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = nombreArchivo;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});
