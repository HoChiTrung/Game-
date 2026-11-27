interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
}

interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

const PARTICLE_CAPACITY = 260;
const FLOAT_CAPACITY = 48;

export class ParticleSystem {
  private particles: PooledParticle[];
  private cursor = 0;
  private floats: FloatingText[];
  private floatCursor = 0;
  private trauma = 0;

  constructor() {
    this.particles = Array.from({ length: PARTICLE_CAPACITY }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.4,
      size: 4,
      color: '#ffffff',
      gravity: 0,
    }));

    this.floats = Array.from({ length: FLOAT_CAPACITY }, () => ({
      active: false,
      x: 0,
      y: 0,
      vy: -36,
      text: '',
      color: '#ffffff',
      life: 0,
      maxLife: 1,
      scale: 1,
    }));
  }

  addShake(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  getShakeOffset(): { ox: number; oy: number } {
    if (this.trauma <= 0.005) return { ox: 0, oy: 0 };
    const mag = this.trauma * this.trauma * 14;
    return {
      ox: (Math.random() * 2 - 1) * mag,
      oy: (Math.random() * 2 - 1) * mag,
    };
  }

  burst(
    x: number,
    y: number,
    color: string,
    count: number,
    speed = 90,
    size = 4,
    gravity = 120
  ): void {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.cursor];
      this.cursor = (this.cursor + 1) % PARTICLE_CAPACITY;
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.35 + Math.random() * 0.75);
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 8;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd - (gravity > 0 ? 35 : 0);
      p.maxLife = 0.28 + Math.random() * 0.34;
      p.life = p.maxLife;
      p.size = size;
      p.color = color;
      p.gravity = gravity;
    }
  }

  spawnAmbientEmber(x: number, y: number, color: string): void {
    const p = this.particles[this.cursor];
    this.cursor = (this.cursor + 1) % PARTICLE_CAPACITY;
    p.active = true;
    p.x = x + (Math.random() - 0.5) * 14;
    p.y = y;
    p.vx = (Math.random() - 0.5) * 18;
    p.vy = -24 - Math.random() * 22;
    p.maxLife = 0.75 + Math.random() * 0.5;
    p.life = p.maxLife;
    p.size = 3;
    p.color = color;
    p.gravity = 0;
  }

  spawnFloatingText(
    x: number,
    y: number,
    text: string,
    color: string,
    scale = 1
  ): void {
    const f = this.floats[this.floatCursor];
    this.floatCursor = (this.floatCursor + 1) % FLOAT_CAPACITY;
    f.active = true;
    f.x = x + (Math.random() - 0.5) * 10;
    f.y = y;
    f.vy = -44;
    f.text = text;
    f.color = color;
    f.maxLife = 0.95;
    f.life = f.maxLife;
    f.scale = scale;
  }

  update(dt: number): void {
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 2.2);
    }

    for (let i = 0; i < PARTICLE_CAPACITY; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    for (let i = 0; i < FLOAT_CAPACITY; i++) {
      const f = this.floats[i];
      if (!f.active) continue;
      f.life -= dt;
      if (f.life <= 0) {
        f.active = false;
        continue;
      }
      f.y += f.vy * dt;
      f.vy *= 0.94;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < PARTICLE_CAPACITY; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    for (let i = 0; i < FLOAT_CAPACITY; i++) {
      const f = this.floats[i];
      if (!f.active) continue;
      const alpha = Math.min(1, (f.life / f.maxLife) * 1.4);
      ctx.globalAlpha = alpha;
      ctx.font = `700 ${Math.round(15 * f.scale)}px "JetBrains Mono", monospace`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(20, 14, 10, 0.92)';
      ctx.strokeText(f.text, Math.round(f.x), Math.round(f.y));
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, Math.round(f.x), Math.round(f.y));
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    for (const p of this.particles) p.active = false;
    for (const f of this.floats) f.active = false;
    this.trauma = 0;
  }
}
