# 🎱 Gerador de Cartelas de Bingo

Um gerador de cartelas de bingo 100% cliente (front-end) que permite criar cartelas personalizadas, únicas e sem sequências, com visualização em tempo real, customização de cores, tamanhos, textos, imagens e exportação para PDF pronta para imprimir.

---

## 🧠 Funcionalidades

- ✅ Configuração da quantidade de cartelas, intervalo de números (X a Y), linhas e colunas
- ✅ Célula central "LIVRE" opcional (apenas para grades ímpares)
- ✅ Geração de cartelas **únicas** e sem sequências consecutivas (ex.: 1,2,3,4,5)
- ✅ Validação automática dos parâmetros (viabilidade das combinações)
- ✅ Visualização em grid responsivo
- ✅ Painel de personalização em tempo real:
  - Cor de fundo, borda, destaque (título e célula livre)
  - Largura, altura, tamanho da fonte e arredondamento das células
  - Título editável (ex.: "Bingo da Escola")
  - Texto da célula livre personalizável (ex.: "GRÁTIS")
  - Upload de imagem para a célula livre (substitui o texto) – com redimensionamento automático
- ✅ Navegação por etapas (1. Configurar → 2. Validar → 3. Exportar) com botões que permitem voltar
- ✅ Exportação para PDF via `window.print()` com preservação de cores, imagens e layout
- ✅ Organização em classes JavaScript (BingoCard, CardGenerator, UIController)
- ✅ Totalmente responsivo, funciona offline

---

## 🖥️ Demonstração

Você pode testar o gerador diretamente no navegador abrindo o arquivo `https://cartelabingorenata.netlify.app/`.  



