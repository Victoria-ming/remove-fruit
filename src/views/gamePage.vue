<template>
  <div class="game-page">
    <div align="center">
      <div
        style="
          display: flex;
          justify-content: space-between;
          line-height: 40px;
          margin-bottom: 10px;
        "
      >
        <el-button icon="el-icon-arrow-left" type="text" @click="goHomeView"
          >返回</el-button
        >
        <span> 块数：{{ clearBlockNum }} / {{ totalBlockNum }} </span>
      </div>
    </div>
    <div>
      <!--通关！-->
      <div v-if="gameStatus === 3" style="text-align: center">
        <h2>恭喜，你赢啦！🎉</h2>
        <el-button type="primary" @click="goHomeView">返回首页</el-button>
      </div>
      <!--失败！-->
      <div v-if="gameStatus === 2" style="text-align: center">
        <h2>游戏结束了！</h2>
        <el-button type="primary" @click="againGame">重新开始游戏</el-button>
      </div>
      <!--游戏区域-->
      <div v-show="gameStatus === 1" class="level-board">
        <div v-for="(block, index) in levelBlocksData" :key="index">
          <div
            v-if="block.status === 0"
            class="block level-block"
            :class="{
              disabled: block.parentBlocks.length > 0,
            }"
            :data-id="block.id"
            :style="{
              zIndex: block.level,
              left: block.x * widthUnit + 'px',
              top: block.y * heightUnit + 'px',
            }"
            @click="clickBlock(block, index)"
          >
            {{ block.animalType }}
          </div>
        </div>
      </div>

      <!-- 槽位 -->
      <el-row
        v-if="slotValue.length > 0 && gameStatus === 1"
        align="center"
        class="slot-board"
      >
        <div v-for="(slotBlock, index) in slotValue" :key="index" class="block">
          {{ slotBlock?.animalType }}
        </div>
      </el-row>
      <!-- 技能 -->
      <div v-if="slotValue.length > 0 && gameStatus === 1" class="skill-board">
        <el-button type="primary" @click="withdraw">撤回</el-button>
        <el-button type="primary" @click="doShuffle">洗牌</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import { easyGameConfig, defaultConfig } from "../config/gameConfig";
