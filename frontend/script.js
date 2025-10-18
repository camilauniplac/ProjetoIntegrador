// Variáveis globais para armazenar as instâncias dos gráficos
let demandChartInstance = null;
let donutChartInstance = null;

function atualizarDashboard(data) {

  // Cards básicos
  document.getElementById("produtosRisco").textContent = data.produtos_em_risco ?? 0;
  document.getElementById("excessoEstoque").textContent = data.excesso_estoque ?? 0;
  document.getElementById("sugestoesCompra").textContent = data.sugestoes_compra ?? 0;
  document.getElementById("oportunidade").textContent = "R$ " + (data.oportunidade ?? 0).toLocaleString();

  // ===== Mensagem dinâmica para "Risco" =====
  const riscoDescEl = document.getElementById("riscoDesc");

  // Segurança: garantir que alertas exista e seja array
  const alertas = Array.isArray(data.alertas) ? data.alertas : [];

  // Filtrar apenas rupturas iminentes que tenham 'dias_restantes'
  const rupturas = alertas
    .filter(a => a.tipo && a.tipo.toLowerCase().includes("ruptura"))
    .map(a => {
      return {
        produto: a.produto,
        dias: (a.dias_restantes !== undefined && a.dias_restantes !== null) ? Number(a.dias_restantes) : null
      };
    });

  if (rupturas.length > 0) {
    // procurar a menor quantidade de dias (ruptura mais próxima)
    const rupturasComDias = rupturas.filter(r => r.dias !== null);
    if (rupturasComDias.length > 0) {
      rupturasComDias.sort((a, b) => a.dias - b.dias);
      const primeiro = rupturasComDias[0];
      // se houver mais de 1 produto com a mesma menor data, mencionar número
      const mesmoPrazo = rupturasComDias.filter(r => r.dias === primeiro.dias).length;
      if (mesmoPrazo > 1) {
        riscoDescEl.textContent = `Ruptura prevista em ${primeiro.dias} dias ( ${mesmoPrazo} produtos )`;
      } else {
        riscoDescEl.textContent = `Ruptura prevista em ${primeiro.dias} dia${primeiro.dias > 1 ? "s" : ""} — ${primeiro.produto}`;
      }
    } else {
      // há rupturas, mas sem dias_restantes informados
      riscoDescEl.textContent = `${rupturas.length} produto(s) com risco de ruptura`;
    }
  } else if ((data.produtos_em_risco ?? 0) > 0) {
    // fallback: há produtos em risco mas nenhum alerta marcado como 'Ruptura'
    riscoDescEl.textContent = `${data.produtos_em_risco} produto(s) com nível crítico de estoque`;
  } else {
    riscoDescEl.textContent = "Nenhuma ruptura prevista";
  }

  // ===== Mensagem para excesso e sugestoes (pode ajustar dinamicamente se quiser) =====
  const excessoDescEl = document.getElementById("excessoDesc");
  if ((data.excesso_estoque ?? 0) > 0) {
    excessoDescEl.textContent = `${data.excesso_estoque} produto(s) possivelmente parados`;
  } else {
    excessoDescEl.textContent = "Sem excesso relevante";
  }

  const sugestoesDescEl = document.getElementById("sugestoesDesc");
  sugestoesDescEl.textContent = (data.sugestoes_compra && data.sugestoes_compra > 0)
    ? `${data.sugestoes_compra} reposição(ões) recomendadas`
    : "Nenhuma reposição sugerida";

  // Atualiza gráficos e alertas
  atualizarGraficos(data);
  atualizarAlertas(alertas);
}

