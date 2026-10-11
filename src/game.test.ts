import { createCanvas } from "@napi-rs/canvas";
import { ConstantClock, createEngine } from "@clockwyrks/simple-2d";
import { describe, expect, it } from "vitest";
import { STAGE_H, STAGE_W } from "./constants";
import { BACKGROUND, game } from "./game";

function testEngine() {
  const events = new EventTarget();
  const canvas = createCanvas(STAGE_W, STAGE_H);
  return createEngine({
    canvas: canvas as unknown as HTMLCanvasElement,
    width: STAGE_W,
    height: STAGE_H,
    game,
    background: BACKGROUND,
    clock: new ConstantClock(1000 / 60),
    surface: {
      cssWidth: () => STAGE_W,
      cssHeight: () => STAGE_H,
      dpr: () => 1,
      events: () => events,
    },
  });
}

describe("Refract simulation", () => {
  it("initializes the title screen and accumulates simulated time", async () => {
    const engine = testEngine();
    await engine.initialize();

    expect(engine.debug.snapshot(engine.state)).toMatchObject({
      version: 2,
      screen: "title",
      mode: "campaign",
      menuIndex: 0,
      muted: false,
    });

    await engine.advance(3);
    expect(engine.debug.snapshot(engine.state).simTime).toBeCloseTo(0.05);
  });

  it("draws a legal beam through a crystal and solves the board", async () => {
    const engine = testEngine();
    await engine.initialize();
    engine.apply((state) => engine.debug.loadBoard(state, ["T1T"]));

    engine.apply((state) => engine.debug.pointerDown(state, 544, 392));
    engine.apply((state) => engine.debug.pointerMove(state, 640, 392));
    engine.apply((state) => engine.debug.pointerMove(state, 736, 392));

    const shot = engine.debug.snapshot(engine.state);
    expect(shot.screen).toBe("solved");
    expect(shot.solved).toBe(true);
    expect(
      shot.board.nodes.find((node) => node.kind === "crystal"),
    ).toMatchObject({ spent: 1, charges: 1 });
    expect(shot.beams.triangle?.cells).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
    ]);
  });

  it("refuses a segment that would skip across an empty cell", async () => {
    const engine = testEngine();
    await engine.initialize();
    engine.apply((state) => engine.debug.loadBoard(state, ["T.T"]));

    engine.apply((state) => engine.debug.pointerDown(state, 544, 392));
    engine.apply((state) => engine.debug.pointerMove(state, 736, 392));

    const shot = engine.debug.snapshot(engine.state);
    expect(shot.screen).toBe("playing");
    expect(shot.beams.triangle?.cells).toEqual([{ col: 0, row: 0 }]);
    expect(shot.solved).toBe(false);
  });

  it("clears beams from any screen through the debug surface", async () => {
    const engine = testEngine();
    await engine.initialize();
    engine.apply((state) => engine.debug.loadBoard(state, ["TT"]));
    engine.apply((state) => engine.debug.pointerDown(state, 592, 392));
    engine.apply((state) => engine.debug.pointerMove(state, 688, 392));
    engine.apply((state) => engine.debug.clear(state));

    const shot = engine.debug.snapshot(engine.state);
    expect(shot.beams.triangle?.cells).toEqual([]);
    expect(shot.tracing).toBeNull();
  });
});
