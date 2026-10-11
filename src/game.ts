import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  BACK_LABEL,
  BINDINGS,
  BOARD_CX,
  BOARD_CY,
  CAMPAIGN_LENGTH,
  CELL_PITCH,
  CHANNELS,
  CLEAR_LABEL,
  CUES,
  GRID_MAX_COLS,
  GRID_MAX_ROWS,
  HUD_SOLVED_LABEL,
  HUD_TIER_LABEL,
  MAX_TIER,
  NODE_HIT_R,
  NODE_R,
  REFRACT_DEBUG_VERSION,
  SET_LABELS,
  SOLVED_ITEMS,
  SOLVED_TITLE_TEXT,
  STAGE_CX,
  STAGE_H,
  STAGE_W,
  TAGLINE_TEXT,
  TARGET_MIN_H,
  TARGET_MIN_W,
  TIER_ADVANCE,
  TITLE_ITEMS,
  TITLE_TEXT,
} from "./constants";

export type Screen =
  "title" | "howto" | "select" | "playing" | "solved" | "complete";

export type Mode = "campaign" | "cascade";

export type Channel = "triangle" | "square" | "diamond";

export type NodeKind = "emitter" | "lens" | "crystal";

export interface Cell {
  readonly col: number;
  readonly row: number;
}

export interface NodeState {
  readonly col: number;
  readonly row: number;
  readonly kind: NodeKind;
  readonly channel: Channel | null;
  readonly charges: number | null;
}

export interface BoardState {
  readonly cols: number;
  readonly rows: number;
  readonly nodes: readonly NodeState[];
}

export interface BeamState {
  readonly channel: Channel;
  readonly cells: readonly Cell[];
}

export interface TraceState {
  readonly channel: Channel;
}

export type PointerDevice = "mouse" | "pen" | "touch";

export interface PointerState {
  readonly x: number;
  readonly y: number;
  readonly down: boolean;
  readonly device: PointerDevice;
}

export interface RefractState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;

  readonly board: BoardState;
  readonly beams: readonly BeamState[];
  readonly tracing: TraceState | null;

  readonly boardIndex: number;
  readonly solvedBoards: readonly number[];
  readonly unlockedCount: number;
  readonly selectIndex: number;

  readonly solvedCount: number;
  readonly tier: number;

  readonly pointer: PointerState;
  readonly armedTarget: string | null;
  readonly simTime: number;
  readonly muted: boolean;
}

