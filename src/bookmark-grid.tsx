import { Grid, ActionPanel, Action, showToast, Toast, useNavigation, Icon, List } from "@raycast/api";
import { useState, useEffect } from "react";
import { getBookmarks, saveBookmarks } from "./utils/storage";
import { Bookmark } from "./types";
import { EditBookmarkForm } from "./edit-clip";

function getScreenshotUrl(url: string) {
  return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
}

function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
}: {
  bookmark: Bookmark;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Grid.Item
      content={{
        value: {
          source: getScreenshotUrl(bookmark.url),
          fallback: Icon.Globe,
        },
        tooltip: bookmark.title,
      }}
      title={bookmark.title}
      subtitle={bookmark.tags.join(", ")}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser url={bookmark.url} />
          <Action title="编辑" icon={Icon.Pencil} onAction={onEdit} />
          <Action title="删除" icon={Icon.Trash} onAction={onDelete} style={Action.Style.Destructive} />
        </ActionPanel>
      }
    ></Grid.Item>
  );
}

export default function BookmarkGrid() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { push } = useNavigation();

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
      showToast(Toast.Style.Failure, "加载书签失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const updatedBookmarks = bookmarks.filter((bookmark) => bookmark.id !== id);
      await saveBookmarks(updatedBookmarks);
      setBookmarks(updatedBookmarks);
      showToast(Toast.Style.Success, "书签已删除");
    } catch (error) {
      showToast(Toast.Style.Failure, "删除书签失败");
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
          showToast(Toast.Style.Success, "书签已更新");
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
      navigationTitle="书签"
      searchBarAccessory={
        <List.Dropdown
          tooltip="按标签过滤"
          storeValue={true}
          onChange={(newValue) => setSelectedTag(newValue === "all" ? null : newValue)}
        >
          <List.Dropdown.Item title="所有标签" value="all" />
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
        />
      ))}
    </Grid>
  );
}
