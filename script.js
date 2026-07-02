// ================================================================
// CLASSE: BingoCard
// ================================================================
class BingoCard {
    constructor(rows, cols, grid, freeCellPos = null) {
        this.rows = rows;
        this.cols = cols;
        this.grid = grid;
        this.freeCellPos = freeCellPos;
    }

    equals(other) {
        if (this.rows !== other.rows || this.cols !== other.cols) return false;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const a = this.grid[r][c];
                const b = other.grid[r][c];
                if (a.free !== b.free || a.n !== b.n) return false;
            }
        }
        return true;
    }

    hasAnySequence() {
        const checkConsecutive = (arr) => {
            if (arr.length < 3) return false;
            let asc = true, desc = true;
            for (let i = 1; i < arr.length; i++) {
                if (arr[i] !== arr[i - 1] + 1) asc = false;
                if (arr[i] !== arr[i - 1] - 1) desc = false;
            }
            return asc || desc;
        };

        for (let r = 0; r < this.rows; r++) {
            const nums = this.grid[r].filter(c => !c.free).map(c => c.n);
            if (checkConsecutive(nums)) return true;
        }
        for (let c = 0; c < this.cols; c++) {
            const nums = [];
            for (let r = 0; r < this.rows; r++) {
                const cell = this.grid[r][c];
                if (!cell.free) nums.push(cell.n);
            }
            if (checkConsecutive(nums)) return true;
        }
        return false;
    }

    fingerprint() {
        return this.grid.map(row => row.map(c => c.free ? 'F' : c.n).join(',')).join('|');
    }
}

// ================================================================
// CLASSE: CardGenerator
// ================================================================
class CardGenerator {
    static generate(config) {
        const { qty, rows, cols, min, max, freeCenter } = config;
        const hasCenter = freeCenter && rows % 2 === 1 && cols % 2 === 1;
        const centerRow = Math.floor(rows / 2);
        const centerCol = Math.floor(cols / 2);

        const total = max - min + 1;
        const base = Math.floor(total / cols);
        const extra = total % cols;
        const bands = [];
        let start = min;
        for (let i = 0; i < cols; i++) {
            const size = base + (i < extra ? 1 : 0);
            bands.push({ min: start, max: start + size - 1, size });
            start += size;
        }

        for (let c = 0; c < cols; c++) {
            const needed = rows - ((hasCenter && c === centerCol) ? 1 : 0);
            if (bands[c].size < needed) {
                return {
                    error: `A coluna ${c+1} precisa de ${needed} número(s), mas só tem ${bands[c].size} disponíveis (${bands[c].min}–${bands[c].max}).`
                };
            }
        }

        const fingerprints = new Set();
        const cards = [];
        const MAX_ATTEMPTS_PER_CARD = 500;

        for (let i = 0; i < qty; i++) {
            let placed = false;
            for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_CARD && !placed; attempt++) {
                const colValues = bands.map((band, c) => {
                    const needed = rows - ((hasCenter && c === centerCol) ? 1 : 0);
                    const pool = [];
                    for (let v = band.min; v <= band.max; v++) pool.push(v);
                    CardGenerator._shuffle(pool);
                    return pool.slice(0, needed);
                });

                const grid = Array.from({ length: rows }, () => []);
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (hasCenter && r === centerRow && c === centerCol) {
                            grid[r][c] = { free: true, n: null };
                        } else {
                            const idx = (hasCenter && c === centerCol && r > centerRow) ? r - 1 : r;
                            grid[r][c] = { free: false, n: colValues[c][idx] };
                        }
                    }
                }

                const card = new BingoCard(rows, cols, grid);
                if (card.hasAnySequence()) continue;

                const fp = card.fingerprint();
                if (fingerprints.has(fp)) continue;

                fingerprints.add(fp);
                cards.push(card);
                placed = true;
            }
            if (!placed) {
                return {
                    error: `Só foi possível gerar ${cards.length} cartela(s) únicas de ${qty} pedidas.`,
                    partial: cards
                };
            }
        }
        return { cards, error: null };
    }

    static _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}

// ================================================================
// CLASSE: UIController
// ================================================================
class UIController {
    constructor() {
        this.currentStep = 1;
        this.state = {
            cards: [],
            rows: 5,
            cols: 5,
            freeCenter: true,
            cardTitle: "BINGO",
            freeText: "FREE",
            freeImage: null   // base64 da imagem
        };

        this._cacheElements();
        this._bindEvents();
        this._updateStepButtons();
        this._applyStyles();
    }