export interface TargetSnapshot {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface NodeSnapshot extends NodeState {
  readonly x: number;
  readonly y: number;
  readonly spent: number | null;
}

export interface BeamSnapshot {
  readonly cells: readonly Cell[];
  readonly complete: boolean;
}

export interface RefractSnapshot {
  readonly version: number;
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly boardIndex: number;
  readonly solvedBoards: readonly number[];
  readonly unlockedCount: number;
  readonly selectIndex: number;
  readonly solvedCount: number;
  readonly tier: number;
  readonly board: {
    readonly cols: number;
    readonly rows: number;
    readonly nodes: readonly NodeSnapshot[];
  };
  readonly beams: Partial<Record<Channel, BeamSnapshot>>;
  readonly solved: boolean;
  readonly tracing: { readonly channel: Channel; readonly live: Cell } | null;
  readonly pointer: PointerState;
  readonly targets: readonly TargetSnapshot[];
  readonly muted: boolean;
  readonly simTime: number;
}

export interface RefractDebugApi {
  readonly version: number;
  reset(state: DeepReadonly<RefractState>): RefractState;
  snapshot(state: DeepReadonly<RefractState>): RefractSnapshot;
  reconcile(state: DeepReadonly<RefractState>): RefractState;
  setMode(state: DeepReadonly<RefractState>, mode: Mode): RefractState;
  setScreen(state: DeepReadonly<RefractState>, screen: Screen): RefractState;
  setMenuIndex(state: DeepReadonly<RefractState>, index: number): RefractState;
  setSolvedCount(
    state: DeepReadonly<RefractState>,
    count: number,
  ): RefractState;
  setTier(state: DeepReadonly<RefractState>, tier: number): RefractState;
  generateBoard(state: DeepReadonly<RefractState>, tier: number): RefractState;
  loadBoard(
    state: DeepReadonly<RefractState>,
    board: readonly string[],
  ): RefractState;
  pointerDown(
    state: DeepReadonly<RefractState>,
    x: number,
    y: number,
    device?: PointerDevice,
  ): RefractState;
  pointerMove(
    state: DeepReadonly<RefractState>,
    x: number,
    y: number,
    device?: PointerDevice,
  ): RefractState;
  pointerUp(
    state: DeepReadonly<RefractState>,
    device?: PointerDevice,
  ): RefractState;
  clear(state: DeepReadonly<RefractState>): RefractState;
}

export const BACKGROUND = "#081018";

const EMPTY_BOARD: BoardState = { cols: 1, rows: 1, nodes: [] };
const HUES: Record<Channel, string> = {
  triangle: "#ffce5c",
  square: "#5ee1ff",
  diamond: "#ff6fae",
};
const MUTED_CUES = {
  [CUES.connect]: false,
  [CUES.retract]: false,
  [CUES.channelComplete]: false,
  [CUES.solved]: false,
  [CUES.clear]: false,
};

const CAMPAIGN_BOARDS: readonly (readonly string[])[] = [
  [".Tt", "ttT", ".tt"],
  [".tt", "TtT", "tt."],
  ["tTtt", "ttTt", "ttt."],
  ["Tt.t", "tTtt", ".ttt"],
  [".tTt", ".ttt", "ttTt", "tttt"],
  ["tttT", "ttt.", "t.tt", "ttTt"],
  ["STtt", "sstt", "ssTt", "Sss."],
  ["Sst..", "stTtt", "ssttt", "SsstT"],
  ["tSss", "2tss", "Ttss", "tTS."],
  ["Tt.T.", "ttt..", "t2sSs", "tSsss"],
  ["..t.s", "ttT2s", "ttS2S", "t.Tss"],
  ["Tttt.", "ttsSt", ".22t.", "ssST."],
  [".Ddd", "tTdD", "t22.", "tsSs", "T.S."],
  ["..tT.", "t2dD.", "T2t.s", "d2sss", "DSssS"],
  [".T.2t", "sDttt", "sS2Td", "ss22D", ".S.d."],
  ["..ttt", ".S2tt", "DsTsT", "d22d.", "SddD."],
  ["...ttd", "S2Ttdd", "t32Ddd", "Tss2d.", "sS.dD."],
  ["T.....", "ttDsss", "dd3222", ".dt3Ss", "DddTSs"],
  [".Dttt", ".dd3t", ".d2TT", "S2s2D", ".sSss"],
  [".S.tT.", "s2ttDd", "s2T2.d", "s22d3.", "ssSddD"],
  ["S2D..T", "d2ssts", ".D3S3s", ".dT32t", ".d2tt."],
  [".tt2d.", ".t2t2d", "t1DdSd", "2.S3dD", "TT2sd.", ".ssss."],
  ["s2SST..", "2232.t.", "stTsttt", "..t.t.t", "d22ttdD", "dD2dddd"],
  ["ssdd.d.", "2S.dd2d", "ssD..d.", "t2ttTdd", ".t323Dd", "ttT2sS."],
];

const CASCADE_TEMPLATES: Readonly<
  Record<number, readonly (readonly string[])[]>
> = {
  1: [CAMPAIGN_BOARDS[0], CAMPAIGN_BOARDS[1], CAMPAIGN_BOARDS[2]],
  2: [CAMPAIGN_BOARDS[6], CAMPAIGN_BOARDS[7], CAMPAIGN_BOARDS[8]],
  3: [CAMPAIGN_BOARDS[12], CAMPAIGN_BOARDS[13], CAMPAIGN_BOARDS[14]],
  4: [CAMPAIGN_BOARDS[15], CAMPAIGN_BOARDS[16], CAMPAIGN_BOARDS[19]],
  5: [CAMPAIGN_BOARDS[21], CAMPAIGN_BOARDS[23], CAMPAIGN_BOARDS[20]],
};

type CueFlags = Record<(typeof CUES)[keyof typeof CUES], boolean>;

function initialState(muted = false): RefractState {
  return {
    screen: "title",
    mode: "campaign",
    menuIndex: 0,
    board: EMPTY_BOARD,
    beams: [],
    tracing: null,
    boardIndex: 0,
    solvedBoards: [],
    unlockedCount: 1,
    selectIndex: 0,
    solvedCount: 0,
    tier: 1,
    pointer: { x: 0, y: 0, down: false, device: "mouse" },
    armedTarget: null,
    simTime: 0,
    muted,
  };
}

function cellX(col: number, cols: number): number {
  return BOARD_CX - ((cols - 1) * CELL_PITCH) / 2 + col * CELL_PITCH;
}

function cellY(row: number, rows: number): number {
  return BOARD_CY - ((rows - 1) * CELL_PITCH) / 2 + row * CELL_PITCH;
}

function cellKey(cell: Cell): string {
  return `${cell.col},${cell.row}`;
}

function sameCell(a: Cell, b: Cell): boolean {
  return a.col === b.col && a.row === b.row;
}

function segmentKey(a: Cell, b: Cell): string {
  const ak = cellKey(a);
  const bk = cellKey(b);
  return ak < bk ? `${ak}|${bk}` : `${bk}|${ak}`;
}

function diagonalMateKey(a: Cell, b: Cell): string | null {
  if (Math.abs(a.col - b.col) !== 1 || Math.abs(a.row - b.row) !== 1) {
    return null;
  }
  return segmentKey({ col: a.col, row: b.row }, { col: b.col, row: a.row });
}

function parseBoard(rows: readonly string[]): BoardState {
  if (rows.length < 1 || rows.length > GRID_MAX_ROWS) {
    throw new Error("Refract: board row count is outside the supported grid");
  }
  const cols = rows[0]?.length ?? 0;
  if (cols < 1 || cols > GRID_MAX_COLS) {
    throw new Error(
      "Refract: board column count is outside the supported grid",
    );
  }
  const nodes: NodeState[] = [];
  rows.forEach((line, row) => {
    if (line.length !== cols) {
      throw new Error("Refract: board rows must all have the same width");
    }
    [...line].forEach((char, col) => {
      if (char === ".") return;
      const channel = charChannel(char);
      if (channel) {
        nodes.push({
          col,
          row,
          kind: char === char.toUpperCase() ? "emitter" : "lens",
          channel,
          charges: null,
        });
        return;
      }
      if (["1", "2", "3"].includes(char)) {
        nodes.push({
          col,
          row,
          kind: "crystal",
          channel: null,
          charges: Number(char),
        });
        return;
      }
      throw new Error(`Refract: invalid board notation '${char}'`);
    });
  });
  const board: BoardState = { cols, rows: rows.length, nodes };
  validateBoard(board);
  return board;
}

function validateBoard(board: BoardState): void {
  for (const channel of channelsPresent(board)) {
    const emitters = board.nodes.filter(
      (node) => node.kind === "emitter" && node.channel === channel,
    );
    if (emitters.length !== 2) {
      throw new Error(`Refract: channel '${channel}' must have two emitters`);
    }
  }
}

function charChannel(char: string): Channel | null {
  const lower = char.toLowerCase();
  if (lower === "t") return "triangle";
  if (lower === "s") return "square";
  if (lower === "d") return "diamond";
  return null;
}

function channelsPresent(board: DeepReadonly<BoardState>): Channel[] {
  return CHANNELS.filter((channel) =>
    board.nodes.some((node) => node.channel === channel),
  ) as Channel[];
}

function emptyBeams(board: DeepReadonly<BoardState>): BeamState[] {
  return channelsPresent(board).map((channel) => ({ channel, cells: [] }));
}

function poseBoard(
  state: DeepReadonly<RefractState>,
  board: BoardState,
): RefractState {
  return {
    ...copyState(state),
    screen: "playing",
    menuIndex: 0,
    board,
    beams: emptyBeams(board),
    tracing: null,
    armedTarget: null,
  };
}

function copyState(state: DeepReadonly<RefractState>): RefractState {
  return {
    ...state,
    board: {
      cols: state.board.cols,
      rows: state.board.rows,
      nodes: state.board.nodes.map((node) => ({ ...node })),
    },
    beams: state.beams.map((beam) => ({
      channel: beam.channel,
      cells: beam.cells.map((cell) => ({ ...cell })),
    })),
    solvedBoards: [...state.solvedBoards],
    pointer: { ...state.pointer },
    tracing: state.tracing ? { ...state.tracing } : null,
  };
}

function getNode(
  board: DeepReadonly<BoardState>,
  cell: Cell,
): DeepReadonly<NodeState> | undefined {
  return board.nodes.find(
    (node) => node.col === cell.col && node.row === cell.row,
  );
}

function targetNodeAt(
  board: DeepReadonly<BoardState>,
  x: number,
  y: number,
): Cell | null {
  for (const node of board.nodes) {
    const dx = x - cellX(node.col, board.cols);
    const dy = y - cellY(node.row, board.rows);
    if (Math.hypot(dx, dy) <= NODE_HIT_R)
      return { col: node.col, row: node.row };
  }
  return null;
}

function beamFor(
  beams: readonly DeepReadonly<BeamState>[],
  channel: Channel,
): DeepReadonly<BeamState> | undefined {
  return beams.find((beam) => beam.channel === channel);
}

function replaceBeam(
  state: DeepReadonly<RefractState>,
  channel: Channel,
  cells: readonly Cell[],
): RefractState {
  return {
    ...copyState(state),
    beams: state.beams.map((beam) =>
      beam.channel === channel
        ? { channel, cells: cells.map((cell) => ({ ...cell })) }
        : {
            channel: beam.channel,
            cells: beam.cells.map((cell) => ({ ...cell })),
          },
    ),
  };
}

function crystalSpent(state: DeepReadonly<RefractState>, node: Cell): number {
  return state.beams.reduce(
    (count, beam) =>
      count +
      beam.cells.filter(
        (cell) => cell.col === node.col && cell.row === node.row,
      ).length,
    0,
  );
}

function nodeDegree(
  beams: readonly DeepReadonly<BeamState>[],
  channel: Channel,
  node: Cell,
): number {
  const beam = beamFor(beams, channel);
  if (!beam || beam.cells.length < 2) return 0;
  let degree = 0;
  for (let i = 0; i < beam.cells.length - 1; i += 1) {
    if (sameCell(beam.cells[i]!, node) || sameCell(beam.cells[i + 1]!, node)) {
      degree += 1;
    }
  }
  return degree;
}

function allSegmentKeys(
  beams: readonly DeepReadonly<BeamState>[],
): Set<string> {
  const keys = new Set<string>();
  for (const beam of beams) {
    for (let i = 0; i < beam.cells.length - 1; i += 1) {
      keys.add(segmentKey(beam.cells[i]!, beam.cells[i + 1]!));
    }
  }
  return keys;
}

function moveAllowed(
  state: DeepReadonly<RefractState>,
  channel: Channel,
  from: Cell,
  to: Cell,
): boolean {
  const dx = Math.abs(from.col - to.col);
  const dy = Math.abs(from.row - to.row);
  if ((dx === 0 && dy === 0) || dx > 1 || dy > 1) return false;
  const node = getNode(state.board, to);
  if (!node) return false;
  if (node.kind !== "crystal" && node.channel !== channel) return false;
  const key = segmentKey(from, to);
  const keys = allSegmentKeys(state.beams);
  if (keys.has(key)) return false;
  const mate = diagonalMateKey(from, to);
  if (mate && keys.has(mate)) return false;
  const beam = beamFor(state.beams, channel);
  const nextCells = [...(beam?.cells ?? []), to];
  const nextBeams = state.beams.map((candidate) =>
    candidate.channel === channel ? { channel, cells: nextCells } : candidate,
  );
  if (node.kind === "crystal") {
    const charges = node.charges ?? 0;
    if (crystalSpent(state, to) >= charges) return false;
  }
  for (const nextNode of [getNode(state.board, from), node]) {
    if (!nextNode) continue;
    const degree = nodeDegree(nextBeams, channel, nextNode);
    if (nextNode.kind === "emitter" && degree > 1) return false;
    if (nextNode.kind === "lens" && degree > 2) return false;
  }
  return true;
}

function beginTrace(
  state: DeepReadonly<RefractState>,
  cell: Cell | null,
): RefractState {
  if (!cell) return copyState(state);
  const node = getNode(state.board, cell);
  if (!node) return copyState(state);
  if (node.kind === "emitter" && node.channel) {
    const beam = beamFor(state.beams, node.channel);
    if (beam && beam.cells.length < 2) {
      return {
        ...replaceBeam(state, node.channel, [cell]),
        tracing: { channel: node.channel },
      };
    }
  }
  for (const beam of state.beams) {
    if (beam.cells.length < 1) continue;
    const first = beam.cells[0]!;
    const last = beam.cells[beam.cells.length - 1]!;
    if (sameCell(cell, first) || sameCell(cell, last)) {
      const cells = sameCell(cell, last)
        ? beam.cells
        : [...beam.cells].reverse();
      return {
        ...replaceBeam(state, beam.channel, cells),
        tracing: { channel: beam.channel },
      };
    }
  }
  const carriers = state.beams.filter((beam) =>
    beam.cells.some((beamCell) => sameCell(beamCell, cell)),
  );
  if (carriers.length === 1) {
    const beam = carriers[0]!;
    let keepIndex = -1;
    beam.cells.forEach((beamCell, index) => {
      if (sameCell(beamCell, cell)) keepIndex = index;
    });
    return {
      ...replaceBeam(state, beam.channel, beam.cells.slice(0, keepIndex + 1)),
      tracing: { channel: beam.channel },
    };
  }
  return copyState(state);
}

function extendTrace(
  state: DeepReadonly<RefractState>,
  cell: Cell | null,
): [RefractState, CueFlags] {
  const cues = { ...MUTED_CUES };
  if (!cell || !state.tracing) return [copyState(state), cues];
  const beam = beamFor(state.beams, state.tracing.channel);
  if (!beam || beam.cells.length === 0) return [copyState(state), cues];
  const last = beam.cells[beam.cells.length - 1]!;
  const prev = beam.cells[beam.cells.length - 2];
  if (prev && sameCell(cell, prev)) {
    const completeBefore = isChannelComplete(state, beam.channel);
    const next = replaceBeam(state, beam.channel, beam.cells.slice(0, -1));
    cues[CUES.retract] = true;
    if (completeBefore && !isChannelComplete(next, beam.channel)) {
      cues[CUES.channelComplete] = false;
    }
    return [next, cues];
  }
  if (!moveAllowed(state, beam.channel, last, cell))
    return [copyState(state), cues];
  const beforeComplete = isChannelComplete(state, beam.channel);
  let next = replaceBeam(state, beam.channel, [...beam.cells, cell]);
  cues[CUES.connect] = true;
  if (!beforeComplete && isChannelComplete(next, beam.channel)) {
    cues[CUES.channelComplete] = true;
  }
  if (isSolved(next)) {
    next = solveBoard(next);
    cues[CUES.solved] = true;
  }
  return [next, cues];
}

function endTrace(state: DeepReadonly<RefractState>): RefractState {
  if (!state.tracing) return copyState(state);
  const beam = beamFor(state.beams, state.tracing.channel);
  const cells = beam && beam.cells.length < 2 ? [] : (beam?.cells ?? []);
  return { ...replaceBeam(state, state.tracing.channel, cells), tracing: null };
}

function clearBeams(state: DeepReadonly<RefractState>): RefractState {
  return {
    ...copyState(state),
    beams: state.beams.map((beam) => ({ channel: beam.channel, cells: [] })),
    tracing: null,
  };
}

function isChannelComplete(
  state: DeepReadonly<RefractState>,
  channel: Channel,
): boolean {
  const beam = beamFor(state.beams, channel);
  if (!beam || beam.cells.length < 2) return false;
  const channelNodes = state.board.nodes.filter(
    (node) => node.channel === channel,
  );
  const emitters = channelNodes.filter((node) => node.kind === "emitter");
  if (emitters.length !== 2) return false;
  const ends = [beam.cells[0]!, beam.cells[beam.cells.length - 1]!];
  if (
    !emitters.every((emitter) =>
      ends.some((end) => end.col === emitter.col && end.row === emitter.row),
    )
  ) {
    return false;
  }
  for (const emitter of emitters) {
    if (nodeDegree(state.beams, channel, emitter) !== 1) return false;
  }
  for (const lens of channelNodes.filter((node) => node.kind === "lens")) {
    if (nodeDegree(state.beams, channel, lens) !== 2) return false;
  }
  return true;
}

function isCrystalSatisfied(
  state: DeepReadonly<RefractState>,
  node: DeepReadonly<NodeState>,
): boolean {
  const spent = crystalSpent(state, node);
  if (spent !== node.charges) return false;
  return !state.beams.some((beam) => {
    if (beam.cells.length === 0) return false;
    const first = beam.cells[0]!;
    const last = beam.cells[beam.cells.length - 1]!;
    return sameCell(first, node) || sameCell(last, node);
  });
}

function isSolved(state: DeepReadonly<RefractState>): boolean {
  return (
    state.beams.every((beam) => isChannelComplete(state, beam.channel)) &&
    state.board.nodes
      .filter((node) => node.kind === "crystal")
      .every((node) => isCrystalSatisfied(state, node))
  );
}

function solvedTier(solvedCount: number): number {
  return Math.min(Math.floor(solvedCount / TIER_ADVANCE) + 1, MAX_TIER);
}

function solveBoard(state: DeepReadonly<RefractState>): RefractState {
  if (state.mode === "campaign") {
    const solvedBoards = [...state.solvedBoards];
    if (!solvedBoards.includes(state.boardIndex)) {
      solvedBoards.push(state.boardIndex);
      solvedBoards.sort((a, b) => a - b);
    }
    const unlockedCount = Math.max(
      state.unlockedCount,
      Math.min(CAMPAIGN_LENGTH, state.boardIndex + 2),
    );
    return {
      ...copyState(state),
      tracing: null,
      solvedBoards,
      unlockedCount,
      selectIndex: state.boardIndex,
      screen: solvedBoards.length >= CAMPAIGN_LENGTH ? "complete" : "solved",
      menuIndex: 0,
      armedTarget: null,
    };
  }
  const solvedCount = state.solvedCount + 1;
  return {
    ...copyState(state),
    tracing: null,
    solvedCount,
    tier: solvedTier(solvedCount),
    screen: "solved",
    menuIndex: 0,
    armedTarget: null,
  };
}

function generatedBoard(tier: number, salt: number): BoardState {
  assertWhole(tier, 1, MAX_TIER, "tier");
  const templates = CASCADE_TEMPLATES[tier] ?? CASCADE_TEMPLATES[1];
  return parseBoard(templates[Math.abs(salt) % templates.length]!);
}

function assertWhole(
  value: number,
  min: number,
  max: number,
  name: string,
): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(
      `Refract: ${name} must be a whole number from ${min} to ${max}`,
    );
  }
}

