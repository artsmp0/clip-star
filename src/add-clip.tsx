import { Form, ActionPanel, Action, showToast, Toast, popToRoot, Clipboard } from "@raycast/api";
import { v4 as uuidv4 } from "uuid";
import { getBookmarks, saveBookmarks } from "./utils/storage";
import { Bookmark } from "./types";
import { useState, useEffect } from "react";

export default function AddBookmark() {
  const [urlFromClipboard, setUrlFromClipboard] = useState("");

  useEffect(() => {
    async function getClipboardContent() {
      const text = await Clipboard.readText();
      if (text && isValidUrl(text)) {
        setUrlFromClipboard(text);
      }
    }
    getClipboardContent();
  }, []);

  function isValidUrl(string: string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  async function handleSubmit(values: { title: string; url: string; tags: string }) {
    try {
      const bookmarks = await getBookmarks();
      const newBookmark: Bookmark = {
        id: uuidv4(),
        title: values.title,
        url: values.url,
        tags: values.tags.split(",").map((tag) => tag.trim()),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveBookmarks([...bookmarks, newBookmark]);
      showToast(Toast.Style.Success, "书签已添加");
      popToRoot();
    } catch (error) {
      showToast(Toast.Style.Failure, "添加书签失败");
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="标题" />
      <Form.TextField id="url" title="URL" value={urlFromClipboard} onChange={setUrlFromClipboard} />
      <Form.TextField id="tags" title="标签" placeholder="用逗号分隔多个标签" />
    </Form>
  );
}
