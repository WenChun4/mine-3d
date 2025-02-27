/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { StagePanelLocation, StagePanelSection, UiItemsProvider, useActiveViewport, Widget, WidgetState } from "@itwin/appui-react";
import { ColorByName, ColorDef, Environment, SkyBox, SkyGradient, TextStringProps } from "@itwin/core-common";
import { IModelApp, ViewState3d } from "@itwin/core-frontend";
import { LineString3d, Loop, Point3d, PolyfaceBuilder, StrokeOptions, Transform, YawPitchRollAngles } from "@itwin/core-geometry";
import { Badge, Divider, IconButton, MenuItem, SplitButton, Tooltip, useToaster } from "@itwin/itwinui-react";
import { GeometryDecorator } from "./common/utils/GeometryDecorator";
import Geometry3dApi from "./common/utils/Geometry3dApi";
import "./Mine3d.scss";
import MineMap from "./common/datas/MineMap";
import MineBox, { MineBoxStatus } from "./common/datas/MineBox";
import MineBoxesApi from "./common/datas/MineBoxesApi";
import { SvgFaceHappy } from "./common/imgs/SvgFaceHappy";
import { SvgFaceSad } from "./common/imgs/SvgFaceSad";
import MineMapEditor, { GameDifficulty } from "./common/datas/MineMapEditor";
import { SvgTrophy } from "./common/imgs/SvgTrophy";
import { SvgFaceCool } from "./common/imgs/SvgFaceCool";
import RecordWindow from "./RecordWindow";
import RecordApi from "./common/utils/GameRecordApi";
import { FireDecorator, FireParams } from "./common/utils/FireDecorator";
import FireDecorationApi from "./common/utils/FireDecorationApi";
import { authContext } from "./common/AuthorizationClient";
import HelpWindow from "./HelpWindow";
import { SvgInfo } from '@itwin/itwinui-icons-react';


enum GameStatus {
  NotStarted,
  Started,
  Success,
  Failure,
  Restart
}

enum GeometryType{
  Cube,
  Mine,
  Text
}