function takeTarget(
  state: DeepReadonly<RefractState>,
  id: string,
): RefractState {
  if (id.startsWith("menu-")) {
    const index = Number(id.slice(5));
    return confirmMenu({ ...copyState(state), menuIndex: index });
  }
  if (id.startsWith("board-")) {
    return confirmMenu({
      ...copyState(state),
      selectIndex: Number(id.slice(6)) - 1,
    });
  }
  if (id === "back") return goBack(state);
  if (id === "clear")
    return state.screen === "playing" ? clearBeams(state) : copyState(state);
  return copyState(state);
}

function confirmMenu(state: DeepReadonly<RefractState>): RefractState {
  if (state.screen === "title") {
    if (state.menuIndex === 0) {
      return {
        ...copyState(state),
        mode: "campaign",
        screen: "select",
        armedTarget: null,
      };
    }
    if (state.menuIndex === 1) {
      const board = generatedBoard(1, Math.floor(state.simTime * 1000));
      return {
        ...poseBoard(
          { ...copyState(state), mode: "cascade", solvedCount: 0, tier: 1 },
          board,
        ),
        mode: "cascade",
        solvedCount: 0,
        tier: 1,
      };
    }
    return {
      ...copyState(state),
      screen: "howto",
      menuIndex: 0,
      armedTarget: null,
    };
  }
  if (state.screen === "select") {
    if (state.selectIndex < state.unlockedCount) {
      return enterCampaignBoard(state, state.selectIndex);
    }
    return copyState(state);
  }
  if (state.screen === "solved") {
    return confirmSolved(state);
  }
  if (state.screen === "complete") {
    return state.menuIndex === 0
      ? {
          ...copyState(state),
          screen: "select",
          menuIndex: 0,
          armedTarget: null,
        }
      : {
          ...copyState(state),
          screen: "title",
          menuIndex: 0,
          armedTarget: null,
        };
  }
  return copyState(state);
}

