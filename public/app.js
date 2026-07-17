/* ============================================
   AquaMonitor — Dashboard Application Logic
   ============================================ */

// ── Configuration ──────────────────────────────────
const CONFIG = {
  API_URL: '/api/registros',
  // Preparado para query params cuando el backend lo soporte:
  // API_URL_FILTERED: (date) => `/api/registros?date=${date}`,
  REFRESH_INTERVAL: 30000, // 30 seconds
};

// ── Application State ──────────────────────────────
const state = {
  allData: [],
  filteredData: [],
  currentFilter: 'all',
  isLoading: true,
  error: null,
  charts: {
    nivel: null,
    presion: null,
    nivelHist: null,
    presionHist: null,
  },
  refreshTimer: null,
};

// ── DOM References ─────────────────────────────────
const DOM = {
  // Loading & errors
  loadingOverlay: () => document.getElementById('loading-overlay'),
  errorBanner: () => document.getElementById('error-banner'),
  errorMessage: () => document.getElementById('error-message'),
  errorClose: () => document.getElementById('error-close'),

  // Navigation
  navDashboard: () => document.getElementById('nav-dashboard'),
  navHistorico: () => document.getElementById('nav-historico'),
  viewDashboard: () => document.getElementById('view-dashboard'),
  viewHistorico: () => document.getElementById('view-historico'),

  // Stats
  statNivel: () => document.getElementById('stat-nivel'),
  statPresion: () => document.getElementById('stat-presion'),
  statTotal: () => document.getElementById('stat-total'),
  statUpdate: () => document.getElementById('stat-update'),

  // Connection status
  connectionStatus: () => document.getElementById('connection-status'),
  statusText: () => document.querySelector('.status-text'),

  // Charts
  nivelCanvas: () => document.getElementById('nivelChart'),
  presionCanvas: () => document.getElementById('presionChart'),
  nivelHistCanvas: () => document.getElementById('nivelHistChart'),
  presionHistCanvas: () => document.getElementById('presionHistChart'),

  // Filters
  filterBtns: () => document.querySelectorAll('.filter-presets .filter-btn'),
  dateFrom: () => document.getElementById('date-from'),
  dateTo: () => document.getElementById('date-to'),
  filterApply: () => document.getElementById('filter-apply'),
  filterBadgeNivel: () => document.getElementById('filter-badge-nivel'),
  filterBadgePresion: () => document.getElementById('filter-badge-presion'),

  // Table
  tableBody: () => document.getElementById('table-body'),
  tableCount: () => document.getElementById('table-count'),
  emptyState: () => document.getElementById('empty-state'),
  tableWrapper: () => document.querySelector('.table-wrapper'),

  // Export
  exportCsv: () => document.getElementById('export-csv'),

  // Retry Modal
  retryModal: () => document.getElementById('retry-modal'),
  modalMessage: () => document.getElementById('modal-message'),
  modalRetry: () => document.getElementById('modal-retry'),
  modalCancel: () => document.getElementById('modal-cancel'),
};


// ── Data Service ───────────────────────────────────

/**
 * Fetch sensor registros from the API.
 * Structure: { ok: boolean, total: number, data: Array<Registro> }
 */
async function fetchRegistros() {
  try {
    const response = await fetch(CONFIG.API_URL);

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    if (!json.ok) {
      throw new Error('La API respondió con un estado no exitoso.');
    }

    // Extraer y ordenar data cronológicamente (asc) para los gráficos
    const data = (json.data || []).map(normalizeRegistro);
    data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    state.allData = data;
    state.error = null;
    setConnectionStatus(true);
    hideRetryModal();

    // Aplicar filtro actual
    applyCurrentFilter();

    return data;

  } catch (error) {
    console.error('Error al obtener registros:', error);
    state.error = error.message;
    setConnectionStatus(false);
    hideLoading();
    showRetryModal(error.message || 'No se pudo conectar con la API. Verifica que el servidor esté encendido.');
    return null;
  }
}