export default {
  name: "GamePage",
  components: {},
  props: {},
  data() {
    return {
      easyGameConfig,
      defaultConfig,
      boxWidthNum: 24,
      boxHeightNum: 24,
      widthUnit: 14, // 每个格子的宽度
      heightUnit: 14, // 每个格子的高度
      gameConfig: {}, // 游戏的配置
      chessBoard: [], // 棋盘
      gameStatus: 1, // 初始化, 1 - 进行中, 2 - 失败结束, 3 - 胜利
      clearBlockNum: 0, // 消除的块数
      totalBlockNum: 0, // 容器中总的块的数量
      allBlocks: [], // 所有的块---没有坐标点
      levelBlocksData: [], // 页面上展示的块集合----有坐标点
      slotValue: [], // 插槽的集合
      currentSlotNum: 0, // 当前插槽中的数量
      levelNum: 0, // 层数
      historyBlocks: [], // 存放点击了的块元素
    };
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {
    const config = this.$route.query.config;
    console.log(config);
    this.gameConfig = this[config];
    console.log(this.gameConfig);
    this.levelNum = this.gameConfig.levelNum;
    this.initGame(this.gameConfig);
  },
  methods: {
    // 游戏初始话
    initGame(config) {
      // 初始化容器
      this.initContainer();
      // 初始化插槽
      this.slotValue = this.initSlot(config);
      // 获取容器中总的块的数量
      this.totalBlockNum = this.getContainerBlockNum(config);
      // 初始化块的内容---展示的动物字体等
      this.allBlocks = this.initBlockContent(config);
      // 计算层级关系及每层要展示的块级的数组
      this.levelBlocksData = this.countBlock(config);
      console.log(this.levelBlocksData);
    },
    // 初始化容器
    initContainer() {
      /**
       * 1、初始化棋盘
       * eg:this.boxWidthNum=6;this.boxHeightNum=6
       * [[[{}],[],[],[],[],[]],[],[],[],[],[]]
       */
      this.chessBoard = new Array(this.boxWidthNum);
      for (let i = 0; i < this.boxWidthNum; i++) {
        this.chessBoard[i] = new Array(this.boxHeightNum);
        for (let j = 0; j < this.boxHeightNum; j++) {
          this.chessBoard[i][j] = {
            blocks: [],
          };
        }
      }
      // 2、设置父级容器的宽高
      const levelBoardDom = document.getElementsByClassName("level-board");
      levelBoardDom[0].style.width = this.widthUnit * this.boxWidthNum + "px";
      levelBoardDom[0].style.height =
        this.heightUnit * this.boxHeightNum + "px";
    },
    // 初始化插槽
    initSlot(config) {
      // slotNum=>[null,null,null,null,null,null,null]
      return new Array(config.slotNum).fill(null);
    },
    // 获取容器中总的块的数量
    getContainerBlockNum(config) {
      let totalBlockNum = 0;
      /**
       * 最少的基础单位块数=动物的类比*多少个合成---->composeNum*animalTypeNum
       * 总块数必须是该值的倍数
       */
      const unitBlockNum = config.animalTypeNum * config.composeNum;

      /**
       * 根据总层数和每层大致的块数计算最小的块数
       */
      const minBlockNum = config.levelNum * config.levelBlockNum;

      /**
       * 根据最少的基础单位块数和最小块数算出总块数
       * 总块数是基础单位块数值的倍数且接近最小的块数
       * a、如果最小块数是基础单位块数的倍数----总块数取最小块数
       * b、最小块数不是基础单位块数的倍数，向上取整基础单位的倍数---算出总块数
       *    大于基础单位块数时
       * eg：minBlockNum = 14, unitBlockNum = 10, 补到 20
       *    小于基础单位块数时
       * eg：minBlockNum = 10, unitBlockNum = 12, 补到 12
       */
      totalBlockNum = minBlockNum;
      if (minBlockNum % unitBlockNum !== 0) {
        totalBlockNum =
          (Math.floor(minBlockNum / unitBlockNum) + 1) * unitBlockNum;
      }
      return totalBlockNum;
    },
    // 初始化块的内容---展示的动物字体等
    initBlockContent(config) {
      const allBlocks = [];
      // 获取要展示的动物的数组
      const needAnimalBlocks = config.animals.slice(0, config.animalTypeNum);
      // 获取所有块的数组，依次将动物塞到数组中--通过loadsh.shuffle(array)打乱数组的顺序
      const showAnimalList = [];
      for (let i = 0; i < this.totalBlockNum; i++) {
        showAnimalList.push(needAnimalBlocks[i % config.animalTypeNum]);
      }
      // 打乱所有块的数组，
      const randomAnimalBlocks = _.shuffle(showAnimalList);
      // 初始化每个块中的配置
      randomAnimalBlocks.forEach((item, index) => {
        const newItem = {
          id: index,
          status: 0, // 0 - 正常, 1 - 已点击, 2 - 已消除
          level: this.totalBlockNum, // 层级----总块数的层级
          animalType: item, // 展示的动物的字体
          parentBlocks: [], // 高于当前块的集合
          childrenBlocks: [], // 低于当前块的集合
        };
        allBlocks.push(newItem);
      });
      return allBlocks;
    },
    // 计算层级关系及每层要展示的块级的数组
    countBlock(config) {
      const levelBlocks = [];
      let num = 0;
      let borderMinX = 0;
      let borderMaxX = 21;
      let borderMinY = 0;
      let borderMaxY = 21;
      let remainBlockNum = this.totalBlockNum; // 剩下的块数
      // 根据层数levelNum 生成每层不同的边界和每层的块数
      for (let i = 0; i < config.levelNum; i++) {
        // 获取当前层级的块数 不是最后一层的时候取定义好的每层大致的块数(levelBlockNum)跟剩余块数的最小的值
        const currentBlockNum = Math.min(config.levelBlockNum, remainBlockNum);
        // 缩小边界
        if (config.borderStep > 0) {
          const dir = i % 4;
          if (i > 0) {
            // 第二层开始缩小边界
            if (dir === 1) {
              borderMaxY -= config.borderStep;
            } else if (dir === 2) {
              borderMinY += config.borderStep;
            } else if (dir === 3) {
              borderMaxX -= config.borderStep;
            } else {
              borderMinX += config.borderStep;
            }
          }
        }
        // 生成当前层级的块 ----根据总块数allBlocks进行截取
        const currentGenBlocks = this.allBlocks.slice(
          num,
          num + currentBlockNum
        );
        num = num + currentBlockNum;
        // 生成当前层级中每个块的坐标
        this.genLevelBlockPos(
          currentGenBlocks,
          borderMinX,
          borderMinY,
          borderMaxX,
          borderMaxY
        );
        // 剩余的块数
        remainBlockNum -= currentBlockNum;
        levelBlocks.push(...currentGenBlocks);
        if (remainBlockNum <= 0) {
          // 剩余块数小于等于0 的时候退出循环
          break;
        }
        console.log("最终剩余块数", remainBlockNum);
      }
      console.log("棋盘", this.chessBoard);
      return levelBlocks;
    },
    /**
     * 生成坐标
     * @param {*} blockList 当前层级的块的集合
     * @param {*} borderMinX 当前层级的边界最小X范围
     * @param {*} borderMinY 当前层级的边界最小Y范围
     * @param {*} borderMaxX 当前层级的边界最大X范围
     * @param {*} borderMaxY 当前层级的边界最大Y范围
     */
    genLevelBlockPos(
      blockList,
      borderMinX,
      borderMinY,
      borderMaxX,
      borderMaxY
    ) {
      // 记录当前层级中块的坐标，且坐标不能完全重叠
      const currentPosSet = new Set(); // 创建集合
      blockList.forEach((block, index) => {
        // 随机生成坐标---给当前层级中的每个块生成唯一的坐标点
        let newCoordinateX; // 新的X坐标
        let newCoordinateY; // 新的Y坐标
        let key;
        while (index < blockList.length) {
          newCoordinateX = Math.floor(Math.random() * borderMaxX + borderMinX);
          newCoordinateY = Math.floor(Math.random() * borderMaxY + borderMinY);
          key = newCoordinateX + ":" + newCoordinateY;
          // 当前层级不能有坐标重叠--不存在重复点的时候退出循环，存在的时候再随机生成X，Y坐标点
          if (!currentPosSet.has(key)) {
            break;
          }
        }
        this.chessBoard[newCoordinateX][newCoordinateY].blocks.push(block);
        currentPosSet.add(key);
        block.x = newCoordinateX;
        block.y = newCoordinateY;
        // 填充层级关系
        this.genLevelRelation(block);
      });
    },
    /**
     * 当前层级中块的关系，对应的--z-index
     * @param {*} block 当前块元素
     */
    genLevelRelation(block) {
      // 确定该块附近的格子坐标范围  [0-24,0-24]
      /**
       * eg:[0,0]=>对应的覆盖范围为[0-3,0-3]
       * eg:[21,21]=>对应的覆盖范围为[19-24,19-24]
       */
      const minX = Math.max(block.x - 2, 0);
      const minY = Math.max(block.y - 2, 0);
      const maxX = Math.min(block.x + 3, this.boxWidthNum);
      const maxY = Math.min(block.y + 3, this.boxWidthNum);
      // 遍历该块附近的格子
      for (let i = minX; i < maxX; i++) {
        for (let j = minY; j < maxY; j++) {
          // 遍历该块覆盖的范围内有没有跟其它块的范围有交集,
          const relationBlocks = this.chessBoard[i][j].blocks;
          if (relationBlocks.length > 0) {
            // 在交集范围内的
            relationBlocks.forEach((item) => {
              // 遍历坐标点中的集合，去掉id相同的元素
              if (item.id !== block.id) {
                /**
                 * 排除id相同的元素
                 * 建立关联关系----高于当前块的元素放到父级集合，且当前块的元素放到父级集合对应的子级集合中
                 */
                block.parentBlocks.push(item);
                item.childrenBlocks.push(block);
              }
            });
          }
        }
      }
      // 块初始的时候层级是最高的，根据block.aboveCurrentBlocks中的数量减少层级
      block.level = block.level - block.parentBlocks.length;
    },
    // 返回
    goHomeView() {
      this.$router.go(-1);
    },
    // 点击元素
    clickBlock(block, index) {
      if (block.parentBlocks.length) {
        // 当前块的父级集合有元素的时候不能被点击
        console.log("点击的块元素有父级遮罩！");
        return;
      }
      // 状态改为1
      this.levelBlocksData[index].status = 1;
      // // 点击的块赋值到插槽中
      this.slotValue[this.currentSlotNum] = block;
      console.log(this.slotValue);
      // 加入到点击了的集合中
      this.historyBlocks.push(block);
      // 移除覆盖的关系
      block.childrenBlocks.forEach((children) => {
        _.remove(children.parentBlocks, (parent) => {
          return parent.id === block.id;
        });
      });
      // 判断插槽中的相同的animalType出现的次数，超过composeNum（多少个合成）的次数就消除
      // 检查是否有可消除的元素
      // block.animalType => 出现次数
      const filterSlotVal = this.slotValue.filter((i) => !!i);
      console.log(filterSlotVal);
      const animalTypeMap = filterSlotVal.reduce(function (obj, block) {
        obj[block.animalType] = obj[block.animalType]
          ? ++obj[block.animalType]
          : 1;
        return obj;
      }, {});
      console.log(animalTypeMap);
      // 初始化新的
      const newSlotValue = this.initSlot(this.gameConfig);
      let newSlotNum = 0;
      filterSlotVal.forEach((slotBlock) => {
        // 消除功能
        if (animalTypeMap[slotBlock.animalType] >= this.gameConfig.composeNum) {
          // 状态改为消除
          slotBlock.status = 2;
          // 消除的块数加1
          this.clearBlockNum++;
          // 触发消除的操作后，就不能触发撤回操作
          this.historyBlocks = [];
          return;
        }
        // 没有消除的块重新赋值给newSlotValue
        newSlotValue[newSlotNum] = slotBlock;
        newSlotNum++;
      });
      this.slotValue = newSlotValue;
      this.currentSlotNum = newSlotNum;

      if (newSlotNum >= this.gameConfig.slotNum) {
        // 达到插槽的数量后结束游戏
        this.gameStatus = 2;
        return this.$message.warning("游戏结束了！");
      }
      if (this.clearBlockNum >= this.totalBlockNum) {
        this.gameStatus = 3;
        return this.$message.success("胜利了！");
      }
    },
    // 撤回
    withdraw() {
      console.log(this.historyBlocks);
      if (!this.currentSlotNum) {
        return this.$message.warning("插槽中没有可撤回的元素！");
      }
      if (!this.historyBlocks.length) {
        return this.$message.warning(
          "上一步操作已清空历史，没有可撤回的操作！"
        );
      }
      this.historyBlocks[this.historyBlocks.length - 1].status = 0;
      this.historyBlocks.splice(this.historyBlocks.length - 1, 1);
      this.currentSlotNum -= 1;
      this.slotValue[this.currentSlotNum] = null;
    },
    // 剩余的块重新洗牌
    /**
     * 剩余的块重新洗牌
     * 本质：块的坐标点不变，改变块展示的animalType
     */
    doShuffle() {
      // 获取页面上展示&状态为0 的块
      const newLevelBlocks = this.levelBlocksData.filter(
        (block) => block.status === 0
      );
      // 获取页面上剩余块的图片的数组&&打乱顺序
      const newAnimalTypeList = _.shuffle(
        newLevelBlocks.map((block) => {
          return block.animalType;
        })
      );
      newLevelBlocks.forEach((levelBlock, index) => {
        levelBlock.animalType = newAnimalTypeList[index];
      });
      this.levelBlocksData = [...this.levelBlocksData];
    },
    // 重新开始游戏
    againGame() {
      this.reset();
      this.initGame(this.gameConfig);
    },
    // 重置数据
    reset() {
      this.chessBoard = [];
      this.gameStatus = 1;
      this.clearBlockNum = 0;
      this.clearBlockNum = 0;
      this.allBlocks = [];
      this.levelBlocksData = [];
      this.slotValue = [];
      this.currentSlotNum = 0;
      this.levelNum = 0;
      this.historyBlocks = [];
    },
  },
};
</script>
<style scoped>
.game-page {
  padding: 16px;
}
.level-board {
  position: relative;
  text-align: center;
}

.level-block {
  position: absolute;
}

.slot-board {
  border: 10px solid saddlebrown;
  margin: 16px auto;
  width: fit-content;
}

.skill-board {
  text-align: center;
}

.block {
  font-size: 28px;
  width: 40px;
  height: 40px;
  line-height: 42px;
  border: 1px solid #eee;
  background: white;
  text-align: center;
  vertical-align: top;
  display: inline-block;
}

.disabled {
  background: grey;
  cursor: not-allowed;
}
</style>
