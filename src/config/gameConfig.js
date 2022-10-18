import { animals } from "./animal";

export const easyGameConfig = {
  // 槽容量
  slotNum: 7,
  // 需要多少个一样块的才能合成
  composeNum: 3,
  // 动物类别数
  animalTypeNum: 2,
  // 每层块数（大致）
  levelBlockNum: 6,
  // 边界收缩步长
  borderStep: 1,
  // 总层数（最小为 2）
  levelNum: 2,
  // 动物数组
  animals,
};

export const defaultConfig = {
  // 槽容量
  slotNum: 7,
  // 需要多少个一样块的才能合成
  composeNum: 3,
  // 动物类别数
  animalTypeNum: 18,
  // 每层块数（大致）
  levelBlockNum: 24,
  // 边界收缩步长
  borderStep: 3,
  // 总层数（最小为 2）
  levelNum: 10,
  // 动物数组
  animals,
};
