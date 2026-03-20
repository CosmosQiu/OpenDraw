import { Editor } from "tldraw";
import { MovieClawCanvasSkill } from "./MovieClawCanvasSkill";

const GLOBAL_SKILL_KEY = "movieClawCanvasSkill";

declare global {
  interface Window {
    movieClawCanvasSkill?: MovieClawCanvasSkill;
  }
}

export function registerCanvasSkill(editor: Editor) {
  const skill = new MovieClawCanvasSkill(editor);
  window[GLOBAL_SKILL_KEY] = skill;
  return skill;
}

export function unregisterCanvasSkill() {
  delete window[GLOBAL_SKILL_KEY];
}
