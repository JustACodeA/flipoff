import { Tile } from './Tile.js';
import {
  GRID_COLS, GRID_ROWS, STAGGER_DELAY,
  TOTAL_TRANSITION, ACCENT_COLORS
} from './constants.js';

export class Board {
  constructor(containerEl, soundEngine) {
    this.cols = GRID_COLS;
    this.rows = GRID_ROWS;
    this.soundEngine = soundEngine;
    this.isTransitioning = false;
    this.tiles = [];
    this.currentGrid = [];
    this.currentColorGrid = [];
    this.accentIndex = 0;

    // Build board DOM
    this.boardEl = document.createElement('div');
    this.boardEl.className = 'board';
    this.boardEl.style.setProperty('--grid-cols', this.cols);
    this.boardEl.style.setProperty('--grid-rows', this.rows);

    // Left accent squares
    this.leftBar = this._createAccentBar('accent-bar-left');
    this.boardEl.appendChild(this.leftBar);

    // Tile grid
    this.gridEl = document.createElement('div');
    this.gridEl.className = 'tile-grid';

    for (let r = 0; r < this.rows; r++) {
      const row = [];
      const charRow = [];
      const colorRow = [];
      for (let c = 0; c < this.cols; c++) {
        const tile = new Tile(r, c);
        tile.setChar(' ');
        this.gridEl.appendChild(tile.el);
        row.push(tile);
        charRow.push(' ');
        colorRow.push(null);
      }
      this.tiles.push(row);
      this.currentGrid.push(charRow);
      this.currentColorGrid.push(colorRow);
    }

    this.boardEl.appendChild(this.gridEl);

    // Right accent squares
    this.rightBar = this._createAccentBar('accent-bar-right');
    this.boardEl.appendChild(this.rightBar);

    containerEl.appendChild(this.boardEl);
    this._updateAccentColors();
  }

  _createAccentBar(extraClass) {
    const bar = document.createElement('div');
    bar.className = `accent-bar ${extraClass}`;
    for (let i = 0; i < 2; i++) {
      const seg = document.createElement('div');
      seg.className = 'accent-segment';
      bar.appendChild(seg);
    }
    return bar;
  }

  _updateAccentColors() {
    const color = ACCENT_COLORS[this.accentIndex % ACCENT_COLORS.length];
    const segments = this.boardEl.querySelectorAll('.accent-segment');
    segments.forEach(seg => {
      seg.style.backgroundColor = color;
    });
  }

  displayMessage(lines, colorGrid = null) {
    if (this.isTransitioning) return;

    // Format lines and colors into grid
    const { grid: newGrid, colors: newColors } = this._formatToGrid(lines, colorGrid);

    // Check if anything actually changed
    let hasChanges = false;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (newGrid[r][c] !== this.currentGrid[r][c] ||
            newColors[r][c] !== this.currentColorGrid[r][c]) {
          hasChanges = true;
          break;
        }
      }
      if (hasChanges) break;
    }

    if (!hasChanges) return;

    this.isTransitioning = true;
    let hasTextChanges = false;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const newChar = newGrid[r][c];
        const oldChar = this.currentGrid[r][c];
        const newColor = newColors[r][c];
        const oldColor = this.currentColorGrid[r][c];

        if (newChar !== oldChar) {
          const delay = (r * this.cols + c) * STAGGER_DELAY;
          this.tiles[r][c].scrambleTo(newChar, delay, newColor);
          hasTextChanges = true;
        } else if (newColor !== oldColor) {
          this.tiles[r][c].setColor(newColor);
        }
      }
    }

    // Play transition audio only if text changed
    if (hasTextChanges && this.soundEngine) {
      this.soundEngine.playTransition();
    }

    // Cycle accent colors
    this.accentIndex++;
    this._updateAccentColors();

    // Update grid state
    this.currentGrid = newGrid;
    this.currentColorGrid = newColors;

    // Clear transitioning flag after animation completes
    const transitionTime = hasTextChanges ? TOTAL_TRANSITION + 200 : 100;
    setTimeout(() => {
      this.isTransitioning = false;
    }, transitionTime);
  }

  _formatToGrid(lines, colorGrid) {
    const grid = [];
    const colors = [];
    for (let r = 0; r < this.rows; r++) {
      const line = (lines[r] || '').toUpperCase();
      const padTotal = this.cols - line.length;
      const padLeft = Math.max(0, Math.floor(padTotal / 2));
      const padded = ' '.repeat(padLeft) + line + ' '.repeat(Math.max(0, this.cols - padLeft - line.length));
      grid.push(padded.split(''));

      // Shift color array by same centering offset
      const rowColors = colorGrid && colorGrid[r] ? colorGrid[r] : [];
      const paddedColors = [];
      for (let c = 0; c < this.cols; c++) {
        const srcIdx = c - padLeft;
        paddedColors.push(
          (srcIdx >= 0 && srcIdx < rowColors.length) ? rowColors[srcIdx] : null
        );
      }
      colors.push(paddedColors);
    }
    return { grid, colors };
  }
}
