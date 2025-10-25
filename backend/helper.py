# Métodos auxiliares
import numpy as np


def to_python_type(value):
    if isinstance(value, (np.int64, np.int32)):
        return int(value)
    if isinstance(value, (np.float64, np.float32)):
        return float(value)
    return value

def calcular_variacao(valor_atual, valor_anterior):
    try:
        if valor_anterior == 0:
            return 0.0
        return round(((valor_atual - valor_anterior) / valor_anterior) * 100, 1)
    except:
        return 0.0
    