/**
 * Normalize a registro object, ensuring createdAt exists.
 * Handles both the new format (createdAt ISO string) and
 * fallback to fechaHora for backward compatibility.
 */
function normalizeRegistro(registro) {
  // If createdAt already exists as ISO, use it directly
  if (registro.createdAt) {
    return {
      id: registro.id,
      nivel: Number(registro.nivel),
      presion: Number(registro.presion),
      createdAt: registro.createdAt,
      fechaHora: registro.fechaHora || formatDateTime(registro.createdAt),
    };
  }

  // Fallback: try to parse fechaHora (DD/MM/YYYY, HH:mm:ss format)
  if (registro.fechaHora) {
    const parsed = parseFechaHora(registro.fechaHora);
    return {
      id: registro.id,
      nivel: Number(registro.nivel),
      presion: Number(registro.presion),
      createdAt: parsed ? parsed.toISOString() : new Date().toISOString(),
      fechaHora: registro.fechaHora,
    };
  }

  // Last resort
  return {
    ...registro,
    nivel: Number(registro.nivel),
    presion: Number(registro.presion),
    createdAt: new Date().toISOString(),
    fechaHora: '--',
  };
}

/**
 * Parse a "DD/MM/YYYY, HH:mm:ss" string into a Date object.
 */
function parseFechaHora(str) {
  try {
    const [datePart, timePart] = str.split(', ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    return new Date(year, month - 1, day, hour, minute, second);
  } catch {
    return null;
  }
}


// ── Formatting ─────────────────────────────────────

/**
 * Format an ISO date string to a short date/time label for chart axes.
 */
function formatChartLabel(isoString) {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
}

/**
 * Format an ISO date string to a full readable date/time for tables.
 */
function formatDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Format a Date object to YYYY-MM-DD (for date input values).
 */
function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}


// ── Filtering ──────────────────────────────────────

/**
 * Apply the current filter and update all UI components.
 */
function applyCurrentFilter() {
  const filter = state.currentFilter;

  if (filter === 'all') {
    state.filteredData = [...state.allData];
  } else if (filter === 'custom') {
    const from = DOM.dateFrom().value;
    const to = DOM.dateTo().value;
    state.filteredData = filterByDateRange(from, to);
  } else {
    state.filteredData = filterByPreset(filter);
  }

  // Update all UI
  updateStats();
  updateDashboardCharts();
  updateHistoricalCharts();
  renderTable();
  updateFilterBadges();
  hideLoading();
}

/**
 * Filter data by a preset time range.
 */
function filterByPreset(preset) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start, end;

  switch (preset) {
    case 'today':
      start = startOfToday;
      end = new Date(startOfToday.getTime() + 86400000); // +1 day
      break;
    case 'yesterday':
      start = new Date(startOfToday.getTime() - 86400000);
      end = startOfToday;
      break;
    case '7days':
      start = new Date(startOfToday.getTime() - 7 * 86400000);
      end = now;
      break;
    case '30days':
      start = new Date(startOfToday.getTime() - 30 * 86400000);
      end = now;
      break;
    default:
      return [...state.allData];
  }

  return state.allData.filter(r => {
    const d = new Date(r.createdAt);
    return d >= start && d < end;
  });
}

