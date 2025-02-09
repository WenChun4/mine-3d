/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { Point3d } from "@itwin/core-geometry";
import MineBox, { MineBoxStatus } from "./MineBox";
import MineMap from "./MineMap";
import { Id64 } from "@itwin/core-bentley";

export default class MineBoxesApi{
  public static createMineBoxes(map: MineMap, sideLength: number) :MineBox[] {
    let boxes: MineBox[] = [];
    let extent: Point3d = Point3d.create(map.mapXNum, map.mapYNum, map.mapZNum);
    for (let z = 0; z < map.mapZNum; z++) {
      for (let y = 0; y < map.mapYNum; y++) {
        for (let x = 0; x < map.mapXNum; x++) {
          let posIndex = Point3d.create(x, y, z);
          let pos = map.calPlacePosition(x, y, z, sideLength);
          let isMine = map.mineExist(x, y, z);
          let surrCounts = map.calNumberOfMinesSurrounded(x, y, z);
          let id = Id64.fromLocalAndBriefcaseIds(boxes.length + 1, 0xffffff);
          boxes.push(new MineBox(id, posIndex, pos, extent, isMine, surrCounts));
        } 
      } 
    }
    
    //  set ini visiable status
    this.resetIniVisiable(boxes);
    return boxes;
  }

  private static resetIniVisiable(boxes: MineBox[]) : void {
    boxes.forEach((box) => {
      box.uiVisiable = (box.posIndex.x === 0 || box.posIndex.y === 0 || box.posIndex.z === 0 ||
        box.posIndex.x === box.extent.x - 1 || box.posIndex.y === box.extent.y - 1 || box.posIndex.z === box.extent.z - 1);
    });
  }

  private static resetVisiable(boxes: MineBox[]) : void {
    boxes.forEach((box) => {
      if(box.uiVisiable === false){
        let boxUp = boxes[this.getMineBoxIndex(boxes, Point3d.create(box.posIndex.x, box.posIndex.y, box.posIndex.z - 1))];
        let boxDown = boxes[this.getMineBoxIndex(boxes, Point3d.create(box.posIndex.x, box.posIndex.y, box.posIndex.z + 1))];
        let boxLeft = boxes[this.getMineBoxIndex(boxes, Point3d.create(box.posIndex.x - 1, box.posIndex.y, box.posIndex.z))]
        let boxRight = boxes[this.getMineBoxIndex(boxes, Point3d.create(box.posIndex.x + 1, box.posIndex.y, box.posIndex.z))]
        let boxTop = boxes[this.getMineBoxIndex(boxes, Point3d.create(box.posIndex.x, box.posIndex.y - 1, box.posIndex.z))];
        let boxBottom = boxes[this.getMineBoxIndex(boxes, Point3d.create(box.posIndex.x, box.posIndex.y + 1, box.posIndex.z))];        
        box.uiVisiable = (boxUp.uiVisiable === true || boxDown.uiVisiable === true || boxLeft.uiVisiable === true || boxRight.uiVisiable === true || boxTop.uiVisiable === true || boxBottom.uiVisiable === true);
      }
    });
  } 

  public static getMineBoxIndex(mineBoxes: MineBox[], idOrPt: any): number {
    if(mineBoxes === undefined || mineBoxes === null || mineBoxes.length <= 0)
      return -1;

    let extent: Point3d = mineBoxes[0].extent;
    if(idOrPt instanceof Point3d){
      let pt: Point3d = idOrPt;
      if(pt.x >= 0 && pt.x < extent.x && pt.y >= 0 && pt.y < extent.y && pt.z >= 0 && pt.z < extent.z) {
        let idPos = 0;
        if(pt.z > 0) 
          idPos = extent.x * extent.y * pt.z;
        if(pt.y > 0) 
          idPos += extent.x * pt.y;
        idPos += pt.x + 1;
        return idPos - 1;
      }
    }
    else if(typeof idOrPt === 'string'){
     let idPos = Id64.getLocalId(idOrPt);
     return idPos - 1;
    }

    return -1;
  }

  public static leftButtonClick(mineBoxes: MineBox[], idOrPt: any, currBox: { box?: MineBox}) : MineBox[] {
    let index = this.getMineBoxIndex(mineBoxes, idOrPt);
    if(index < 0)
      return mineBoxes;

    let nextMineBoxes = [...mineBoxes];    
    currBox.box = nextMineBoxes[index];
    if(mineBoxes[index].status === MineBoxStatus.Flag){
      return nextMineBoxes;
      }

    if(nextMineBoxes[index].status === MineBoxStatus.Unknown){
      nextMineBoxes[index].status = MineBoxStatus.Known;
      //  status changed, let's check surroundings boxes..

      //  Hit the mine, return immediately..
      if(mineBoxes[index].isMine === true){
        return nextMineBoxes;
      }

      let explorerList: MineBox[] = [];
      this.addSurroundingBoxesToExplorerList(nextMineBoxes, nextMineBoxes[index].posIndex, explorerList)
      while(explorerList.length > 0){
        this.explorerBox(explorerList[0], nextMineBoxes, explorerList);
        explorerList.shift();
      }
    }

    this.resetVisiable(nextMineBoxes);
    return nextMineBoxes;
  }

