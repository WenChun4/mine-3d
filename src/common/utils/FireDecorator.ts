/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { dispose } from "@itwin/core-bentley";
import { RenderTexture } from "@itwin/core-common";
import { DecorateContext, Decorator, GraphicBranch, GraphicType, HitDetail, IModelApp, ParticleCollectionBuilder, ParticleProps, RenderGraphic, ScreenViewport, Viewport } from "@itwin/core-frontend";
import { Point3d, Range1d, Range2d, Range3d, Transform, Vector3d, XAndY } from "@itwin/core-geometry";
import FireDecorationApi from "./FireDecorationApi";
import flameImage from "../imgs/particle-gradient-flame.png";
import smokeImage from "../imgs/particle-gradient-smoke.png";

/** Generate integer in [min, max]. */
function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Generate random floating-point number in [min, max). */
function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

interface FireParticle extends ParticleProps {
  /** Make x, y, and z from ParticleProps writable. */
  x: number;
  y: number;
  z: number;

  /** Current velocity, in pixels per second. */
  velocity: Vector3d;
  /** Denotes the type of particle.
   * Fire: the flames of the effect.
   * Smoke: grey and puffy emitted at the ends of the flames (fire).
   * Center: these particles are emitted at the center of the effect range. A yellowing effect is created by with a concentration of particles and this type helps encourage that.
   */
  type: "Smoke" | "Fire" | "Center";
}

/** This decorator functions to highlight a given emitter by outlining the source range. */

export class EmitterHighlighter implements Decorator {
  constructor(public emitter: FireDecorator) { }
  public decorate(context: DecorateContext) {
    /*
    const minimum = this.emitter.params.smokeSizeRange.low;
    const range = Range3d.createXYZXYZ(
      Math.min(this.emitter.params.effectRange.low.x, -minimum),
      Math.min(this.emitter.params.effectRange.low.y, -minimum),
      0,
      Math.max(this.emitter.params.effectRange.high.x, minimum),
      Math.max(this.emitter.params.effectRange.high.y, minimum),
      this.emitter.params.height
    );
    const transform = Transform.createTranslation(this.emitter.source);
    const builder = context.createSceneGraphicBuilder();
    builder.setSymbology(context.viewport.getContrastToBackgroundColor(), ColorDef.black, 2);
    builder.addRangeBox(transform.multiplyRange(range));
    context.addDecoration(GraphicType.WorldOverlay, builder.finish());
    */
  }
}


/** Parameters describing a Fire Emitter Decorator. */
export interface FireParams {
  /** This scales the number of particles from 0 at a value of 0 to 7000 at a value of 1, at an exponential rate. */
  particleNumScale: number;
  /** Range from which to randomly select each fire particle's size, in pixels. */
  sizeRange: Range1d;
  /** Range from which to randomly select each particle's transparency. */
  transparencyRange: Range1d;
  /** Range from which to randomly select each particle's initial velocity, in meters per second. */
  velocityRange: Range3d;
  /** Range from which to randomly select an acceleration to apply to each particle's velocity each frame. */
  accelerationRange: Range3d;
  /** Wind velocity. */
  windVelocity: number;
  /** Wind direction normalized. */
  windDirection: Vector3d;
  /** The height of the flames in meters. */
  height: number;
  /** The range which fire particles can be emitted. */
  effectRange: Range2d;
  /** When true, the particles will be rendered as a WorldOverlay, on top of the scene. */
  isOverlay: boolean;
  /** When enabled, the smoke will be emitted at the end of the flames (will extend pass the specified height). */
  enableSmoke: boolean;
  /** Range from which to randomly select each smoke particle's size, in pixels. */
  smokeSizeRange: Range1d;
  /** Information about this emitter that will be printed with the tool tip. */
  toolTipInfo?: string;
}

interface CustomFireEmitter {
  source: Point3d;
  pickableId: string;
  sideLength: number;
  particles: FireParticle[];
  lastUpdateTime: number;
}

