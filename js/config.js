// Every tuned number in one place. Arrays are [desktop, coarse pointer / phone].

export const THEME = {
  bg0: "#03141c", bg1: "#07303d", caus: "#5fe3d6", causBg: .16, causText: .9,
  text: "#0b5e66", text2: "#93f7ec", fish: "#9cc4c6", glow: "#1fb5aa", glowAmt: .32,
  spec: 1.1, disp: .22, textA: .9, refract: 55, grain: .035, vig: .9,
};

export const FLUID = {
  simRes: [128, 96], mapRes: [512, 320], pressureIters: [22, 14],
  curl: 12, velDissipation: 1.6, force: 2600, radius: .0013, flickCap: 36,
};

// fractions of the viewport height
export const SCROLL = { fadeStart: .08, fadeLength: .5, fluidUntil: 1.2, pushUntil: .7 };

export const WORLD = { shoreFrac: .24, deepEndFrac: 1.05, bottleAngleDeg: -20, bottleUnits: 112, wordPad: 16 };

export const AUDIO = { fadeIn: 1.5, swishGap: .12, storageKey: "bytuna:muted", names: ["river", "surf", "swish", "plop"] };

// time used for the current, light and waves when motion is reduced or frozen for tests
export const FROZEN_TIME = 7;
