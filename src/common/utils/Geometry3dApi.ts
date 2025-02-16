/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { TextString } from "@itwin/core-common";
import { Angle, AngleSweep, Arc3d, Box, Cone, LineString3d, Matrix3d, Path, Point3d, Range3d, RuledSweep, Sphere, TorusPipe, Transform} from "@itwin/core-geometry";

export default class Geometry3dApi {

  public static createCone(height: number, lowerRadius: number, upperRadius: number): Cone | undefined {
    return Cone.createAxisPoints(Point3d.create(0, 0, 0), Point3d.create(0, 0, height), lowerRadius, upperRadius, true);
  }

  public static createSphere(radius: number): Sphere | undefined {
    return Sphere.createCenterRadius(Point3d.create(0, 0, radius), radius);
  }

  public static createBox(length: number, width: number, height: number): Box | undefined {
    return Box.createRange(new Range3d(0 - length / 2, 0 - width / 2, 0 / 2, 0 + length / 2, 0 + width / 2, height), true);
  }

  public static createCube(pos: Point3d, sideLen: number): Box | undefined {
    return Box.createRange(new Range3d(pos.x - sideLen / 2, pos.y - sideLen / 2, pos.z - sideLen / 2, pos.x + sideLen / 2, pos.y + sideLen / 2, pos.z + sideLen / 2), true);
  }

  public static createTorusPipe(outerRadius: number, innerRadius: number, sweep: number) {
    return TorusPipe.createAlongArc(Arc3d.createXY(new Point3d(0, 0, innerRadius), outerRadius, AngleSweep.create(Angle.createDegrees(sweep))), innerRadius, false);
  }

  /*
  public static createFlag(pos: Point3d, height: number): RuledSweep | undefined {

  }
  */

  public static createMine(pos: Point3d, dia: number): RuledSweep | undefined {
    let mineArcs: Arc3d[] = [];
    mineArcs.push(this.mineArc(180 - 2, 0));
    mineArcs.push(this.mineArc(180 - 15, 0));
    mineArcs.push(this.mineArc(180 - 30, 0));
    mineArcs.push(this.mineArc(180 - 45, 0));
    mineArcs.push(this.mineArc(180 - 60, 0));
    mineArcs.push(this.mineArc(180 - 75, 0));
    mineArcs.push(this.mineArc(180 - 90, 0));
    mineArcs.push(this.mineArc(180 - 105, 0));
    mineArcs.push(this.mineArc(180 - 120, 0));
    mineArcs.push(this.mineArc(180 - 135, 0));
    mineArcs.push(this.mineArc(180 - 150, 0));
    mineArcs.push(this.mineArc(180 - 160, 0));
    mineArcs.push(this.mineArc(180 - 160, 0.15));
    mineArcs.push(this.mineArc(180 - 178, 0.11));

    let paths: Path[] = [];
    mineArcs.forEach((arc) => {
      paths.push(Path.create(arc));
    });

    let unitMine :RuledSweep | undefined = RuledSweep.create(paths, true);

    let trfm1: Transform = Transform.createScaleAboutPoint(new Point3d(0, 0, 0), dia / 2.0);
    let trfm2: Transform = Transform.createTranslation(pos);

    let trfm: Transform = Transform.createIdentity();
    trfm.setMultiplyTransformTransform(trfm1, trfm);
    trfm.setMultiplyTransformTransform(trfm2, trfm);

    return unitMine!.cloneTransformed(trfm);
  }

  private static mineArc(angle: number, zdat: number): Arc3d {
    let rang: number = angle * Math.PI / 180.0;
    let z: number = Math.cos(rang) + zdat;
    let r: number = Math.sin(rang);
    return Arc3d.createXY(new Point3d(0, 0, z), r);
  }

  public static createCenterLinex(lineSecs: Point3d[], centerPos: Point3d, height: number, mx: Matrix3d): LineString3d {
     let centerLine = LineString3d.create();
    for (let i = 0; i < lineSecs.length; i++) {
      let pt = lineSecs[i].plus(new Point3d(-0.5, -0.5, 0));  // assume the line center is at (0, 0, 0)

      pt.scaleInPlace(height);
      let ptNew = mx.multiplyPoint(pt).plus(centerPos);
      centerLine.addPoint(ptNew);
    }
    return centerLine;
  }

