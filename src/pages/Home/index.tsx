import { useState, useRef, useEffect, useCallback } from "react";
import { Button, Space } from "antd";
import { drawBasicShapes, shapeEnum } from "../utils/drawBasicShapes";
import { dpr, shapeConfig } from "../utils/constant";
import "./index.css";

export default function Home() {
  // 展示的画布
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  // 记录绘制起点
  const lastPointRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  // 浏览器动画绘制
  const requestIdRef = useRef<number | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [curShape, setCurShape] = useState<shapeEnum>(shapeEnum.line);

  // 双缓冲初始化
  const initBuffers = useCallback(() => {
    const mainCanvas = canvasRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;
    if (!mainCanvas || !offscreenCanvas) return;

    const rect = mainCanvas.getBoundingClientRect();

    // 主画布设置
    mainCanvas.width = rect.width * dpr;
    mainCanvas.height = rect.height * dpr;

    // 离屏画布设置
    offscreenCanvas.width = rect.width * dpr;
    offscreenCanvas.height = rect.height * dpr;

    const ctx = mainCanvas.getContext("2d");
    const offscreenCtx = offscreenCanvasRef.current.getContext("2d");

    if (!ctx || !offscreenCtx) return;

    ctx.scale(dpr, dpr);
    offscreenCtx.scale(dpr, dpr);
    drawBasicShapes.initCanvas(ctx, offscreenCtx);
  }, []);

  // 获取画布坐标的辅助函数
  const getCanvasCoordinates = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr
    };
  }, []);

  // 绘制逻辑
  const drawTempShapes = useCallback((endPoint: { x: number; y: number }) => {
    const mainCtx = canvasRef.current?.getContext("2d");
    const offscreenCtx = offscreenCanvasRef.current.getContext("2d");

    if (!mainCtx || !offscreenCtx) return;

    // 清空主画布
    mainCtx.clearRect(0, 0, mainCtx.canvas.width, mainCtx.canvas.height);
    // 绘制已保存内容
    mainCtx.drawImage(offscreenCanvasRef.current, 0, 0);
    // 绘制临时路径
    drawBasicShapes.drawShapes(
      lastPointRef.current,
      endPoint,
      'main'
    );
  }, []);

  // 鼠标按下事件处理
  const handleMouseDown = useCallback((e: MouseEvent) => {
    setIsDrawing(true);
    const point = getCanvasCoordinates(e);
    lastPointRef.current = point;
    // 开始新路径时复制离屏内容到主画布
    const mainCtx = canvasRef.current?.getContext("2d");
    if (mainCtx) {
      mainCtx.drawImage(offscreenCanvasRef.current, 0, 0);
    }
  }, [getCanvasCoordinates]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawing || requestIdRef.current !== null) {
      return;
    }

    requestIdRef.current = requestAnimationFrame(() => {
      const endPoint = getCanvasCoordinates(e);
      drawTempShapes(endPoint);
      requestIdRef.current = null;
    });
  }, [drawTempShapes, getCanvasCoordinates, isDrawing]);

  // 鼠标抬起事件处理
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDrawing) {
      return;
    }
    setIsDrawing(false);

    const point = getCanvasCoordinates(e);

    // 将最终路径保存到离屏画布
    const offscreenCtx = offscreenCanvasRef.current.getContext("2d");
    if (offscreenCtx) {
      drawBasicShapes.drawShapes(
        lastPointRef.current,
        point,
        'off'
      );
    }

    if (requestIdRef.current) {
      cancelAnimationFrame(requestIdRef.current);
      requestIdRef.current = null;
    }
  }, [getCanvasCoordinates, isDrawing]);

  const handleMouseleave = useCallback((e: MouseEvent) => {
    handleMouseUp(e);
  }, [handleMouseUp]);

  const handleChange = useCallback(
    (type: shapeEnum) => {
      drawBasicShapes.changeShape(type);
      if (curShape !== type) {
        setCurShape(type);
      }
    },
    [curShape]
  );

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const offscreenCtx = offscreenCanvasRef.current.getContext("2d");
    if (ctx && canvas && offscreenCtx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      offscreenCtx.clearRect(0, 0, canvas.width, canvas.height);
      lastPointRef.current = { x: 0, y: 0 };
    }
  }, []);

  // 事件监听设置
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const options = { passive: true };
    canvas.addEventListener('mousedown', handleMouseDown, options);
    canvas.addEventListener('mousemove', handleMouseMove, options);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseleave);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseleave);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleMouseleave]);

  // 初始化和窗口大小变化处理
  useEffect(() => {
    initBuffers();
    window.addEventListener('resize', initBuffers);
    return () => window.removeEventListener('resize', initBuffers);
  }, [initBuffers]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="canvas-container"
      />
      <div className="header">✨ 手绘画布</div>
      <div className="btn-container">
        <div className="operate-container">
          {Object.keys(shapeEnum).map((item) => (
            <Button
              key={item}
              onClick={() =>
                handleChange(shapeEnum[item as keyof typeof shapeEnum])
              }
              type={curShape === item ? "primary" : undefined}
            >
              {shapeConfig[item as keyof typeof shapeEnum].name}
            </Button>
          ))}
        </div>
        <Space size={4}>
          <Button onClick={handleClear}>清除画布</Button>
        </Space>
      </div>
    </>
  );
}
