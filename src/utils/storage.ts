import { LocalStorage, getPreferenceValues } from "@raycast/api";
import { Clip } from "../types";
import axios from "axios";

const STORAGE_KEY = "clips";

const { webhook } = getPreferenceValues<{ webhook?: string; webhook_get?: string }>();

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

export async function addClip(clip: Clip) {
  const clips = await getClips();
  const updatedClips = [clip, ...clips];
  if (webhook) {
    const transferClip = {
      ...clip,
      tags: clip.tags.join(","),
    };
    await axios(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: { action: "add", text: Object.values(transferClip).join("|"), clip },
    });
    await saveClips(updatedClips);
    return;
  }
  await saveClips(updatedClips);
  return updatedClips;
}

export async function updateClip(updatedClip: Clip) {
  const clips = await getClips();
  const updatedClips = clips.map((clip) => (clip.id === updatedClip.id ? updatedClip : clip));
  await saveClips(updatedClips);
  return updatedClips;
}

export async function deleteClip(id: string) {
  const clips = await getClips();
  const updatedClips = clips.filter((clip) => clip.id !== id);
  await saveClips(updatedClips);
  return updatedClips;
}