function confirmSolved(state: DeepReadonly<RefractState>): RefractState {
  if (state.mode === "cascade") {
    if (state.menuIndex === 0) {
      return poseBoard(state, generatedBoard(state.tier, state.solvedCount));
    }
    return {
      ...poseBoard(
        { ...copyState(state), solvedCount: 0, tier: 1 },
        generatedBoard(1, Math.floor(state.simTime * 1000) + 1),
      ),
      solvedCount: 0,
      tier: 1,
    };
  }
  const choices = campaignSolvedChoices(state);
  const choice = choices[state.menuIndex] ?? choices[0];
  if (choice === "next") return enterCampaignBoard(state, state.boardIndex + 1);
  if (choice === "replay") return enterCampaignBoard(state, state.boardIndex);
  return {
    ...copyState(state),
    screen: "select",
    menuIndex: 0,
    armedTarget: null,
  };
}

function campaignSolvedChoices(
  state: DeepReadonly<RefractState>,
): readonly ("next" | "replay" | "select")[] {
  return state.boardIndex < CAMPAIGN_LENGTH - 1
    ? ["next", "replay", "select"]
    : ["replay", "select"];
}

function enterCampaignBoard(
  state: DeepReadonly<RefractState>,
  index: number,
): RefractState {
  const boardIndex = Math.max(0, Math.min(CAMPAIGN_LENGTH - 1, index));
  return {
    ...poseBoard(
      { ...copyState(state), mode: "campaign" },
      parseBoard(CAMPAIGN_BOARDS[boardIndex]!),
    ),
    mode: "campaign",
    boardIndex,
    selectIndex: boardIndex,
  };
}

