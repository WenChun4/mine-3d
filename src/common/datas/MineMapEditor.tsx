/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import MineMap from "./MineMap";

export enum GameDifficulty{
    Easy,
    Normal,
    Hard,
    Expert
  }

export default class MineMapEditor {

  public static createMineMap(level: GameDifficulty): MineMap {
    switch(level){
      case GameDifficulty.Normal:
        return MineMapEditor.createCustomMineMap(5, 6, 7, 12);
      case GameDifficulty.Hard:
        return MineMapEditor.createCustomMineMap(8, 8, 8, 30);
      case GameDifficulty.Expert:
        return MineMapEditor.createCustomMineMap(10, 10, 10, 50);
      case GameDifficulty.Easy:
      default:
        return MineMapEditor.createCustomMineMap(4, 4, 4, 4);
    }    
  }

  private static createCustomMineMap(x: number, y:number, z: number, mines: number): MineMap {
    var map: MineMap  = new MineMap(x, y, z);
    while(map.getMineCount() < mines){
      let posX = Math.floor(Math.random() * x);
      let posY = Math.floor(Math.random() * y);
      let posZ = Math.floor(Math.random() * z);
      map.addMine(posX, posY, posZ);
    }
    return map;
  }

  public static createTestMap(): MineMap {
        var map: MineMap  = new MineMap(5, 6, 7);
    
        map.addMine(0, 0, 0);
        map.addMine(1, 1, 1);
        map.addMine(1, 2, 1);
        map.addMine(1, 2, 3);
        map.addMine(1, 3, 4);
        map.addMine(1, 2, 5);
        map.addMine(3, 1, 1);
        map.addMine(3, 2, 1);
        map.addMine(3, 3, 3);
        map.addMine(3, 2, 4);
        map.addMine(3, 4, 5); 
    return map;
  }
}