import { API_BASE_URL } from "../js/config.js";

let produtosCache = []; // manter em memória para evitar múltiplos fetch

async function carregarProdutos() {
  try {
    const resposta = await fetch(`${API_BASE_URL}/api/estoque`);
    produtosCache = await resposta.json();
    renderizarTabela(produtosCache);
    atualizarInfoEstoque(produtosCache.length, produtosCache.length);
  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
  }
}

function atualizarInfoEstoque(totalFiltrado, totalGeral) {
  document.getElementById("totalFiltrado").textContent = totalFiltrado;
  document.getElementById("totalGeral").textContent = totalGeral;
}

// Função para buscar categorias
async function carregarCategorias() {
  try {
    const resposta = await fetch(`${API_BASE_URL}/api/categorias`);
    const categorias = await resposta.json();

    const selectCategoria = document.getElementById("filtro-categoria");
    selectCategoria.innerHTML = `<option value="">Todas as categorias</option>`;

    categorias.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      selectCategoria.appendChild(option);
    });
  } catch (erro) {
    console.error("Erro ao carregar categorias:", erro);
  }
}

// Renderiza tabela de produtos
function renderizarTabela(produtos) {

 const tabelaBody = document.querySelector("#tabelaEstoque tbody");

  try {
    tabelaBody.innerHTML = ""; // limpa o "Carregando..."

    produtos.forEach(produto => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${produto.id}</td>
        <td>${produto.nome_produto}</td>
        <td>${produto.categoria}</td>
        <td>R$ ${produto.preco_unitario.toFixed(2)}</td>
        <td>${produto.quantidade_estoque}</td>
        <td>${produto.unidade_medida}</td>
        <td>${produto.fornecedor}</td>
        <td>${produto.data_entrada || '-'}</td>
        <td>${produto.data_validade || '-'}</td>
        <td>${produto.codigo_barras}</td>
        <td class="acoes">
          <button class="btn-acao editar" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-acao excluir" title="Excluir">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      `;

      tabelaBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar estoque:", error);
    tabelaBody.innerHTML =
      `<tr><td colspan="10" style="text-align:center; color:red;">Erro ao carregar produtos.</td></tr>`;
  }
  
}

// Função que aplica todos os filtros
function aplicarFiltros() {
  const nomeFiltro = document.getElementById("filtro-nome")?.value.toLowerCase() || "";
  const categoriaFiltro = document.getElementById("filtro-categoria")?.value || "";
  const fornecedorFiltro = document.getElementById("filtro-fornecedor")?.value || "";
  const quantidadeFiltro = document.getElementById("filtro-quantidade")?.value || "";

  let produtosFiltrados = [...produtosCache];

    // Função auxiliar para normalizar (remove acentos e deixa minúsculo)
  const normalizarTexto = (texto) =>
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // Filtro por nome (considera acentos e variações)
  if (nomeFiltro) {
    const nomeNormalizado = normalizarTexto(nomeFiltro);
    produtosFiltrados = produtosFiltrados.filter(p =>
      normalizarTexto(p.nome_produto).includes(nomeNormalizado)
    );
  }

  // Filtro por categoria
  if (categoriaFiltro) {
    produtosFiltrados = produtosFiltrados.filter(p => p.categoria === categoriaFiltro);
  }

  // Filtro por fornecedor
  // if (fornecedorFiltro) {
  //   produtosFiltrados = produtosFiltrados.filter(p => p.fornecedor === fornecedorFiltro);
  // }

  // Filtro por quantidade
  if (quantidadeFiltro === "baixo") {
    produtosFiltrados = produtosFiltrados.filter(p => p.quantidade_estoque < 20);
  } else if (quantidadeFiltro === "medio") {
    produtosFiltrados = produtosFiltrados.filter(p => p.quantidade_estoque >= 20 && p.quantidade_estoque <= 200);
  } else if (quantidadeFiltro === "alto") {
    produtosFiltrados = produtosFiltrados.filter(p => p.quantidade_estoque > 200);
  }

  renderizarTabela(produtosFiltrados);
  atualizarInfoEstoque(produtosFiltrados.length, produtosCache.length);
}

// Eventos dos filtros
["filtro-nome", "filtro-categoria", "filtro-fornecedor", "filtro-quantidade"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", aplicarFiltros);
});


// Limpar filtros
document.getElementById("btnLimparFiltros")?.addEventListener("click", () => {
  document.getElementById("filtro-nome").value = "";
  document.getElementById("filtro-categoria").value = "";
  document.getElementById("filtro-quantidade").value = "";
  renderizarTabela(produtosCache); // Recarrega tabela completa
    atualizarInfoEstoque(produtosCache.length, produtosCache.length);

});

// Inicialização
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

  
  await carregarCategorias();
  await carregarProdutos();
});