/** This decorator functions as a particle emitter at the given a XYZ source and the particles are stylized as a fire burning.
 * Note: Assumes up is Z.
 */
export class FireDecorator implements Decorator {
  private static readonly _rateOfDegeneration = 0.000001;
  private static readonly _rateOfGrowth = 0.8;
  private static readonly _maximumParticles = 15000;

  private static _fireTexture?: RenderTexture;
  private static _smokeTexture?: RenderTexture;
  private static _removeOnDispose?: () => void;
  private static _removeOnClose?: () => void;

  //public readonly source: Point3d;
  //private readonly _pickableId: string;
  private _lastUpdateTime: number;
  private _params: FireParams;

  private fireEmitters: CustomFireEmitter[] = [];

  /** If the textures are not created yet, will attempt to create them.  Returns true if successful. */
  private static async tryTextures(): Promise<boolean> {
    if (!FireDecorator._fireTexture)
      FireDecorator._fireTexture = await FireDecorationApi.allocateTextureFromUrl(flameImage);
    if (!FireDecorator._smokeTexture)
      FireDecorator._smokeTexture = await FireDecorationApi.allocateTextureFromUrl(smokeImage);
    return (FireDecorator._fireTexture !== undefined && FireDecorator._smokeTexture !== undefined);
  }

  /** Only dispose of resources that are not used by any other decorators. */
  private static _tryDisposeTextures() {

    if (FireDecorationApi.getAllEmitters().length === 0) {
      FireDecorator._fireTexture = dispose(FireDecorator._fireTexture);
      FireDecorator._smokeTexture = dispose(FireDecorator._smokeTexture);
      // Remove listeners
      const tryDisposeListen = (func?: () => void) => {
        if (func !== undefined) func();
        func = undefined;
      };
      tryDisposeListen(FireDecorator._removeOnDispose);
      tryDisposeListen(FireDecorator._removeOnClose);
    }
  }

  /** Creates a new fire particle decorator at the given world position. */
  /*
  public static async create(viewport: Viewport, source: Point3d, params: FireParams): Promise<FireDecorator | undefined> {
    if (!(await FireDecorator.tryTextures()))
      return undefined;

    // A transient id is needed for interacting with the mouse (tool tips).
    const id = FireDecorationApi.getNextTransientId(viewport.iModel);
    const fireDecorator = new this(id, source, params);

    if (FireDecorationApi.getAllEmitters().length === 0) {
      // Due to the constructions of the showcase, we know when the viewport will be closed.  Under different circumstances, the methods below are example events to ensure the timely dispose of textures owned by the decorator.
      // When the iModel is closed, dispose of any decorations.
      FireDecorator._removeOnClose = viewport.iModel.onClose.addOnce(() => FireDecorationApi.disposeAllEmitters());
      // When the viewport is destroyed, dispose of any decorations. too.
      FireDecorator._removeOnDispose = viewport.onDisposed.addListener(() => FireDecorationApi.disposeAllEmitters());
    }

    return fireDecorator;
  }
  */

  public clearFireEmitter() {
    this.fireEmitters = [];
    IModelApp.viewManager.invalidateDecorationsAllViews();
  }

  /** Drop decorator and attempt to dispose of resources. */
  public dispose() {
    console.log("FireDecorator dispose...");
    FireDecorator._tryDisposeTextures();
  }

  /** Calculate the number of particles based on the params' particleNumScale.  Is calculated along a exponential curve. */
  private calculateNumParticle(): number {
    // y(normalized change of survival) = a * b ^ x(distance) + c(-a)
    const maximumMass = FireDecorator._maximumParticles;
    const a = FireDecorator._rateOfGrowth;
    const b = (1 + a) / a;
    const exponentialDensityScaling = (a * Math.pow(b, this._params.particleNumScale)) - a;

    return Math.round(exponentialDensityScaling * maximumMass);
  }