/**
 * Filter data by a custom date range.
 * Prepared for future backend query param support:
 *   GET /api/registros?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
function filterByDateRange(fromStr, toStr) {
  if (!fromStr && !toStr) return [...state.allData];

  return state.allData.filter(r => {
    const d = new Date(r.createdAt);
    if (fromStr) {
      const from = new Date(fromStr + 'T00:00:00');
      if (d < from) return false;
    }
    if (toStr) {
      const to = new Date(toStr + 'T23:59:59.999');
      if (d > to) return false;
    }
    return true;
  });
}

function getFilterLabel(filter) {
  const labels = {
    all: 'Todos',
    today: 'Hoy',
    yesterday: 'Ayer',
    '7days': '7 días',
    '30days': '30 días',
    custom: 'Personalizado',
  };
  return labels[filter] || 'Todos';
}


// ── Chart Management ───────────────────────────────

const CHART_COLORS = {
  nivel: {
    line: '#3b82f6',
    fill: 'rgba(59, 130, 246, 0.08)',
    fillTop: 'rgba(59, 130, 246, 0.25)',
    point: '#3b82f6',
    pointHover: '#60a5fa',
  },
  presion: {
    line: '#f59e0b',
    fill: 'rgba(245, 158, 11, 0.08)',
    fillTop: 'rgba(245, 158, 11, 0.25)',
    point: '#f59e0b',
    pointHover: '#fbbf24',
  },
};

/**
 * Create a gradient fill for chart backgrounds.
 */
function createGradient(ctx, canvas, colorTop, colorBottom) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, colorTop);
  gradient.addColorStop(1, colorBottom);
  return gradient;
}

/**
 * Build common Chart.js options for the dark theme.
 */
function getChartOptions(titleText) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 10,
        padding: 12,
        titleFont: { family: "'Inter', sans-serif", weight: '600', size: 13 },
        bodyFont: { family: "'Inter', sans-serif", size: 12 },
        displayColors: false,
        callbacks: {
          title: (items) => items[0]?.label || '',
          label: (item) => `${titleText}: ${item.formattedValue}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: { family: "'Inter', sans-serif", size: 10 },
          maxRotation: 45,
          maxTicksLimit: 12,
        },
        border: { display: false },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: { family: "'Inter', sans-serif", size: 11 },
          padding: 8,
        },
        border: { display: false },
        beginAtZero: true,
      },
    },
    animation: {
      duration: 800,
      easing: 'easeInOutQuart',
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 6,
        hitRadius: 8,
      },
    },
  };
}

/**
 * Create a new Chart.js line chart instance.
 */
function createChart(canvasEl, label, colorScheme, data) {
  const ctx = canvasEl.getContext('2d');
  const gradient = createGradient(ctx, canvasEl, colorScheme.fillTop, colorScheme.fill);

  const labels = data.map(r => formatChartLabel(r.createdAt));
  const values = data.map(r => label === 'Nivel' ? r.nivel : r.presion);

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: colorScheme.line,
        backgroundColor: gradient,
        pointBackgroundColor: colorScheme.point,
        pointBorderColor: 'transparent',
        pointHoverBackgroundColor: colorScheme.pointHover,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
      }],
    },
    options: getChartOptions(label),
  });
}

/**
 * Update an existing chart with new data.
 */
function updateChart(chart, label, colorScheme, data) {
  if (!chart) return;

  const canvas = chart.canvas;
  const ctx = canvas.getContext('2d');
  const gradient = createGradient(ctx, canvas, colorScheme.fillTop, colorScheme.fill);

  chart.data.labels = data.map(r => formatChartLabel(r.createdAt));
  chart.data.datasets[0].data = data.map(r => label === 'Nivel' ? r.nivel : r.presion);
  chart.data.datasets[0].backgroundColor = gradient;
  chart.update('none'); // Skip animation on data update for performance
}

/**
 * Initialize all four chart instances.
 */
function initCharts() {
  const nivelCanvas = DOM.nivelCanvas();
  const presionCanvas = DOM.presionCanvas();
  const nivelHistCanvas = DOM.nivelHistCanvas();
  const presionHistCanvas = DOM.presionHistCanvas();

  if (nivelCanvas) {
    state.charts.nivel = createChart(nivelCanvas, 'Nivel', CHART_COLORS.nivel, []);
  }
  if (presionCanvas) {
    state.charts.presion = createChart(presionCanvas, 'Presión', CHART_COLORS.presion, []);
  }
  if (nivelHistCanvas) {
    state.charts.nivelHist = createChart(nivelHistCanvas, 'Nivel', CHART_COLORS.nivel, []);
  }
  if (presionHistCanvas) {
    state.charts.presionHist = createChart(presionHistCanvas, 'Presión', CHART_COLORS.presion, []);
  }
}

/**
 * Update dashboard charts with all data (real-time view).
 */
function updateDashboardCharts() {
  updateChart(state.charts.nivel, 'Nivel', CHART_COLORS.nivel, state.allData);
  updateChart(state.charts.presion, 'Presión', CHART_COLORS.presion, state.allData);
}

/**
 * Update historical charts with filtered data.
 */
function updateHistoricalCharts() {
  updateChart(state.charts.nivelHist, 'Nivel', CHART_COLORS.nivel, state.filteredData);
  updateChart(state.charts.presionHist, 'Presión', CHART_COLORS.presion, state.filteredData);
}


// ── Stats Cards ────────────────────────────────────

function updateStats() {
  const data = state.allData;

  if (data.length === 0) {
    DOM.statNivel().textContent = '--';
    DOM.statPresion().textContent = '--';
    DOM.statTotal().textContent = '0';
    DOM.statUpdate().textContent = '--';
    return;
  }

  // Latest record (data is sorted asc, so last element is newest)
  const latest = data[data.length - 1];

  DOM.statNivel().textContent = latest.nivel.toFixed(2);
  DOM.statPresion().textContent = latest.presion.toFixed(2);
  DOM.statTotal().textContent = data.length.toLocaleString('es-MX');

  // Format the latest update time
  const updateTime = new Date(latest.createdAt);
  DOM.statUpdate().textContent = updateTime.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}


// ── Data Table ─────────────────────────────────────

function renderTable() {
  const tbody = DOM.tableBody();
  const emptyState = DOM.emptyState();
  const tableWrapper = DOM.tableWrapper();
  const tableCount = DOM.tableCount();

  if (!tbody) return;

  // Show most recent first in the table
  const data = [...state.filteredData].reverse();

  tableCount.textContent = `${data.length} registro${data.length !== 1 ? 's' : ''}`;

  if (data.length === 0) {
    tbody.innerHTML = '';
    if (tableWrapper) tableWrapper.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (tableWrapper) tableWrapper.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  // Build table rows efficiently
  const fragment = document.createDocumentFragment();
  data.forEach((registro, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${registro.nivel.toFixed(2)}</td>
      <td>${registro.presion.toFixed(2)}</td>
      <td>${registro.fechaHora || formatDateTime(registro.createdAt)}</td>
    `;
    fragment.appendChild(tr);
  });

  tbody.innerHTML = '';
  tbody.appendChild(fragment);
}