function goBack(state: DeepReadonly<RefractState>): RefractState {
  if (state.screen === "howto") {
    return {
      ...copyState(state),
      screen: "title",
      menuIndex: 2,
      armedTarget: null,
    };
  }
  if (state.screen === "select") {
    return {
      ...copyState(state),
      screen: "title",
      menuIndex: 0,
      armedTarget: null,
    };
  }
  if (state.screen === "playing") {
    return state.mode === "campaign"
      ? {
          ...copyState(state),
          screen: "select",
          menuIndex: 0,
          beams: emptyBeams(state.board),
          tracing: null,
          armedTarget: null,
        }
      : {
          ...copyState(state),
          screen: "title",
          menuIndex: 1,
          beams: emptyBeams(state.board),
          tracing: null,
          armedTarget: null,
        };
  }
  if (state.screen === "solved") {
    return state.mode === "campaign"
      ? {
          ...copyState(state),
          screen: "select",
          menuIndex: 0,
          armedTarget: null,
        }
      : {
          ...copyState(state),
          screen: "title",
          menuIndex: 1,
          armedTarget: null,
        };
  }
  if (state.screen === "complete") {
    return {
      ...copyState(state),
      screen: "select",
      menuIndex: 0,
      armedTarget: null,
    };
  }
  return copyState(state);
}

function menuLength(state: DeepReadonly<RefractState>): number {
  if (state.screen === "title") return TITLE_ITEMS.length;
  if (state.screen === "solved") {
    return state.mode === "campaign"
      ? campaignSolvedChoices(state).length
      : SOLVED_ITEMS.length;
  }
  if (state.screen === "complete") return 2;
  return 1;
}

function moveMenu(
  state: DeepReadonly<RefractState>,
  dx: number,
  dy: number,
): RefractState {
  if (state.screen === "select") {
    const col = state.selectIndex % 6;
    const row = Math.floor(state.selectIndex / 6);
    const nextCol = (col + dx + 6) % 6;
    const nextRow = (row + dy + 4) % 4;
    return { ...copyState(state), selectIndex: nextRow * 6 + nextCol };
  }
  const length = menuLength(state);
  return {
    ...copyState(state),
    menuIndex: (state.menuIndex + dy + length) % length,
  };
}

function targets(state: DeepReadonly<RefractState>): TargetSnapshot[] {
  if (state.screen === "title") {
    return TITLE_ITEMS.map((_, index) => ({
      id: `menu-${index}`,
      x: STAGE_CX - 170,
      y: 316 + index * 84,
      w: 340,
      h: TARGET_MIN_H,
    }));
  }
  if (state.screen === "howto") {
    return [{ id: "back", x: 56, y: 598, w: 132, h: TARGET_MIN_H }];
  }
  if (state.screen === "select") {
    const boardTargets: TargetSnapshot[] = [];
    for (let i = 0; i < CAMPAIGN_LENGTH; i += 1) {
      boardTargets.push({
        id: `board-${i + 1}`,
        x: 306 + (i % 6) * 112,
        y: 212 + Math.floor(i / 6) * 94,
        w: TARGET_MIN_W,
        h: TARGET_MIN_H,
      });
    }
    return [
      ...boardTargets,
      { id: "back", x: 56, y: 598, w: 132, h: TARGET_MIN_H },
    ];
  }
  if (state.screen === "playing") {
    return [
      { id: "clear", x: 1000, y: 564, w: 132, h: TARGET_MIN_H },
      { id: "back", x: 1148, y: 564, w: 104, h: TARGET_MIN_H },
    ];
  }
  if (state.screen === "solved") {
    const count =
      state.mode === "campaign"
        ? campaignSolvedChoices(state).length
        : SOLVED_ITEMS.length;
    return Array.from({ length: count }, (_, index) => ({
      id: `menu-${index}`,
      x: STAGE_CX - 170,
      y: 306 + index * 82,
      w: 340,
      h: TARGET_MIN_H,
    }));
  }
  return [
    { id: "menu-0", x: STAGE_CX - 170, y: 352, w: 340, h: TARGET_MIN_H },
    { id: "menu-1", x: STAGE_CX - 170, y: 438, w: 340, h: TARGET_MIN_H },
  ];
}

