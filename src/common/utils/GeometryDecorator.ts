/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { ColorDef, LinePixels, TextString } from "@itwin/core-common";
import { BeButton, BeButtonEvent, DecorateContext, Decorator, EventHandled, GraphicBranch, GraphicBuilder, GraphicType, HitDetail, IModelApp, Marker, RenderGraphic } from "@itwin/core-frontend";
import { Arc3d, CurveChainWithDistanceIndex, GeometryQuery, IndexedPolyface, IndexedPolyfaceVisitor, LineSegment3d, LineString3d, Loop, Matrix3d, Path, Point3d, Transform } from "@itwin/core-geometry";
import Geometry3dApi from "./Geometry3dApi";

// Since all geometry is rendered concurrently, when adding geometry, we attach their desired attributes to them in an object
interface CustomGeometryQuery {
  geometry: GeometryQuery;
  color: ColorDef;
  fill: boolean;
  fillColor: ColorDef;
  lineThickness: number;
  edges: boolean;
  linePixels: LinePixels;
  id: string;
  pickable: boolean;
}

interface CustomTextString {
  text: TextString;
  color: ColorDef;
  fill: boolean;
  fillColor: ColorDef;
  lineThickness: number;
  edges: boolean;
  linePixels: LinePixels;
  id: string;
  pickable: boolean;
}

interface CustomPoint {
  point: Point3d;
  color: ColorDef;
  fill: boolean;
  lineThickness: number;
}

export class GeometryDecorator implements Decorator {

  private graphics: RenderGraphic[] | undefined;
  private textGraphics: RenderGraphic[] | undefined;

  private points: CustomPoint[] = [];
  private shapes: CustomGeometryQuery[] = [];
  private texts: CustomTextString[] = [];
  private markers: Marker[] = [];

  private textMatrix: Matrix3d | undefined = undefined;
  private fill: boolean = false;
  private color: ColorDef = ColorDef.black;
  private fillColor: ColorDef = ColorDef.white;
  private lineThickness: number = 1;
  private edges: boolean = true;
  private linePixels = LinePixels.Solid;
  private id: string = "";
  private pickable: boolean = false;

  private _buttonClick: (idOrPt: any, isLeftButton: boolean) => void;

  public buttonClickEvent(buttonClick: (idOrPt: any, isLeftButton: boolean) => void) {
    if (typeof buttonClick !== "function") {
      throw new Error("Arguments must be functions");
    }
    
    this._buttonClick = buttonClick;
     //this._buttonClick = this._buttonClick.bind(this);
  }

  constructor(buttonClick: (idOrPt: any, isLeftButton: boolean) => void) {
    this._buttonClick = buttonClick;
    //this._buttonClick = this._buttonClick.bind(this);
   }

  public addMarker(marker: Marker) {
    this.markers.push(marker);
  }

  public addLine(line: LineSegment3d) {
    const styledGeometry: CustomGeometryQuery = ({
      geometry: line,
      color: this.color,
      fill: this.fill,
      fillColor: this.fillColor,
      lineThickness: this.lineThickness,
      edges: this.edges,
      linePixels: this.linePixels,
      id: this.id,
      pickable: this.pickable,
    });
    this.shapes.push(styledGeometry);
  }

  public addPoint(point: Point3d) {
    const styledPoint: CustomPoint = ({
      point,
      color: this.color,
      fill: this.fill,
      lineThickness: this.lineThickness,
    });
    this.points.push(styledPoint);
  }

  public addText(text: TextString) {
    const styledText: CustomTextString = ({
      text,
      color: this.color,
      fill: this.fill,
      fillColor: this.fillColor,
      lineThickness: this.lineThickness,
      edges: this.edges,
      linePixels: this.linePixels,
      id: this.id,
      pickable: this.pickable,
    });
    this.texts.push(styledText);
  }

  public setTextStyle(style: CustomGeometryQuery){

  }

  public addPoints(points: Point3d[]) {
    points.forEach((point) => {
      this.addPoint(point);
    });
  }

  public addGeometry(geometry: GeometryQuery) {
    const styledGeometry: CustomGeometryQuery = ({
      geometry,
      color: this.color,
      fill: this.fill,
      fillColor: this.fillColor,
      lineThickness: this.lineThickness,
      edges: this.edges,
      linePixels: this.linePixels,
      id: this.id,
      pickable: this.pickable,
    });
    this.shapes.push(styledGeometry);
  }

