import { Component, Input, OnChanges, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<canvas #canvas [width]="width" [height]="height"></canvas>`,
  styles: [`:host { display: block; } canvas { display: block; }`]
})
export class SparklineChartComponent implements OnChanges, AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() data: number[] = [];
  @Input() width  = 100;
  @Input() height = 40;
  @Input() positive = true;

  private ready = false;

  ngAfterViewInit(): void {
    this.ready = true;
    this.draw();
  }

  ngOnChanges(): void {
    if (this.ready) this.draw();
  }

  private draw(): void {
    if (!this.canvasRef || !this.data.length) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx    = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = this.width  * dpr;
    canvas.height = this.height * dpr;
    canvas.style.width  = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, this.width, this.height);

    const pts  = this.data;
    const min  = Math.min(...pts);
    const max  = Math.max(...pts);
    const range = max - min || 1;
    const pad  = 3;
    const w    = this.width;
    const h    = this.height - pad * 2;

    const color = this.positive ? '#10B981' : '#EF4444';
    const colorFade = this.positive ? 'rgba(16,185,129,' : 'rgba(239,68,68,';

    const coords = pts.map((v, i) => ({
      x: (i / (pts.length - 1)) * w,
      y: pad + h - ((v - min) / range) * h,
    }));

    // gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0,   colorFade + '0.3)');
    grad.addColorStop(1,   colorFade + '0)');

    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 1; i < coords.length; i++) {
      const mx = (coords[i - 1].x + coords[i].x) / 2;
      ctx.bezierCurveTo(mx, coords[i - 1].y, mx, coords[i].y, coords[i].x, coords[i].y);
    }
    ctx.lineTo(w, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // line
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 1; i < coords.length; i++) {
      const mx = (coords[i - 1].x + coords[i].x) / 2;
      ctx.bezierCurveTo(mx, coords[i - 1].y, mx, coords[i].y, coords[i].x, coords[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }
}
