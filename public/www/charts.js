// --- CHARTS MANAGER ---
let chartInstances = {
  bar: null,
  doughnut: null
};

// Colors associated with each political party
const PARTIES_CONFIG = {
  "FP": { color: "#ea580c", label: "Fuerza Popular", short: "FP" },
  "JP": { color: "#059669", label: "Juntos por el Perú", short: "JP" },
  "SOMOS PERU": { color: "#1e3a8a", label: "Somos Perú", short: "SOMOS PERÚ" },
  "FREPAP": { color: "#0284c7", label: "Frepap", short: "FREPAP" },
  "VERDE": { color: "#16a34a", label: "Partido Verde", short: "VERDE" },
  "MORADO": { color: "#7c3aed", label: "Partido Morado", short: "MORADO" }
};

// Helper function to generate beautiful linear gradients or stripes for chart elements
function getPartyColorOrGradient(ctx, partyKey, type = 'bar') {
  if (!ctx) {
    return PARTIES_CONFIG[partyKey] ? PARTIES_CONFIG[partyKey].color : "#94a3b8";
  }
  
  let grad;
  if (type === 'bar') {
    grad = ctx.createLinearGradient(0, 200, 0, 0);
  } else {
    grad = ctx.createLinearGradient(0, 0, 150, 150);
  }

  switch (partyKey) {
    case 'FP':
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(1, '#ea580c');
      return grad;
    case 'JP':
      grad.addColorStop(0, '#ef4444');
      grad.addColorStop(0.33, '#ef4444');
      grad.addColorStop(0.33, '#ffffff');
      grad.addColorStop(0.66, '#ffffff');
      grad.addColorStop(0.66, '#059669');
      grad.addColorStop(1, '#059669');
      return grad;
    case 'SOMOS PERU':
      grad.addColorStop(0, '#ef4444');
      grad.addColorStop(0.33, '#ef4444');
      grad.addColorStop(0.33, '#ffffff');
      grad.addColorStop(0.66, '#ffffff');
      grad.addColorStop(0.66, '#1e3a8a');
      grad.addColorStop(1, '#1e3a8a');
      return grad;
    case 'FREPAP':
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(0.5, '#0284c7');
      grad.addColorStop(1, '#0284c7');
      return grad;
    case 'VERDE':
      grad.addColorStop(0, '#16a34a');
      grad.addColorStop(1, '#4ade80');
      return grad;
    case 'MORADO':
      grad.addColorStop(0, '#7c3aed');
      grad.addColorStop(1, '#a855f7');
      return grad;
    default:
      return '#94a3b8';
  }
}

/**
 * Initializes the charts in the UI.
 */
function inicializarGraficos() {
  const barCanvas = document.getElementById('chart-bar');
  const doughnutCanvas = document.getElementById('chart-doughnut');

  if (!barCanvas || !doughnutCanvas) return;

  // Destroy previous instances to avoid "Canvas is already in use" errors from Chart.js
  if (chartInstances.bar && typeof chartInstances.bar.destroy === 'function') {
    try {
      chartInstances.bar.destroy();
    } catch (e) {
      console.warn("Error destroying bar chart:", e);
    }
    chartInstances.bar = null;
  }
  if (chartInstances.doughnut && typeof chartInstances.doughnut.destroy === 'function') {
    try {
      chartInstances.doughnut.destroy();
    } catch (e) {
      console.warn("Error destroying doughnut chart:", e);
    }
    chartInstances.doughnut = null;
  }

  const labels = Object.keys(PARTIES_CONFIG);
  const barCtx = barCanvas.getContext('2d');
  const doughnutCtx = doughnutCanvas.getContext('2d');
  
  const barColors = labels.map(key => getPartyColorOrGradient(barCtx, key, 'bar'));
  const doughnutColors = labels.map(key => getPartyColorOrGradient(doughnutCtx, key, 'doughnut'));
  
  // Configure default font for Chart.js to match our stylesheet (Outfit)
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.color = '#94a3b8';
  } else {
    console.error("Chart.js is not loaded.");
    return;
  }

  // 1. Bar Chart Initialization
  chartInstances.bar = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Votos',
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: barColors,
        borderRadius: 6,
        borderWidth: 0,
        barPercentage: 0.6
      }]
    },
    options: {
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(19, 25, 46, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          padding: 10,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: 'bold' } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          beginAtZero: true,
          ticks: {
            precision: 0,
            callback: function(v) { return Number.isInteger(v) ? v : ''; }
          }
        }
      }
    }
  });

  // 2. Doughnut Chart Initialization
  chartInstances.doughnut = new Chart(doughnutCtx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: doughnutColors,
        borderWidth: 2,
        borderColor: '#13192e'
      }]
    },
    options: {
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1200,
        easing: 'easeOutQuart'
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#f8fafc',
            boxWidth: 12,
            font: { size: 11 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(19, 25, 46, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          padding: 10
        }
      },
      cutout: '70%'
    }
  });
}