  public static createLcdNumberLoops_backup(text: TextString, mx: Matrix3d): LineString3d[] {
    const regex = /^[1-9]d*$/;
    if(!regex.test(text.text))
      return [];

    let num0Lines: LineString3d[] = [];

    if(text.text.length === 1) {
      let numLines = this.lcd_Number(Number(text.text));
      let maxPt: Point3d = this.maxPoint(numLines);
      let centerPt = maxPt.clone();
      centerPt.scaleInPlace(0.5);
      let oppCenterPt: Point3d = centerPt.clone();
      oppCenterPt.scaleInPlace(-1.0);

      numLines.forEach((loop) => {
        let centerLine = LineString3d.create();
        loop.points.forEach((pt) => {
          let mxLocal: Matrix3d = Matrix3d.createIdentity();
          mxLocal = mxLocal.scale(1.0 / maxPt.y);

          let ptNew = mxLocal.multiplyPoint(pt);
          ptNew = ptNew.plus(Point3d.create(-0.5, -0.5, 0.0));
          ptNew.scaleInPlace(text.height * 1);
          ptNew = mx.multiplyPoint(ptNew).plus(text.origin);
        
          centerLine.addPoint(ptNew);
        });
        num0Lines.push(centerLine);
      });

      //console.log("createLcdNumberLoops: ", num0Lines);
    }

    return num0Lines;
  }


  public static createLcdNumberLoops(text: TextString, mx: Matrix3d): LineString3d[] {
    const regex = /^[1-9]d*$/;
    if(!regex.test(text.text))
      return [];

    let num0Lines: LineString3d[] = [];

    if(text.text.length === 1) {
      let numLines = this.lcd_Number(Number(text.text));
      let maxPt: Point3d = this.maxPoint(numLines);
      let centerPt = maxPt.clone();
      centerPt.scaleInPlace(-0.5 / maxPt.y);

      let trfm1: Transform = Transform.createScaleAboutPoint(new Point3d(0, 0, 0), 1.0 / maxPt.y);
      let trfm2: Transform = Transform.createTranslation(centerPt);
      let trfm3: Transform = Transform.createScaleAboutPoint(new Point3d(0, 0, 0), text.height);
      let trfm0: Transform = Transform.createRefs(new Point3d(0, 0, 0), mx);
      let trfm4: Transform = Transform.createTranslation(text.origin);

      let trfm: Transform = Transform.createIdentity();
      trfm.setMultiplyTransformTransform(trfm1, trfm);
      trfm.setMultiplyTransformTransform(trfm2, trfm);
      trfm.setMultiplyTransformTransform(trfm3, trfm);
      trfm.setMultiplyTransformTransform(trfm0, trfm);
      trfm.setMultiplyTransformTransform(trfm4, trfm);
     
      numLines.forEach((loop) => {
        num0Lines.push(loop.cloneTransformed(trfm));
      });
    }

    return num0Lines;
  }

  private static lcd_Number(num: number): LineString3d[]  {
    const numberLines: LineString3d[] = [];
    switch(num) {
      case 0:
        numberLines.push(this.lcd_BlockG());
        numberLines.push(this.lcd_BlockF());
        numberLines.push(this.lcd_BlockC());
        numberLines.push(this.lcd_BlockA());
        numberLines.push(this.lcd_BlockB());
        numberLines.push(this.lcd_BlockE());
        break;
      case 1:
        numberLines.push(this.lcd_BlockF());
        numberLines.push(this.lcd_BlockC());
        break;
      case 2:
        numberLines.push(this.lcd_BlockG());
        numberLines.push(this.lcd_BlockF());
        numberLines.push(this.lcd_BlockD());
        numberLines.push(this.lcd_BlockB());
        numberLines.push(this.lcd_BlockA());
        break;
      case 3:
        numberLines.push(this.lcd_BlockG());
        numberLines.push(this.lcd_BlockF());
        numberLines.push(this.lcd_BlockD());
        numberLines.push(this.lcd_BlockC());
        numberLines.push(this.lcd_BlockA());
        break;
      case 4:
        numberLines.push(this.lcd_BlockE());
        numberLines.push(this.lcd_BlockD());
        numberLines.push(this.lcd_BlockF());
        numberLines.push(this.lcd_BlockC());
        break; 
      case 5:
        numberLines.push(this.lcd_BlockG());
        numberLines.push(this.lcd_BlockE());
        numberLines.push(this.lcd_BlockD());
        numberLines.push(this.lcd_BlockC());
        numberLines.push(this.lcd_BlockA());
        break;
      case 6:
        numberLines.push(this.lcd_BlockG());
        numberLines.push(this.lcd_BlockE());
        numberLines.push(this.lcd_BlockB());
        numberLines.push(this.lcd_BlockC());
        numberLines.push(this.lcd_BlockA());
        numberLines.push(this.lcd_BlockD());
        break;
      case 7:
        numberLines.push(this.lcd_BlockG());
        numberLines.push(this.lcd_BlockF());
        numberLines.push(this.lcd_BlockC());        
        break;
      case 8:
        numberLines.push(this.lcd_BlockF());
        numberLines.push(this.lcd_BlockG());
        numberLines.push(this.lcd_BlockE());
        numberLines.push(this.lcd_BlockB());
        numberLines.push(this.lcd_BlockA());
        numberLines.push(this.lcd_BlockC());
        numberLines.push(this.lcd_BlockD());
        break;
      case 9:
        numberLines.push(this.lcd_BlockF());
        numberLines.push(this.lcd_BlockG());
        numberLines.push(this.lcd_BlockE());
        numberLines.push(this.lcd_BlockD());
        numberLines.push(this.lcd_BlockC());
        numberLines.push(this.lcd_BlockA());
        break;        
      default:
        break;
    }

    return numberLines;
  }

