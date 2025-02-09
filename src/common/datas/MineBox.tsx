/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { Point3d } from "@itwin/core-geometry";

export enum MineBoxStatus {
    Unknown,
    Flag,
    Known
  }

export default class MineBox{
  id: string; // Id64String
  posIndex: Point3d;
  pos: Point3d;
  extent: Point3d;
  isMine: boolean;
  status: MineBoxStatus;
  uiVisiable: boolean = false;
  numberOfMinesSurrounded: number;

  constructor(id: string, posIndex: Point3d, pos: Point3d, extent: Point3d, isMine: boolean, numberOfMinesSurrounded: number) {
    this.id = id;
    this.posIndex = posIndex.clone();
    this.pos = pos.clone();
    this.extent = extent.clone();
    this.isMine = isMine;
    this.status = MineBoxStatus.Unknown;
    this.numberOfMinesSurrounded = numberOfMinesSurrounded;
  }

  clone(): MineBox {    
    return new MineBox(this.id, this.posIndex, this.pos, this.extent,this.isMine, this.numberOfMinesSurrounded);
  }
}