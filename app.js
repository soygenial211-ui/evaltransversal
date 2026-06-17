const fuentesGrupos = gruposPorSemestre;

// Contenedores de Navegación de Flujo Principal
const menuPrincipal = document.getElementById('menuPrincipal');
const btnModCalificar = document.getElementById('btnModCalificar');
const btnModConsultar = document.getElementById('btnModConsultar');
const secCalificar = document.getElementById('secCalificar');
const secConsultar = document.getElementById('secConsultar');

// Modales del DOM
const initialModal = document.getElementById('initialModal');
const confirmModal = document.getElementById('confirmModal');
const successModal = document.getElementById('successModal');

// Selectores del Modal Inicial
const modalSemestre = document.getElementById('modalSemestre');
const modalMateria = document.getElementById('modalMateria');
const modalGrupo = document.getElementById('modalGrupo');
const modalEquipo = document.getElementById('modalEquipo');
const btnIniciar = document.getElementById('btnIniciar');

// Referencias a la UI de integrantes en el modal de configuración
const integrantesContainer = document.getElementById('integrantesContainer');
const listaIntegrantesTexto = document.getElementById('listaIntegrantesTexto');

// Contenedores Principales de Interfaz
const mainContainer = document.getElementById('mainContainer');
const subTitle = document.getElementById('subTitle');
const btnCambiarEquipo = document.getElementById('btnCambiarEquipo');
const btnConfirmarEvaluacion = document.getElementById('btnConfirmarEvaluacion');

// Elementos de Confirmación
const confirmEquipoText = document.getElementById('confirmEquipoText');
const confirmRubricaPond = document.getElementById('confirmRubricaPond');
const confirmSliderPond = document.getElementById('confirmSliderPond');
const confirmCalificacionText = document.getElementById('confirmCalificacionText');
const badgeCalificacion = document.getElementById('badgeCalificacion');
const btnRegresarConfirm = document.getElementById('btnRegresarConfirm');
const btnGuardarConfirm = document.getElementById('btnGuardarConfirm');

// Elementos de la Rúbrica y Slider
const criterionCards = document.querySelectorAll('.criterion-card:not(.slider-section)');
const personalSlider = document.getElementById('personalSlider');
const sliderValueElem = document.getElementById('sliderValue');

let scores = {};
let estadoActual = {
    semestre: "",
    materia: "",
    grupo: "",
    equipo: ""
};

// Inicializar la estructura limpia de valores de rúbrica
function initScores() {
    criterionCards.forEach(card => {
        const select = card.querySelector('.criterion-select');
        const criterion = card.getAttribute('data-criterion');
        
        let defaultOpt = select.querySelector('option[value="-1"]');
        if (!defaultOpt) {
            defaultOpt = document.createElement('option');
            defaultOpt.value = "-1";
            defaultOpt.text = "Seleccione un nivel...";
            defaultOpt.disabled = true;
            select.insertBefore(defaultOpt, select.firstChild);
        }
        
        select.value = "-1";
        scores[criterion] = -1;
    });
}

// Registro de eventos para manipulación de selectores base
criterionCards.forEach(card => {
    const select = card.querySelector('.criterion-select');
    const criterion = card.getAttribute('data-criterion');

    select.addEventListener('change', () => {
        const selectedOption = select.options[select.selectedIndex];
        const val = parseInt(selectedOption.value);
        const level = selectedOption.getAttribute('data-level');

        card.className = "criterion-card";
        if (level) card.classList.add(level);

        scores[criterion] = val;
    });
});

// Listener para actualización del texto del Slider personalizado
personalSlider.addEventListener('input', () => {
    sliderValueElem.innerText = personalSlider.value;
});

function resetRubric() {
    criterionCards.forEach(card => {
        card.className = "criterion-card";
        card.querySelector('.criterion-select').value = "-1";
    });
    personalSlider.value = 5;
    sliderValueElem.innerText = "5";
    
    for (let key in scores) {
        scores[key] = -1;
    }
}

