// Parade Grid renderer and drone animation

const CELL = 80; // pixel size per cell
const GRID_SIZE = 6;
const DIR_NAMES = ['up', 'right', 'down', 'left'];
const DIR_DX = [0, 1, 0, -1];
const DIR_DY = [-1, 0, 1, 0];

// Emoji/icon drawing helpers
const ITEM_EMOJI = {
  F: '🚩',
  B: '🎈',
  C: '⭐',
};

class ParadeGrid {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = null;
    this.droneX = 0;
    this.droneY = 0;
    this.droneDir = 0;
    this.collected = new Set();
    this.animating = false;
    this.moveQueue = [];
    this.animFrame = 0; // for propeller spin + hover bob
    this._startIdleLoop();
  }

  // Continuous idle animation for propeller spin and hover bob
  _startIdleLoop() {
    const tick = () => {
      this.animFrame++;
      if (!this.animating && this.level) {
        this.draw();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  loadLevel(level) {
    this.level = level;
    this.collected = new Set();
    this.animating = false;
    this.moveQueue = [];
    // Find start position
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (level.grid[r][c] === 'S') {
          this.droneX = c;
          this.droneY = r;
        }
      }
    }
    this.droneDir = level.startDir;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = c * CELL;
        const y = r * CELL;
        const cell = this.level.grid[r][c];

        if (cell === 'X') {
          // Grass / park area
          ctx.fillStyle = '#a5d6a7';
          ctx.fillRect(x, y, CELL, CELL);
          // Little tree
          ctx.fillStyle = '#6d4c41';
          ctx.fillRect(x + 36, y + 40, 8, 20);
          ctx.fillStyle = '#43a047';
          ctx.beginPath();
          ctx.arc(x + 40, y + 34, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#66bb6a';
          ctx.beginPath();
          ctx.arc(x + 37, y + 30, 10, 0, Math.PI * 2);
          ctx.fill();
          // Grass tufts
          ctx.strokeStyle = '#81c784';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + 12, y + 65); ctx.lineTo(x + 15, y + 55);
          ctx.moveTo(x + 15, y + 65); ctx.lineTo(x + 18, y + 56);
          ctx.moveTo(x + 60, y + 60); ctx.lineTo(x + 63, y + 50);
          ctx.stroke();
        } else {
          // Road tile
          const roadGrad = ctx.createLinearGradient(x, y, x, y + CELL);
          roadGrad.addColorStop(0, '#fff9c4');
          roadGrad.addColorStop(1, '#fff59d');
          ctx.fillStyle = roadGrad;
          ctx.fillRect(x, y, CELL, CELL);
          ctx.strokeStyle = '#ffe082';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, CELL, CELL);

          // Subtle road markings
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = 'rgba(255,183,77,0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + CELL / 2, y);
          ctx.lineTo(x + CELL / 2, y + CELL);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y + CELL / 2);
          ctx.lineTo(x + CELL, y + CELL / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw items (if not collected)
        const key = `${r},${c}`;
        if (cell === 'F' && !this.collected.has(key)) {
          this.drawFlag(x + CELL / 2, y + CELL / 2);
        } else if (cell === 'B' && !this.collected.has(key)) {
          this.drawBalloon(x + CELL / 2, y + CELL / 2);
        } else if (cell === 'C' && !this.collected.has(key)) {
          this.drawCheckpoint(x + CELL / 2, y + CELL / 2);
        }

        // Collected sparkle
        if (ITEM_EMOJI[cell] && this.collected.has(key)) {
          this.drawSparkle(x + CELL / 2, y + CELL / 2);
        }

        // Start marker
        if (cell === 'S') {
          ctx.save();
          // Landing pad circle
          ctx.strokeStyle = 'rgba(67,160,71,0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(x + CELL / 2, y + CELL / 2, 28, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          // H marking
          ctx.fillStyle = 'rgba(67,160,71,0.4)';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('H', x + CELL / 2, y + CELL / 2);
          // Label
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#43a047';
          ctx.textBaseline = 'bottom';
          ctx.fillText('START', x + CELL / 2, y + CELL - 3);
          ctx.restore();
        }
      }
    }

    // Draw drone
    this.drawDrone(this.droneX * CELL + CELL / 2, this.droneY * CELL + CELL / 2, this.droneDir);
  }

  // --- Canvas-drawn items ---

  drawFlag(cx, cy) {
    const ctx = this.ctx;
    ctx.save();
    // Pole
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 22);
    ctx.lineTo(cx - 10, cy - 20);
    ctx.stroke();
    // Flag fabric (waving)
    const wave = Math.sin(this.animFrame * 0.06) * 2;
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 20);
    ctx.quadraticCurveTo(cx + 2, cy - 16 + wave, cx + 14, cy - 12);
    ctx.lineTo(cx + 12, cy - 6 + wave);
    ctx.quadraticCurveTo(cx, cy - 4, cx - 10, cy - 6);
    ctx.closePath();
    ctx.fill();
    // Highlight stripe
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 18);
    ctx.quadraticCurveTo(cx, cy - 15 + wave, cx + 10, cy - 12);
    ctx.lineTo(cx + 8, cy - 10 + wave);
    ctx.quadraticCurveTo(cx - 2, cy - 12, cx - 10, cy - 14);
    ctx.closePath();
    ctx.fill();
    // Pole ball top
    ctx.fillStyle = '#ffd600';
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 21, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawBalloon(cx, cy) {
    const ctx = this.ctx;
    const bob = Math.sin(this.animFrame * 0.05 + 1) * 3;
    ctx.save();
    // String
    ctx.strokeStyle = '#bdbdbd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 20);
    ctx.quadraticCurveTo(cx + 2, cy + 5 + bob, cx, cy - 2 + bob);
    ctx.stroke();
    // Balloon body
    const ballGrad = ctx.createRadialGradient(cx - 4, cy - 14 + bob, 2, cx, cy - 8 + bob, 18);
    ballGrad.addColorStop(0, '#e1bee7');
    ballGrad.addColorStop(0.5, '#ab47bc');
    ballGrad.addColorStop(1, '#7b1fa2');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8 + bob, 14, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    // Knot
    ctx.fillStyle = '#7b1fa2';
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy + 8 + bob);
    ctx.lineTo(cx + 3, cy + 8 + bob);
    ctx.lineTo(cx, cy + 12 + bob);
    ctx.closePath();
    ctx.fill();
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx - 4, cy - 14 + bob, 5, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawCheckpoint(cx, cy) {
    const ctx = this.ctx;
    const pulse = 1 + Math.sin(this.animFrame * 0.07) * 0.08;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    // Outer glow
    ctx.fillStyle = 'rgba(255,193,7,0.2)';
    ctx.beginPath();
    this._starPath(ctx, 0, 0, 22, 11, 5);
    ctx.fill();
    // Star body
    const starGrad = ctx.createRadialGradient(-3, -4, 2, 0, 0, 18);
    starGrad.addColorStop(0, '#fff9c4');
    starGrad.addColorStop(0.5, '#ffc107');
    starGrad.addColorStop(1, '#f57f17');
    ctx.fillStyle = starGrad;
    ctx.beginPath();
    this._starPath(ctx, 0, 0, 18, 8, 5);
    ctx.fill();
    // Outline
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    this._starPath(ctx, 0, 0, 18, 8, 5);
    ctx.stroke();
    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    this._starPath(ctx, -1, -2, 10, 5, 5);
    ctx.fill();
    ctx.restore();
  }

  _starPath(ctx, cx, cy, outerR, innerR, points) {
    const step = Math.PI / points;
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = -Math.PI / 2 + i * step;
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    }
    ctx.closePath();
  }

  drawSparkle(cx, cy) {
    const ctx = this.ctx;
    const t = this.animFrame;
    ctx.save();
    ctx.globalAlpha = 0.4 + Math.sin(t * 0.1) * 0.2;
    ctx.fillStyle = '#ffd54f';
    for (let i = 0; i < 3; i++) {
      const angle = t * 0.05 + (i * Math.PI * 2) / 3;
      const dist = 10 + Math.sin(t * 0.08 + i) * 5;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawDrone(cx, cy, dir) {
    const ctx = this.ctx;
    const t = this.animFrame;

    // Hover bob offset
    const bobY = Math.sin(t * 0.08) * 2.5;

    ctx.save();
    ctx.translate(cx, cy + bobY);
    ctx.rotate((dir * Math.PI) / 2);

    // --- Shadow on the ground ---
    ctx.save();
    ctx.rotate(-(dir * Math.PI) / 2); // un-rotate so shadow stays flat
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath();
    ctx.ellipse(0, 4 - bobY, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- Arms (X-shape) ---
    const armLen = 26;
    const armWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      ctx.save();
      ctx.rotate(angle);
      // Arm bar with gradient
      const armGrad = ctx.createLinearGradient(0, 0, 0, -armLen);
      armGrad.addColorStop(0, '#546e7a');
      armGrad.addColorStop(1, '#78909c');
      ctx.strokeStyle = armGrad;
      ctx.lineWidth = armWidth;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(0, -armLen);
      ctx.stroke();

      // Motor housing at tip
      ctx.fillStyle = '#37474f';
      ctx.beginPath();
      ctx.arc(0, -armLen, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#455a64';
      ctx.beginPath();
      ctx.arc(0, -armLen, 4, 0, Math.PI * 2);
      ctx.fill();

      // --- Spinning propeller blades ---
      const spinSpeed = 0.35;
      const bladeAngle = t * spinSpeed + i * 1.2; // offset per arm
      const bladeLen = 12;
      ctx.save();
      ctx.translate(0, -armLen);
      // Blade 1
      ctx.save();
      ctx.rotate(bladeAngle);
      ctx.fillStyle = 'rgba(100, 181, 246, 0.55)';
      ctx.beginPath();
      ctx.ellipse(bladeLen / 2, 0, bladeLen, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Blade 2 (opposite)
      ctx.save();
      ctx.rotate(bladeAngle + Math.PI);
      ctx.fillStyle = 'rgba(100, 181, 246, 0.55)';
      ctx.beginPath();
      ctx.ellipse(bladeLen / 2, 0, bladeLen, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Spin disc (motion blur effect)
      ctx.fillStyle = 'rgba(144, 202, 249, 0.15)';
      ctx.beginPath();
      ctx.arc(0, 0, bladeLen + 2, 0, Math.PI * 2);
      ctx.fill();
      // Center hub
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    // --- Central body ---
    // Outer shell with gradient
    const bodyGrad = ctx.createRadialGradient(0, -2, 2, 0, 0, 16);
    bodyGrad.addColorStop(0, '#e3f2fd');
    bodyGrad.addColorStop(0.4, '#1e88e5');
    bodyGrad.addColorStop(1, '#0d47a1');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Body outline
    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring detail
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();

    // --- Camera / sensor dome (front) ---
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    ctx.arc(0, -8, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // Camera lens glint
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.arc(-1, -9, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(-1.8, -9.8, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // --- Direction indicator (front chevron) ---
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.lineTo(0, -6);
    ctx.lineTo(5, -2);
    ctx.stroke();

    // --- LED lights (front = green, back = red, blinking) ---
    const ledBlink = Math.sin(t * 0.15) > 0;
    // Front LEDs (green)
    ctx.fillStyle = ledBlink ? '#69f0ae' : '#2e7d32';
    ctx.beginPath();
    ctx.arc(-6, -12, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -12, 2, 0, Math.PI * 2);
    ctx.fill();
    // Front LED glow
    if (ledBlink) {
      ctx.fillStyle = 'rgba(105, 240, 174, 0.3)';
      ctx.beginPath();
      ctx.arc(-6, -12, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(6, -12, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Rear LEDs (red)
    ctx.fillStyle = !ledBlink ? '#ff5252' : '#b71c1c';
    ctx.beginPath();
    ctx.arc(-6, 12, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, 12, 2, 0, Math.PI * 2);
    ctx.fill();
    if (!ledBlink) {
      ctx.fillStyle = 'rgba(255, 82, 82, 0.3)';
      ctx.beginPath();
      ctx.arc(-6, 12, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(6, 12, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Top highlight / specular ---
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(-3, -5, 7, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Execute a list of commands with animation
  async executeCommands(commands) {
    this.animating = true;
    let hitWall = false;

    for (const cmd of commands) {
      if (hitWall) break;

      if (cmd === 'forward') {
        const nx = this.droneX + DIR_DX[this.droneDir];
        const ny = this.droneY + DIR_DY[this.droneDir];
        if (
          nx < 0 || nx >= GRID_SIZE ||
          ny < 0 || ny >= GRID_SIZE ||
          this.level.grid[ny][nx] === 'X'
        ) {
          hitWall = true;
          await this.animateBump();
          break;
        }
        await this.animateMove(nx, ny);
        this.droneX = nx;
        this.droneY = ny;
        // Check collection
        const cell = this.level.grid[ny][nx];
        if (ITEM_EMOJI[cell]) {
          this.collected.add(`${ny},${nx}`);
        }
        this.draw();
      } else if (cmd === 'left') {
        this.droneDir = (this.droneDir + 3) % 4;
        await this.animatePause(250);
        this.draw();
      } else if (cmd === 'right') {
        this.droneDir = (this.droneDir + 1) % 4;
        await this.animatePause(250);
        this.draw();
      }
    }

    this.animating = false;
    return this.checkWin(hitWall);
  }

  checkWin(hitWall) {
    if (hitWall) return 'crash';
    const allItems = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.level.grid[r][c];
        if (this.level.collectAll.includes(cell)) {
          allItems.push(`${r},${c}`);
        }
      }
    }
    const allCollected = allItems.every((k) => this.collected.has(k));
    return allCollected ? 'win' : 'incomplete';
  }

  animateMove(nx, ny) {
    return new Promise((resolve) => {
      const startX = this.droneX * CELL + CELL / 2;
      const startY = this.droneY * CELL + CELL / 2;
      const endX = nx * CELL + CELL / 2;
      const endY = ny * CELL + CELL / 2;
      const duration = 350;
      const startTime = performance.now();

      const step = (now) => {
        const t = Math.min((now - startTime) / duration, 1);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        this.draw();
        // Overdraw drone at interpolated position
        const cx = startX + (endX - startX) * ease;
        const cy = startY + (endY - startY) * ease;
        // Clear drone at old spot and draw at new
        this.ctx.clearRect(
          this.droneX * CELL + CELL / 2 - 35,
          this.droneY * CELL + CELL / 2 - 35,
          70, 70
        );
        this.draw(); // redraw grid
        this.drawDrone(cx, cy, this.droneDir);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  animateBump() {
    return new Promise((resolve) => {
      const cx = this.droneX * CELL + CELL / 2;
      const cy = this.droneY * CELL + CELL / 2;
      const dx = DIR_DX[this.droneDir] * 10;
      const dy = DIR_DY[this.droneDir] * 10;
      let frame = 0;

      const step = () => {
        frame++;
        this.draw();
        const offset = frame <= 4 ? frame * 2 : (8 - frame) * 2;
        this.drawDrone(cx + dx * (offset / 8), cy + dy * (offset / 8), this.droneDir);
        if (frame < 8) {
          requestAnimationFrame(step);
        } else {
          this.draw();
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  animatePause(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
