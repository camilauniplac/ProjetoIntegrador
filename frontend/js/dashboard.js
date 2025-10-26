import { API_BASE_URL } from "../js/config.js";

document.addEventListener("DOMContentLoaded", async () => {
    try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard`);
    const data = await res.json();

    // KPIs
    document.getElementById("kpi-risco").textContent = data.produtos_em_risco;
    document.getElementById("kpi-excesso").textContent = data.excesso_estoque;
    document.getElementById("kpi-sugestoes").textContent = data.sugestoes_compra;
    document.getElementById("kpi-vencimento").textContent = data.produtos_proximos_vencimento;
    atualizarKpiTrend("risco", data.variacoes.risco);
    atualizarKpiTrend("vencimento", data.variacoes.vencimento);
    atualizarKpiTrend("excesso", data.variacoes.excesso);
    atualizarKpiTrend("sugestoes", data.variacoes.sugestoes);

     // Gráfico de previsão de demanda para os próximos 30 dias (dados reais do backend)
    const demandCtx = document.getElementById('demandChart');
    if (demandCtx) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/previsao`);
        const previsaoData = await response.json();

        // Extrai labels e valores do JSON
        const labels = previsaoData.map(item => item.data);
        const valores = previsaoData.map(item => item.valor);

        new Chart(demandCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Previsão (próximos 30 dias)',
                        data: valores,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderDash: [5, 5],
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        borderRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        title: {
                            display: true,
                            text: 'Quantidade Prevista'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Data'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erro ao carregar previsão de demanda:", error);
    }
    }   


    // Stock Status Chart
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Normal', 'Atenção', 'Crítico'],
                datasets: [{
                    data: [
                    data.estoque_status.normal,
                    data.estoque_status.atencao,
                    data.estoque_status.critico
                    ],
                    backgroundColor: [
                        '#10B981',
                        '#F59E0B',
                        '#EF4444'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        borderRadius: 8
                    }
                },
                cutout: '70%'
            }
        });
    }
    const legendContainer = document.getElementById("status-legend");
    if (legendContainer && data.estoque_status) {
        legendContainer.innerHTML = `
            <div class="legend-item">
                <span class="legend-dot green"></span>
                <span>Normal: ${data.estoque_status.normal} produtos</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot orange"></span>
                <span>Atenção: ${data.estoque_status.atencao} produtos</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot red"></span>
                <span>Crítico: ${data.estoque_status.critico} produtos</span>
            </div>
        `;
    }
    // Alertas
    const container = document.getElementById("alerts-container");
    if (container) {
      container.innerHTML = data.alertas.map(a => `
        <div class="alert-item ${a.tipo.includes('Ruptura') ? 'critical' : 'warning'}">
          <div class="alert-icon"><i class="fas fa-exclamation-circle"></i></div>
          <div class="alert-content">
            <h4>${a.tipo}</h4>
            <p><strong>${a.produto}</strong> - Estoque atual: ${a.estoque_atual}</p>
          </div>
        </div>
      `).join("");
    }


    // Search functionality
    const searchInput = document.querySelector('.input-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.data-table tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    // Filter by status
    const filterSelect = document.querySelector('.select-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function(e) {
            const filterValue = e.target.value;
            const rows = document.querySelectorAll('.data-table tbody tr');
            
            rows.forEach(row => {
                if (filterValue === 'Todos os status') {
                    row.style.display = '';
                } else {
                    const status = row.querySelector('.status-badge');
                    if (status && status.textContent.trim() === filterValue) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
        });
    }
    
    // Action buttons
    document.querySelectorAll('.btn-action').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const productName = row.querySelector('strong').textContent;
            
            if (confirm(`Criar pedido de reposição para ${productName}?`)) {
                window.StockSense.showNotification(
                    `Pedido criado para ${productName}`,
                    'success'
                );
            }
        });
    });
    
    // Alert action buttons
    document.querySelectorAll('.alert-action .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const alertContent = this.closest('.alert-item').querySelector('h4').textContent;
            window.StockSense.showNotification(
                `Ação iniciada: ${alertContent}`,
                'success'
            );
        });
    });

  } catch (err) {
    console.error("Erro ao carregar dados do dashboard:", err);
  }

});

// Função auxiliar p/ atualizar % de variação no KPI
function atualizarKpiTrend(kpi, valor) {
  const trend = document.getElementById(`kpi-trend-${kpi}`);
  if (!trend) return;

  if (valor > 0) {
    trend.className = "kpi-trend up";
    trend.innerHTML = `<i class="fas fa-arrow-up"></i> ${valor}%`;
  } else if (valor < 0) {
    trend.className = "kpi-trend down";
    trend.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(valor)}%`;
  } else {
    trend.className = "kpi-trend neutral";
    trend.innerHTML = `<i class="fas fa-minus"></i> 0%`;
  }
}
