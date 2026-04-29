export const STATES = Object.freeze({
  INTRO: "INTRO",
  REAR_ROOM: "REAR_ROOM",
  CRACK_FOCUS: "CRACK_FOCUS",
  MATRIX_ROOM: "MATRIX_ROOM",
  PILL_CHOICE: "PILL_CHOICE",
  BLUE_WORLD: "BLUE_WORLD",
  RED_WORLD: "RED_WORLD",
  SELFIE_BLUE: "SELFIE_BLUE",
  SELFIE_RED: "SELFIE_RED"
});

export class AppState extends EventTarget {
  constructor() {
    super();
    this.value = STATES.INTRO;
    this.choice = null;
    this.demoMode = false;
  }

  set(next, detail = {}) {
    if (!Object.values(STATES).includes(next) || next === this.value) return;
    const previous = this.value;
    this.value = next;
    this.dispatchEvent(new CustomEvent("statechange", { detail: { previous, state: next, ...detail } }));
  }

  setChoice(choice) {
    this.choice = choice;
    this.dispatchEvent(new CustomEvent("choicechange", { detail: { choice } }));
  }

  setDemoMode(enabled) {
    this.demoMode = enabled;
    this.dispatchEvent(new CustomEvent("demomode", { detail: { enabled } }));
  }
}
