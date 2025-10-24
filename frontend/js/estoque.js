import { API_BASE_URL } from "../js/config.js";

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

   const tabelaBody = document.querySelector("#tabelaEstoque tbody");

  try {
    const response = await fetch(`${API_BASE_URL}/api/estoque`);
    const produtos = await response.json();

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
      `;

      tabelaBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar estoque:", error);
    tabelaBody.innerHTML =
      `<tr><td colspan="10" style="text-align:center; color:red;">Erro ao carregar produtos.</td></tr>`;
  }
});
