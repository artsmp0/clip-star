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

function customSearch(clip: Clip, searchText: string): boolean {
  const searchLower = searchText.toLowerCase();
  const titleLower = clip.title.toLowerCase();
  const urlLower = clip.url.toLowerCase();
  const tagsLower = clip.tags.map((tag) => tag.toLowerCase());

  // 检查完整匹配
  if (
    titleLower.includes(searchLower) ||
    urlLower.includes(searchLower) ||
    tagsLower.some((tag) => tag.includes(searchLower))
  ) {
    return true;
  }

  // 检查首字母缩写匹配
  const titleWords = titleLower.split(/\s+/);
  const titleAcronym = titleWords.map((word) => word[0]).join("");
  if (titleAcronym.includes(searchLower)) {
    return true;
  }

  // 检查连续子序列匹配
  const isSubsequence = (str: string, sub: string) => {
    let j = 0;
    for (let i = 0; i < str.length && j < sub.length; i++) {
      if (str[i] === sub[j]) j++;
    }
    return j === sub.length;
  };

  if (isSubsequence(titleLower, searchLower) || isSubsequence(urlLower, searchLower)) {
    return true;
  }

  return false;
}

export default function ClipGallery({ initialFilterUrl }: { initialFilterUrl?: string }) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [filteredClips, setFilteredClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchText, setSearchText] = useState(initialFilterUrl || "");
  const { push } = useNavigation();

  const strings = getLocalizedStrings();

  useEffect(() => {
    fetchClips();
  }, []);

  useEffect(() => {
    if (selectedTag) {
      setFilteredClips(clips.filter((clip) => clip.tags.includes(selectedTag)));
    } else if (searchText) {
      setFilteredClips(clips.filter((clip) => customSearch(clip, searchText)));
    } else {
      setFilteredClips(clips);
    }
  }, [selectedTag, searchText, clips]);

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
      filtering={false}
      onSearchTextChange={setSearchText}
      columns={3}
      aspectRatio="3/2"
      fit={Grid.Fit.Fill}
      navigationTitle={strings.clips}
      searchText={searchText}
      searchBarAccessory={
        <List.Dropdown
          tooltip={strings.filterByTag}
          storeValue={true}
          onChange={(newValue) => {
            setSelectedTag(newValue === "all" ? null : newValue);
            setSearchText("");
          }}
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
