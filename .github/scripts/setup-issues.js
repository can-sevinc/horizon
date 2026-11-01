// The issues that the setup opens with the steps that only you can do (label "setup").
// The pictures are in docs/images.

const LABEL = "setup";
const PREPARE = "Prepare the board";
const BOOKMARK = "Add the bookmark";

// A picture of this repository, for an issue
const image = (repo, branch, file, alt) => `![${alt}](https://github.com/${repo}/blob/${branch}/docs/images/${file}?raw=true)`;

function prepare({ owner, repo, branch, projectUrl, viewUrls = {} }) {
  const img = (f, alt) => "  " + image(repo, branch, f, alt);
  // The name of a view, with a link to it
  const view = name => viewUrls[name] ? `**[${name}](${viewUrls[name]})**` : `**${name}**`;
  return [
    `@${owner} Github doesn't let workflows change these view settings, so please do them once by hand.`,
    `Click a view name below (Cmd+click on a Mac, Ctrl+click on Windows, to keep this issue open), ` +
      `or open the [project board](${projectUrl}) and pick the view. Then open its menu (the arrow next to the view name).`,
    "Click **Save** after each view.",
    "",
    `- [ ] ${view("Board")}`,
    "  - Sort by: **Last update**, new to old",
    "  - Field sum: **Count** and **Interviews**",
    "",
    img("board-view.png", "Board view settings"),
    "",
    `- [ ] ${view("Table")}`,
    "  - Sort by: **Applied date**, old to new",
    "",
    img("table-view.png", "Table view settings"),
    "",
    `- [ ] ${view("Interviews")}`,
    "  - Sort by: **Last update**, new to old",
    "  - Dates: start **Applied date**, end **Last update**",
    "  - Zoom level: **Year**",
    "",
    img("interviews-view.png", "Interviews view settings"),
    "",
    `- [ ] ${view("Summaries")}`,
    "  - Sort by: **Created**, new to old",
    "",
    img("summaries-view.png", "Summaries view settings"),
    "",
    "Close this issue when you are done.",
  ].join("\n");
}

function bookmark({ owner, repo, branch, bookmarklet }) {
  return [
    `@${owner} The bookmark saves a job post to your board in one click.`,
    "",
    "1. Copy this code:",
    "",
    "   ```",
    `   ${bookmarklet}`,
    "   ```",
    "",
    "2. In Chrome, show the bookmarks bar (Cmd+Shift+B on a Mac, Ctrl+Shift+B on Windows), right-click it and choose **Add page...**. " +
      "Name it `Add to application board`, paste the code as the URL, and click **Save**.",
    "",
    "   " + image(repo, branch, "add-bookmark.png", "Add bookmark in Chrome"),
    "",
    "   Other browsers work the same way: make a new bookmark and paste the code as its URL.",
    "",
    "3. Open a job post, for example on LinkedIn, and click the bookmark. Check the form and click **Create**. That's your first application.",
    "",
    `On your phone, use the [new application form](https://github.com/${repo}/issues/new?template=application.yaml) instead.`,
    "",
    "Close this issue when your first application is on the board.",
  ].join("\n");
}

module.exports = { LABEL, PREPARE, BOOKMARK, prepare, bookmark };