  private static explorerBox(mineBox: MineBox, nextMineBoxes: MineBox[], explorerList: MineBox[]): void {
    if(mineBox.isMine || mineBox.status === MineBoxStatus.Flag){
      return;
    }

    if(mineBox.status === MineBoxStatus.Unknown){
      let index = this.getMineBoxIndex(nextMineBoxes, mineBox.id);
      nextMineBoxes[index].status = MineBoxStatus.Known;
      //  status changed, let's check surroundings boxes..

      if(mineBox.numberOfMinesSurrounded === 0){
        this.addSurroundingBoxesToExplorerList(nextMineBoxes, mineBox.posIndex,  explorerList)
      }
    }
  }

  private static addSurroundingBoxesToExplorerList(nextMineBoxes: MineBox[], centerPosIndex: Point3d, explorerList: MineBox[]): void {
    let pI = centerPosIndex;

    this.addBoxPosToExplorerList(nextMineBoxes, Point3d.create(pI.x - 1, pI.y, pI.z), explorerList);
    this.addBoxPosToExplorerList(nextMineBoxes, Point3d.create(pI.x + 1, pI.y, pI.z), explorerList);
    this.addBoxPosToExplorerList(nextMineBoxes, Point3d.create(pI.x, pI.y - 1, pI.z), explorerList);
    this.addBoxPosToExplorerList(nextMineBoxes, Point3d.create(pI.x, pI.y + 1, pI.z), explorerList);
    this.addBoxPosToExplorerList(nextMineBoxes, Point3d.create(pI.x, pI.y, pI.z - 1), explorerList);
    this.addBoxPosToExplorerList(nextMineBoxes, Point3d.create(pI.x, pI.y, pI.z + 1), explorerList);
  }

  private static addBoxPosToExplorerList(nextMineBoxes: MineBox[], posIndex: Point3d, explorerList: MineBox[]): void{
    let index = this.getMineBoxIndex(nextMineBoxes, posIndex);
    if(index < 0)
      return;

    if(nextMineBoxes[index].status === MineBoxStatus.Unknown){
      explorerList.push(nextMineBoxes[index]);
    }
  }

  public static resetButtonClick(mineBoxes: MineBox[], idOrPt: any, currBox: { box?: MineBox}) : MineBox[] {
      let index = this.getMineBoxIndex(mineBoxes, idOrPt);
      if(index < 0){
        return mineBoxes;
      }

      let nextMineBoxes = [...mineBoxes];   
      currBox.box = nextMineBoxes[index];

      let curFlagCounts: number =  MineBoxesApi.getStatusMineBoxCounts(nextMineBoxes, MineBoxStatus.Flag);
      let curMineCounts: number =  MineBoxesApi.getIsMineCounts(nextMineBoxes);

      if(nextMineBoxes[index].status === MineBoxStatus.Unknown &&
         curFlagCounts >= curMineCounts){
        return nextMineBoxes
      }

      this.resetMineBox(nextMineBoxes[index]);
 
      console.log('reset Minebox..');
      return nextMineBoxes;
    }
    
  private static resetMineBox(box: MineBox) : MineBox {
    if(box.status === MineBoxStatus.Unknown){
      box.status = MineBoxStatus.Flag;
      return box;
    }
    else if(box.status === MineBoxStatus.Flag){
      box.status = MineBoxStatus.Unknown;
      return box;
    }

    return box;
  }

  public static flagAllUnknowMines(nextMineBoxes: MineBox[]) {
    console.log('flag all unknow mines..');
    nextMineBoxes.forEach((box) => {      
      if(box.status === MineBoxStatus.Unknown){
        box.status = MineBoxStatus.Flag;
        box.uiVisiable = true;
      }
    });

    return nextMineBoxes;
  }

  public static getStatusMineBoxes(mineBoxes: MineBox[], status: MineBoxStatus): MineBox[] {
    let outputs: MineBox[] = mineBoxes.filter((box) => {
        return box.status === status;
    });

    return outputs;
  }

  public static getStatusMineBoxCounts(mineBoxes: MineBox[], status: MineBoxStatus): number {
    let outputs: MineBox[] = this.getStatusMineBoxes(mineBoxes, status);
    return outputs.length;
  }

  public static getIsMineBoxes(mineBoxes: MineBox[]) {
    let outputs: MineBox[] = mineBoxes.filter((box) => {
      return box.isMine === true;
    });

    return outputs;
  }

  public static getIsMineCounts(mineBoxes: MineBox[]): number {
    let outputs: MineBox[] = this.getIsMineBoxes(mineBoxes);
    return outputs.length;
  }
}