/**
 * Updates the chart data based on current inputs.
 * @param {Object} votos - Object containing vote count per party { "FP": X, "JP": Y, ... }
 * @param {string} scope - Either 'provincial' or 'distrital'
 * @param {string} districtName - Name of the selected district (e.g. 'Breña')
 */
function actualizarGraficosYResumen(votos, scope = 'provincial', districtName = '') {
  const labels = Object.keys(PARTIES_CONFIG);
  const dataValues = labels.map(key => votos[key] || 0);
  const totalVotos = dataValues.reduce((a, b) => a + b, 0);

  // Update Charts
  if (chartInstances.bar) {
    chartInstances.bar.data.datasets[0].data = dataValues;
    chartInstances.bar.update(); // Let it animate!
  }

  if (chartInstances.doughnut) {
    chartInstances.doughnut.data.datasets[0].data = dataValues;
    chartInstances.doughnut.update(); // Let it animate!
  }

  // Update Summary Info
  const totalVotesElement = document.getElementById('summary-total-votes');
  if (totalVotesElement) {
    totalVotesElement.textContent = totalVotos;
  }

  // Determine Leader
  let maxVotos = -1;
  let lider = "Ninguno";
  let liderColor = "#94a3b8";

  labels.forEach(key => {
    const v = votos[key] || 0;
    if (v > maxVotos && v > 0) {
      maxVotos = v;
      lider = PARTIES_CONFIG[key].label;
      liderColor = PARTIES_CONFIG[key].color;
    }
  });

  const leaderNameElement = document.getElementById('summary-leader-name');
  const leaderCardElement = document.getElementById('summary-leader-card');
  const leaderPercentElement = document.getElementById('summary-leader-pct');

  // Update leader label dynamically
  const leaderCardLabel = leaderCardElement ? leaderCardElement.querySelector('.card-label') : null;
  if (leaderCardLabel) {
    leaderCardLabel.textContent = scope === 'provincial' ? 'Líder Provincial (Lima)' : `Líder Distrital (${districtName})`;
  }

  if (leaderNameElement) {
    leaderNameElement.textContent = lider;
    leaderNameElement.style.color = liderColor;
  }

  if (leaderPercentElement) {
    if (totalVotos > 0 && maxVotos > 0) {
      const pct = ((maxVotos / totalVotos) * 100).toFixed(1);
      leaderPercentElement.textContent = `${pct}% del total (${maxVotos} votos)`;
    } else {
      leaderPercentElement.textContent = "Sin votos registrados";
    }
  }

  if (leaderCardElement) {
    if (maxVotos > 0) {
      leaderCardElement.style.borderColor = liderColor;
      leaderCardElement.style.background = `linear-gradient(135deg, rgba(30, 41, 59, 0.45), ${liderColor}15)`;
    } else {
      leaderCardElement.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      leaderCardElement.style.background = 'rgba(30, 41, 59, 0.45)';
    }
  }
}

// --- OCR DYNAMIC CHARTS ---
let ocrChartInstances = {
  bar: null,
  doughnut: null,
  comparison: null
};

function getDynamicColor(index, total) {
  const hue = (index * 360) / Math.max(1, total);
  return `hsl(${hue}, 70%, 55%)`;
}

function destroyOcrCharts() {
  if (ocrChartInstances.bar && typeof ocrChartInstances.bar.destroy === 'function') {
    ocrChartInstances.bar.destroy();
    ocrChartInstances.bar = null;
  }

  if (ocrChartInstances.doughnut && typeof ocrChartInstances.doughnut.destroy === 'function') {
    ocrChartInstances.doughnut.destroy();
    ocrChartInstances.doughnut = null;
  }
  if (ocrChartInstances.comparison && typeof ocrChartInstances.comparison.destroy === 'function') {
    ocrChartInstances.comparison.destroy();
    ocrChartInstances.comparison = null;
  }
}