// Lógica de Modales en Cascada (Módulo Calificar)
modalSemestre.addEventListener('change', () => {
    const sem = modalSemestre.value;
    modalMateria.innerHTML = '<option value="">Seleccione una materia...</option>';
    modalGrupo.innerHTML = '<option value="">Seleccione un grupo...</option>';
    modalEquipo.innerHTML = '<option value="">Seleccione un equipo...</option>';
    integrantesContainer.style.display = 'none';
    modalGrupo.disabled = true;
    modalEquipo.disabled = true;

    if (sem) {
        asignaturasPorSemestre[sem].forEach(m => {
            modalMateria.innerHTML += `<option value="${m}">${m}</option>`;
        });
        modalMateria.disabled = false;
    }
    validarFormModal();
});

modalMateria.addEventListener('change', () => {
    const sem = modalSemestre.value;
    modalGrupo.innerHTML = '<option value="">Seleccione un grupo...</option>';
    modalEquipo.innerHTML = '<option value="">Seleccione un equipo...</option>';
    integrantesContainer.style.display = 'none';
    modalEquipo.disabled = true;

    if (modalMateria.value) {
        fuentesGrupos[sem].forEach(g => {
            modalGrupo.innerHTML += `<option value="${g}">Grupo ${g}</option>`;
        });
        modalGrupo.disabled = false;
    }
    validarFormModal();
});

modalGrupo.addEventListener('change', () => {
    modalEquipo.innerHTML = '<option value="">Seleccione un equipo...</option>';
    integrantesContainer.style.display = 'none';
    const grupo = modalGrupo.value;

    if (grupo) {
        const dicEquipos = equiposPorGrupo[grupo] || {};
        const listaEquipos = Object.keys(dicEquipos);
        
        listaEquipos.forEach(eq => {
            modalEquipo.innerHTML += `<option value="${eq}">${eq}</option>`;
        });
        modalEquipo.disabled = false;
    }
    validarFormModal();
});

modalEquipo.addEventListener('change', () => {
    const grupo = modalGrupo.value;
    const equipo = modalEquipo.value;

    if (grupo && equipo && equiposPorGrupo[grupo] && equiposPorGrupo[grupo][equipo]) {
        const alumnos = equiposPorGrupo[grupo][equipo];
        listaIntegrantesTexto.innerText = alumnos.join(', ');
        integrantesContainer.style.display = 'block';
    } else {
        integrantesContainer.style.display = 'none';
    }
    validarFormModal();
});

function validarFormModal() {
    if (modalSemestre.value && modalMateria.value && modalGrupo.value && modalEquipo.value) {
        btnIniciar.disabled = false;
    } else {
        btnIniciar.disabled = true;
    }
}

btnIniciar.addEventListener('click', () => {
    estadoActual.semestre = modalSemestre.value;
    estadoActual.materia = modalMateria.value;
    estadoActual.grupo = modalGrupo.value;
    estadoActual.equipo = modalEquipo.value;

    subTitle.innerText = `Materia: ${estadoActual.materia} | Grupo: ${estadoActual.grupo} | ${estadoActual.equipo}`;
    
    initialModal.style.display = 'none';
    mainContainer.style.display = 'block';
});

btnCambiarEquipo.addEventListener('click', () => {
    mainContainer.style.display = 'none';
    resetRubric();
    modalEquipo.value = "";
    integrantesContainer.style.display = 'none';
    validarFormModal();
    initialModal.style.display = 'block';
});

// Flujo de Confirmación con Validación y Escala Dinámica de Colores
btnConfirmarEvaluacion.addEventListener('click', () => {
    for (let key in scores) {
        if (scores[key] === -1) {
            alert("Por favor, seleccione una opción para todos los criterios antes de confirmar la evaluación.");
            return;
        }
    }

    let totalRubrica = 0;
    for (let key in scores) { totalRubrica += scores[key]; }
    const maxPointsRubrica = criterionCards.length * 3;
    
    const pondRubrica = (totalRubrica / maxPointsRubrica) * 6.0;
    const pondSlider = (parseInt(personalSlider.value) / 10) * 4.0;
    const notaFinal = pondRubrica + pondSlider;

    confirmEquipoText.innerText = estadoActual.equipo;
    confirmRubricaPond.innerText = pondRubrica.toFixed(1);
    confirmSliderPond.innerText = pondSlider.toFixed(1);
    confirmCalificacionText.innerText = notaFinal.toFixed(1);

    badgeCalificacion.className = "score-badge";
    if (notaFinal < 6.0) {
        badgeCalificacion.classList.add("badge-insuficiente");
    } else if (notaFinal >= 6.0 && notaFinal < 8.0) {
        badgeCalificacion.classList.add("badge-regular");
    } else if (notaFinal >= 8.0 && notaFinal < 9.5) {
        badgeCalificacion.classList.add("badge-bueno");
    } else {
        badgeCalificacion.classList.add("badge-excelente");
    }

    confirmModal.style.display = 'flex';
});