  /*
      ......
      .    .
      ......
      .    .
      ______
  */
  private static lcd_BlockA(): LineString3d {
    let pt0: Point3d = new Point3d(7, 0, 0);
    let pt1: Point3d = new Point3d(72, 68, 0);
    let pt2: Point3d = new Point3d(294, 68, 0);
    let pt3: Point3d = new Point3d(359, 0, 0);

    const numberLines: LineString3d = LineString3d.create(pt0, pt1, pt2, pt3, pt0);
    return numberLines;
  }

    /*
      ......
      .    .
      ......
      |    .
      ......
  */
  private static lcd_BlockB(): LineString3d {
    let pt0: Point3d = new Point3d(0, 6, 0);
    let pt1: Point3d = new Point3d(0, 274, 0);
    let pt2: Point3d = new Point3d(32, 304, 0);
    let pt3: Point3d = new Point3d(70, 268, 0);
    let pt4: Point3d = new Point3d(70, 78, 0);

    const numberLines: LineString3d = LineString3d.create(pt0, pt1, pt2, pt3, pt4, pt0);
    return numberLines;
  }

  /*
      ......
      .    .
      ......
      .    |
      ......
  */
  private static lcd_BlockC(): LineString3d {
    let pt0: Point3d = new Point3d(296, 78, 0);
    let pt1: Point3d = new Point3d(296, 268, 0);
    let pt2: Point3d = new Point3d(334, 304, 0);
    let pt3: Point3d = new Point3d(366, 274, 0);
    let pt4: Point3d = new Point3d(366, 5, 0);

    const numberLines: LineString3d = LineString3d.create(pt0, pt1, pt2, pt3, pt4, pt0);
    return numberLines;
  }

    /*
      ......
      .    .
      ______
      .    .
      ......
  */
  private static lcd_BlockD(): LineString3d {
    let pt0: Point3d = new Point3d(38, 310, 0);
    let pt1: Point3d = new Point3d(76, 346, 0);
    let pt2: Point3d = new Point3d(290, 346, 0);
    let pt3: Point3d = new Point3d(328, 310, 0);
    let pt4: Point3d = new Point3d(289, 274, 0);
    let pt5: Point3d = new Point3d(76, 274, 0);

    const numberLines: LineString3d = LineString3d.create(pt0, pt1, pt2, pt3, pt4, pt5, pt0);
    return numberLines;
  } 

      /*
      ......
      |    .
      ......
      .    .
      ......
  */
  private static lcd_BlockE(): LineString3d {
    let pt0: Point3d = new Point3d(0, 613, 0);
    let pt1: Point3d = new Point3d(70, 546, 0);
    let pt2: Point3d = new Point3d(70, 352, 0);
    let pt3: Point3d = new Point3d(32, 316, 0);
    let pt4: Point3d = new Point3d(0, 346, 0);

    const numberLines: LineString3d = LineString3d.create(pt0, pt1, pt2, pt3, pt4, pt0);
    return numberLines;
  }

      /*
      ......
      .    |
      ......
      .    .
      ......
  */  
  private static lcd_BlockF(): LineString3d {
    let pt0: Point3d = new Point3d(296, 352, 0);
    let pt1: Point3d = new Point3d(296, 546, 0);
    let pt2: Point3d = new Point3d(366, 613, 0);
    let pt3: Point3d = new Point3d(366, 346, 0);
    let pt4: Point3d = new Point3d(334, 316, 0);

    const numberLines: LineString3d = LineString3d.create(pt0, pt1, pt2, pt3, pt4, pt0);
    return numberLines;
  }

      /*
      ______
      .    .
      ......
      .    .
      ......
  */
  private static lcd_BlockG(): LineString3d {
    let pt0: Point3d = new Point3d(5, 620, 0);
    let pt1: Point3d = new Point3d(361, 620, 0);
    let pt2: Point3d = new Point3d(290, 552, 0);
    let pt3: Point3d = new Point3d(76, 552, 0);

    const numberLines: LineString3d = LineString3d.create(pt0, pt1, pt2, pt3, pt0);
    return numberLines;
  }

  private static maxPoint(lines: LineString3d[]): Point3d {
    let maxPt: Point3d = new Point3d(0, 0, 0);

    (lines).forEach((eachLine) => {
      eachLine.points.forEach((pt) => {
        maxPt.x = Math.max(maxPt.x, pt.x);
        maxPt.y = Math.max(maxPt.y, pt.y);
      });
    });

    return maxPt;
  }
}
