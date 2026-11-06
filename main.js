import "./tailwind.css";

const STEP_DURATION = 2000; // ms each step stays in the center
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

// One icon per step, drawn on the 7×7 grid in index.html.
// "#" = pixel on, "+" = pixel dimmed, "." = pixel off.
const ICONS = [
  // Downloading required assets
  [
    "...#...",
    "...#...",
    ".#+#+#.",
    "..###..",
    "+..#..+",
    "#.....#",
    ".#####.",
  ],
  // Checking for potential issues
  [
    "...#...",
    "#.#.#.#",
    ".#####.",
    "##.#.##",
    ".#+..#.",
    ".#++.#.",
    "#.###.#",
  ],
  // Building your workspace
  [
    "...##..",
    "...#...",
    "#.#.#.#",
    "##.#.##",
    "#+....#",
    "#+###.#",
    "#+#+#.#",
  ],
  // You're all set!
  [
    "..##+..",
    ".#.....",
    "#....#.",
    "#.#.#.+",
    "#..#..#",
    ".#...#.",
    "..###..",
  ],
];

const GRID_SIZE = 7;
const DIM = 0.25;
const OPACITY = { "#": 1, "+": DIM, ".": 0 };

// Turn an icon into a flat list of opacities, one per grid cell.
const toOpacities = (icon) => icon.join("").split("").map((char) => OPACITY[char]);

// Every effect is a short sequence of pixel "frames" (opacities), each one
// lasting FRAME ms, which gives a stepped, glitchy look.
const FRAME = 50;

// Blink burst: a few pixels blink at once. Plays when the first icon boots
// and once the final icon is in place.
const BURST_BLINKS = 8; // lit pixels that blink
const BURST_NOISE = 4; // extra pixels (outside the icon) flashing briefly
const BURST_WINDOW = 700; // ms in which the blinks happen

// Transition: pixels change row by row from the bottom (following the step
// titles moving up), with random jitter, a stutter on each changing pixel and
// a few extra noise pixels.
const ROW_DELAY = 50; // ms between rows
const JITTER = 100; // max random extra delay per pixel
const TRANSITION_NOISE = 6; // extra pixels flashing during the transition

// Idle: while waiting for the next step, a random lit pixel blinks.
const IDLE_GAP = [120, 360]; // min/max ms between blinks

const random = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);

function createIcons(figure) {
  const cells = [...figure.querySelectorAll("path")];
  const indexes = cells.map((_, i) => i);
  const shown = []; // opacity each cell currently displays
  let target = []; // opacity each cell should have for the current icon
  let timers = [];

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const cancelAll = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  function set(i, opacity) {
    shown[i] = opacity;
    cells[i].style.opacity = opacity;
  }

  // Play a sequence of opacities on a cell, starting after `delay` ms.
  // Returns the time at which the sequence ends.
  function play(i, frames, delay = 0) {
    frames.forEach((opacity, n) => later(() => set(i, opacity), delay + n * FRAME));
    return delay + frames.length * FRAME;
  }

  const lit = () => indexes.filter((i) => target[i] > 0);
  const unlit = () => indexes.filter((i) => target[i] === 0 && shown[i] === 0);

  // Flash a few cells that are not part of the icon.
  function noise(count, window, delay = 0) {
    shuffle(unlit())
      .slice(0, count)
      .forEach((i) => play(i, [pick([DIM, 1]), 0], delay + random(0, window)));
  }

  // Blink a few lit pixels (plus some noise) within BURST_WINDOW ms.
  // Returns the time at which the burst ends.
  function burst(delay = 0) {
    shuffle(lit())
      .slice(0, BURST_BLINKS)
      .forEach((i) => play(i, [0, target[i], 0, target[i]], delay + random(0, BURST_WINDOW)));
    noise(BURST_NOISE, BURST_WINDOW, delay);
    return delay + BURST_WINDOW;
  }

  function idle() {
    const i = pick(lit());
    const end = play(i, [pick([0, DIM]), pick([0, DIM]), target[i]]);
    later(idle, end + random(...IDLE_GAP));
  }

  function intro() {
    indexes.forEach((i) => set(i, target[i]));
    if (reducedMotion) return;

    const end = burst();
    later(idle, end + random(...IDLE_GAP));
  }

  function transition() {
    if (reducedMotion) return indexes.forEach((i) => set(i, target[i]));

    let end = 0;

    indexes.forEach((i) => {
      const from = shown[i];
      const to = target[i];
      if (from === to) return;

      const rowFromBottom = GRID_SIZE - 1 - Math.floor(i / GRID_SIZE);
      const delay = rowFromBottom * ROW_DELAY + random(0, JITTER);
      const frames = to > from ? [DIM, 0, DIM, to] : [DIM, from, 0, to];

      end = Math.max(end, play(i, frames, delay));
    });

    noise(TRANSITION_NOISE, end);
    return end;
  }

  function goTo(index) {
    cancelAll();
    target = toOpacities(ICONS[index]);

    const end = transition();
    if (reducedMotion) return;

    // Keep the icon alive until the next step. The final icon gets one last
    // blink burst once it's in place, then stays still.
    const isLast = index === ICONS.length - 1;
    const next = end + random(...IDLE_GAP);

    if (isLast) burst(next);
    else later(idle, next);
  }

  // Start from a blank grid, then boot the first icon.
  indexes.forEach((i) => set(i, 0));
  target = toOpacities(ICONS[0]);
  intro();

  return { goTo };
}

// ---------------------------------------------------------------------------
// Step titles
// ---------------------------------------------------------------------------

function createSteps(container) {
  const list = container.querySelector("ul");
  const steps = [...list.children];

  // Move the list so the given step sits in the vertical center of the
  // container, and mark it as active (100% opacity, others stay at 30%).
  function goTo(index) {
    const step = steps[index];
    const stepCenter = step.offsetTop + step.offsetHeight / 2;
    const offset = container.clientHeight / 2 - stepCenter;

    list.style.transform = `translateY(${offset}px)`;
    steps.forEach((el, i) => el.toggleAttribute("data-active", i === index));
  }

  // Set the initial state with transitions off, so nothing animates on load
  // (e.g. steps fading from 100% to 30% when the styles kick in).
  const animated = [list, ...steps];
  animated.forEach((el) => (el.style.transition = "none"));
  goTo(0);
  container.offsetHeight; // force reflow to commit the initial state
  animated.forEach((el) => (el.style.transition = ""));

  // Steps start hidden in the markup until they're positioned.
  container.classList.remove("invisible");

  return { goTo, count: steps.length };
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const steps = createSteps(document.querySelector("[data-animated-steps]"));
  const icons = createIcons(document.querySelector("[data-animated-icons]"));
  let current = 0;

  const timer = setInterval(() => {
    current++;
    steps.goTo(current);
    icons.goTo(current);
    if (current === steps.count - 1) clearInterval(timer);
  }, STEP_DURATION);
});