    _cacheElements() {
        this.view1 = document.getElementById('view1');
        this.view2 = document.getElementById('view2');
        this.view3 = document.getElementById('view3');
        this.stepBtns = document.querySelectorAll('.step-btn');
        this.msgBox = document.getElementById('msgBox');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.cardsGridPrint = document.getElementById('cardsGridPrint');
        this.cardsCount = document.getElementById('cardsCount');
        this.dupBanner = document.getElementById('dupBanner');

        // Inputs de configuração
        this.qtdCartelas = document.getElementById('qtdCartelas');
        this.linhas = document.getElementById('linhas');
        this.colunas = document.getElementById('colunas');
        this.numMin = document.getElementById('numMin');
        this.numMax = document.getElementById('numMax');
        this.centroLivre = document.getElementById('centroLivre');

        // Inputs de customização (existentes)
        this.cBg = document.getElementById('cBg');
        this.cBorder = document.getElementById('cBorder');
        this.cAccent = document.getElementById('cAccent');
        this.cellW = document.getElementById('cellW');
        this.cellH = document.getElementById('cellH');
        this.cellFont = document.getElementById('cellFont');
        this.cardRadius = document.getElementById('cardRadius');

        // Labels de valores
        this.vBg = document.getElementById('vBg');
        this.vBorder = document.getElementById('vBorder');
        this.vAccent = document.getElementById('vAccent');
        this.vCellW = document.getElementById('vCellW');
        this.vCellH = document.getElementById('vCellH');
        this.vFont = document.getElementById('vFont');
        this.vRadius = document.getElementById('vRadius');

        this.printCols = document.getElementById('printCols');

        // NOVOS elementos para título e célula livre
        this.cardTitleInput = document.getElementById('cardTitle');
        this.freeTextInput = document.getElementById('freeText');
        this.freeImageInput = document.getElementById('freeImage');
        this.removeImageBtn = document.getElementById('removeImage');
    }

