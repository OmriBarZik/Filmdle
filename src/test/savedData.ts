import type { SaveData } from "@/lib/save/saveData";

/** The save as the game wrote it. */
export function savedData(): SaveData {
  return JSON.parse(window.localStorage.getItem("filmdle:v1") ?? "null") as SaveData;
}
