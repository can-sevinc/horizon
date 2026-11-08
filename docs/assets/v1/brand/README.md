# Horizon brand assets

## Divider alternatives and motion

`dividers/horizon-divider-options.png` compares four alternatives. Each comes as `-light.svg`, `-dark.svg`, and an adaptive `.svg` without a mode suffix:

- `horizon-divider-right`: the symbol at the right end of a long rule.
- `horizon-divider-large`: a larger symbol between two shorter rules.
- `horizon-divider-left`: the symbol at the left, followed by a long rule.
- `horizon-divider-raised`: the symbol above a full-width rule.
- `horizon-divider-offset`: the symbol about one third along the rule.
- `horizon-divider-double`: paired horizon lines around the symbol.

All six are transparent vectors at 640 units wide. The first four are in `dividers/horizon-divider-options.png`; the two later designs are in `dividers/horizon-divider-options-2.png`. Selected guides now use the right, left, large, offset, and double versions. The home page keeps the original divider.

`motion/horizon-road-light.gif` and `motion/horizon-road-dark.gif` animate only the symbol. The road bends smoothly as a curve moves toward the viewer. There are no moving lane markings. The sun stays in place and gently brightens within the yellow palette; the outer silhouette stays still. Each is 256 × 256 px, with 72 frames in a seamless 3.6-second loop. The backgrounds are warm white (#FAF8F2) and navy (#29334A), respectively. There is no wordmark.

Matching `horizon-road-light-still.png` and `horizon-road-dark-still.png` provide the original still symbol for a non-animated version. The GIFs can be displayed at 128 or 160 px wide in a README.

The same animation is available with the approved outlined wordmark:

| Layout | Light background | Dark background | Size |
| --- | --- | --- | --- |
| Wordmark on the right | `motion/horizon-logo-light.gif` | `motion/horizon-logo-dark.gif` | 608 × 256 px |
| Wordmark below | `motion/horizon-stacked-light.gif` | `motion/horizon-stacked-dark.gif` | 320 × 352 px |

The road and sun animate together with the symbol-only version. The wordmark stays still. Its Manrope outlines, weight, spacing, and approved light/dark colors are preserved. All four have 72 frames in the same 3.6-second loop, plus matching `-still.png` fallback images. Display the horizontal version at about 304 px wide and the stacked version at about 160 px wide for a small logo.

### Wide animated README banners

For a still banner with a transparent background, use `horizon-banner-light.svg` or `horizon-banner-dark.svg` in this directory. Both are 1080 × 256 units, with the original outlined logo centered and extra space at the sides. The Pages home page uses these banners and switches them with the site's theme control. The sidebar also uses the original still SVG logos.

`motion/horizon-banner-light.gif` and `motion/horizon-banner-dark.gif` are **1080 × 256 px**. They add 236 px of matching background on each side of the horizontal animation. The logo size, colors, and animation stay the same. Matching `-still.png` files are available too.

Use this in the root README. The banner fills the available width and shrinks on smaller screens:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/v1/brand/motion/horizon-banner-dark.gif">
  <img src="docs/assets/v1/brand/motion/horizon-banner-light.gif" alt="Horizon" width="100%">
</picture>
```

## Powered by horizon

`attribution/powered-by-horizon-light.svg` and `attribution/powered-by-horizon-dark.svg` are small **169 × 34 px** badges. They use the original symbol, the approved outlined wordmark, and a rounded background. All text is outlined, including “powered by”. No font download is needed.

`attribution/powered-by-horizon.svg` follows the browser's preferred color scheme. The `-light@2x.png` and `-dark@2x.png` files provide 338 × 68 px raster versions. Display those at 169 × 34 px. `powered-by-horizon-preview.png` compares the two backgrounds.

For a small clickable badge in Markdown:

```markdown
[![powered by horizon](https://can-sevinc.github.io/horizon/assets/v1/brand/attribution/powered-by-horizon.svg)](https://can-sevinc.github.io/horizon/)
```

For a site with its own theme switch, use the matching explicit light or dark file, as with the other logos. The assets are ready for use; no badge has been added to the site or templates yet.

## Files

`light` means **for a light background**; `dark` means **for a dark background**.

| Format | Light background | Dark background |
| --- | --- | --- |
| Horizontal | `horizon-logo-light.svg` | `horizon-logo-dark.svg` |
| Symbol only | `horizon-mark-light.svg` | `horizon-mark-dark.svg` |
| Symbol above wordmark | `horizon-stacked-light.svg` | `horizon-stacked-dark.svg` |
| Favicon | `horizon-favicon-light.svg` | `horizon-favicon-dark.svg` |

Additional favicon files:

- `favicon.svg`: changes the lower shape for the browser's preferred light/dark scheme. The sun stays yellow.
- `favicon.ico`: transparent 16, 32, and 48 px fallback images. The corners and road cutout contain no background fill. The site's favicon URLs include a version suffix so browsers refresh the old opaque fallback.
- `favicon-light-16.png`, `favicon-light-32.png`, `favicon-light-48.png` and the matching `dark` files: transparent PNG fallbacks.
- `apple-touch-icon.png`: 180 px icon with a light background.

`horizon-brand-preview.png` and `.svg` show all formats and an enlarged lettering detail. They are presentation sheets, not production logos.

## Typography and color

- Manrope variable font, weight **550**, outlined at 80 units.
- Base tracking **−1.6 units** (−0.02 em), with small optical adjustments after `r`, `i`, and `z`. The original Manrope `z` is retained. The gaps at `i–z` and `z–o` are opened slightly to preserve its diagonal shape at small sizes.
- The stacked wordmark uses exactly the same outlines and spacing, scaled uniformly.
- Sun: **#F2C85B** in both modes.
- Lower shape: **#40547D** for light backgrounds; **#8FA4D0** for dark backgrounds.
- Wordmark: **#36435C** for light backgrounds; **#FBF9F5** for dark backgrounds. These shades match the visible lettering in the approved Manrope comparison PNG. Its original renderer shifted the nominal source colors; the final files encode the approved visible shades directly.

The road uses an even-odd vector cutout rather than a painted white or dark stripe. It shows the actual background. All assets keep the selected First light silhouette.

## Github README

From the repository's root README, use the following. Github's theme fragments show one version at a time according to the selected Github theme.

```html
<p align="center">
  <a href="#gh-light-mode-only">
    <img src="docs/assets/v1/brand/horizon-logo-light.svg" alt="Horizon" width="360">
  </a>
  <a href="#gh-dark-mode-only">
    <img src="docs/assets/v1/brand/horizon-logo-dark.svg" alt="Horizon" width="360">
  </a>
</p>
```

For the stacked layout, replace `horizon-logo-` with `horizon-stacked-` and use a width of about 220 px. Use the `mark` version when no wordmark is needed.

## Github Pages / Jekyll

For a site whose theme follows the system light/dark preference:

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
          srcset="{{ '/assets/v1/brand/horizon-logo-dark.svg' | relative_url }}">
  <img src="{{ '/assets/v1/brand/horizon-logo-light.svg' | relative_url }}"
       alt="Horizon" width="360">
</picture>
```

If the site has a manual theme selector, choose the `light` or `dark` image from that selected theme instead. The separate files support either approach.

Add these favicon links to `docs/_includes/head_custom.html`. Jekyll's `relative_url` keeps them working under the `/horizon` project path.

```html
<link rel="icon" href="{{ '/assets/v1/brand/favicon.ico' | relative_url }}" sizes="16x16 32x32 48x48">
<link rel="icon" href="{{ '/assets/v1/brand/favicon.svg' | relative_url }}" type="image/svg+xml" sizes="any">
<link rel="apple-touch-icon" href="{{ '/assets/v1/brand/apple-touch-icon.png' | relative_url }}" sizes="180x180">
```

The root README uses the themed horizontal logo, six feature icons, a divider, and matching badges. The docs home page uses matching badges, navigation icons, and a divider. The favicon links above are provided for the site's head include; they have not been installed there.

## Logos with backgrounds

The original outlined logos are also available on padded, rounded background panels:

| Format | Light panel | Dark panel |
| --- | --- | --- |
| Horizontal | `horizon-logo-panel-light.svg` | `horizon-logo-panel-dark.svg` |
| Stacked | `horizon-stacked-panel-light.svg` | `horizon-stacked-panel-dark.svg` |
| Symbol | `horizon-mark-panel-light.svg` | `horizon-mark-panel-dark.svg` |

The light panel is **#FAF8F2**; the dark panel is **#29334A**. These preserve the finalized logo colors, outlines, proportions, and spacing. Use a panel when the logo needs its own background, such as in a card or image shared outside Github.

## Feature and documentation icons

The `icons/` directory contains twelve feature/documentation icons and eighteen additional template icons:

| Name | Use |
| --- | --- |
| `save` | Bookmark, add an application |
| `board` | Project board, automatic status updates |
| `commands` | Comment commands, update an application |
| `reminders` | Reminders and weekly summaries |
| `transfer` | Import, export, archive |
| `skills` | AI agent skills |
| `setup` | Create your copy, setup |
| `settings` | Configuration and repository files |
| `privacy` | Private application data |
| `updates` | Template updates |
| `sites` | Supported job boards |
| `help` | Troubleshooting |

Each has three versions: `icon-NAME-light.svg`, `icon-NAME-dark.svg`, and `icon-NAME.svg`. The last follows the browser's preferred color scheme. All are 48-unit vectors with 2.2-unit rounded strokes and yellow accents. Display them at **24 px** beside text or **48 px** in cards. The backgrounds are transparent. The preview sheet's colored tiles are not part of the icon files.

For example, from the root README:

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
          srcset="docs/assets/v1/icons/icon-save-dark.svg">
  <img src="docs/assets/v1/icons/icon-save-light.svg"
       alt="" width="24" height="24">
</picture>
```

Use `alt=""` when adjacent text already describes the feature. Give the image a descriptive `alt` if it supplies information on its own.

## Section dividers

`horizon-divider-light.svg` and `horizon-divider-dark.svg` combine a thin line with the existing Horizon symbol. `horizon-divider.svg` follows the browser's preferred color scheme. Their backgrounds are transparent. Use a width of **640 px**, or less on a narrower page. One divider between major sections is enough.

## Badge colors

Shields badge URLs use **`labelColor=36435C`** for the label and **`color=F2C85B`** for the value. This pairs the approved wordmark navy with the sun yellow. Keep the same pair across README and docs badges.

`horizon-toolkit-preview.png` and `.svg` show the panels, an illustrative badge, all twelve icons in both modes, and the dividers.

## Template icons

The template collection uses the same 48-unit grid, 2.2-unit rounded strokes, slate-blue colors, and yellow accents. Each name below has adaptive, `-light`, and `-dark` SVG versions in `icons/`.

| Name | Use |
| --- | --- |
| `interview` | Interview notes and interview commands |
| `questions` | What they asked |
| `learning` | What I asked / learned |
| `impression` | My impression and interest |
| `notes` | Additional notes |
| `next` | Next step |
| `offer` | Job offer |
| `salary` | Compensation |
| `benefits` | Benefits |
| `calendar` | Start date and answer deadline |
| `applied` | Applied status |
| `followup` | Sent follow-up |
| `hold` | On hold |
| `rejected` | Rejected |
| `withdraw` | Withdrawn |
| `redirect` | Redirected to another process |
| `period` | Job search period |
| `contact` | Recruiter / contact |

`horizon-template-icons-preview.png` and `.svg` show this collection in both modes. Icons are added to `templates/README.md`, the comment command list, interview sections, offer headings, and status comments. Salary, benefits, dates, contact details, and next-step field labels stay plain text because skills and workflows read them; the matching icons are available for other layouts.

Comment templates use absolute public Pages URLs, so the icons are independent of the private application's repository. Publish the assets with the docs site before using those image URLs in newly generated comments. Existing issue comments are not changed.
