import { LocalStorage } from "@raycast/api";
import { Clip } from "../types";

const STORAGE_KEY = "clips";

export async function getClips(): Promise<Clip[]> {
  const data = await LocalStorage.getItem<string>(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveClips(clips: Clip[]): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(clips));
}

export async function updateClip(updatedClip: Clip): Promise<void> {
  const clips = await getClips();
  const updatedClips = clips.map((clip) => (clip.id === updatedClip.id ? updatedClip : clip));
  await saveClips(updatedClips);
}
