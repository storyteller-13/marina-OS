/**
 * Chess.com Daily Panel – fetches daily puzzle via API and renders board (no iframe)
 */
const PIECE_SYMBOLS = {
  K: '\u2654', Q: '\u2655', R: '\u2656', B: '\u2657', N: '\u2658', P: '\u2659',
  k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F',
};

class ChessPanel {
  constructor() {
    this.boxId = 'chess-box';
    this.apiUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === ''))
      ? 'https://api.chess.com/pub/puzzle'
      : '/api/chess';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadPuzzle();
  }

  setupEventListeners() {
    const box = document.getElementById(this.boxId);
    const closeBtn = document.getElementById('chess-box-close');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideBox());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && box && box.style.display !== 'none') {
        this.hideBox();
      }
    });
  }

  /** Parse FEN piece placement (first field) into 8x8 array; returns board[rank][file] with rank 0 = 8th rank. */
  fenToBoard(fen) {
    const placement = (fen || '').split(' ')[0];
    if (!placement) return null;
    const rows = placement.split('/');
    if (rows.length !== 8) return null;
    const board = [];
    for (let r = 0; r < 8; r++) {
      const row = [];
      for (const ch of rows[r]) {
        if (/[1-8]/.test(ch)) {
          for (let i = 0; i < parseInt(ch, 10); i++) row.push(null);
        } else if (/[KQRBNPkqrbnp]/.test(ch)) {
          row.push(ch);
        }
      }
      board.push(row);
    }
    return board;
  }

  renderBoard(container, fen) {
    const board = this.fenToBoard(fen);
    if (!board) return;
    container.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const isLight = (r + f) % 2 === 0;
        const cell = document.createElement('div');
        cell.className = 'cell ' + (isLight ? 'light' : 'dark');
        const piece = board[r][f];
        if (piece) {
          cell.textContent = PIECE_SYMBOLS[piece] || piece;
        }
        container.appendChild(cell);
      }
    }
  }

  setLoading(loading) {
    const el = document.getElementById('chess-loading');
    const content = document.getElementById('chess-puzzle-content');
    const err = document.getElementById('chess-error');
    if (el) el.style.display = loading ? 'block' : 'none';
    if (content) content.style.display = loading ? 'none' : 'flex';
    if (err) err.style.display = 'none';
  }

  extractFen(data) {
    if (!data) return null;
    if (typeof data === 'string' && /^[rnbqkpRNBQKP1-8\/\s]+/.test(data)) return data.split(/\s/)[0];
    if (data.fen) return data.fen;
    if (data.puzzle && data.puzzle.fen) return data.puzzle.fen;
    if (Array.isArray(data['@graph']) && data['@graph'][0]?.fen) return data['@graph'][0].fen;
    if (data.pgn) {
      const match = data.pgn.match(/\bFEN\s+"([^"]+)"/);
      if (match) return match[1];
    }
    return null;
  }

  setError() {
    const el = document.getElementById('chess-loading');
    const content = document.getElementById('chess-puzzle-content');
    const err = document.getElementById('chess-error');
    if (el) el.style.display = 'none';
    if (content) content.style.display = 'none';
    if (err) err.style.display = 'block';
  }

  async loadPuzzle() {
    const wrap = document.getElementById('chess-board-wrap');
    const content = document.getElementById('chess-puzzle-content');
    if (!wrap || !content) return;

    this.setLoading(true);

    try {
      const res = await fetch(this.apiUrl, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();

      const fen = this.extractFen(data);
      if (fen) {
        this.renderBoard(wrap, fen);
        this.setLoading(false);
        return;
      }

      throw new Error('No FEN in response');
    } catch (e) {
      try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.chess.com/pub/puzzle');
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        const fen = this.extractFen(data);
        if (fen) {
          this.renderBoard(wrap, fen);
          this.setLoading(false);
          return;
        }
      } catch (_) {}
      this.setError();
    }
  }

  toggleVisibility() {
    const box = document.getElementById(this.boxId);
    if (!box) return;
    const isVisible = box.style.display !== 'none' && window.getComputedStyle(box).display !== 'none';
    if (isVisible) this.hideBox();
    else this.showBox();
  }

  showBox() {
    const box = document.getElementById(this.boxId);
    if (!box) return;
    box.style.display = 'block';
    box.style.opacity = '0';
    box.style.transform = 'translateX(-50%) translateY(-10px) scale(0.95)';
    void box.offsetHeight;
    requestAnimationFrame(() => {
      box.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      box.style.opacity = '1';
      box.style.transform = 'translateX(-50%) translateY(0) scale(1)';
    });
  }

  hideBox() {
    const box = document.getElementById(this.boxId);
    if (!box) return;
    box.style.opacity = '0';
    box.style.transform = 'translateX(-50%) translateY(-10px) scale(0.95)';
    setTimeout(() => { box.style.display = 'none'; }, 400);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { window.ChessPanel = new ChessPanel(); });
} else {
  window.ChessPanel = new ChessPanel();
}

window.openChessWindow = () => {
  if (window.ChessPanel) window.ChessPanel.toggleVisibility();
};
