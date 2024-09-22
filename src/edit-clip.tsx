import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { Clip } from "./types";
import { updateClip } from "./utils/storage";

export function EditClipForm({ clip, onEdit }: { clip: Clip; onEdit: (updatedClip: Clip) => void }) {
  const [title, setTitle] = useState(clip.title);
  const [url, setUrl] = useState(clip.url);
  const [tags, setTags] = useState(clip.tags.join(", "));
  const [isLoading, setIsLoading] = useState(false);
  const { pop } = useNavigation();

  async function handleSubmit() {
    try {
      setIsLoading(true);
      const updatedClip: Clip = {
        ...clip,
        title,
        url,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== ""),
        updatedAt: new Date().toISOString(),
      };
      await updateClip(updatedClip);
      showToast(Toast.Style.Success, "Clip updated");
      onEdit(updatedClip);
      pop();
    } catch (error) {
      showToast(Toast.Style.Failure, "Failed to update clip");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      navigationTitle="Edit"
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Update Clip" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" value={title} onChange={setTitle} />
      <Form.TextField id="url" title="URL" value={url} onChange={setUrl} />
      <Form.TextField
        id="tags"
        title="Tags"
        value={tags}
        onChange={setTags}
        placeholder="Separate multiple tags with commas"
      />
    </Form>
  );
}

export function editClip(clip: Clip): Promise<Clip | null> {
  return new Promise((resolve) => {
    showToast(Toast.Style.Animated, "Editing clip...");
    <EditClipForm
      clip={clip}
      onEdit={(updatedClip) => {
        resolve(updatedClip);
      }}
    />;
  });
}
