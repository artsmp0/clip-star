import { LocalStorage } from "@raycast/api";
import { Bookmark } from "../types";

const STORAGE_KEY = "bookmarks";

export async function getBookmarks(): Promise<Bookmark[]> {
  const data = await LocalStorage.getItem<string>(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

// ... 其他 CRUD 操作函数

export async function updateBookmark(updatedBookmark: Bookmark): Promise<void> {
  const bookmarks = await getBookmarks();
  const updatedBookmarks = bookmarks.map((bookmark) =>
    bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark,
  );
  await saveBookmarks(updatedBookmarks);
}