  public addArc(arc: Arc3d) {
    const styledGeometry: CustomGeometryQuery = ({
      geometry: arc,
      color: this.color,
      fill: this.fill,
      fillColor: this.fillColor,
      lineThickness: this.lineThickness,
      edges: this.edges,
      linePixels: this.linePixels,
      id: this.id,
      pickable: this.pickable,
    });
    this.shapes.push(styledGeometry);
  }

  public clearGeometry() {
    this.markers = [];
    this.points = [];
    this.shapes = [];
    this.texts = [];
    this.graphics = undefined;
    this.textGraphics = undefined;
    IModelApp.viewManager.invalidateDecorationsAllViews();
  }

  public setColor(color: ColorDef) {
    this.color = color;
  }

  public setNextId(id: string){
    this.id = id;
  }

  public setFill(fill: boolean) {
    this.fill = fill;
  }

  public setFillColor(color: ColorDef) {
    this.fillColor = color;
  }

  public setLineThickness(lineThickness: number) {
    this.lineThickness = lineThickness;
  }

  public setEdges(edges: boolean) {
    this.edges = edges;
  }

  public setLinePixels(linePixels: LinePixels) {
    this.linePixels = linePixels;
  }

  public setPickable(pickable: boolean) {
    this.pickable = pickable;
  }

  public testDecorationHit?(id: string): boolean{
    return true;
  }

  public overrideElementHit?(hit: HitDetail): boolean{
    return false;
  }

  onDecorationButtonEvent?(hit: HitDetail, ev: BeButtonEvent): Promise<EventHandled>{
  //onDecorationButtonEvent = async (hit: HitDetail, ev: BeButtonEvent): Promise<EventHandled> => {
    //  hit.sourceId is Id, example: "0xffffff0000000e22"
    //  ev.button == BeButton.Data, left mouse button;
    //  ev.button == BeButton.Reset, right mouse button;

    console.log("...onDecorationButtonEvent ...");

    return Promise.resolve(EventHandled.Yes).then((handled) => {
      if (ev.button === BeButton.Data || ev.button === BeButton.Reset) {
        //console.log("...onDecorationButtonEvent with button click: ", hit.sourceId, ev.button === BeButton.Data);
        this._buttonClick(hit.sourceId, ev.button === BeButton.Data);
      }
      return handled; // Return the original EventHandled value
    });
  }

  // Iterate through the geometry and point lists, extracting each geometry and point, along with their styles
  // Adding them to the graphic builder which then creates new graphics
  public createGraphics(context: DecorateContext): RenderGraphic[] | undefined {
    // Specifying an Id for the graphics tells the display system that all of the geometry belongs to the same entity, so that it knows to make sure the edges draw on top of the surfaces.
    const graphics: RenderGraphic[] = [];

    //console.log("createGraphics, points...");
    //const builder = context.createGraphic({wantNormals: true, type: GraphicType.WorldDecoration});
    this.points.forEach((styledPoint) => {
      let builder = context.createGraphicBuilder(GraphicType.WorldDecoration, undefined, context.viewport.iModel.transientIds.getNext());
      builder.setSymbology(styledPoint.color, styledPoint.fill ? styledPoint.color : ColorDef.white, styledPoint.lineThickness);
      const point = styledPoint.point;
      const circle = Arc3d.createXY(point, 1);
      builder.addArc(circle, false, styledPoint.fill);
      const graphic = builder.finish();
      graphics.push(graphic);
    });

    //console.log("createGraphics, shapes...");
    this.shapes.forEach((styledGeometry) => {
      let builder;
      if(styledGeometry.pickable){
        builder = context.createGraphicBuilder(GraphicType.WorldDecoration, undefined, styledGeometry.id);
      }else{
        builder = context.createGraphic({ wantNormals: true, type: GraphicType.WorldDecoration });
      }
      const geometry = styledGeometry.geometry;
      builder.setSymbology(styledGeometry.color, styledGeometry.fill ? styledGeometry.fillColor : styledGeometry.color, styledGeometry.lineThickness, styledGeometry.linePixels);
      this.createGraphicsForGeometry(geometry, styledGeometry.edges, builder);
      const graphic = builder.finish();
      graphics.push(graphic);
    });

    return graphics;
  }

