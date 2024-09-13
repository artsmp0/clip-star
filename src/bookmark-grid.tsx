import { Grid, ActionPanel, Action, showToast, Toast, useNavigation, Icon, List } from "@raycast/api";
import { useState, useEffect } from "react";
import { getBookmarks, saveBookmarks } from "./utils/storage";
import { Bookmark } from "./types";
import { EditBookmarkForm } from "./edit-clip";
import { getLocalizedStrings } from "./utils/i18n";

// 导入本地化字符串
import en from "./locales/en.json";

type LocaleStrings = typeof en;

function getScreenshotUrl(url: string) {
  return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
}

function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  strings,
}: {
  bookmark: Bookmark;
  onEdit: () => void;
  onDelete: () => void;
  strings: LocaleStrings;
}) {
  return (
    <Grid.Item
      content={{
        value: {
          source: getScreenshotUrl(bookmark.url),
          fallback: Icon.Globe,
        },
        tooltip: "",
      }}
      title={bookmark.title}
      subtitle={bookmark.tags.join(", ")}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser url={bookmark.url} />
          <Action title={strings.edit} icon={Icon.Pencil} onAction={onEdit} />
          <Action title={strings.delete} icon={Icon.Trash} onAction={onDelete} style={Action.Style.Destructive} />
        </ActionPanel>
      }
    />
  );
}

export default function BookmarkGrid() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { push } = useNavigation();

  // 获取本地化字符串
  const strings = getLocalizedStrings();

  useEffect(() => {
    fetchBookmarks();
  }, []);

  useEffect(() => {
    if (selectedTag) {
      setFilteredBookmarks(bookmarks.filter((bookmark) => bookmark.tags.includes(selectedTag)));
    } else {
      setFilteredBookmarks(bookmarks);
    }
  }, [selectedTag, bookmarks]);

  async function fetchBookmarks() {
    try {
      const fetchedBookmarks = await getBookmarks();
      setBookmarks(fetchedBookmarks);
      setFilteredBookmarks(fetchedBookmarks);
    } catch (error) {
      showToast(Toast.Style.Failure, strings.failedToLoadBookmarks);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const updatedBookmarks = bookmarks.filter((bookmark) => bookmark.id !== id);
      await saveBookmarks(updatedBookmarks);
      setBookmarks(updatedBookmarks);
      showToast(Toast.Style.Success, strings.bookmarkDeleted);
    } catch (error) {
      showToast(Toast.Style.Failure, strings.failedToDeleteBookmark);
    }
  }

  function handleEdit(bookmark: Bookmark) {
    push(
      <EditBookmarkForm
        bookmark={bookmark}
        onEdit={async (updatedBookmark) => {
          const updatedBookmarks = bookmarks.map((b) => (b.id === updatedBookmark.id ? updatedBookmark : b));
          await saveBookmarks(updatedBookmarks);
          setBookmarks(updatedBookmarks);
          showToast(Toast.Style.Success, strings.bookmarkUpdated);
        }}
      />,
    );
  }

  function getAllTags() {
    const tagSet = new Set<string>();
    bookmarks.forEach((bookmark) => {
      bookmark.tags.forEach((tag) => tagSet.add(tag));
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
      navigationTitle={strings.bookmarks}
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
      {filteredBookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onEdit={() => handleEdit(bookmark)}
          onDelete={() => handleDelete(bookmark.id)}
          strings={strings}
        />
      ))}
    </Grid>
  );
}
