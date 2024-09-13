import { LocalStorage } from "@raycast/api";
import { Clip } from "../types";

const STORAGE_KEY = "clips";

export async function getClips(): Promise<Clip[]> {
  const data = await LocalStorage.getItem<string>(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveClips(clips: Clip[]): Promise<void> {
  const clipsData = clips.map((clip) => ({
    id: clip.id,
    title: clip.title,
    url: clip.url,
    tags: clip.tags,
    createdAt: clip.createdAt,
    updatedAt: clip.updatedAt,
  }));
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(clipsData));
}

export async function updateClip(updatedClip: Clip): Promise<void> {
  const clips = await getClips();
  const updatedClips = clips.map((clip) => (clip.id === updatedClip.id ? updatedClip : clip));
  await saveClips(updatedClips);
}
