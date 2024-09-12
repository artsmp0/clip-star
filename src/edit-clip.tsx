import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { Bookmark } from "./types";
import { updateBookmark } from "./utils/storage";

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
      showToast(Toast.Style.Success, "书签已更新");
      onEdit(updatedBookmark);
      pop();
    } catch (error) {
      showToast(Toast.Style.Failure, "更新书签失败");
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="更新书签" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="标题" value={title} onChange={setTitle} />
      <Form.TextField id="url" title="URL" value={url} onChange={setUrl} />
      <Form.TextField id="tags" title="标签" value={tags} onChange={setTags} />
    </Form>
  );
}

export function editBookmark(bookmark: Bookmark): Promise<Bookmark | null> {
  return new Promise((resolve) => {
    showToast(Toast.Style.Animated, "正在编辑书签...");
    <EditBookmarkForm
      bookmark={bookmark}
      onEdit={(updatedBookmark) => {
        resolve(updatedBookmark);
      }}
    />;
  });
}