// ── Filter Badges ──────────────────────────────────

function updateFilterBadges() {
  const label = getFilterLabel(state.currentFilter);
  const badgeNivel = DOM.filterBadgeNivel();
  const badgePresion = DOM.filterBadgePresion();
  if (badgeNivel) badgeNivel.textContent = label;
  if (badgePresion) badgePresion.textContent = label;
}


// ── CSV Export ─────────────────────────────────────

function exportCSV() {
  const data = state.filteredData;
  if (data.length === 0) {
    showError('No hay datos para exportar con el filtro actual.');
    return;
  }

  const headers = ['#', 'Nivel', 'Presión', 'Fecha y Hora', 'ID'];
  const rows = data.map((r, i) => [
    i + 1,
    r.nivel,
    r.presion,
    r.fechaHora || formatDateTime(r.createdAt),
    r.id,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `aquamonitor_datos_${toDateInputValue(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


// ── UI State Management ────────────────────────────

function showLoading() {
  const overlay = DOM.loadingOverlay();
  if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
  const overlay = DOM.loadingOverlay();
  if (overlay) overlay.classList.add('hidden');
}

function showError(message) {
  const banner = DOM.errorBanner();
  const msgEl = DOM.errorMessage();
  if (banner && msgEl) {
    msgEl.textContent = message;
    banner.style.display = 'flex';
  }
}

function hideError() {
  const banner = DOM.errorBanner();
  if (banner) banner.style.display = 'none';
}

function setConnectionStatus(connected) {
  const statusEl = DOM.connectionStatus();
  const textEl = DOM.statusText();
  if (statusEl) {
    if (connected) {
      statusEl.classList.remove('error');
      if (textEl) textEl.textContent = 'Conectado';
    } else {
      statusEl.classList.add('error');
      if (textEl) textEl.textContent = 'Sin conexión';
    }
  }
}


// ── Retry Modal ─────────────────────────────────────

function showRetryModal(message) {
  const modal = DOM.retryModal();
  const msgEl = DOM.modalMessage();
  if (modal) {
    if (msgEl) msgEl.textContent = message;
    modal.style.display = 'flex';
  }
}

function hideRetryModal() {
  const modal = DOM.retryModal();
  if (modal) modal.style.display = 'none';
}


// ── Navigation ─────────────────────────────────────

function switchView(viewName) {
  // Update nav buttons
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Update views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });

  // If switching to historical, update filtered charts
  if (viewName === 'historico') {
    updateHistoricalCharts();
  }
}


// ── Event Listeners ────────────────────────────────

function setupEventListeners() {
  // Navigation
  DOM.navDashboard().addEventListener('click', () => switchView('dashboard'));
  DOM.navHistorico().addEventListener('click', () => switchView('historico'));

  // Error close
  DOM.errorClose().addEventListener('click', hideError);

  // Filter preset buttons
  DOM.filterBtns().forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      DOM.filterBtns().forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Clear custom date inputs
      DOM.dateFrom().value = '';
      DOM.dateTo().value = '';

      // Apply filter
      state.currentFilter = btn.dataset.filter;
      applyCurrentFilter();
    });
  });

  // Custom date range
  DOM.filterApply().addEventListener('click', () => {
    const from = DOM.dateFrom().value;
    const to = DOM.dateTo().value;

    if (!from && !to) {
      showError('Selecciona al menos una fecha para filtrar.');
      return;
    }

    // Clear preset active state
    DOM.filterBtns().forEach(b => b.classList.remove('active'));

    state.currentFilter = 'custom';
    applyCurrentFilter();
  });

  // CSV Export
  DOM.exportCsv().addEventListener('click', exportCSV);

  // Retry Modal buttons
  DOM.modalRetry().addEventListener('click', async () => {
    hideRetryModal();
    showLoading();
    await fetchRegistros();
  });

  DOM.modalCancel().addEventListener('click', () => {
    hideRetryModal();
    hideLoading();
    showError('Carga cancelada. Los datos no están disponibles.');
  });

  // Keyboard navigation (optional accessibility)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideError();
      hideRetryModal();
    }
  });
}


// ── Auto Refresh ───────────────────────────────────

function startAutoRefresh() {
  stopAutoRefresh();
  state.refreshTimer = setInterval(async () => {
    await fetchRegistros();
  }, CONFIG.REFRESH_INTERVAL);
}

function stopAutoRefresh() {
  if (state.refreshTimer) {
    clearInterval(state.refreshTimer);
    state.refreshTimer = null;
  }
}


// ── Initialize ─────────────────────────────────────

async function init() {
  try {
    // Initialize charts first (with empty data)
    initCharts();

    // Setup event listeners
    setupEventListeners();

    // Fetch initial data
    showLoading();
    await fetchRegistros();

    // Start auto-refresh
    startAutoRefresh();

  } catch (error) {
    console.error('Error durante la inicialización:', error);
    hideLoading();
    showError('Error al inicializar el dashboard. Verifica que el servidor esté corriendo.');
  }
}

// ── Start Application ──────────────────────────────
document.addEventListener('DOMContentLoaded', init);