    _bindEvents() {
        document.getElementById('btnGerar').addEventListener('click', () => this._generate());
        document.getElementById('btnVoltar').addEventListener('click', () => this._goToStep(1));
        document.getElementById('btnVoltar2').addEventListener('click', () => this._goToStep(2));
        document.getElementById('btnIrExportar').addEventListener('click', () => this._goToStep(3));

        this.stepBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const step = parseInt(btn.dataset.step);
                if (step < this.currentStep) this._goToStep(step);
            });
        });

        // Customização de cores/tamanhos
        ['cBg', 'cBorder', 'cAccent', 'cellW', 'cellH', 'cellFont', 'cardRadius'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this._applyStyles());
        });

        this.printCols.addEventListener('change', () => {
            document.documentElement.style.setProperty('--print-cols', this.printCols.value);
        });

        document.getElementById('btnImprimir').addEventListener('click', () => window.print());

        // NOVOS eventos para título e célula livre
        this.cardTitleInput.addEventListener('input', () => {
            this.state.cardTitle = this.cardTitleInput.value || "BINGO";
            this._renderCards();
        });
        this.freeTextInput.addEventListener('input', () => {
            this.state.freeText = this.freeTextInput.value || "FREE";
            if (!this.state.freeImage) this._renderCards();
        });
        this.freeImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    this.state.freeImage = ev.target.result;
                    this._renderCards();
                };
                reader.readAsDataURL(file);
            }
        });
        this.removeImageBtn.addEventListener('click', () => {
            this.state.freeImage = null;
            this.freeImageInput.value = '';  // limpa o campo de arquivo
            this._renderCards();
        });
    }

    _showMessage(text, type = 'error') {
        this.msgBox.textContent = text;
        this.msgBox.className = `msg ${type}`;
    }

    _clearMessage() {
        this.msgBox.textContent = '';
        this.msgBox.className = 'msg';
    }

    _goToStep(n) {
        [this.view1, this.view2, this.view3].forEach(v => {
            v.classList.remove('active', 'print-active');
        });
        if (n === 1) this.view1.classList.add('active');
        if (n === 2) this.view2.classList.add('active');
        if (n === 3) {
            this.view3.classList.add('active');
            this.view3.classList.add('print-active');
        }
        this.currentStep = n;
        this._updateStepButtons();
    }

    _updateStepButtons() {
        this.stepBtns.forEach(btn => {
            const step = parseInt(btn.dataset.step);
            btn.classList.remove('active', 'clickable');
            if (step === this.currentStep) {
                btn.classList.add('active');
            } else if (step < this.currentStep) {
                btn.classList.add('clickable');
            }
        });
    }

    _validateInputs() {
        const qty = parseInt(this.qtdCartelas.value);
        const rows = parseInt(this.linhas.value);
        const cols = parseInt(this.colunas.value);
        const min = parseInt(this.numMin.value);
        const max = parseInt(this.numMax.value);
        if (!qty || qty < 1) return 'Quantidade de cartelas inválida (mínimo 1).';
        if (!rows || rows < 1 || !cols || cols < 1) return 'Linhas e colunas devem ser pelo menos 1.';
        if (isNaN(min) || isNaN(max) || max <= min) return 'O número final (Y) deve ser maior que o inicial (X).';
        if ((max - min + 1) < rows * cols) return `Intervalo muito pequeno (${max-min+1} números) para ${rows*cols} células.`;
        return null;
    }

    _generate() {
        this._clearMessage();
        const errorMsg = this._validateInputs();
        if (errorMsg) {
            this._showMessage(errorMsg, 'error');
            return;
        }

        const qty = parseInt(this.qtdCartelas.value);
        const rows = parseInt(this.linhas.value);
        const cols = parseInt(this.colunas.value);
        const min = parseInt(this.numMin.value);
        const max = parseInt(this.numMax.value);
        const freeCenter = this.centroLivre.checked;

        const result = CardGenerator.generate({ qty, rows, cols, min, max, freeCenter });

        if (result.error && (!result.partial || result.partial.length === 0)) {
            this._showMessage(result.error, 'error');
            return;
        }
        if (result.error && result.partial) {
            this._showMessage(result.error, 'warn');
            this.state.cards = result.partial;
        } else {
            this.state.cards = result.cards;
        }

        this.state.rows = rows;
        this.state.cols = cols;
        this.state.freeCenter = freeCenter && rows % 2 === 1 && cols % 2 === 1;

        // Mantém os valores atuais de título, texto livre e imagem
        this.state.cardTitle = this.cardTitleInput.value || "BINGO";
        this.state.freeText = this.freeTextInput.value || "FREE";
        // freeImage já está no state

        this._renderCards();
        this._goToStep(2);
    }

    _renderCards() {
        const html = this.state.cards.map((card, idx) => this._buildCardHTML(card, idx)).join('');
        this.cardsGrid.innerHTML = html;
        this.cardsGridPrint.innerHTML = html;
        this.cardsCount.textContent =
            `${this.state.cards.length} cartela(s) · ${this.state.rows}×${this.state.cols} · ${this.state.freeCenter ? 'com' : 'sem'} livre central`;
        this.dupBanner.style.display = 'none';
    }

    _buildCardHTML(card, index) {
        const { rows, cols, grid } = card;
        let cellsHTML = '';
        const freeImage = this.state.freeImage;
        const freeText = this.state.freeText || "FREE";

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = grid[r][c];
                if (cell.free) {
                    if (freeImage) {
                        cellsHTML += `<div class="bingo-cell free"><img src="${freeImage}" alt="Livre"></div>`;
                    } else {
                        cellsHTML += `<div class="bingo-cell free">${freeText}</div>`;
                    }
                } else {
                    cellsHTML += `<div class="bingo-cell">${cell.n}</div>`;
                }
            }
        }
        return `
            <div class="bingo-card">
                <div class="card-head">
                    <div class="card-title">${this.state.cardTitle || "BINGO"}</div>
                    <div class="card-num">Nº ${String(index+1).padStart(3,'0')}</div>
                </div>
                <div class="bingo-grid" style="grid-template-columns: repeat(${cols}, var(--cell-w));">
                    ${cellsHTML}
                </div>
            </div>`;
    }

    _applyStyles() {
        const root = document.documentElement.style;
        root.setProperty('--card-bg', this.cBg.value);
        root.setProperty('--card-border', this.cBorder.value);
        root.setProperty('--card-number', this.cBorder.value);
        root.setProperty('--card-accent', this.cAccent.value);
        root.setProperty('--cell-w', this.cellW.value + 'px');
        root.setProperty('--cell-h', this.cellH.value + 'px');
        root.setProperty('--cell-font', this.cellFont.value + 'px');
        root.setProperty('--card-radius', this.cardRadius.value + 'px');

        this.vBg.textContent = this.cBg.value;
        this.vBorder.textContent = this.cBorder.value;
        this.vAccent.textContent = this.cAccent.value;
        this.vCellW.textContent = this.cellW.value + 'px';
        this.vCellH.textContent = this.cellH.value + 'px';
        this.vFont.textContent = this.cellFont.value + 'px';
        this.vRadius.textContent = this.cardRadius.value + 'px';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});