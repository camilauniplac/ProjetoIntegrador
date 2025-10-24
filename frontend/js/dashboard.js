// Dashboard JavaScript

document.addEventListener("DOMContentLoaded", async () => {
  const sidebarContainer = document.getElementById("sidebar-container");

  // carrega o HTML do menu
  const response = await fetch("sidebar.html");
  const sidebarHTML = await response.text();
  sidebarContainer.innerHTML = sidebarHTML;

  // define o item ativo automaticamente
  const currentPage = window.location.pathname.split("/").pop();
  const navItems = sidebarContainer.querySelectorAll(".nav-item");

  navItems.forEach(item => {
    const href = item.getAttribute("href");
    item.classList.toggle("active", href === currentPage);
  });
});

document.addEventListener('DOMContentLoaded', function() {
    // Demand Forecast Chart
    const demandCtx = document.getElementById('demandChart');
    if (demandCtx) {
        new Chart(demandCtx, {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [
                    {
                        label: 'Real',
                        data: [65, 78, 85, 72, 90, 95, 88],
                        borderColor: '#2563EB',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Previsto',
                        data: [null, null, null, null, null, 98, 105],
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
                        display: false
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
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Stock Status Chart
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Normal', 'Atenção', 'Crítico'],
                datasets: [{
                    data: [245, 32, 12],
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
    
    // Simulate real-time updates
    function simulateRealTimeUpdate() {
        // This would connect to a real API in production
        console.log('Real-time update simulated');
    }
    
    // Update every 30 seconds
    setInterval(simulateRealTimeUpdate, 30000);
    
    // Table sorting (basic implementation)
    const tableHeaders = document.querySelectorAll('.data-table th');
    tableHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', function() {
            console.log('Sort by:', this.textContent);
            // Implement sorting logic here
        });
    });
    
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
});