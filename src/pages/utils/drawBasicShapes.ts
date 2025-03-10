// 坐标定义
export type IPoint = {
  x: number;
  y: number;
};

// 图形枚举
export enum shapeEnum {
  line = "line",
  rect = "rect",
  circle = "circle",
}

// 类型定义
export interface DrawConfig {
  lineWidth: number; // 线条宽度
  strokeStyle: string; // 线条颜色
  roughness: number; // 线条抖动幅度
  iterations: number; // 叠加绘制次数
  segmentCount: number; // 线段分割数量
}

const defaultConfig = {
  roughness: 3,
  iterations: 1,
  segmentCount: 5,
  lineWidth: 2,
  strokeStyle: "#000",
};

const bezierCurveConfig = {
  kappa: 0.5519, // 标准圆控制点系数
  randomFactor: 0.08, // 手绘扰动系数
}

class DrawBasicShapes {
  private config: DrawConfig;
  private mainCanvas: CanvasRenderingContext2D | null;
  private offscreenCanvas: CanvasRenderingContext2D | null;

  private shape: shapeEnum;

  constructor() {
    this.mainCanvas = null;
    this.offscreenCanvas = null;
    this.shape = shapeEnum.line;
    this.config = { ...defaultConfig };
  }

  // 初始化
  public initCanvas(mainCanvas: CanvasRenderingContext2D, offscreenCanvas: CanvasRenderingContext2D, config?: DrawConfig) {
    this.mainCanvas = mainCanvas;
    this.offscreenCanvas = offscreenCanvas;
    if (config) {
      this.config = config;
    }
    //主画布应用样式
    this.mainCanvas.beginPath();
    this.mainCanvas.lineWidth = this.config.lineWidth;
    this.mainCanvas.strokeStyle = this.config.strokeStyle;
    // 离线画布应用样式
    this.offscreenCanvas.beginPath();
    this.offscreenCanvas.lineWidth = this.config.lineWidth;
    this.offscreenCanvas.strokeStyle = this.config.strokeStyle;
  }

  // 多次重复绘制两点间的线条
  private redrawRepeatedly(start: IPoint, end: IPoint, ctx: CanvasRenderingContext2D) {
    // 两点间重复绘制多次，实现手绘效果
    for (let i = 0; i < this.config.iterations; i++) {
      ctx.beginPath();

      let lastX = start.x;
      let lastY = start.y;

      ctx.moveTo(lastX, lastY);

      for (let j = 1; j <= this.config.segmentCount; j++) {
        // 计算当前分段点所占比例
        let t = j / this.config.segmentCount;
        // 获取当前分段点的x，y值
        let x = start.x + (end.x - start.x) * t;
        let y = start.y + (end.y - start.y) * t;
        // 在每个分段点添加随机偏移
        let offsetX = (Math.random() - 0.5) * this.config.roughness;
        let offsetY = (Math.random() - 0.5) * this.config.roughness;

        ctx.lineTo(x + offsetX, y + offsetY);
      }

      ctx.stroke();
    }
  }

  // 绘制矩形
  private redrawRepeatedlyRect(
    x: number,
    y: number,
    width: number,
    height: number,
    ctx: CanvasRenderingContext2D
  ) {
    const leftTop = { x, y };
    const leftBottom = { x, y: y + height };
    const rightTop = { x: x + width, y };
    const rightBottom = { x: x + width, y: y + height };

    if (leftTop && leftBottom && rightTop && rightBottom) {
      this.redrawRepeatedly(leftTop, leftBottom, ctx);
      this.redrawRepeatedly(leftBottom, rightBottom, ctx);
      this.redrawRepeatedly(rightBottom, rightTop, ctx);
      this.redrawRepeatedly(rightTop, leftTop, ctx);
    }
  }

  // 绘制圆
  private redrawRepeatedlyCircle(
    cx: number,
    cy: number,
    radius: number,
    ctx: CanvasRenderingContext2D
  ) {
    // 设置样式
    ctx.lineCap = "round";
    // 生成带随机扰动的坐标
    const rand = () => (Math.random() - 0.5) * radius * bezierCurveConfig.randomFactor;
    // 开始绘制
    ctx.beginPath();
    // 绘制四段贝塞尔曲线构成圆形
    for (let i = 0; i < 4; i++) {
      const angleStart = (i * Math.PI) / 2;
      const angleEnd = ((i + 1) * Math.PI) / 2;

      // 计算起始点、控制点和终点（添加随机扰动）
      const x0 = cx + Math.cos(angleStart) * radius + rand();
      const y0 = cy + Math.sin(angleStart) * radius + rand();
      const x1 =
        cx +
        (Math.cos(angleStart) - Math.sin(angleStart) * bezierCurveConfig.kappa) * radius +
        rand();
      const y1 =
        cy +
        (Math.sin(angleStart) + Math.cos(angleStart) * bezierCurveConfig.kappa) * radius +
        rand();
      const x2 =
        cx +
        (Math.cos(angleEnd) + Math.sin(angleEnd) * bezierCurveConfig.kappa) * radius +
        rand();
      const y2 =
        cy +
        (Math.sin(angleEnd) - Math.cos(angleEnd) * bezierCurveConfig.kappa) * radius +
        rand();
      const x3 = cx + Math.cos(angleEnd) * radius + rand();
      const y3 = cy + Math.sin(angleEnd) * radius + rand();

      if (i === 0) {
        ctx.moveTo(x0, y0);
      };
      ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
    }

    // 绘制圆形路径
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 切换图形
  public changeShape(type: shapeEnum) {
    if (this.shape !== type) {
      this.shape = type;
    }
  }

  // 绘制线段
  private drawLine(start: IPoint, end: IPoint, ctx: CanvasRenderingContext2D) {
    // 保存当前状态
    ctx.save();
    // 绘制路径
    this.redrawRepeatedly(start, end, ctx);
    ctx.closePath();
    // 恢复画布原始状态
    ctx.restore();
  }

  // 绘制矩形
  private drawRect(start: IPoint, end: IPoint, ctx: CanvasRenderingContext2D) {
    // 计算矩形参数（自动处理反向拖拽）
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    if (height <= this.config.lineWidth || width <= this.config.lineWidth) {
      return;
    }
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);

    // 保存当前状态
    ctx.save();

    // 绘制图形
    this.redrawRepeatedlyRect(x, y, width, height, ctx);
    ctx.closePath();

    // 恢复画布原始状态
    ctx.restore();
  }

  // 绘制圆
  private drawCircle(start: IPoint, end: IPoint, ctx: CanvasRenderingContext2D) {
    // 计算圆心和半径
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const radius = Math.sqrt(Math.abs((start.x - end.x)) ** 2 + Math.abs((start.y - end.y)) ** 2) / 2;

    if (cx && cy && radius) {
      // 保存画布状态
      ctx.save();

      // 绘制图形
      this.redrawRepeatedlyCircle(cx, cy, radius, ctx);
      ctx.closePath();
      // 恢复画布状态
      ctx.restore();
    }
  }

  // 绘制图形
  public drawShapes(start: IPoint, end: IPoint, type: 'main' | 'off') {
    const ctx = type === 'main' ? this.mainCanvas : this.offscreenCanvas;
    if (ctx) {
      switch (this.shape) {
        case shapeEnum.line:
          this.drawLine(start, end, ctx);
          break;
        case shapeEnum.rect:
          this.drawRect(start, end, ctx);
          break;
        case shapeEnum.circle:
          this.drawCircle(start, end, ctx);
          break;
        default:
          return;
      }
    }
  }
}

export const drawBasicShapes = new DrawBasicShapes();
