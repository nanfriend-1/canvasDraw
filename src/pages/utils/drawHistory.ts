// 绘制记录
class DrawHistory {
  private historyStack: ImageData[] = [];

  public saveState(ctx: CanvasRenderingContext2D) {
    if (!ctx) {
      return;
    }
    // 保存当前画布状态
    const snapshot = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.historyStack.push(snapshot);
  }

  public undo(ctx: CanvasRenderingContext2D) {
    if (!ctx) {
      return;
    }
    this.historyStack.pop();
    if (this.historyStack.length) {
      ctx.putImageData(
        this.historyStack[this.historyStack.length - 1],
        0,
        0
      );
    } else {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }

  public clear() {
    this.historyStack = [];
  }
}

export const drawHistory = new DrawHistory();

