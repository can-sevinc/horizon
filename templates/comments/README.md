# Comment templates

The workflows write these comments when you use a comment command (`/interview`, `/next`, ...),
and `added.md` on each new application. Change a file to change the comment: the next command
uses your version, and an update of Horizon keeps your changes.

In a template:

- `{{name}}`: a value, for example `{{date}}`. The note at the top of each file lists its values.
- `{{#name}}...{{/name}}`: shown only when the value is not empty.
- `{{^name}}...{{/name}}`: shown only when the value is empty.
- `<!-- ... -->` at the top: a note for you. It is not in the comment.