function atualizarGraficos(data) {
  const ctxLine = document.getElementById("demandChart").getContext("2d");
  const ctxDonut = document.getElementById("donutChart").getContext("2d");

  // 🔹 Se já existir gráfico de linha, destrói antes de recriar
  if (demandChartInstance) {
    demandChartInstance.destroy();
  }

  demandChartInstance = new Chart(ctxLine, {
    type: "line",
    data: {
      labels: data.vendas_labels,
      datasets: [{
        label: "Vendas (últimos 7 dias)",
        data: data.vendas_valores,
        borderWidth: 2,
        borderColor: "#4e79a7",
        backgroundColor: "rgba(78,121,167,0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });

  // 🔹 Se já existir gráfico donut, destrói antes de recriar
  if (donutChartInstance) {
    donutChartInstance.destroy();
  }

  donutChartInstance = new Chart(ctxDonut, {
    type: "doughnut",
    data: {
      labels: ["Em risco", "Excesso", "Adequado"],
      datasets: [{
        data: [
          data.produtos_em_risco,
          data.excesso_estoque,
          Math.max(0, 100 - data.produtos_em_risco - data.excesso_estoque)
        ],
        backgroundColor: ["#e74c3c", "#f1c40f", "#2ecc71"]
      }]
    },
    options: {
      cutout: "70%",
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

function atualizarAlertas(alertas) {
  const container = document.getElementById("alertsList");
  container.innerHTML = "";
  alertas.forEach(a => {
    const div = document.createElement("div");
    div.classList.add("alert");
    div.innerHTML = `<b>${a.tipo}:</b> ${a.produto} — Estoque atual: ${a.estoque_atual}`;
    container.appendChild(div);
  });
}

document.getElementById("useMock").addEventListener("click", async () => {
  try {
    const response = await fetch("http://127.0.0.1:5000/mock");
    const data = await response.json();

    if (data.erro) {
      alert(data.erro);
      return;
    }

    atualizarDashboard(data);
  } catch (error) {
    alert("Erro ao carregar dados demo");
    console.error(error);
  }
});


//#region MODAL - Importar dados
const importarBtn = document.getElementById("importarDadosBtn");
const modal = document.getElementById("importModal");
const closeModalBtn = document.getElementById("closeModal");
const uploadForm = document.getElementById("uploadForm");
// Abrir modal
importarBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

// Fechar modal (botão "Cancelar")
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
  limparCamposUpload(); // 🔹 limpa os inputs
});

// Fechar modal ao clicar fora da área
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
    limparCamposUpload(); // 🔹 limpa também aqui
  }
});

// Enviar os arquivos para o backend e atualizar o dashboard
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const vendasFile = document.getElementById("vendas").files[0];
  const estoqueFile = document.getElementById("estoque").files[0];

  if (!vendasFile || !estoqueFile) {
    alert("⚠️ Por favor, selecione os dois arquivos (vendas e estoque).");
    return;
  }

  // 🔹 Extensões e tipos MIME aceitos
  const extensoesPermitidas = [".csv", ".xls", ".xlsx"];
  const tiposPermitidos = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];

  // 🔹 Função para validar arquivo
  function validarArquivo(file, nomeCampo) {
    const nome = file.name.toLowerCase();
    const extensaoOk = extensoesPermitidas.some(ext => nome.endsWith(ext));
    const tipoOk = tiposPermitidos.includes(file.type);

    if (!extensaoOk && !tipoOk) {
      alert(`❌ O arquivo de ${nomeCampo} deve ser CSV ou Excel (.xls, .xlsx).`);
      return false;
    }
    return true;
  }

  // 🔹 Verificações antes de enviar
  if (!validarArquivo(vendasFile, "VENDAS") || !validarArquivo(estoqueFile, "ESTOQUE")) {
    return; // interrompe o envio
  }

  // 🔹 Criação do FormData e envio
  const formData = new FormData();
  formData.append("vendas", vendasFile);
  formData.append("estoque", estoqueFile);

  try {
    // Mostra um pequeno loading
    const btn = uploadForm.querySelector(".btn.primary");
    btn.textContent = "Processando...";
    btn.disabled = true;

    const res = await fetch("http://127.0.0.1:5000/processar", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      alert("⚠️ Erro no processamento: " + (data.erro || res.statusText));
      btn.textContent = "Enviar e Processar";
      btn.disabled = false;
      return;
    }

    // Fecha o modal
    modal.style.display = "none";

    // Atualiza o dashboard
    atualizarDashboard(data);

    // Reseta o formulário e botão
    uploadForm.reset();
    btn.textContent = "Enviar e Processar";
    btn.disabled = false;

  } catch (err) {
    console.error(err);
    alert("❌ Erro ao enviar arquivos: " + err.message);
    const btn = uploadForm.querySelector(".btn.primary");
    btn.textContent = "Enviar e Processar";
    btn.disabled = false;
  }
});

// 🔹 Função para limpar campos e resetar labels
function limparCamposUpload() {
  uploadForm.reset(); // limpa os arquivos
}

//#endregion MODAL