  private createTextGraphics(context: DecorateContext): RenderGraphic[] | undefined {
    // Specifying an Id for the graphics tells the display system that all of the geometry belongs to the same entity, so that it knows to make sure the edges draw on top of the surfaces.
    const graphics: RenderGraphic[] = [];

    this.texts.forEach((styledText) => {
      let builder = context.createGraphic({ wantNormals: true, type: GraphicType.WorldDecoration });
      //  text: TextString object
      let m: Matrix3d | undefined = IModelApp.viewManager.selectedView?.rotation.clone();
      if(m === undefined) return;
    
      let loopGeometry: LineString3d[] = Geometry3dApi.createLcdNumberLoops(styledText.text, m.inverse()!);
      builder.setSymbology(styledText.color, styledText.fill ? styledText.fillColor : styledText.color, styledText.lineThickness, styledText.linePixels);
      loopGeometry.forEach((lineString) => {
        const loop = Loop.create(lineString.clone());
        this.createGraphicsForGeometry(loop, false, builder);
      });

      const graphic = builder.finish();
      graphics.push(graphic);
    });

    return graphics;
  }

  private createGraphicsForGeometry(geometry: GeometryQuery, wantEdges: boolean, builder: GraphicBuilder) {
    if (geometry instanceof LineString3d) {
      builder.addLineString(geometry.points);
    } else if (geometry instanceof Loop) {
      builder.addLoop(geometry);
      if (wantEdges) {
        // Since decorators don't natively support visual edges,
        // We draw them manually as lines along each loop edge/arc
        builder.setSymbology(ColorDef.black, ColorDef.black, 2);
        const curves = geometry.children;
        curves.forEach((value) => {
          if (value instanceof LineString3d) {
            let edges = value.points;
            const endPoint = value.pointAt(0);
            if (endPoint) {
              edges = edges.concat([endPoint]);
            }
            builder.addLineString(edges);
          } else if (value instanceof Arc3d) {
            builder.addArc(value, false, false);
          }
        });
      }
    } else if (geometry instanceof Path) {
      builder.addPath(geometry);
    } else if (geometry instanceof IndexedPolyface) {
      //console.log("IndexedPolyface");
      builder.addPolyface(geometry, false);
      if (wantEdges) {
        // Since decorators don't natively support visual edges,
        // We draw them manually as lines along each facet edge
        builder.setSymbology(ColorDef.black, ColorDef.black, 2);
        const visitor = IndexedPolyfaceVisitor.create(geometry, 1);
        let flag = true;
        while (flag) {
          const numIndices = visitor.pointCount;
          for (let i = 0; i < numIndices - 1; i++) {
            const point1 = visitor.getPoint(i);
            const point2 = visitor.getPoint(i + 1);
            if (point1 && point2) {
              builder.addLineString([point1, point2]);
            }
          }
          flag = visitor.moveToNextFacet();
        }
      }
    } else if (geometry instanceof LineSegment3d) {
      const pointA = geometry.point0Ref;
      const pointB = geometry.point1Ref;
      const lineString = [pointA, pointB];
      builder.addLineString(lineString);
    } else if (geometry instanceof Arc3d) {
      builder.addArc(geometry, false, false);
    } else if (geometry instanceof CurveChainWithDistanceIndex) {
      this.createGraphicsForGeometry(geometry.path, wantEdges, builder);
    }
  }

  // Generates new graphics if needed, and adds them to the scene
  public decorate(context: DecorateContext): void {
    //console.log("GeometryDecorator decorate started...");

    const overrides = { ...context.viewFlags };
    overrides.visibleEdges = true;
    overrides.lighting = true;
    const branch = new GraphicBranch(false);

    branch.viewFlagOverrides = overrides;
    context.viewport.view.displayStyle.viewFlags = context.viewFlags.override(overrides);

    // 1. Create Graphics
    if (!this.graphics){
      this.graphics = this.createGraphics(context);
    }

    if (this.graphics && this.graphics.length > 0){
      this.graphics.forEach((graphic) => {
        branch.add(graphic)
      });
    }

    //  2. Create texts
    let m: Matrix3d | undefined = IModelApp.viewManager.selectedView?.rotation;
    if((m !== undefined && this.textGraphics === undefined) ||
      (m !== undefined && m.isAlmostEqual(this.textMatrix!, 0.2) === false)){
      this.textGraphics = undefined;
      this.textGraphics = this.createTextGraphics(context);
      this.textMatrix = m.clone();
    }

    if (this.textGraphics && this.textGraphics.length > 0){
      this.textGraphics.forEach((text) => {
        branch.add(text)
      });
    }

    const renderGraphicBranch = context.createBranch(branch, Transform.identity);
    context.addDecoration(GraphicType.WorldDecoration, renderGraphicBranch);

    this.markers.forEach((marker) => {
      marker.addDecoration(context);
    });

    //console.log("GeometryDecorator decorate finished.");
  }