  public constructor(params: FireParams, viewport: ScreenViewport) {
    this._params = { ...params };
    this._lastUpdateTime = Date.now();

    FireDecorator.tryTextures().catch(err => {
      console.log(err);
      return undefined;
    });

    if (FireDecorationApi.getAllEmitters().length === 0)
      viewport.onRender.addListener(() => viewport.invalidateDecorations());
      // Tell the viewport to re-render the decorations every frame so that the fire particles animate smoothly.
      //FireDecorationApi._dropListeners.push(viewport.onRender.addListener(() => viewport.invalidateDecorations()));


    if (FireDecorationApi.getAllEmitters().length === 0) {
      // Due to the constructions of the showcase, we know when the viewport will be closed.  Under different circumstances, the methods below are example events to ensure the timely dispose of textures owned by the decorator.
      // When the iModel is closed, dispose of any decorations.
      FireDecorator._removeOnClose = viewport.iModel.onClose.addOnce(() => FireDecorationApi.disposeAllEmitters());
      // When the viewport is destroyed, dispose of any decorations. too.
      FireDecorator._removeOnDispose = viewport.onDisposed.addListener(() => FireDecorationApi.disposeAllEmitters());
    }
  }

  public addFireEmitter(viewport: ScreenViewport, source: Point3d, sideLength: number){   

    const id = FireDecorationApi.getNextTransientId(viewport.iModel);
    const fireParticles :FireParticle[] = [];
    for (let i = 0; i < this.calculateNumParticle(); i++)
      fireParticles.push(this.emitFire(true, sideLength));

    const fire: CustomFireEmitter = ({
      source: source,
      pickableId: id,
      sideLength: sideLength,
      particles: fireParticles,
      lastUpdateTime: Date.now()
    });
    this.fireEmitters.push(fire);
  }


  /** Get the current parameters for the decorator. */
  public get params(): FireParams { return this._params; }

  /** Change some of the parameters affecting this decorator. */
  public configure(params: Partial<FireParams>): void {
    for (const key of Object.keys(params)) {
      const val = (params as any)[key];
      if (undefined !== val)
        (this._params as any)[key] = val;
    }
  }

  /** Returns HTML describing the particular fire sample. */
  public async getDecorationToolTip(_hit: HitDetail): Promise<HTMLElement | string> {
    /* Example tool tip format:
     * "Name"
     * Particle Count: #####
     * Temperature: ~####
     */
    const toolTip = document.createElement("div");
    const header = document.createElement("b");
    header.textContent = this.params.toolTipInfo ?? "Fire";
    const info = document.createElement("label");
    info.textContent = `Particle Count: ${this.calculateNumParticle()}`;
    const temperature = document.createElement("label");
    let tempText = -273.15;
    // Temperatures are estimated based on the base parameters type.
    if (this.params.toolTipInfo?.includes("Candle"))
      tempText = 1100;
    if (this.params.toolTipInfo?.includes("Campfire"))
      tempText = 800;
    if (this.params.toolTipInfo?.includes("Inferno"))
      tempText = 2000;
    temperature.textContent = `Temperature: ~${tempText} C`;
    toolTip.appendChild(header);
    toolTip.appendChild(document.createElement("br"));
    toolTip.appendChild(info);
    toolTip.appendChild(document.createElement("br"));
    toolTip.appendChild(temperature);
    return toolTip;
  }

  /** Returns true if the id matches the pickable id of this decorator. */
  public testDecorationHit?(id: string): boolean {
    //const rtn = id === this._pickableId;
    //return rtn;
    
    //const found: CustomFireEmitter | undefined = this.fireEmitters.find(t => t.pickableId === id);
    //return found !== undefined;
    return false;
  }

