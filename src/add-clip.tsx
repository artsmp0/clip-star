import { Form, ActionPanel, Action, showToast, Toast, popToRoot, Clipboard } from "@raycast/api";
import { v4 as uuidv4 } from "uuid";
import { getBookmarks, saveBookmarks } from "./utils/storage";
import { Bookmark } from "./types";
import { useState, useEffect } from "react";
import { generateTitleAndTags } from "./utils/deepseeker";

export default function AddBookmark() {
  const [urlFromClipboard, setUrlFromClipboard] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function getClipboardContent() {
      const text = await Clipboard.readText();
      if (text && isValidUrl(text)) {
        setUrlFromClipboard(text);
        await generateTitleAndTagsForUrl(text);
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

  async function generateTitleAndTagsForUrl(url: string) {
    setIsLoading(true);
    try {
      const { title: generatedTitle, tags: generatedTags } = await generateTitleAndTags(url);
      setTitle(generatedTitle);
      setTags(generatedTags.join(", "));
    } catch (error) {
      console.log("error: ", error);
      showToast(Toast.Style.Failure, "生成标题和标签失败");
    } finally {
      setIsLoading(false);
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
      isLoading={isLoading}
    >
      <Form.TextField id="title" title="标题" value={title} onChange={setTitle} />
      <Form.TextField
        id="url"
        title="URL"
        value={urlFromClipboard}
        onChange={(newUrl) => {
          setUrlFromClipboard(newUrl);
        }}
      />
      <Form.TextField id="tags" title="标签" value={tags} onChange={setTags} placeholder="用逗号分隔多个标签" />
    </Form>
  );
}