  /*
  private mytest(context: DecorateContext) : RenderGraphic{
    let m: Matrix3d | undefined = IModelApp.viewManager.selectedView?.rotation.clone();

    //console.log("GeometryDecorator.decorate... 0. IModelApp.viewManager.selectedView = ", IModelApp.viewManager.selectedView);
    console.log("GeometryDecorator.decorate... 1. IModelApp.viewManager.selectedView?.viewDelta = ", IModelApp.viewManager.selectedView?.viewDelta);
    console.log("GeometryDecorator.decorate... 2. rotation = ", m);
    console.log("GeometryDecorator.decorate... 3.1. rowX() = ", m!.rowX());
    console.log("GeometryDecorator.decorate... 3.2. rowY() = ", m!.rowY());
    console.log("GeometryDecorator.decorate... 3.3. rowZ() = ", m!.rowZ());

    let pt0: Point3d = Point3d.create(0, 0, 40);
    let ptX: Point3d = Point3d.create(50, 0, 40);
    let ptY: Point3d = Point3d.create(0, 100, 40);
    let ptZ: Point3d = Point3d.create(0, 0, 200);

    let lineSegX: LineSegment3d = LineSegment3d.create(pt0, ptX);
    let lineSegY: LineSegment3d = LineSegment3d.create(pt0, ptY);
    let lineSegZ: LineSegment3d = LineSegment3d.create(pt0, ptZ);

    let builder = context.createGraphic({ wantNormals: true, type: GraphicType.WorldDecoration });
    builder.setSymbology(this.color, this.fill ? this.fillColor : this.color, this.lineThickness, this.linePixels);

    this.createGraphicsForGeometry(lineSegX, true, builder);
    this.createGraphicsForGeometry(lineSegY, true, builder);
    this.createGraphicsForGeometry(lineSegZ, true, builder);

    let pt0m: Point3d = m?.inverse()!.multiplyPoint(pt0)!;
    let ptXm: Point3d = m?.inverse()!.multiplyPoint(ptX)!;
    let ptYm: Point3d = m?.inverse()!.multiplyPoint(ptY)!;
    let ptZm: Point3d = m?.inverse()!.multiplyPoint(ptZ)!;

    let lineSegXm: LineSegment3d = LineSegment3d.create(pt0m, ptXm);
    let lineSegYm: LineSegment3d = LineSegment3d.create(pt0m, ptYm);
    let lineSegZm: LineSegment3d = LineSegment3d.create(pt0m, ptZm);

    this.createGraphicsForGeometry(lineSegXm, true, builder);
    this.createGraphicsForGeometry(lineSegYm, true, builder);
    this.createGraphicsForGeometry(lineSegZm, true, builder);
    
    const graphic = builder.finish();
    return graphic
  }
  */

  // Draws a base for the 3d geometry
  public drawBase(origin: Point3d = new Point3d(0, 0, 0), width: number = 80, length: number = 80) {
    const oldEdges = this.edges;
    const oldColor = this.color;
    this.edges = false;
    const points: Point3d[] = [];
    points.push(Point3d.create(origin.x - width / 2, origin.y - length / 2, origin.z - 0.05));
    points.push(Point3d.create(origin.x - width / 2, origin.y + length / 2, origin.z - 0.05));
    points.push(Point3d.create(origin.x + width / 2, origin.y + length / 2, origin.z - 0.05));
    points.push(Point3d.create(origin.x + width / 2, origin.y - length / 2, origin.z - 0.05));
    const linestring = LineString3d.create(points);
    const loop = Loop.create(linestring.clone());
    this.setColor(ColorDef.fromTbgr(ColorDef.withTransparency(ColorDef.green.tbgr, 150)));
    this.addGeometry(loop);
    this.color = oldColor;
    this.edges = oldEdges;
  }
}
