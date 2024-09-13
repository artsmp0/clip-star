import { Grid, ActionPanel, Action, showToast, Toast, useNavigation, Icon, List } from "@raycast/api";
import { useState, useEffect } from "react";
import { getClips, saveClips } from "./utils/storage";
import { Clip } from "./types";
import { EditClipForm } from "./edit-clip";
import { getLocalizedStrings } from "./utils/i18n";

function getScreenshotUrl(url: string) {
  return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
}

function ClipCard({
  clip,
  onEdit,
  onDelete,
  strings,
}: {
  clip: Clip;
  onEdit: () => void;
  onDelete: () => void;
  strings: ReturnType<typeof getLocalizedStrings>;
}) {
  return (
    <Grid.Item
      content={{
        value: {
          source: getScreenshotUrl(clip.url),
          fallback: Icon.Globe,
        },
        tooltip: "",
      }}
      title={clip.title}
      subtitle={clip.tags.join(", ")}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser url={clip.url} />
          <Action title={strings.edit} icon={Icon.Pencil} onAction={onEdit} />
          <Action title={strings.delete} icon={Icon.Trash} onAction={onDelete} style={Action.Style.Destructive} />
        </ActionPanel>
      }
    />
  );
}

export default function ClipGallery() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [filteredClips, setFilteredClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { push } = useNavigation();

  const strings = getLocalizedStrings();

  useEffect(() => {
    fetchClips();
  }, []);

  useEffect(() => {
    if (selectedTag) {
      setFilteredClips(clips.filter((clip) => clip.tags.includes(selectedTag)));
    } else {
      setFilteredClips(clips);
    }
  }, [selectedTag, clips]);

  async function fetchClips() {
    try {
      const fetchedClips = await getClips();
      setClips(fetchedClips);
      setFilteredClips(fetchedClips);
    } catch (error) {
      showToast(Toast.Style.Failure, strings.failedToLoadClips);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const updatedClips = clips.filter((clip) => clip.id !== id);
      await saveClips(updatedClips);
      setClips(updatedClips);
      showToast(Toast.Style.Success, strings.clipDeleted);
    } catch (error) {
      showToast(Toast.Style.Failure, strings.failedToDeleteClip);
    }
  }

  function handleEdit(clip: Clip) {
    push(
      <EditClipForm
        clip={clip}
        onEdit={async (updatedClip) => {
          const updatedClips = clips.map((c) => (c.id === updatedClip.id ? updatedClip : c));
          await saveClips(updatedClips);
          setClips(updatedClips);
          showToast(Toast.Style.Success, strings.clipUpdated);
        }}
      />,
    );
  }

  function getAllTags() {
    const tagSet = new Set<string>();
    clips.forEach((clip) => {
      clip.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }

  return (
    <Grid
      isLoading={isLoading}
      inset={Grid.Inset.Zero}
      columns={3}
      aspectRatio="3/2"
      fit={Grid.Fit.Fill}
      navigationTitle={strings.clips}
      searchBarAccessory={
        <List.Dropdown
          tooltip={strings.filterByTag}
          storeValue={true}
          onChange={(newValue) => setSelectedTag(newValue === "all" ? null : newValue)}
        >
          <List.Dropdown.Item title={strings.allTags} value="all" />
          {getAllTags().map((tag) => (
            <List.Dropdown.Item key={tag} title={tag} value={tag} />
          ))}
        </List.Dropdown>
      }
    >
      {filteredClips.map((clip) => (
        <ClipCard
          key={clip.id}
          clip={clip}
          onEdit={() => handleEdit(clip)}
          onDelete={() => handleDelete(clip.id)}
          strings={strings}
        />
      ))}
    </Grid>
  );
}
