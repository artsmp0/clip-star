import { Form, ActionPanel, Action, showToast, Toast, popToRoot, Clipboard, confirmAlert } from "@raycast/api";
import { v4 as uuidv4 } from "uuid";
import { getClips, saveClips } from "./utils/storage";
import { Clip } from "./types";
import { useState, useEffect } from "react";
import { generateClipTitleAndTags } from "./utils/deepseeker";
import { getLocalizedStrings } from "./utils/i18n";

export default function AddClip() {
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
      const { title: generatedTitle, tags: generatedTags } = await generateClipTitleAndTags(url);
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
      const clips = await getClips();
      const existingClip = clips.find((clip) => clip.url === values.url);

      if (existingClip) {
        const options = {
          title: strings.clipAlreadyExists,
          message: strings.clipAlreadyExistsMessage,
          primaryAction: {
            title: strings.update,
            onAction: () => updateExistingClip(existingClip, values),
          },
          dismissAction: {
            title: strings.cancel,
            onAction: () => {},
          },
        };
        await confirmAlert(options);
      } else {
        await addNewClip(values);
      }
    } catch (error) {
      showToast(Toast.Style.Failure, strings.failedToAddClip);
    }
  }

  async function addNewClip(values: { title: string; url: string; tags: string }) {
    const clips = await getClips();
    const newClip: Clip = {
      id: uuidv4(),
      title: values.title,
      url: values.url,
      tags: values.tags.split(",").map((tag) => tag.trim()),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveClips([...clips, newClip]);
    showToast(Toast.Style.Success, strings.clipAdded);
    popToRoot();
  }

  async function updateExistingClip(existingClip: Clip, values: { title: string; url: string; tags: string }) {
    const clips = await getClips();
    const updatedClip: Clip = {
      ...existingClip,
      title: values.title,
      tags: values.tags.split(",").map((tag) => tag.trim()),
      updatedAt: Date.now(),
    };
    const updatedClips = clips.map((clip) => (clip.id === existingClip.id ? updatedClip : clip));
    await saveClips(updatedClips);
    showToast(Toast.Style.Success, strings.clipUpdated);
    popToRoot();
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
