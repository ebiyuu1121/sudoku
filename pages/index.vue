<template>
  <v-layout column justify-center align-center>
    <v-row>
      <v-col>
        <v-btn @click="setProblem">現在の盤面を問題として設定</v-btn>
      </v-col>
      <v-col>
        <v-btn color="primary" @click="clearAns">解答を削除</v-btn>
      </v-col>
      <v-col>
        <v-btn color="error" @click="clearAll">全削除</v-btn>
      </v-col>
    </v-row>
    <div class="cell-wrap">
      <div class="cell-group__row" v-for="startRow in [0,3,6]" :key="startRow">
        <div class="cell-group" v-for="startCol in [0,3,6]" :key="startCol">
          <div class="cell__row" v-for="row in [startRow,startRow+1,startRow+2]" dense :key="row">
            <div class="cell" v-for="col in [startCol,startCol+1,startCol+2]" :key="col">
              <input
                type="text"
                class="num-cell"
                :class="{
                  highlighted: cellsHighlited[row][col],
                  active: activeCell && row == activeCell.row && col == activeCell.col,
                  problem: cells[row][col].isProblem
                }"
                :readonly="cells[row][col].isProblem"
                v-model="cells[row][col].value"
                @focus="activeCell = {row: row, col: col}"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-layout>
</template>

<script>
export default {
  components: {},
  data() {
    return {
      activeCell: null,
      cells: JSON.parse(
        JSON.stringify(
          new Array(9).fill(
            new Array(9).fill({
              value: null,
              isProblem: false,
              inputBy: null
            })
          )
        )
      )
    };
  },
  computed: {
    activeNum() {
      if (this.activeCell) {
        return this.cells[this.activeCell.row][this.activeCell.col].value;
      } else {
        return null;
      }
    },
    cellsHighlited() {
      return this.cells.map(row => {
        return row.map(cell => {
          return this.activeNum && cell.value == this.activeNum;
        });
      });
    }
  },
  methods: {
    setProblem() {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (this.cells[row][col].value) {
            this.$set(this.cells[row][col], "isProblem", true);
          } else {
            this.$set(this.cells[row][col], "isProblem", false);
          }
        }
      }
    },
    clearAns() {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (!this.cells[row][col].isProblem) {
            this.$set(this.cells[row][col], "value", null);
          }
        }
      }
    },
    clearAll() {
      this.cells = JSON.parse(
        JSON.stringify(
          new Array(9).fill(
            new Array(9).fill({
              value: null,
              isProblem: false,
              inputBy: null
            })
          )
        )
      );
    }
  },
  watch: {
    cells: {
      handler() {
        [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach(row => {
          [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach(col => {
            let val = this.cells[row][col].value;
            if (val != "" && (isNaN(val) || val < 1 || val > 9)) {
              this.$set(this.cells[row][col], "value", "");
            }
          });
        });
      },
      deep: true
    }
  }
};
</script>

<style lang="sass" scoped>
.cell-group
  display: inline-block
  border: solid 2px black

.cell
  display: inline-block
  width: 50px
  height: 50px
  border: solid 1px black

.num-cell
  display: block
  width: 100%
  height: 100%
  text-align: center
  font-size: 18pt
  font-weight: bold
  outline: 0

  &.highlighted
    background-color: yellow

  &.active
    border: red solid 2px

  &.problem
    color: blue
</style>