export default function Mine3dWidget() {
  const activeViewport = useActiveViewport();
  const [gameDifficulty, setGameDifficulty] = useState<GameDifficulty>(GameDifficulty.Easy);
  const [showRecord, setShowRecord] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [gameStatus, SetGameStatus] = useState<GameStatus>(GameStatus.NotStarted);
  const [timerId, SetTimerId] = useState<any>(null);
  const [remainsMine, setRemainsMine] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);   
  const [mineMap, setMineMap] = useState<MineMap>();
  const [mineBoxes, setMineBoxes] = useState<MineBox[]>([]);
  const [geoDecorator, setGeoDecorator] = useState<GeometryDecorator>();
  const [fireDecorator, setFireDecorator] = useState<FireDecorator>();

  const sideLength = 5;
  const mineBoxesRef = useRef(mineBoxes);
  const gameStatusRef = useRef(gameStatus);

  const toaster = useToaster();
  const auth = useContext(authContext);
  
  useEffect(() => {
    mineBoxesRef.current = mineBoxes;
    gameStatusRef.current = gameStatus;
  }, [mineBoxes, gameStatus]);

  useEffect(() => {
    if (!geoDecorator) {
      const decorator = new GeometryDecorator(handleClick);
      IModelApp.viewManager.addDecorator(decorator);
      setGeoDecorator(decorator);
      console.log("Geometry decorator created.");
    }

    return (() => {
      if (geoDecorator){
        IModelApp.viewManager.dropDecorator(geoDecorator);
        setGeoDecorator(undefined);
        console.log("Geometry decorator released.");
      }      
    });
  }, [geoDecorator]);

  useEffect(() => {
    if (!fireDecorator) {
      const params: FireParams | undefined = FireDecorationApi.predefinedParams.get('Mine');
      console.log("param:", params, "activeViewport:", activeViewport);
      if(params && activeViewport){
        const decorator = new FireDecorator(params, activeViewport);
        IModelApp.viewManager.addDecorator(decorator);
        setFireDecorator(decorator);
        console.log("Fire decorator created.");
      }
    }

    return (() => {
      if (fireDecorator){
        IModelApp.viewManager.dropDecorator(fireDecorator);
        setFireDecorator(undefined);
        console.log("Fire decorator released.");
      }
    });
  }, [fireDecorator, activeViewport]);  

  // Apply background color changes
  useEffect(() => {
    if (activeViewport) {
      const gradient = SkyGradient.create({
        zenithColor: ColorDef.from(255, 255, 255),
        nadirColor: ColorDef.from(150, 150, 150),
        twoColor: true,
      });
  
      (activeViewport.view as ViewState3d).displayStyle.environment = Environment.create({
        sky: SkyBox.createGradient(gradient),
        displaySky: true,
      });
    }

  }, [activeViewport]);

  useEffect(() => {
    if(gameStatusRef.current === GameStatus.Restart){
      SetGameStatus(GameStatus.Started);
    }
    else if(gameStatusRef.current === GameStatus.Started){
      _loadMap();
      setSeconds(0);
      let timer = setInterval(() => {
        setSeconds((sec) => sec + 1);
      }, 1000);

      SetTimerId(timer);
    }
    else {
     if(timerId !== null){
      clearInterval(timerId);
        SetTimerId(null);
      }
    }

    if (gameStatus === GameStatus.Success) {
      auth.getUserFullName().then((user) => {
        RecordApi.saveRecord(GameDifficulty[gameDifficulty], user, seconds);
      });

      setTimeout(() => {
        toaster.setSettings({ placement: 'top' });
        toaster.positive(`You found all mines, you spent ${seconds} seconds, congratulations.`, {
          hasCloseButton: true,
          duration: 5000,
        });
      }, 300);
    } else if (gameStatus === GameStatus.Failure) {
      setTimeout(() => {
        toaster.setSettings({ placement: 'top' });
        toaster.negative('You stepped on a mine, you failed!', {
          hasCloseButton: true,
          duration: 3000,
        })
      }, 300);
    }

    console.log("_game status useEffect called. gamestatus = ", gameStatusRef.current); 
    return () => {
      if(timerId!== null){
        clearInterval(timerId);
        SetTimerId(null);
      }  
    }
  }, [gameStatus]);

  useEffect(() => {
    SetGameStatus(GameStatus.Restart);
  }, [gameDifficulty]);

  useEffect(() => {
    _setGeometry();

    console.log("_setGeometry useEffect called." );
  }, [mineBoxes, gameStatus]);

  // update mine counts
  useEffect(() => {
    const currentMineBoxes = mineBoxesRef.current;
    let flagCounts: number =  MineBoxesApi.getStatusMineBoxCounts(currentMineBoxes, MineBoxStatus.Flag);
    let mineCounts: number =  MineBoxesApi.getIsMineCounts(currentMineBoxes);

    console.log("mineCounts = ", mineCounts, " flagCounts = ", flagCounts);
    setRemainsMine(mineCounts - flagCounts);
  }, [mineBoxes]);

  const _loadMap = () => {
    var map: MineMap = MineMapEditor.createMineMap(gameDifficulty);//createTestMap();
    setMineMap(map);
    setMineBoxes(MineBoxesApi.createMineBoxes(map, sideLength));
  }

  const _setGeometry = () => {
    if (!geoDecorator || !fireDecorator)
      return;

    geoDecorator.clearGeometry();
    fireDecorator.clearFireEmitter();

    if (!mineMap || !mineBoxes) return;

    const options = StrokeOptions.createForCurves();
    options.needParams = false;
    options.needNormals = true;

    //  Display mine box
    drawUnknowStatusBoxes(options);
    console.log("_setGeometry, drawUnknowStatusMines done.." );

    drawFlagStatusBoxes(options);
    console.log("_setGeometry, drawFlagStatusMines done.." );

    drawKnownStatusBoxes(options);
    console.log("_setGeometry, drawKnownStatusMines(num > 0) done.." );

    drawFailureMines(options);
    console.log("_setGeometry, drawFailureMines done.." );

    //drawBaseFaces(options);
  };

  const handleClick = useCallback((idOrPt: any, isLeftButton: boolean): void => {
    const currentMineBoxes = mineBoxesRef.current;
    console.log(".. Mine3dWidget handleClick: ", idOrPt, isLeftButton, gameStatusRef.current);
    if (!currentMineBoxes || currentMineBoxes.length === 0) 
      return;

    if(gameStatusRef.current !== GameStatus.Started){
      return;
    }

    let currBox: { box?: MineBox } = {};
    let nextMineBoxes: MineBox[] = [];
    let newUnknowCounts: number = 0;
    if(isLeftButton === true){
      nextMineBoxes = MineBoxesApi.leftButtonClick(currentMineBoxes, idOrPt, currBox);
      if(currBox !== undefined && currBox.box?.status === MineBoxStatus.Flag){
        return;
      }
      newUnknowCounts =  MineBoxesApi.getStatusMineBoxCounts(nextMineBoxes, MineBoxStatus.Unknown);
    }
    else{
      nextMineBoxes = MineBoxesApi.resetButtonClick(currentMineBoxes, idOrPt, currBox);
      let newFlagCounts: number =  MineBoxesApi.getStatusMineBoxCounts(nextMineBoxes, MineBoxStatus.Flag);
       let newMineCounts: number =  MineBoxesApi.getIsMineCounts(nextMineBoxes);
      
      if(newFlagCounts > newMineCounts){
        return;
      }
    }

    let status:GameStatus = checkGameStatus(nextMineBoxes, currBox.box!, isLeftButton);
    if(isLeftButton === true && status === GameStatus.Success && newUnknowCounts > 0){
      MineBoxesApi.flagAllUnknowMines(nextMineBoxes);
    }

    console.log("handleClick, status = ", status);
    SetGameStatus(status);
    setMineBoxes(nextMineBoxes);
  }, []);

  function checkGameStatus(boxes: MineBox[], currBox: MineBox, isLeftButton: boolean): GameStatus  {
    if(currBox !== undefined && currBox.isMine === true && isLeftButton === true)  {
      return GameStatus.Failure;
    }

    let curUnknowCounts: number =  MineBoxesApi.getStatusMineBoxCounts(boxes, MineBoxStatus.Unknown);
    let flagCounts: number =  MineBoxesApi.getStatusMineBoxCounts(boxes, MineBoxStatus.Flag);
    let mineCounts: number =  MineBoxesApi.getIsMineCounts(boxes);
    console.log("checkGameStatus, curUnknowCounts = ", curUnknowCounts, " flagCounts = ", flagCounts, " mineCounts = ", mineCounts);
    if(curUnknowCounts === mineCounts - flagCounts && isLeftButton === true){
      return GameStatus.Success;
    }

    return gameStatusRef.current; //  Not changed.
  }
  
  function drawUnknowStatusBoxes(options: StrokeOptions) : void  {
    if (!geoDecorator)
      return;

    for (const box of MineBoxesApi.getStatusMineBoxes(mineBoxes!, MineBoxStatus.Unknown)) {
      let unKnowBoxColor: ColorDef = ColorDef.create(ColorByName.lightGoldenrodYellow);
      if(gameStatusRef.current === GameStatus.Failure){
        unKnowBoxColor = ColorDef.fromTbgr(ColorDef.withTransparency(ColorDef.create(ColorByName.lightGoldenrodYellow).tbgr, 200));
      }

      // Optimize perfomance
      if(gameStatusRef.current === GameStatus.Failure || box.uiVisiable === true){
        _createOneGeometry(
          options, GeometryType.Cube, 
          box.pos, sideLength * 0.95, 
          undefined, 
          unKnowBoxColor, 
          true, true, true, box.id, "");
      }
    }
  }

  function drawFlagStatusBoxes(options: StrokeOptions)  {
    if (!geoDecorator)
      return;

    for (const box of MineBoxesApi.getStatusMineBoxes(mineBoxes!, MineBoxStatus.Flag)) {
      let flagBoxColor: ColorDef = ColorDef.create(ColorByName.orange);
      if(gameStatusRef.current === GameStatus.Failure){
        flagBoxColor = ColorDef.fromTbgr(ColorDef.withTransparency(ColorDef.create(ColorByName.orange).tbgr, 100));
      }

      _createOneGeometry(
        options, GeometryType.Cube, 
        box.pos, sideLength * 0.95, 
        flagBoxColor, 
        undefined, 
        true, true, false, box.id, "");
    }
  }

  function drawKnownStatusBoxes(options: StrokeOptions)  {
    if (!geoDecorator)
      return;

    for (const box of MineBoxesApi.getStatusMineBoxes(mineBoxes!, MineBoxStatus.Known)) {
      if(box.numberOfMinesSurrounded === 0 || box.isMine === true)
        continue;

      //  Draw a Cube
      _createOneGeometry(
        options, GeometryType.Cube, 
        box.pos, sideLength * 0.95, 
        ColorDef.fromTbgr(ColorDef.withTransparency(ColorDef.create(ColorByName.forestGreen).tbgr, 220)), 
        undefined, 
        false, false, false, box.id, "");

      //  Draw Text
      _createOneGeometry(
        options, GeometryType.Text, 
        box.pos, sideLength * 0.5, 
        ColorDef.fromTbgr(ColorDef.withTransparency(_getTextColor(box.numberOfMinesSurrounded).tbgr, 80)), 
        undefined, 
        false, false, false, box.id, `${box.numberOfMinesSurrounded}`);
    }
  }

  function _getTextColor(num: number): ColorDef {
    switch(num) {
      case 1: return ColorDef.from(38, 33, 255);    //  rgb(38, 33, 255)
      case 2: return ColorDef.from(36, 127, 0);     //  rgb(36, 127, 0)
      case 3: return ColorDef.from(239, 3, 10);     //  rgb(239, 3, 10)
      case 4: return ColorDef.from(13, 11, 128);    //  rgb(13, 11, 128)
      case 5: return ColorDef.from(122, 0, 0);      //  rgb(122, 0, 0)
      case 6: return ColorDef.from(229, 38, 165);   //  rgb(229, 38, 165)
      case 7: return ColorDef.from(26, 188, 182);   //  rgb(26, 188, 182)
      case 8: return ColorDef.from(206, 219, 22);   //  rgb(206, 219, 22)
      case 9: return ColorDef.from(231, 60, 17);    //  rgb(231, 60, 17)
      case 0:
      default: return ColorDef.black;
    }   
  }

  function drawFailureMines(options: StrokeOptions)  {
    if (!geoDecorator || gameStatusRef.current !== GameStatus.Failure)
      return;

    for (const box of MineBoxesApi.getIsMineBoxes(mineBoxes!)) {
      let mineColor: ColorDef = ColorDef.create(ColorByName.darkSlateGrey);
      if(box.status === MineBoxStatus.Known){
        mineColor = ColorDef.create(ColorByName.orangeRed);
      }

      _createOneGeometry(
        options, GeometryType.Mine, 
        box.pos, sideLength * 0.7, 
        undefined, mineColor, 
        true, true, true, box.id, "");

      if(box.status === MineBoxStatus.Known && fireDecorator !== undefined && activeViewport){
        //_createFireEmmiter(box.pos, sideLength, false, box.id);
        fireDecorator.addFireEmitter(activeViewport, box.pos, sideLength);
      }
    }
  }

  function _createOneGeometry(
    options: StrokeOptions, type: GeometryType, 
    pos: Point3d, sideLength: number, 
    color: ColorDef | undefined, fillColor: ColorDef | undefined, 
    isEdges: boolean, isPickable: boolean, isFill: boolean, id: string, text: string) : void{
    if (!geoDecorator)
      return;  
    
    const builder = PolyfaceBuilder.create(options);
    if(type === GeometryType.Cube){
      builder.addBox(Geometry3dApi.createCube(pos, sideLength)!);
    }
    else if(type === GeometryType.Mine){
      builder.addRuledSweep(Geometry3dApi.createMine(pos, sideLength)!);
    }
    
    const polyface = builder.claimPolyface(true);
    if(color !== undefined) 
      geoDecorator.setColor(color);

    geoDecorator.setFill(isFill);
    if(fillColor !== undefined && isFill === true)  
      geoDecorator.setFillColor(fillColor!);
    
    geoDecorator.setEdges(isEdges);
    geoDecorator.setNextId(id);
    geoDecorator.setPickable(isPickable);

    if(type === GeometryType.Text){ 
        geoDecorator.addText({
          text: text, origin: pos, height: sideLength, widthFactor: 1, font: 12,
          rotation: new YawPitchRollAngles,
          width: 0,
          toJSON: function (): TextStringProps {
            throw new Error("Function not implemented.");
          },
          transformInPlace: function (transform: Transform): boolean {
            throw new Error("Function not implemented.");
          }
        }); 
    }
    else{
      geoDecorator.addGeometry(polyface);
    }
  }

  function drawBaseFaces(options: StrokeOptions)  {

    let ptOriMetrix = Point3d.create((mineMap!.mapXNum) * sideLength * -0.5, (mineMap!.mapYNum) * sideLength * -0.5, (mineMap!.mapZNum) * sideLength * -0.5);

    //  Center Point
    let pt0: Point3d = Point3d.create(0, 0, 0).plus(ptOriMetrix);
    let ptx_ext: Point3d = Point3d.create(1 * sideLength, 0, 0);
    let pty_ext: Point3d = Point3d.create(0, 1 * sideLength, 0);
    let ptz_ext: Point3d = Point3d.create(0, 0, 1 * sideLength);

    //  X Max Point
    let pt1: Point3d = pt0.plus(new Point3d(mineMap!.mapXNum * sideLength, 0, 0)).plus(ptx_ext);
    //  Y Max Point
    let pt2: Point3d = pt0.plus(new Point3d(0, mineMap!.mapYNum * sideLength, 0)).plus(pty_ext);
    //  Z Max Point
    let pt3: Point3d = pt0.plus(new Point3d(0, 0, mineMap!.mapZNum * sideLength)).plus(ptz_ext);
    //  X-Y Max Point
    let pt4: Point3d = Point3d.create(pt1.x, pt2.y, pt1.z);
    //  X-Z  Max Point
    let pt5: Point3d = Point3d.create(pt1.x, pt1.y, pt3.z)
    //  Y-Z  Max Point
    let pt6: Point3d = Point3d.create(pt3.x, pt2.y, pt3.z)

    //  X-Y base faces
    _drawBaseFaces(pt0, pt1, pt4, pt2); 
    //  X-Z base faces
    _drawBaseFaces(pt0, pt1, pt5, pt3); 
    //  Y-Z base faces
    _drawBaseFaces(pt0, pt2, pt6, pt3); 

  }

  function _drawBaseFaces(pt0: Point3d, pt1: Point3d, pt2: Point3d, pt3: Point3d)  {
    if (!geoDecorator)
      return;

    const points: Point3d[] = [pt0, pt1, pt2, pt3];
    const linestring = LineString3d.create(points);
    const loop = Loop.create(linestring.clone());
    geoDecorator.setFill(false);
    geoDecorator.setEdges(true);
    geoDecorator.setColor(ColorDef.fromTbgr(ColorDef.withTransparency(ColorDef.create(ColorByName.lightSteelBlue).tbgr, 50)));
    geoDecorator.setPickable(false);
    geoDecorator.addGeometry(loop);
  }

  const buttonIcon  = useCallback(() => {
    switch (gameStatusRef.current) {
      case GameStatus.Failure:
        return<SvgFaceSad/>;
      case GameStatus.Success:
        return<SvgFaceCool/>;
      default:
        return<SvgFaceHappy/>;
    }
   }, []);

  const buttonLabel  = useCallback(() => {
    return gameStatusRef.current === GameStatus.NotStarted? 'Start' : 'Restart';
  }, []);

  const onMenuItemClick = (index: number, close: any) => () => {
    setGameDifficulty(index as GameDifficulty);
    close();
  };

  const buttonMenuItems = (close: any):any[] => {
    let items: any[] = [];
    let index = 0;
    for (let item in GameDifficulty) {
      if (isNaN(Number(item))) {
          items.push(<MenuItem key={index} onClick={onMenuItemClick(index, close)}>{item}</MenuItem>);
          index++;
      }
    }
    return items;
  }
    
  return (
    <div className="sample-options">
      <div className="container">
        <div className="left-controls">
          <Tooltip content='Remaining mines'>
            <Badge backgroundColor='positive'>{`${remainsMine}`}</Badge>
          </Tooltip>
          <IconButton onClick={() => {SetGameStatus(GameStatus.Restart);}} label={buttonLabel()} size='small'>
            {buttonIcon()}
          </IconButton>
          <Tooltip content='Elapsed time'>
            <Badge backgroundColor='informational'>{`${seconds}`}</Badge>
          </Tooltip>
          <Divider orientation='vertical' />
        </div>
        <div className="right-controls">
          <Divider orientation='vertical' />
          <Tooltip content='Game difficulty'>
            <SplitButton onClick={() => {}} menuItems={buttonMenuItems} styleType='default'>{GameDifficulty[gameDifficulty]}</SplitButton>
          </Tooltip>
          <IconButton onClick={() => {setShowRecord(true);}} label='High Records' size='small'>
            <SvgTrophy/>
          </IconButton>
          <IconButton onClick={() => {setShowHelp(true);}} label='Help' size='small'>
            <SvgInfo/>
          </IconButton>          
        </div>
        {showRecord && (<RecordWindow show={showRecord} difficulty={GameDifficulty[gameDifficulty]} setShow={setShowRecord}/>)}
        {showHelp && (<HelpWindow show={showHelp} setShow={setShowHelp}/>)}
      </div>
    </div>
  );
};

export class Mine3dWidgetProvider implements UiItemsProvider {
  public readonly id: string = "3dMineWidgetProvider";

  public provideWidgets(_stageId: string, _stageUsage: string, location: StagePanelLocation, _section?: StagePanelSection): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];
    if (location === StagePanelLocation.Top) {
      widgets.push(
        {
          id: "Mine3dWidget",
          label: "Mine3d Widget",
          defaultState: WidgetState.Open,
          content: <Mine3dWidget />,
        }
      );
    }
    return widgets;
  }
}