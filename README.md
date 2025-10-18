# 🧠 Projeto Integrador — Plataforma de Gestão Proativa de Estoque

Este projeto é composto por dois módulos principais:

- **Backend**: API desenvolvida em **Flask (Python)**, responsável pelo processamento e previsão de demanda.  
- **Frontend**: Interface web em **HTML, CSS e JavaScript**, que consome a API para exibir os resultados.

---

## 🚀 Tecnologias utilizadas

- **Python 3.10+**
- **Flask**
- **Pandas / Scikit-learn**
- **HTML, CSS e JavaScript**

---

## ⚙️ Como rodar o projeto localmente

### 1️⃣ Clonar o repositório
```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```
2️⃣ Configurar e rodar o backend (API Flask)

Vá até a pasta do backend:
```
cd backend
```

Crie e ative um ambiente virtual:
```
python -m venv venv
venv\Scripts\activate   # Windows
# ou
source venv/bin/activate  # Linux/Mac
```


Instale as dependências:
```
pip install -r requirements.txt
```

Execute o servidor Flask:
```
python app.py
```

O backend será iniciado em:

http://127.0.0.1:5000

3️⃣ Rodar o frontend

Abra outro terminal e vá até a pasta do frontend:
```
cd frontend
```

Inicie um servidor local (recomendado usar o Live Server do VS Code):

Clique com o botão direito no index.html

Selecione "Open with Live Server"

Ou use o Python:
```
python -m http.server 8000
```

Acesse no navegador:

http://127.0.0.1:8000

4️⃣ Conexão com a API

O frontend se comunica com a API Flask por meio da URL definida no arquivo:

frontend/config.js


Exemplo:
```
export const API_BASE_URL = "http://127.0.0.1:5000"; // ambiente local
```

Para o ambiente hospedado:
```
export const API_BASE_URL = "https://projetointegrador-wl8d.onrender.com";
```
