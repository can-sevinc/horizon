# Comment templates

The workflows write these comments when you use a comment command (`/interview`, `/next`, ...),
and `added.md` on each new application. Change a file to change the comment: the next command
uses your version, and an update of Horizon keeps your changes.

In a template:

- `{{name}}`: a value, for example `{{date}}`. The note at the top of each file lists its values.
- `{{#name}}...{{/name}}`: shown only when the value is not empty.
- `{{^name}}...{{/name}}`: shown only when the value is empty.
- `<!-- ... -->` at the top: a note for you. It is not in the comment.

## Icons

`{{icon:NAME}}` puts an icon in the comment: `docs/assets/v1/icons/icon-NAME-light.svg` of Horizon, or
`icon-NAME-dark.svg` in the dark theme of Github. For example `### Next step {{icon:next}}`. The icons
load from Horizon's documentation site (`assetsUrl` in `config.yaml`), so they work in a private
copy too. The names: https://github.com/can-sevinc/horizon/tree/main/docs/assets/v1/icons

Keep `## Interview: DATE` at the start of the interview notes: the interview count reads it. Keep
the `**Next step:**` and `**Next date:**` lines and the offer field labels as they are. Put icons in
headings and status lines, not inside these lines.
