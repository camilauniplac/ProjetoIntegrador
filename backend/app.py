from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)


def carregar_arquivo(file_storage):
    """Lê o arquivo enviado (CSV, Excel, TXT ou JSON) e retorna um DataFrame pandas."""
    nome = file_storage.filename.lower()

    try:
        if nome.endswith(".csv") or nome.endswith(".txt"):
            return pd.read_csv(file_storage, sep=None, engine="python")
        elif nome.endswith(".xlsx") or nome.endswith(".xls"):
            return pd.read_excel(file_storage)
        elif nome.endswith(".json"):
            return pd.read_json(file_storage)
        else:
            raise ValueError("Formato de arquivo não suportado. Envie um CSV, Excel ou JSON.")
    except Exception as e:
        raise ValueError(f"Erro ao ler o arquivo '{nome}': {str(e)}")


def detectar_tipo_arquivo(df):
    """Tenta identificar se o arquivo é de vendas ou estoque com base nas colunas."""
    colunas = [c.lower() for c in df.columns]

    padroes_vendas = ["data", "dia", "dt_venda", "emissao", "quantidade", "vendida"]
    padroes_estoque = ["estoque", "saldo", "disponivel", "qtd_estoque"]

    tem_vendas = any(p in col for col in colunas for p in padroes_vendas)
    tem_estoque = any(p in col for col in colunas for p in padroes_estoque)

    if tem_vendas and not tem_estoque:
        return "vendas"
    elif tem_estoque and not tem_vendas:
        return "estoque"
    elif tem_vendas and tem_estoque:
        return "indefinido"
    else:
        return "desconhecido"


@app.route('/processar', methods=['POST'])
def processar():
    vendas_file = request.files.get('vendas')
    estoque_file = request.files.get('estoque')

    if not vendas_file or not estoque_file:
        return jsonify({"erro": "Arquivos de vendas e estoque são obrigatórios."}), 400

    try:
        vendas = carregar_arquivo(vendas_file)
        estoque = carregar_arquivo(estoque_file)
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400

    # 🔍 Detectar tipo dos arquivos
    tipo_vendas = detectar_tipo_arquivo(vendas)
    tipo_estoque = detectar_tipo_arquivo(estoque)

    if tipo_vendas == "estoque" and tipo_estoque == "vendas":
        return jsonify({"erro": "Os arquivos parecem estar invertidos. Verifique se enviou o CSV correto para cada campo."}), 400
    if tipo_vendas == "desconhecido" or tipo_estoque == "desconhecido":
        return jsonify({"erro": "Não foi possível identificar o tipo dos arquivos. Verifique se estão no formato esperado."}), 400

    return processar_dados(vendas, estoque)


@app.route('/mock', methods=['GET'])
def mock():
    """Lê dados demo salvos localmente."""
    try:
        vendas = pd.read_csv('static/dados_demo_vendas.csv', sep=None, engine="python")
        estoque = pd.read_csv('static/dados_demo_estoque.csv', sep=None, engine="python")
    except Exception as e:
        return jsonify({"erro": f"Erro ao ler arquivos demo: {str(e)}"}), 500

    return processar_dados(vendas, estoque)


def get_col(df, possible_names):
    """Procura uma coluna existente entre nomes possíveis."""
    df.columns = df.columns.str.lower().str.strip()
    for name in possible_names:
        for col in df.columns:
            if name in col:
                return col
    raise KeyError(f"Nenhuma coluna encontrada entre: {possible_names}")


def processar_dados(vendas, estoque):
    try:
        # Normalizar colunas
        vendas.columns = [c.strip().lower() for c in vendas.columns]
        estoque.columns = [c.strip().lower() for c in estoque.columns]

        # Detectar colunas dinamicamente
        col_data = get_col(vendas, ["data", "dia", "dt_venda", "emissao"])
        col_qtd_venda = get_col(vendas, ["quantidade", "qtd", "qtde", "volume", "vendida"])
        col_produto = get_col(vendas, ["produto", "item", "descricao", "nome"])

        col_qtd_estoque = get_col(estoque, ["quantidade", "estoque", "qtd", "saldo", "disponivel"])
        col_produto_estoque = get_col(estoque, ["produto", "item", "descricao", "nome"])

        # Processamento de vendas
        vendas[col_data] = pd.to_datetime(vendas[col_data], errors="coerce")
        vendas = vendas.dropna(subset=[col_data])
        ultimos_7 = vendas.groupby(col_data)[col_qtd_venda].sum().tail(7)

        # Identificar produtos em risco e excesso
        produtos_em_risco = estoque[estoque[col_qtd_estoque] < 10]
        excesso_estoque = estoque[estoque[col_qtd_estoque] > 100]

        # Sugestões
        sugestoes = produtos_em_risco[col_produto_estoque].tolist()

        # Alertas
        alertas = []
        for _, row in produtos_em_risco.iterrows():
            alertas.append({
                "tipo": "Ruptura Iminente",
                "produto": str(row[col_produto_estoque]),
                "estoque_atual": int(row[col_qtd_estoque]),
                "dias_restantes": int(max(1, row[col_qtd_estoque] // 3))
            })
        for _, row in excesso_estoque.iterrows():
            alertas.append({
                "tipo": "Excesso de Estoque",
                "produto": str(row[col_produto_estoque]),
                "estoque_atual": int(row[col_qtd_estoque]),
                "dias_parado": 45
            })

        # Retorno JSON
        return jsonify({
            "produtos_em_risco": int(len(produtos_em_risco)),
            "excesso_estoque": int(len(excesso_estoque)),
            "sugestoes_compra": int(len(sugestoes)),
            "vendas_labels": [d.strftime("%d/%m") for d in ultimos_7.index],
            "vendas_valores": [float(v) for v in ultimos_7.values],
            "alertas": alertas
        })

    except KeyError as e:
        return jsonify({"erro": f"Erro de mapeamento de colunas: {str(e)}"}), 400

    except Exception as e:
        return jsonify({"erro": f"Erro inesperado no processamento: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)
