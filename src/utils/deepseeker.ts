import OpenAI from "openai";
import axios from "axios";
import { load } from "cheerio";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: "sk-27f37c84dbac434cb051a1b1020d9101",
});

async function getWebsiteInfo(url: string): Promise<{ title: string; description: string }> {
  try {
    const response = await axios.get(url);
    const $ = load(response.data);
    const title = $("title").text().trim() || "";
    const description = $('meta[name="description"]').attr("content") || "";
    return { title, description };
  } catch (error) {
    console.error("Error fetching website info:", error);
    return { title: "", description: "" };
  }
}

export async function generateTitleAndTags(url: string): Promise<{ title: string; tags: string[] }> {
  const { title, description } = await getWebsiteInfo(url);

  const response = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant specialized in generating concise titles and relevant resource type tags for URLs. Focus on categorizing the content type and format. If no content is available, summarize the URL itself. Your native language is Chinese, respond in Chinese.",
      },
      {
        role: "user",
        content: `Generate a concise title and 2-5 relevant tags for this URL: ${url}
          Website title: ${title}
          Website description: ${description}
          Tags should focus on resource types such as: documentation, software, video, article, tutorial, tool, blog, podcast, course, ebook, research paper, forum, database, API, framework, library, app, game, etc.
          If the URL is a Twitter/X post, extract the main topic or theme of the tweet. Use 'tweet' as one of the tags and focus on the content type (e.g., news, opinion, announcement, etc.).
          If no content is available, summarize the URL itself.
          Respond in JSON format with 'title' and 'tags' keys.`,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (content) {
    const { title, tags } = JSON.parse(content.replaceAll("```json", "").replaceAll("```", "").trim());
    return { title, tags };
  } else {
    throw new Error("Failed to generate title and tags");
  }
}