  /** Called by the render loop and adds the fire particles graphics to the context. */
  public decorate(context: DecorateContext): void {
    if (!FireDecorator._fireTexture || !FireDecorator._smokeTexture || this.fireEmitters.length === 0)
      return;

    //console.log("FireDecorator decorate started...");
    // Update the particles.
    const now = Date.now();
    const deltaMillis = now - this._lastUpdateTime;
    this._lastUpdateTime = now;
    this.updateParticles(deltaMillis / 1000);

    const overrides = { ...context.viewFlags };
    overrides.visibleEdges = true;
    overrides.lighting = true;
    let branch = new GraphicBranch(false);

    branch.viewFlagOverrides = overrides;

    let fireGraphic: RenderGraphic[] | undefined = this.createFireGraphics(context);
    if (fireGraphic && fireGraphic.length > 0){
      fireGraphic.forEach((fire) => {
        branch.add(fire);
      });
     }

    let smokeGraphic: RenderGraphic[] | undefined = this.createSmokeGraphics(context);
    if (smokeGraphic && smokeGraphic.length > 0){
      smokeGraphic.forEach((smoke) => {
        branch.add(smoke);
      });
    }

    const type = this._params.isOverlay ? GraphicType.WorldOverlay : GraphicType.WorldDecoration;
    let renderGraphicBranch = context.createBranch(branch, Transform.identity);
    context.addDecoration(type, renderGraphicBranch);
    //console.log("FireDecorator decorate finished...");
  }

  private createFireGraphics(context: DecorateContext): RenderGraphic[] | undefined {
    // Specifying an Id for the graphics tells the display system that all of the geometry belongs to the same entity, so that it knows to make sure the edges draw on top of the surfaces.
    const graphics: RenderGraphic[] = [];

    if (!FireDecorator._fireTexture)
      return graphics;

    this.fireEmitters.forEach((fireEmitter) => {
      const fireBuilder = ParticleCollectionBuilder.create({
        viewport: context.viewport,
        texture: FireDecorator._fireTexture!,
        origin: fireEmitter.source,
        size: fireEmitter.sideLength / 2,//(this._params.sizeRange.high - this._params.sizeRange.low) / 2,
        pickableId: fireEmitter.pickableId,
      });

      // Process Particles
      fireEmitter.particles.filter(t => t.type !== "Smoke").forEach((particle) => {
        fireBuilder.addParticle(particle);
      });

      const graphic: RenderGraphic | undefined = fireBuilder.finish();
      if(graphic)
        graphics.push(graphic);
    });

    return graphics;
  }

  private createSmokeGraphics(context: DecorateContext): RenderGraphic[] | undefined {
    // Specifying an Id for the graphics tells the display system that all of the geometry belongs to the same entity, so that it knows to make sure the edges draw on top of the surfaces.
    const graphics: RenderGraphic[] = [];
    if (!FireDecorator._smokeTexture)
      return graphics;

    this.fireEmitters.forEach((fireEmitter) => {
      const smokeBuilder = ParticleCollectionBuilder.create({
        viewport: context.viewport,
        texture: FireDecorator._smokeTexture!,
        origin: fireEmitter.source,
        size: fireEmitter.sideLength / 2, //(this._params.sizeRange.high - this._params.sizeRange.low) / 2,
        pickableId: fireEmitter.pickableId,
      });

      // Process Particles
      fireEmitter.particles.filter(t => t.type === "Smoke").forEach((particle) => {
        smokeBuilder.addParticle(particle);
      });

      const graphic = smokeBuilder.finish();
      if(graphic)
        graphics.push(graphic);
    });

    return graphics;
  }

  /** Emit a new fire particle with randomized properties. */
  private emitFire(randomizeHeight: boolean, overrideRange: number): FireParticle {
    // weight for the middle 20% of effectRange
    let xy: XAndY = {
      x: randomFloat(this._params.effectRange.low.x, this._params.effectRange.high.x),
      y: randomFloat(this._params.effectRange.low.y, this._params.effectRange.high.y),
    };

    if(overrideRange > 0){
      let xy = {
        x: randomFloat(-overrideRange, overrideRange),
        y: randomFloat(-overrideRange, overrideRange),
      };
    }

    const isCenterFlame = Math.random() > 0.80;
    if (isCenterFlame) {
      xy = {
        x: xy.x * 0.25,
        y: xy.y * 0.25,
      };
    }
    return {
      type: isCenterFlame ? "Center" : "Fire",
      ...xy,
      z: randomizeHeight ? randomFloat(0, this._params.height) : 0,
      size: randomFloat(this._params.sizeRange.low, this._params.sizeRange.high),
      transparency: randomInteger(this._params.transparencyRange.low, this._params.transparencyRange.high),
      velocity: new Vector3d(
        randomFloat(this._params.velocityRange.low.x, this._params.velocityRange.high.x),
        randomFloat(this._params.velocityRange.low.y, this._params.velocityRange.high.y),
        randomFloat(this._params.velocityRange.low.z, this._params.velocityRange.high.z)
      ),
    };
  }

