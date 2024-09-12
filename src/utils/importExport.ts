import { getBookmarks, saveBookmarks } from "./storage";
import { Bookmark } from "../types";
import fs from "fs";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

export async function exportBookmarks(filePath: string): Promise<void> {
  const bookmarks = await getBookmarks();
  await writeFile(filePath, JSON.stringify(bookmarks, null, 2));
}

export async function importBookmarks(filePath: string): Promise<void> {
  const data = await readFile(filePath, "utf-8");
  const bookmarks = JSON.parse(data) as Bookmark[];
  await saveBookmarks(bookmarks);
}
