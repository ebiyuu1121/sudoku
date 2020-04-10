<template>
  <v-layout>
    <v-layout column justify-center align-center>
      <v-row v-if="connected">
        <span :style="`color: ${this.color}`">{{name}}</span>
      </v-row>
      <v-row v-if="!connected">
        <v-text-field label="名前を入力" v-model="name"></v-text-field>
      </v-row>
      <v-row v-if="!connected">
        <v-color-picker hide-canvas v-model="color"></v-color-picker>
      </v-row>
      <v-row v-if="!connected">
        <v-btn color="primary" @click="connect">接続</v-btn>
      </v-row>
      <v-row v-if="connected">
        <v-btn color="error" @click="disconnect">切断</v-btn>
      </v-row>
      <v-row v-if="connected">
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
      <div class="cell-wrap" v-if="connected">
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
                  :style="`color: ${cells[row][col].color}`"
                  :readonly="cells[row][col].isProblem"
                  v-model="cells[row][col].value"
                  @focus="activeCell = {row: row, col: col}"
                  @input="cellChanged"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-layout>
    <v-layout>
      <v-list v-if="connected">
        <v-list-item v-for="(user, key) in users" :key="key">
          <span :style="`color: ${user.color}`">{{user.name}}</span>
        </v-list-item>
      </v-list>
    </v-layout>
  </v-layout>
</template>

<script>
import io from "socket.io-client";

export default {
  components: {},
  data() {
    return {
      activeCell: null,
      cells: JSON.parse(
        JSON.stringify(
          new Array(9).fill(
            new Array(9).fill({
              value: "",
              isProblem: false,
              inputBy: "",
              color: ""
            })
          )
        )
      ),
      socket: "",
      name: "",
      color: "",
      connected: false,
      users: {}
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
      this.socket.emit("cell-changed", this.cells);
    },
    clearAns() {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (!this.cells[row][col].isProblem) {
            this.$set(this.cells[row][col], "value", null);
          }
        }
      }
      this.socket.emit("cell-changed", this.cells);
    },
    clearAll() {
      this.cells = JSON.parse(
        JSON.stringify(
          new Array(9).fill(
            new Array(9).fill({
              value: "",
              isProblem: false,
              inputBy: "",
              color: ""
            })
          )
        )
      );
      this.socket.emit("cell-changed", this.cells);
    },
    cellChanged() {
      [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach(row => {
        [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach(col => {
          let val = this.cells[row][col].value;
          if (val == "") {
            if (this.cells[row][col].inputBy != "") {
              this.$set(this.cells[row][col], "inputBy", "");
            }
          } else {
            if (isNaN(val) || val < 1 || val > 9) {
              this.$set(this.cells[row][col], "value", "");
            } else {
              if (this.cells[row][col].inputBy == "") {
                this.$set(this.cells[row][col], "inputBy", this.name);
                this.$set(this.cells[row][col], "color", this.color);
              }
            }
          }
        });
      });
      this.socket.emit("cell-changed", this.cells);
    },
    connect() {
      this.connected = true;

      this.socket = io();
      this.socket.emit("user-join", {
        name: this.name,
        color: this.color
      });
      this.socket.on("cell-changed", cells => {
        this.cells = cells;
      });
      this.socket.on("user-update", users => {
        this.users = users;
      });
    },
    disconnect() {
      this.socket.emit("user-leave", {});
      this.socket.close();
      this.connected = false;
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
    color: black !important
</style>
