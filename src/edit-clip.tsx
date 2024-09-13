import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { Bookmark } from "./types";
import { updateBookmark } from "./utils/storage";
import { getLocalizedStrings } from "./utils/i18n";

export function EditBookmarkForm({
  bookmark,
  onEdit,
}: {
  bookmark: Bookmark;
  onEdit: (updatedBookmark: Bookmark) => void;
}) {
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [tags, setTags] = useState(bookmark.tags.join(", "));
  const { pop } = useNavigation();

  // 获取本地化字符串
  const strings = getLocalizedStrings();

  async function handleSubmit() {
    try {
      const updatedBookmark: Bookmark = {
        ...bookmark,
        title,
        url,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== ""),
      };
      await updateBookmark(updatedBookmark);
      showToast(Toast.Style.Success, strings.bookmarkUpdated);
      onEdit(updatedBookmark);
      pop();
    } catch (error) {
      showToast(Toast.Style.Failure, strings.failedToUpdateBookmark);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title={strings.updateBookmark} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title={strings.title} value={title} onChange={setTitle} />
      <Form.TextField id="url" title={strings.url} value={url} onChange={setUrl} />
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

export function editBookmark(bookmark: Bookmark): Promise<Bookmark | null> {
  return new Promise((resolve) => {
    const strings = getLocalizedStrings();
    showToast(Toast.Style.Animated, strings.editingBookmark);
    <EditBookmarkForm
      bookmark={bookmark}
      onEdit={(updatedBookmark) => {
        resolve(updatedBookmark);
      }}
    />;
  });
}