function actualizarGraficosOCR(tablaDatos, columnaSeleccionada = null) {
  if (!tablaDatos || !tablaDatos.columnas || !tablaDatos.filas || tablaDatos.filas.length === 0) {
    destroyOcrCharts();
    return;
  }

  const columnas = tablaDatos.columnas;
  const filas = tablaDatos.filas;

  // Default to first column if none selected or if selected is invalid
  if (!columnaSeleccionada || !columnas.includes(columnaSeleccionada)) {
    columnaSeleccionada = columnas[0];
  }

  // Get labels and values for the selected column
  const labels = filas.map(f => f.nombre || "Sin Nombre");
  const dataValues = filas.map(f => {
    const val = f[columnaSeleccionada];
    return typeof val === 'number' ? val : Number(val) || 0;
  });

  const colors = labels.map((_, idx) => getDynamicColor(idx, labels.length));

  // Initialize or update Bar Chart
  const barCanvas = document.getElementById('ocr-chart-bar');
  if (barCanvas) {
    if (ocrChartInstances.bar) {
      ocrChartInstances.bar.destroy();
    }
    const barTitle = document.getElementById('ocr-chart-bar-title');
    if (barTitle) barTitle.textContent = `Votos por Categoría - Columna: ${columnaSeleccionada}`;
    
    ocrChartInstances.bar = new Chart(barCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: columnaSeleccionada,
          data: dataValues,
          backgroundColor: colors,
          borderRadius: 6,
          borderWidth: 0,
          barPercentage: 0.6
        }]
      },
      options: {
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(19, 25, 46, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            padding: 10
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { precision: 0, color: '#94a3b8' }
          }
        }
      }
    });
  }



  // Initialize or update Doughnut Chart
  const doughnutCanvas = document.getElementById('ocr-chart-doughnut');
  if (doughnutCanvas) {
    if (ocrChartInstances.doughnut) {
      ocrChartInstances.doughnut.destroy();
    }
    ocrChartInstances.doughnut = new Chart(doughnutCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#13192e'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 2000,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#f8fafc', boxWidth: 12, font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: 'rgba(19, 25, 46, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            padding: 10
          }
        },
        cutout: '70%'
      }
    });
  }

  // Comparative Chart (Multiple Columns)
  const comparisonContainer = document.getElementById('ocr-chart-comparison-container');
  const comparisonCanvas = document.getElementById('ocr-chart-comparison');
  
  if (columnas.length > 1 && comparisonCanvas) {
    if (comparisonContainer) comparisonContainer.classList.remove('hidden');
    if (ocrChartInstances.comparison) {
      ocrChartInstances.comparison.destroy();
    }

    const datasets = columnas.map((colName, cIdx) => {
      const colColor = getDynamicColor(cIdx, columnas.length);
      return {
        label: colName,
        data: filas.map(f => {
          const val = f[colName];
          return typeof val === 'number' ? val : Number(val) || 0;
        }),
        backgroundColor: colColor,
        borderRadius: 4,
        borderWidth: 0,
        barPercentage: 0.8,
        categoryPercentage: 0.8
      };
    });

    ocrChartInstances.comparison = new Chart(comparisonCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#f8fafc' }
          },
          tooltip: {
            backgroundColor: 'rgba(19, 25, 46, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            padding: 10
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { precision: 0, color: '#94a3b8' }
          }
        }
      }
    });
  } else {
    if (comparisonContainer) comparisonContainer.classList.add('hidden');
    if (ocrChartInstances.comparison) {
      ocrChartInstances.comparison.destroy();
      ocrChartInstances.comparison = null;
    }
  }
}

function actualizarGraficosOCRTab() {
  const barCanvas = document.getElementById('ocr-chart-bar');
  const doughnutCanvas = document.getElementById('ocr-chart-doughnut');
  if (!barCanvas || !doughnutCanvas) return;

  const scope = appState.currentChartScope || 'provincial';
  const ocrVotes = (appState.ocrVotes && appState.ocrVotes[scope]) || { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0 };

  const labels = Object.keys(PARTIES_CONFIG);
  const dataValues = labels.map(key => ocrVotes[key] || 0);
  const colors = labels.map(key => PARTIES_CONFIG[key].color);

  // 1. OCR Bar Chart
  if (ocrChartInstances.bar) {
    ocrChartInstances.bar.data.datasets[0].data = dataValues;
    ocrChartInstances.bar.update();
  } else {
    ocrChartInstances.bar = new Chart(barCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Votos OCR',
          data: dataValues,
          backgroundColor: colors,
          borderRadius: 6,
          borderWidth: 0,
          barPercentage: 0.6
        }]
      },
      options: {
        animation: { duration: 1000, easing: 'easeOutQuart' },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(19, 25, 46, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            padding: 10,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: 'bold' } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  // 2. OCR Doughnut Chart
  if (ocrChartInstances.doughnut) {
    ocrChartInstances.doughnut.data.datasets[0].data = dataValues;
    ocrChartInstances.doughnut.update();
  } else {
    ocrChartInstances.doughnut = new Chart(doughnutCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#13192e'
        }]
      },
      options: {
        animation: { animateRotate: true, animateScale: true, duration: 1200, easing: 'easeOutQuart' },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#f8fafc',
              boxWidth: 12,
              font: { size: 11 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(19, 25, 46, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            padding: 10
          }
        },
        cutout: '70%'
      }
    });
  }
}
