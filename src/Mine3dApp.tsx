/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import React, { useContext, useEffect } from "react";
import { UiFramework } from "@itwin/appui-react";
import { Cartographic, ColorDef, RenderMode } from "@itwin/core-common";
import { Range3d, Vector3d } from "@itwin/core-geometry";
import { BlankConnectionViewState, Viewer, ViewerNavigationToolsProvider } from "@itwin/web-viewer-react";
import { Mine3dWidgetProvider } from "./Mine3dWidget";
import "./Mine3d.scss";
import { authContext } from "./common/AuthorizationClient";

console.log("before uiProviders...");
const uiProviders = [
  new ViewerNavigationToolsProvider( {
    horizontal: {
        rotateView: true,
        panView: true,
        fitView: true,
        windowArea: false,
        viewUndoRedo: false,
    },
    vertical: {
        walk: false,
        toggleCamera: false,
        setupWalkCamera: false,
    }}),
  new Mine3dWidgetProvider()];

const viewState: BlankConnectionViewState = {
  displayStyle: { backgroundColor: ColorDef.white },
  viewFlags: { grid: false, renderMode: RenderMode.SmoothShade },
  setAllow3dManipulations: true,
  lookAt: {
    eyePoint: { x: 100, y: 100, z: 100 },
    targetPoint: { x: 0, y: 0, z: 0 },
    upVector: new Vector3d(0, 0, 1),
  },
};

const Mine3dApp = () => {
  const auth = useContext(authContext);

  /** Sign-in */
  useEffect(() => {
    void auth.signIn();
  }, []);

  /** The sample's render method */
  return <Viewer
    iTwinId="none"
    authClient={auth}
    location={Cartographic.createZero()}
    extents={new Range3d(-50, -50, -50, 50, 50, 50)}
    blankConnectionViewState={viewState}
    uiProviders={uiProviders}
    defaultUiConfig={
      {
        hideNavigationAid: true,
        hideStatusBar: true,
        hideToolSettings: true,
      }
    }
    enablePerformanceMonitors={false}
    theme={process.env.THEME ?? "dark"}
  />;
};

// Define panel size
UiFramework.frontstages.onFrontstageReadyEvent.addListener((event) => {
  const { topPanel } = event.frontstageDef;
  topPanel && (topPanel.size = 80);
});

export default Mine3dApp;