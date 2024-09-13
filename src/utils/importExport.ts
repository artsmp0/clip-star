import { getClips, saveClips } from "./storage";
import { Clip } from "../types";
import fs from "fs";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

export async function exportClips(filePath: string): Promise<void> {
  const clips = await getClips();
  await writeFile(filePath, JSON.stringify(clips, null, 2));
}

export async function importClips(filePath: string): Promise<void> {
  const data = await readFile(filePath, "utf-8");
  const clips = JSON.parse(data) as Clip[];
  await saveClips(clips);
}