function targetAt(
  state: DeepReadonly<RefractState>,
  x: number,
  y: number,
): TargetSnapshot | null {
  return (
    targets(state).find(
      (target) =>
        x >= target.x &&
        x <= target.x + target.w &&
        y >= target.y &&
        y <= target.y + target.h,
    ) ?? null
  );
}

function applyPointerDown(
  state: DeepReadonly<RefractState>,
  x: number,
  y: number,
  device: PointerDevice,
): RefractState {
  const target = targetAt(state, x, y);
  let next: RefractState = {
    ...copyState(state),
    pointer: { x, y, down: true, device },
    armedTarget: target?.id ?? null,
  };
  if (target) {
    next = highlightTarget(next, target.id);
    return next;
  }
  if (state.screen === "playing") {
    return beginTrace(next, targetNodeAt(next.board, x, y));
  }
  return next;
}

function applyPointerMove(
  state: DeepReadonly<RefractState>,
  x: number,
  y: number,
  device: PointerDevice,
): [RefractState, CueFlags] {
  const cues = { ...MUTED_CUES };
  let next: RefractState = {
    ...copyState(state),
    pointer: { x, y, down: state.pointer.down, device },
  };
  const target = targetAt(next, x, y);
  if (target && !next.tracing) next = highlightTarget(next, target.id);
  if (next.screen === "playing" && next.tracing) {
    return extendTrace(next, targetNodeAt(next.board, x, y));
  }
  return [next, cues];
}

function applyPointerUp(
  state: DeepReadonly<RefractState>,
  device: PointerDevice,
): RefractState {
  const pointer = { ...state.pointer, down: false, device };
  const target = targetAt(state, state.pointer.x, state.pointer.y);
  if (state.armedTarget && target?.id === state.armedTarget) {
    return {
      ...takeTarget({ ...copyState(state), pointer }, state.armedTarget),
      pointer,
      armedTarget: null,
    };
  }
  return { ...endTrace(state), pointer, armedTarget: null };
}

function highlightTarget(
  state: DeepReadonly<RefractState>,
  id: string,
): RefractState {
  if (id.startsWith("menu-")) {
    return { ...copyState(state), menuIndex: Number(id.slice(5)) };
  }
  if (id.startsWith("board-")) {
    return { ...copyState(state), selectIndex: Number(id.slice(6)) - 1 };
  }
  return copyState(state);
}

function snapshot(state: DeepReadonly<RefractState>): RefractSnapshot {
  const beams: Partial<Record<Channel, BeamSnapshot>> = {};
  for (const beam of state.beams) {
    beams[beam.channel] = {
      cells: beam.cells.map((cell) => ({ ...cell })),
      complete: isChannelComplete(state, beam.channel),
    };
  }
  const liveBeam = state.tracing
    ? beamFor(state.beams, state.tracing.channel)
    : null;
  return {
    version: REFRACT_DEBUG_VERSION,
    screen: state.screen,
    mode: state.mode,
    menuIndex: state.menuIndex,
    boardIndex: state.boardIndex,
    solvedBoards: [...state.solvedBoards],
    unlockedCount: state.unlockedCount,
    selectIndex: state.selectIndex,
    solvedCount: state.solvedCount,
    tier: state.tier,
    board: {
      cols: state.board.cols,
      rows: state.board.rows,
      nodes: state.board.nodes.map((node) => ({
        ...node,
        x: cellX(node.col, state.board.cols),
        y: cellY(node.row, state.board.rows),
        spent: node.kind === "crystal" ? crystalSpent(state, node) : null,
      })),
    },
    beams,
    solved: isSolved(state),
    tracing:
      state.tracing && liveBeam && liveBeam.cells.length > 0
        ? {
            channel: state.tracing.channel,
            live: { ...liveBeam.cells[liveBeam.cells.length - 1]! },
          }
        : null,
    pointer: { ...state.pointer },
    targets: targets(state),
    muted: state.muted,
    simTime: state.simTime,
  };
}

function createDebug(): RefractDebugApi {
  return {
    version: REFRACT_DEBUG_VERSION,
    reset: (state) => initialState(state.muted),
    snapshot,
    reconcile: copyState,
    setMode: (state, mode) => ({ ...copyState(state), mode }),
    setScreen: (state, screen) => ({
      ...copyState(state),
      screen,
      armedTarget: null,
    }),
    setMenuIndex: (state, menuIndex) => ({ ...copyState(state), menuIndex }),
    setSolvedCount: (state, solvedCount) => {
      assertWhole(solvedCount, 0, Number.MAX_SAFE_INTEGER, "solvedCount");
      return { ...copyState(state), solvedCount };
    },
    setTier: (state, tier) => {
      assertWhole(tier, 1, MAX_TIER, "tier");
      return { ...copyState(state), tier };
    },
    generateBoard: (state, tier) =>
      poseBoard(state, generatedBoard(tier, Math.floor(state.simTime * 1000))),
    loadBoard: (state, board) => poseBoard(state, parseBoard(board)),
    pointerDown: (state, x, y, device = "mouse") =>
      applyPointerDown(state, x, y, device),
    pointerMove: (state, x, y, device = "mouse") =>
      applyPointerMove(state, x, y, device)[0],
    pointerUp: (state, device = "mouse") => applyPointerUp(state, device),
    clear: clearBeams,
  };
}

function registerDiagnostics(api: InitApi<RefractState>): void {
  api.diagnostics.register("screen", (state) => state.screen);
  api.diagnostics.register("mode", (state) => state.mode);
  api.diagnostics.register(
    "board",
    (state) => `${state.board.cols}x${state.board.rows}`,
  );
  for (const channel of CHANNELS) {
    api.diagnostics.register(`${channel}-beam`, (state) => {
      const beam = beamFor(state.beams, channel);
      return beam
        ? `${beam.cells.length}/${isChannelComplete(state, channel)}`
        : "-";
    });
  }
  api.diagnostics.register(
    "crystals",
    (state) =>
      state.board.nodes
        .filter((node) => node.kind === "crystal")
        .map((node) => `${crystalSpent(state, node)}/${node.charges}`)
        .join(" ") || "-",
  );
  api.diagnostics.register("solved", isSolved);
  api.diagnostics.register(
    "pointer",
    (state) =>
      `${state.pointer.x.toFixed(0)},${state.pointer.y.toFixed(0)} ${state.pointer.device}`,
  );
}

