import { Form, ActionPanel, Action, showToast, Toast, popToRoot, Clipboard } from "@raycast/api";
import { v4 as uuidv4 } from "uuid";
import { getBookmarks, saveBookmarks } from "./utils/storage";
import { Bookmark } from "./types";
import { useState, useEffect } from "react";
import { generateTitleAndTags } from "./utils/deepseeker";
import { getLocalizedStrings } from "./utils/i18n";

export default function AddBookmark() {
  const [urlFromClipboard, setUrlFromClipboard] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 获取本地化字符串
  const strings = getLocalizedStrings();

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
      showToast(Toast.Style.Failure, strings.generateTitleAndTagsFailed);
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
      showToast(Toast.Style.Success, strings.bookmarkAdded);
      popToRoot();
    } catch (error) {
      showToast(Toast.Style.Failure, strings.failedToAddBookmark);
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
      <Form.TextField id="title" title={strings.title} value={title} onChange={setTitle} />
      <Form.TextField
        id="url"
        title={strings.url}
        value={urlFromClipboard}
        onChange={(newUrl) => {
          setUrlFromClipboard(newUrl);
        }}
      />
      <Form.TextField
        id="tags"
        title={strings.tags}
        value={tags}
        onChange={setTags}
        placeholder={strings.separateTagsWithComma}
      />
    </Form>
  );
}
