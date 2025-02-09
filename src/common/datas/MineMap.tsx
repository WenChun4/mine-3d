/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { Point3d } from "@itwin/core-geometry";

export default class MineMap{
    mapXNum: number = 0;
    mapYNum: number = 0;
    mapZNum: number = 0;

    minesPosArray: Point3d[];

  constructor(x: number, y: number, z: number) {
    this.mapXNum = x;
    this.mapYNum = y;
    this.mapZNum = z;

    this.minesPosArray = [];
  }

  // Get mine counts
  getMineCount(): number {
    return this.minesPosArray.length;
  }

  //  Add a mine to array
  addMine(x: number, y: number, z: number) {
    if(!this.mineExist(x, y, z)){
      this.minesPosArray.push(new Point3d(x, y, z));
    }    
  }

  removeMine(index: number) {
    if (index > -1 && index < this.getMineCount()) {
      this.minesPosArray.splice(index, 1);
    } else {
      console.log("Element not found in the array.");
    }
  }

  mineExist(x: number, y: number, z: number) : boolean {
    for (const element of this.minesPosArray) {
      if (element.isAlmostEqualXYZ(x, y, z) ) {
        return true;
      }
    }
    return false;
  }    

  calNumberOfMinesSurrounded(x: number, y: number, z: number): number {
    let counts = 0;
    counts += this._calIfMineExist(x, y, z - 1);
    counts += this._calIfMineExist(x + 1, y, z - 1);
    counts += this._calIfMineExist(x + 1, y + 1, z - 1);
    counts += this._calIfMineExist(x, y + 1, z - 1);
    counts += this._calIfMineExist(x - 1, y + 1, z - 1);
    counts += this._calIfMineExist(x - 1, y, z - 1);
    counts += this._calIfMineExist(x - 1, y - 1, z - 1);
    counts += this._calIfMineExist(x, y - 1, z - 1);
    counts += this._calIfMineExist(x + 1, y - 1, z - 1);

    counts += this._calIfMineExist(x + 1, y, z);
    counts += this._calIfMineExist(x + 1, y + 1, z);
    counts += this._calIfMineExist(x, y + 1, z);
    counts += this._calIfMineExist(x - 1, y + 1, z);
    counts += this._calIfMineExist(x - 1, y, z);
    counts += this._calIfMineExist(x - 1, y - 1, z);
    counts += this._calIfMineExist(x, y - 1, z);
    counts += this._calIfMineExist(x + 1, y - 1, z);

    counts += this._calIfMineExist(x, y, z + 1);
    counts += this._calIfMineExist(x + 1, y, z + 1);
    counts += this._calIfMineExist(x + 1, y + 1, z + 1);
    counts += this._calIfMineExist(x, y + 1, z + 1);
    counts += this._calIfMineExist(x - 1, y + 1, z + 1);
    counts += this._calIfMineExist(x - 1, y, z + 1);
    counts += this._calIfMineExist(x - 1, y - 1, z + 1);
    counts += this._calIfMineExist(x, y - 1, z + 1);
    counts += this._calIfMineExist(x + 1, y - 1, z + 1);
    return counts;
  }

  _calIfMineExist(x: number, y: number, z: number): number{
    if(x < 0 || x >= this.mapXNum ||
      y < 0 || y >= this.mapYNum ||
      z < 0 || z >= this.mapZNum){
        return 0;
      }
  
    return this.mineExist(x, y, z) ? 1 : 0;
  }

  //  All blocks are centered at the origin
  calPlacePosition(x: number, y: number, z: number, sideLength: number): Point3d {
    if(x < 0 || x >= this.mapXNum ||
      y < 0 || y >= this.mapYNum ||
      z < 0 || z >= this.mapZNum){
        throw new Error("Pos is out of scrope.");
      }

      return new Point3d(
        (2 * x + 1 - this.mapXNum) * (sideLength / 2.0),
        (2 * y + 1 - this.mapYNum) * (sideLength / 2.0),
        (2 * z + 1 - this.mapZNum) * (sideLength / 2.0));
   }
}