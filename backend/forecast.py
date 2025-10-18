import pandas as pd
import numpy as np

def gerar_previsao(vendas, estoque):
    resultados = []

    for produto in estoque["produto"].unique():
        dados_produto = vendas[vendas["produto"] == produto]
        media_diaria = dados_produto["quantidade"].mean()

        qtd_estoque = estoque.loc[estoque["produto"] == produto, "quantidade"].values[0]
        dias_restantes = qtd_estoque / media_diaria if media_diaria > 0 else np.inf

        resultados.append({
            "produto": produto,
            "estoque_atual": int(qtd_estoque),
            "media_vendas_dia": round(media_diaria, 2),
            "dias_para_acabar": round(dias_restantes, 1)
        })

    return {"previsoes": resultados}
