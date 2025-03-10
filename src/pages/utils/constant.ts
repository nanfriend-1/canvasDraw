import { shapeEnum } from "./drawBasicShapes";

export const shapeConfig = {
  [shapeEnum.line]: {
    name: '线条',
  },
  [shapeEnum.rect]: {
    name: '矩形',
  },
  [shapeEnum.circle]: {
    name: '圆'
  }
}

export const dpr = 1;