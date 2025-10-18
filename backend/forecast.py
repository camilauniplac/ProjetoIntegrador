import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

def gerar_previsao(vendas, estoque):
    resultados = []

    # Garantir colunas minúsculas e sem espaços
    vendas.columns = [c.lower().strip() for c in vendas.columns]
    estoque.columns = [c.lower().strip() for c in estoque.columns]

    for produto in estoque["produto"].unique():
        dados_produto = vendas[vendas["produto"] == produto].copy()
        if dados_produto.empty:
            continue

        # Converter data e criar variável numérica
        dados_produto["data"] = pd.to_datetime(dados_produto["data"], errors="coerce")
        dados_produto = dados_produto.dropna(subset=["data"])
        dados_produto = dados_produto.sort_values("data")

        if len(dados_produto) < 3:
            # Se poucos dados, usa média simples
            media_diaria = dados_produto["quantidade"].mean()
            qtd_estoque = estoque.loc[estoque["produto"] == produto, "quantidade"].values[0]
            dias_restantes = qtd_estoque / media_diaria if media_diaria > 0 else np.inf

            resultados.append({
                "produto": produto,
                "estoque_atual": int(qtd_estoque),
                "media_vendas_dia": round(media_diaria, 2),
                "dias_para_acabar": round(dias_restantes, 1),
            })
            continue

        # Treinar modelo de regressão linear
        dados_produto["dia_num"] = (dados_produto["data"] - dados_produto["data"].min()).dt.days
        X = dados_produto[["dia_num"]]
        y = dados_produto["quantidade"]

        model = LinearRegression()
        model.fit(X, y)

        # Prever vendas médias dos próximos 7 dias
        dias_futuros = np.arange(X["dia_num"].max() + 1, X["dia_num"].max() + 8).reshape(-1, 1)
        previsao = model.predict(dias_futuros)
        media_prevista = np.mean(previsao)

        qtd_estoque = estoque.loc[estoque["produto"] == produto, "quantidade"].values[0]
        dias_restantes = qtd_estoque / media_prevista if media_prevista > 0 else np.inf

        resultados.append({
            "produto": produto,
            "estoque_atual": int(qtd_estoque),
            "media_prevista_venda_dia": round(float(media_prevista), 2),
            "dias_para_acabar": round(float(dias_restantes), 1)
        })

    return {"previsoes": resultados}