function defineAudio(api: InitApi<RefractState>): void {
  api.audio.define(CUES.connect, {
    wave: "sine",
    freq: 620,
    freqTo: 920,
    durationMs: 65,
    gain: 0.12,
  });
  api.audio.define(CUES.retract, {
    wave: "triangle",
    freq: 420,
    freqTo: 210,
    durationMs: 70,
    gain: 0.1,
  });
  api.audio.define(CUES.channelComplete, {
    wave: "sine",
    freq: 880,
    freqTo: 1320,
    durationMs: 120,
    gain: 0.11,
  });
  api.audio.define(CUES.solved, {
    wave: "triangle",
    freq: 520,
    freqTo: 1040,
    durationMs: 220,
    gain: 0.14,
  });
  api.audio.define(CUES.clear, {
    wave: "sawtooth",
    freq: 180,
    freqTo: 90,
    durationMs: 90,
    gain: 0.08,
  });
}

function playCues(api: UpdateApi, cues: CueFlags): void {
  for (const cue of Object.values(CUES)) {
    if (cues[cue]) api.audio.play(cue);
  }
}

function updateFromInput(
  state: DeepReadonly<RefractState>,
  api: UpdateApi,
): RefractState {
  let next = copyState(state);
  if (api.input.pressed("mute")) {
    api.audio.setMuted(!api.audio.muted());
  }
  if (api.input.pressed("up")) next = moveMenu(next, 0, -1);
  if (api.input.pressed("down")) next = moveMenu(next, 0, 1);
  if (api.input.pressed("left")) next = moveMenu(next, -1, 0);
  if (api.input.pressed("right")) next = moveMenu(next, 1, 0);
  if (api.input.pressed("back")) next = goBack(next);
  if (api.input.pressed("confirm")) next = confirmMenu(next);
  if (api.input.pressed("clear") && next.screen === "playing") {
    const hadSegments = next.beams.some((beam) => beam.cells.length > 1);
    next = clearBeams(next);
    if (hadSegments) api.audio.play(CUES.clear);
  }

  const pointer = api.input.pointer();
  const samples = api.input.pointerSamples().filter((sample) => sample.primary);
  if (samples.length === 0) {
    return {
      ...next,
      pointer: {
        x: pointer.x,
        y: pointer.y,
        down: pointer.down,
        device: pointer.device,
      },
      muted: api.audio.muted(),
    };
  }
  for (const sample of samples) {
    if (sample.type === "down") {
      next = applyPointerDown(next, sample.x, sample.y, sample.device);
    } else if (sample.type === "move") {
      const [moved, cues] = applyPointerMove(
        next,
        sample.x,
        sample.y,
        sample.device,
      );
      next = moved;
      playCues(api, cues);
    } else {
      next = applyPointerUp(next, sample.device);
    }
  }
  return { ...next, muted: api.audio.muted() };
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color = "#e9fbff",
  align: CanvasTextAlign = "center",
): void {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px Inter, ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  active = false,
): void {
  ctx.fillStyle = active ? "rgba(95,225,255,0.16)" : "rgba(233,251,255,0.07)";
  ctx.strokeStyle = active ? "#5ee1ff" : "rgba(233,251,255,0.24)";
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  channel: Channel,
  x: number,
  y: number,
  r: number,
  fill: boolean,
): void {
  ctx.beginPath();
  if (channel === "triangle") {
    for (let i = 0; i < 3; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / 3;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (channel === "square") {
    ctx.rect(x - r * 0.76, y - r * 0.76, r * 1.52, r * 1.52);
  } else {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  }
  ctx.strokeStyle = HUES[channel];
  ctx.fillStyle = HUES[channel];
  ctx.lineWidth = 5;
  if (fill) ctx.fill();
  else ctx.stroke();
}

function drawBoard(
  state: DeepReadonly<RefractState>,
  ctx: CanvasRenderingContext2D,
): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let row = 0; row < state.board.rows; row += 1) {
    for (let col = 0; col < state.board.cols; col += 1) {
      const x = cellX(col, state.board.cols);
      const y = cellY(row, state.board.rows);
      ctx.strokeStyle = "rgba(233,251,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  for (const beam of state.beams) {
    if (beam.cells.length < 2) continue;
    ctx.strokeStyle = HUES[beam.channel];
    ctx.shadowColor = HUES[beam.channel];
    ctx.shadowBlur = 18;
    ctx.lineWidth = 10;
    ctx.beginPath();
    beam.cells.forEach((cell, index) => {
      const x = cellX(cell.col, state.board.cols);
      const y = cellY(cell.row, state.board.rows);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  for (const node of state.board.nodes) {
    const x = cellX(node.col, state.board.cols);
    const y = cellY(node.row, state.board.rows);
    if (node.kind === "crystal") {
      const spent = crystalSpent(state, node);
      ctx.fillStyle = "#142533";
      ctx.strokeStyle = "#bff8d7";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, NODE_R * 0.82, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawText(ctx, `${spent}/${node.charges}`, x, y, 19, "#d9ffe9");
    } else if (node.channel) {
      drawShape(ctx, node.channel, x, y, NODE_R * 0.86, node.kind === "lens");
    }
  }
  ctx.restore();
}

function drawMenuItem(
  ctx: CanvasRenderingContext2D,
  label: string,
  target: TargetSnapshot,
  active: boolean,
): void {
  drawPanel(ctx, target.x, target.y, target.w, target.h, active);
  drawText(ctx, label, target.x + target.w / 2, target.y + target.h / 2, 24);
}

function renderTitle(
  state: DeepReadonly<RefractState>,
  ctx: CanvasRenderingContext2D,
): void {
  drawText(ctx, TITLE_TEXT, STAGE_CX, 158, 78, "#e9fbff");
  drawText(ctx, TAGLINE_TEXT, STAGE_CX, 226, 24, "#8bd8e8");
  targets(state).forEach((target, index) =>
    drawMenuItem(ctx, TITLE_ITEMS[index]!, target, state.menuIndex === index),
  );
}

function renderHowTo(
  state: DeepReadonly<RefractState>,
  ctx: CanvasRenderingContext2D,
): void {
  drawText(ctx, "HOW TO PLAY", STAGE_CX, 84, 42);
  const lines = [
    "Draw one beam for each channel between its two outlined emitters.",
    "Drag from node to adjacent node, including diagonals; empty cells do not carry light.",
    "Filled channel nodes are lenses. A finished beam must thread every lens of its channel.",
    "Crystals are neutral. Spend every charge exactly once by crossing through them.",
    "Beams cannot touch another channel's emitters or lenses, share a segment, or cross diagonals.",
    `Use arrows or WASD, Enter or Space, Esc for back, M for mute, and R to ${CLEAR_LABEL}.`,
  ];
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "500 27px Inter, ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#d7edf3";
  lines.forEach((line, index) => ctx.fillText(line, 190, 190 + index * 58));
  const back = targets(state)[0]!;
  drawMenuItem(ctx, BACK_LABEL, back, false);
}

function renderSelect(
  state: DeepReadonly<RefractState>,
  ctx: CanvasRenderingContext2D,
): void {
  drawText(ctx, "CAMPAIGN", STAGE_CX, 92, 44);
  for (let row = 0; row < 4; row += 1) {
    drawText(ctx, SET_LABELS[row]!, 204, 248 + row * 94, 22, "#8bd8e8", "left");
  }
  const gridTargets = targets(state);
  for (let i = 0; i < CAMPAIGN_LENGTH; i += 1) {
    const target = gridTargets[i]!;
    const solved = state.solvedBoards.includes(i);
    const locked = i >= state.unlockedCount;
    drawPanel(
      ctx,
      target.x,
      target.y,
      target.w,
      target.h,
      state.selectIndex === i,
    );
    drawText(ctx, String(i + 1), target.x + 28, target.y + 28, 24, "#e9fbff");
    drawText(
      ctx,
      solved ? "SOLVED" : locked ? "LOCKED" : "OPEN",
      target.x + target.w / 2,
      target.y + 52,
      14,
      solved ? "#bff8d7" : locked ? "#6d7f87" : "#ffce5c",
    );
  }
  drawMenuItem(ctx, BACK_LABEL, gridTargets[gridTargets.length - 1]!, false);
}

function renderPlaying(
  state: DeepReadonly<RefractState>,
  ctx: CanvasRenderingContext2D,
): void {
  drawBoard(state, ctx);
  drawText(
    ctx,
    state.mode === "campaign"
      ? `BOARD ${state.boardIndex + 1}`
      : `${HUD_SOLVED_LABEL} ${state.solvedCount}   ${HUD_TIER_LABEL} ${state.tier}`,
    STAGE_CX,
    64,
    30,
    "#e9fbff",
  );
  let x = 70;
  for (const beam of state.beams) {
    drawShape(
      ctx,
      beam.channel,
      x,
      110,
      18,
      isChannelComplete(state, beam.channel),
    );
    x += 58;
  }
  const [clearTarget, backTarget] = targets(state);
  drawMenuItem(ctx, `${CLEAR_LABEL} R`, clearTarget!, false);
  drawMenuItem(ctx, BACK_LABEL, backTarget!, false);
}

function renderSolved(
  state: DeepReadonly<RefractState>,
  ctx: CanvasRenderingContext2D,
): void {
  drawBoard(state, ctx);
  ctx.fillStyle = "rgba(8,16,24,0.74)";
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  const heading =
    state.mode === "campaign"
      ? `BOARD ${state.boardIndex + 1} SOLVED`
      : SOLVED_TITLE_TEXT;
  drawText(ctx, heading, STAGE_CX, 210, 44);
  if (state.mode === "cascade") {
    drawText(
      ctx,
      `${HUD_SOLVED_LABEL} ${state.solvedCount}`,
      STAGE_CX,
      256,
      22,
      "#8bd8e8",
    );
  }
  const labels =
    state.mode === "campaign"
      ? campaignSolvedChoices(state).map((choice) =>
          choice === "next"
            ? "NEXT BOARD"
            : choice === "replay"
              ? "REPLAY"
              : "BACK TO SELECT",
        )
      : [...SOLVED_ITEMS];
  targets(state).forEach((target, index) =>
    drawMenuItem(ctx, labels[index]!, target, state.menuIndex === index),
  );
}

function renderComplete(
  state: DeepReadonly<RefractState>,
  ctx: CanvasRenderingContext2D,
): void {
  drawBoard(state, ctx);
  ctx.fillStyle = "rgba(8,16,24,0.78)";
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  drawText(ctx, "COURSE COMPLETE", STAGE_CX, 234, 48);
  drawText(
    ctx,
    `ALL ${CAMPAIGN_LENGTH} BOARDS SOLVED`,
    STAGE_CX,
    288,
    24,
    "#bff8d7",
  );
  const labels = ["BACK TO SELECT", "BACK TO TITLE"];
  targets(state).forEach((target, index) =>
    drawMenuItem(ctx, labels[index]!, target, state.menuIndex === index),
  );
}

export const game: Game<RefractState, RefractDebugApi> = {
  initialize(api: InitApi<RefractState>): [RefractState, RefractDebugApi] {
    for (const action of ACTIONS) {
      api.input.register(action, { keys: [...BINDINGS[action]] });
    }
    defineAudio(api);
    registerDiagnostics(api);
    return [initialState(), createDebug()];
  },

  update(
    state: DeepReadonly<RefractState>,
    api: UpdateApi,
    dt: number,
  ): RefractState {
    return {
      ...updateFromInput(
        { ...copyState(state), simTime: state.simTime + dt },
        api,
      ),
      simTime: state.simTime + dt,
    };
  },

  render(state: DeepReadonly<RefractState>, api: RenderApi): void {
    const { ctx } = api;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.fillStyle = "rgba(94,225,255,0.035)";
    for (let x = 64; x < STAGE_W; x += 64) ctx.fillRect(x, 0, 1, STAGE_H);
    for (let y = 48; y < STAGE_H; y += 48) ctx.fillRect(0, y, STAGE_W, 1);
    if (state.screen === "title") renderTitle(state, ctx);
    else if (state.screen === "howto") renderHowTo(state, ctx);
    else if (state.screen === "select") renderSelect(state, ctx);
    else if (state.screen === "playing") renderPlaying(state, ctx);
    else if (state.screen === "solved") renderSolved(state, ctx);
    else renderComplete(state, ctx);
  },
};
