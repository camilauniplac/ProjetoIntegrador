import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from datetime import datetime
import os
import numpy as np

from helper import to_python_type, calcular_variacao

app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)

# Caminhos dos arquivos
SALES_FILE = "./data/vendas_mercado.json"
STOCK_FILE = "./data/estoque_mercado.json"
HIST_FILE = "./data/variacao_dados_anteriores.json"

# Rota da API que lê o JSON e devolve os dados
@app.route('/api/estoque')
def get_estoque():
    json_path = os.path.join(os.getcwd(), STOCK_FILE)
    with open(json_path, encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/api/dashboard')
def get_dashboard_data():
    """Gera os dados consolidados para o dashboard"""
    try:
        # Carregar dados dos arquivos
        with open(STOCK_FILE, encoding='utf-8') as f:
            estoque = pd.DataFrame(json.load(f))
        with open(SALES_FILE, encoding='utf-8') as f:
            vendas_json = json.load(f)

        # Normalizar colunas do estoque
        estoque.columns = estoque.columns.str.lower()

        # Converter estrutura de vendas (expandir itens)
        vendas_expandidas = []
        for venda in vendas_json:
            data_venda = venda["data_venda"]
            for item in venda["itens"]:
                vendas_expandidas.append({
                    "data": data_venda,
                    "id_produto": item["id_produto"],
                    "quantidade_vendida": item["quantidade"]
                })
        vendas = pd.DataFrame(vendas_expandidas)

        # --- KPI 1: Produtos em risco (estoque < 10)
        produtos_em_risco = estoque[estoque["quantidade_estoque"] < 10]
        total_risco = len(produtos_em_risco)

        # --- KPI 2: Excesso de estoque (estoque > 100)
        excesso_estoque = estoque[estoque["quantidade_estoque"] > 100]
        total_excesso = len(excesso_estoque)

        # --- KPI 3: Sugestões de compra (produtos em risco + média de vendas)
        vendas['data'] = pd.to_datetime(vendas['data'])
        vendas_agrupadas = vendas.groupby('id_produto')['quantidade_vendida'].sum().reset_index()

        sugestoes = produtos_em_risco[['id', 'nome_produto', 'quantidade_estoque']].merge(
            vendas_agrupadas, left_on='id', right_on='id_produto', how='left'
        )
        total_sugestoes = len(sugestoes)

        # --- KPI 4: Oportunidade de vendas (fictício)
        oportunidade_valor = round(vendas_agrupadas['quantidade_vendida'].sum() * 5, 2)

        # --- KPI 5: Produtos próximos do vencimento (≤ 30 dias)
        hoje = pd.Timestamp.now()
        limite = hoje + pd.Timedelta(days=30)

        if "data_validade" in estoque.columns:
            estoque["data_validade"] = pd.to_datetime(estoque["data_validade"], errors="coerce")
            proximos_vencimento = estoque[
                (estoque["data_validade"].notna()) &
                (estoque["data_validade"] >= hoje) &
                (estoque["data_validade"] <= limite)
            ]
            total_vencimento = len(proximos_vencimento)
        else:
            total_vencimento = 0

        # --- Gráfico: Previsão de demanda (últimos 7 dias)
        ultimos_7 = vendas.groupby('data')['quantidade_vendida'].sum().tail(7)
        vendas_labels = [d.strftime("%d/%m") for d in ultimos_7.index]
        vendas_valores = [float(v) for v in ultimos_7.values]


       
        # =============================
        # NOVO: Status do estoque dinâmico
        # =============================
        estoque["quantidade_estoque"] = pd.to_numeric(
            estoque["quantidade_estoque"], errors="coerce"
        ).fillna(0)
        qtd = estoque["quantidade_estoque"]

        # Definir percentis dinâmicos
        limite_critico = qtd.quantile(0.10)   # 10% menores
        limite_atencao = qtd.quantile(0.25)   # 25% menores
        limite_excesso = qtd.quantile(0.90)   # 10% maiores

        def classificar_estoque(valor):
            if pd.isna(valor):
                return "critico"
            elif valor <= limite_critico:
                return "critico"
            elif valor <= limite_atencao:
                return "atencao"
            elif valor >= limite_excesso:
                return "excesso"   # excesso identificado separadamente
            else:
                return "normal"

        estoque["status_estoque"] = estoque["quantidade_estoque"].apply(classificar_estoque)

        # Contagem por categoria
        status_counts = estoque["status_estoque"].value_counts().to_dict()



        normal = status_counts.get("normal", 0)
        atencao = status_counts.get("atencao", 0)
        critico = status_counts.get("critico", 0)
        excesso = status_counts.get("excesso", 0)

        atencao_total = atencao + excesso
        
        # --- Alertas
        alertas = []
        for _, row in estoque[estoque["status_estoque"] == "critico"].iterrows():
            alertas.append({
                "tipo": "Ruptura Iminente",
                "produto": row['nome_produto'],
                "estoque_atual": int(row['quantidade_estoque']),
                "previsao_dias": max(1, row['quantidade_estoque'] // 3)
            })
        for _, row in estoque[estoque["status_estoque"] == "excesso"].iterrows():
            alertas.append({
                "tipo": "Excesso de Estoque",
                "produto": row['nome_produto'],
                "estoque_atual": int(row['quantidade_estoque']),
                "dias_parado": 45
            })

        # --- Variações simuladas
        variacao_risco = round((critico / (critico + 1)) * 5, 1)
        variacao_excesso = round((excesso / (excesso + 1)) * 3, 1)
        variacao_sugestoes = round((total_sugestoes / (total_sugestoes + 1)) * 2, 1)
        variacao_oportunidade = round((oportunidade_valor / (oportunidade_valor + 1)) * 4, 1)
        variacao_vencimento = round((total_vencimento / (len(estoque) + 1)) * 5, 1)

        # Retornar JSON
        return jsonify({
            "produtos_em_risco": to_python_type(critico),
            "excesso_estoque": to_python_type(excesso),
            "sugestoes_compra": to_python_type(total_sugestoes),
            "oportunidade_valor": to_python_type(oportunidade_valor),
            "vendas_labels": vendas_labels,
            "vendas_valores": [float(v) for v in vendas_valores],
            "produtos_proximos_vencimento": to_python_type(total_vencimento),
            "estoque_status": {
                "normal": to_python_type(normal),
                "atencao": to_python_type(atencao_total),
                "critico": to_python_type(critico),
                "excesso": to_python_type(excesso)
            },
            "variacoes": {
                "risco": float(variacao_risco),
                "excesso": float(variacao_excesso),
                "sugestoes": float(variacao_sugestoes),
                "oportunidade": float(variacao_oportunidade),
                "vencimento": float(variacao_vencimento)
            },
            "alertas": alertas,
            "limites_dinamicos": {
                "critico": round(float(limite_critico), 2),
                "atencao": round(float(limite_atencao), 2),
                "excesso": round(float(limite_excesso), 2)
            }
        })

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route('/api/categorias')
def get_categorias():
    """Retorna lista de categorias únicas do estoque"""
    try:
        json_path = os.path.join(os.getcwd(), STOCK_FILE)
        with open(json_path, encoding='utf-8') as f:
            data = json.load(f)

        categorias = sorted({item["categoria"] for item in data if "categoria" in item})
        return jsonify(categorias)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