  /** Emit a new smoke particle base on the fire particle it came from with randomized size. */
  private emitSmoke(parent: FireParticle): FireParticle {
    return {
      ...parent,
      type: "Smoke",
      size: randomFloat(this._params.smokeSizeRange.low, this._params.smokeSizeRange.high),
    };
  }

  private updateParticles(elapsedSeconds: number): void {
    this.fireEmitters.forEach((emitter) => {
      this._updateParticle(elapsedSeconds, emitter);
    })
  }

  // Determine if someone changed the desired number of particles.
  /** Update the positions and velocities of all the particles based on the amount of time that has passed since the last update. */
  private _updateParticle(elapsedSeconds: number, emitter: CustomFireEmitter): void {
    // Determine if someone changed the desired number of particles.
    const numParticles = this.calculateNumParticle();
    const particleDiscrepancy = numParticles - emitter.particles.length;
    if (particleDiscrepancy > 0) {
      // Birth new particles up to the new maximum.
      for (let i = 0; i < particleDiscrepancy; i++)
        emitter.particles.push(this.emitFire(true, emitter.sideLength));
    } else {
      // Destroy extra particles.
      emitter.particles.length = numParticles;
    }

    const acceleration = new Vector3d();
    const velocity = new Vector3d();
    for (let i = 0; i < emitter.particles.length; i++) {
      // Apply some acceleration to produce random drift.
      const particle = emitter.particles[i];
      acceleration.set(
        randomFloat(this._params.accelerationRange.low.x, this._params.accelerationRange.high.x),
        randomFloat(this._params.accelerationRange.low.y, this._params.accelerationRange.high.y),
        randomFloat(this._params.accelerationRange.low.z, this._params.accelerationRange.high.z)
      );

      acceleration.scale(elapsedSeconds, acceleration);
      particle.velocity.plus(acceleration, particle.velocity);

      // Apply velocity
      particle.velocity.clone(velocity);
      velocity.scale(elapsedSeconds, velocity);
      particle.x += velocity.x;
      particle.y += velocity.y;
      particle.z += velocity.z;

      // Apply wind
      particle.x += this._params.windVelocity * elapsedSeconds * this._params.windDirection.x;
      particle.y += this._params.windVelocity * elapsedSeconds * this._params.windDirection.y;
      particle.z += this._params.windVelocity * elapsedSeconds * this._params.windDirection.z;

      // Particles that travel beyond the height, are replace with a new particle.
      const origin = Point3d.createZero();
      let distance = (origin.distance(particle) * 0.75) + (particle.z * 0.25);
      if (particle.type === "Smoke" && particle.transparency) {
        distance /= 2;
        const linear = Math.round(((distance / emitter.sideLength) * 255));
        particle.transparency = Math.max(particle.transparency, linear);
      }
      // Re-emits particles that have expired.  The chance of survival is exponentially inverse to their distance from the source.
      // y(normalized change of survival) = a * b ^ x(distance) + c(-a)
      const a = FireDecorator._rateOfDegeneration;
      const b = Math.pow((1 + a) / a, 1 / emitter.sideLength);
      const chanceToSurvive = (a * Math.pow(b, distance)) - a;
      const reset = Math.random();
      if (reset <= chanceToSurvive) {
        if (this._params.enableSmoke && particle.type !== "Smoke")
          emitter.particles[i] = this.emitSmoke(particle);
        else
        emitter.particles[i] = this.emitFire(false, emitter.sideLength);
      }
    }
  }
}