btnRegresarConfirm.addEventListener('click', () => {
    confirmModal.style.display = 'none';
});

const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxJ03tcnzK5eujtBn6QGHBS9eWkBx-A1Tlx0hNrYgk6CpsvWTeoAdP0o8_UNhVuwC1U_A/exec";

btnGuardarConfirm.addEventListener('click', () => {
    btnGuardarConfirm.disabled = true;

    let totalRubrica = 0;
    for (let key in scores) { totalRubrica += scores[key]; }
    const maxPointsRubrica = criterionCards.length * 3;
    const pondRubrica = (totalRubrica / maxPointsRubrica) * 6.0;
    const pondSlider = (parseInt(personalSlider.value) / 10) * 4.0;
    const notaFinal = (pondRubrica + pondSlider).toFixed(1);

    const payload = {
        semestre: estadoActual.semestre,
        materia: estadoActual.materia,
        grupo: estadoActual.grupo,
        equipo: estadoActual.equipo,
        scores: scores,
        sliderValue: personalSlider.value,
        notaFinal: notaFinal
    };

    confirmModal.style.display = 'none';
    
    const modalIconContainer = document.getElementById('modalIconContainer');
    const modalStatusTitle = document.getElementById('modalStatusTitle');
    const modalStatusText = document.getElementById('modalStatusText');

    modalIconContainer.innerHTML = `<div class="loader-spinner"></div>`;
    modalStatusTitle.innerText = "Enviando evaluación...";
    modalStatusText.innerText = "Por favor, espere mientras se registran los datos.";
    
    successModal.style.display = 'flex';

    fetch(URL_APPS_SCRIPT, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(() => {
        modalIconContainer.innerHTML = `
            <div class="success-checkmark">
                <div class="check-icon">
                    <span class="icon-line line-tip"></span>
                    <span class="icon-line line-long"></span>
                </div>
            </div>`;
        modalStatusTitle.innerText = "¡Evaluación Guardada!";
        modalStatusText.innerText = "La calificación fue registrada correctamente.";

        setTimeout(() => {
            successModal.style.display = 'none';
            mainContainer.style.display = 'none';
            resetRubric();
            
            integrantesContainer.style.display = 'none';
            listaIntegrantesTexto.innerText = "";

            modalEquipo.innerHTML = '<option value="">Seleccione un equipo...</option>';
            
            const grupoActual = estadoActual.grupo;
            const dicEquipos = equiposPorGrupo[grupoActual] || {};
            const listaEquipos = Object.keys(dicEquipos);

            listaEquipos.forEach(eq => {
                modalEquipo.innerHTML += `<option value="${eq}">${eq}</option>`;
            });
            modalEquipo.value = "";
            modalEquipo.disabled = false;
            
            validarFormModal();
            btnGuardarConfirm.disabled = false;
            initialModal.style.display = 'block';
        }, 2000);
    })
    .catch(error => {
        console.error("Error al registrar en Google Sheets:", error);
        
        modalIconContainer.innerHTML = `
            <div style="width: 80px; height: 80px; margin: 0 auto; border: 4px solid var(--reset-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--reset-color); font-size: 3rem; font-weight: bold;">
                ✕
            </div>`;
        modalStatusTitle.innerText = "Error de Conexión";
        modalStatusText.innerText = "No se pudo sincronizar con el servidor. Regresando al resumen...";

        setTimeout(() => {
            successModal.style.display = 'none';
            confirmModal.style.display = 'flex';
            btnGuardarConfirm.disabled = false;
        }, 2500);
    });
});

// ==========================================
// MÓDULO DE NAVEGACIÓN Y CONSULTA (MENÚ INICIAL)
// ==========================================

const readSemestre = document.getElementById('readSemestre');
const readMateria = document.getElementById('readMateria');
const readGrupo = document.getElementById('readGrupo');
const btnBuscarCalificaciones = document.getElementById('btnBuscarCalificaciones');
const loaderConsulta = document.getElementById('loaderConsulta');
const containerResultados = document.getElementById('containerResultados');

btnModCalificar.addEventListener('click', () => {
    menuPrincipal.style.display = 'none';
    secCalificar.classList.add('active');
    initialModal.style.display = 'block';
    mainContainer.style.display = 'none';
});

btnModConsultar.addEventListener('click', () => {
    menuPrincipal.style.display = 'none';
    secConsultar.classList.add('active');
    containerResultados.innerHTML = "";
    readSemestre.value = "";
    readMateria.innerHTML = '<option value="">Seleccione una materia...</option>';
    readMateria.disabled = true;
    readGrupo.innerHTML = '<option value="">Seleccione un grupo...</option>';
    readGrupo.disabled = true;
    btnBuscarCalificaciones.disabled = true;
});

document.querySelectorAll('.btn-back-menu').forEach(btn => {
    btn.addEventListener('click', () => {
        secCalificar.classList.remove('active');
        secConsultar.classList.remove('active');
        menuPrincipal.style.display = 'flex';
        resetRubric();
    });
});

// Cascadas para selectores del área de Consulta con limpieza automática
readSemestre.addEventListener('change', () => {
    const sem = readSemestre.value;
    readMateria.innerHTML = '<option value="">Seleccione una materia...</option>';
    readGrupo.innerHTML = '<option value="">Seleccione un grupo...</option>';
    readMateria.disabled = true;
    readGrupo.disabled = true;
    btnBuscarCalificaciones.disabled = true;
    
    containerResultados.innerHTML = "";

    if (sem && asignaturasPorSemestre[sem]) {
        asignaturasPorSemestre[sem].forEach(m => {
            readMateria.innerHTML += `<option value="${m}">${m}</option>`;
        });
        readMateria.disabled = false;
    }
});

readMateria.addEventListener('change', () => {
    const sem = readSemestre.value;
    readGrupo.innerHTML = '<option value="">Seleccione un grupo...</option>';
    readGrupo.disabled = true;
    btnBuscarCalificaciones.disabled = true;
    
    containerResultados.innerHTML = "";

    if (readMateria.value && fuentesGrupos[sem]) {
        fuentesGrupos[sem].forEach(g => {
            readGrupo.innerHTML += `<option value="${g}">Grupo ${g}</option>`;
        });
        readGrupo.disabled = false;
    }
});

readGrupo.addEventListener('change', () => {
    btnBuscarCalificaciones.disabled = !readGrupo.value;
    containerResultados.innerHTML = "";
});

// Petición HTTP GET para Consultar Calificaciones
btnBuscarCalificaciones.addEventListener('click', () => {
    const semestre = readSemestre.value;
    const materia = readMateria.value;
    const grupo = readGrupo.value;

    if (!semestre || !grupo) {
        alert("Por favor, selecciona los campos requeridos para la consulta.");
        return;
    }

    containerResultados.innerHTML = "";
    loaderConsulta.style.display = "block";
    
    const leyendaCargando = document.createElement('p');
    leyendaCargando.id = "leyendaCargando";
    leyendaCargando.style.cssText = "text-align: center; color: #64748b; font-size: 0.9rem; margin-top: -10px; margin-bottom: 20px;";
    leyendaCargando.innerText = "Por favor, espere un momento mientras se recuperan los registros del servidor.";
    loaderConsulta.parentNode.insertBefore(leyendaCargando, loaderConsulta.nextSibling);

    fetch(`${URL_APPS_SCRIPT}?semestre=${encodeURIComponent(semestre)}&grupo=${encodeURIComponent(grupo)}`)
        .then(response => response.json())
        .then(data => {
            loaderConsulta.style.display = "none";
            const leyendExistente = document.getElementById('leyendaCargando');
            if (leyendExistente) leyendExistente.remove();

            if (data.status === "success" && data.data.length > 0) {
                const filtradosPorMateria = data.data.filter(item => item.materia === materia);
                if (filtradosPorMateria.length > 0) {
                    renderizarCalificaciones(filtradosPorMateria);
                } else {
                    containerResultados.innerHTML = `<p style="text-align:center; color: #64748b; margin-top:20px; font-size:0.95rem;">No se encontraron evaluaciones registradas para esta materia.</p>`;
                }
            } else {
                containerResultados.innerHTML = `<p style="text-align:center; color: #64748b; margin-top:20px; font-size:0.95rem;">No se encontraron evaluaciones registradas para estos criterios.</p>`;
            }
        })
        .catch(err => {
            console.error("Error al leer datos:", err);
            loaderConsulta.style.display = "none";
            const leyendExistente = document.getElementById('leyendaCargando');
            if (leyendExistente) leyendExistente.remove();
            containerResultados.innerHTML = `<p style="text-align:center; color: var(--reset-color); margin-top:20px; font-size:0.95rem;">Error al conectar con el servidor.</p>`;
        });
});

// Renderizado dinámico de tarjetas móviles sin la vista de materia
function renderizarCalificaciones(lista) {
    const grupoActualConsulta = readGrupo.value;

    lista.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = "card-view";
        
        const dicEquipos = equiposPorGrupo[grupoActualConsulta] || {};
        const alumnosEquipo = dicEquipos[item.equipo] || [];
        const listaAlumnosTexto = alumnosEquipo.length > 0 ? alumnosEquipo.join(', ') : "No especificados";

        card.innerHTML = `
            <div class="card-header-view">
                <div style="flex: 1; padding-right: 8px;">
                    <h3 style="margin:0 0 4px 0; color: var(--primary-color); font-size:1.1rem;">${item.equipo}</h3>
                    <div style="font-size: 0.85rem; color: var(--text-main); background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 4px;">
                        <strong style="color: var(--primary-color);">Integrantes:</strong> ${listaAlumnosTexto}
                    </div>
                </div>
                <div style="text-align: right; display:flex; flex-direction: column; align-items: flex-end; gap: 8px; justify-content: flex-start;">
                    <span class="score-badge" style="margin:0; font-size: 1.1rem; background: #f1f5f9; color: #2563eb;">${parseFloat(item.notaFinal).toFixed(1)}</span>
                    <button class="btn-navigation btn-details" data-target="details-${index}" style="padding: 4px 10px; font-size:0.8rem; margin:0; width:max-content;">Detalles</button>
                </div>
            </div>
            <div id="details-${index}" class="details-grid" style="display: none;">
                <div class="detail-item"><strong>Bitácora:</strong> ${item.bitacora} pts</div>
                <div class="detail-item"><strong>Redacción:</strong> ${item.redaccion} pts</div>
                <div class="detail-item"><strong>Contenido:</strong> ${item.contenido} pts</div>
                <div class="detail-item"><strong>Salud Árbol:</strong> ${item.salud} pts</div>
                <div class="detail-item"><strong>Material:</strong> ${item.material} pts</div>
                <div class="detail-item"><strong>Colaborativo:</strong> ${item.colaborativo} pts</div>
                <div class="detail-item"><strong>Vestimenta:</strong> ${item.vestimenta} pts</div>
                <div class="detail-item"><strong>Lenguaje:</strong> ${item.lenguaje} pts</div>
                <div class="detail-item"><strong>Tiempo:</strong> ${item.tiempo} pts</div>
                <div class="detail-item"><strong>PowerPoint:</strong> ${item.ppt} pts</div>
                <div class="detail-item"><strong>Asistencia:</strong> ${item.asistencia} pts</div>
                <div class="detail-item" style="grid-column: 1 / -1; border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 4px; font-weight:600;">
                    Asignatura (Slider): ${item.sliderValue} / 10
                </div>
            </div>
        `;
        containerResultados.appendChild(card);
    });

    containerResultados.querySelectorAll('.btn-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            const targetDiv = document.getElementById(targetId);
            if (targetDiv.style.display === "none") {
                targetDiv.style.display = "grid";
                e.target.innerText = "Ocultar";
                e.target.style.backgroundColor = "#cbd5e1";
            } else {
                targetDiv.style.display = "none";
                e.target.innerText = "Detalles";
                e.target.style.backgroundColor = "#e2e8f0";
            }
        });
    });
}

// Inicializar ejecución limpia al cargar
initScores();