# create-hunter-module

CLI to scaffold Hunter modules from the official skeleton template.

## Usage

### Interactive mode

```bash
npx create-hunter-module
```

### With module name

```bash
npx create-hunter-module analytics
```

### With all options (non-interactive)

```bash
npx create-hunter-module analytics \
  --vendor acme \
  --namespace Acme \
  --author "John Doe" \
  --email "john@example.com" \
  --description "Analytics module for Hunter" \
  --yes
```

## Options

| Option                    | Description                   |
| ------------------------- | ----------------------------- |
| `--vendor <name>`         | Vendor name (e.g., Acme)      |
| `--namespace <namespace>` | Vendor namespace (e.g., Acme) |
| `--author <name>`         | Author name                   |
| `--email <email>`         | Author email                  |
| `--description <desc>`    | Package description           |
| `-y, --yes`               | Skip confirmation prompts     |
| `-V, --version`           | Output the version number     |
| `-h, --help`              | Display help                  |

## What it does

1. Downloads the [hunter-module-skeleton](https://github.com/akira-foundation/hunter-module-skeleton) from GitHub
2. Replaces all placeholders with your values
3. Renames files (ServiceProvider, Controller, config, etc.)
4. Initializes a git repository with branch `1.x`
5. Optionally installs composer and npm dependencies

## Example output

```
$ npx create-hunter-module analytics

  _   _             _
 | | | |_   _ _ __ | |_ ___ _ __
 | |_| | | | | '_ \| __/ _ \ '__|
 |  _  | |_| | | | | ||  __/ |
 |_| |_|\__,_|_| |_|\__\___|_|

  Create Hunter Module v1.0.0

? Author name: John Doe
? Author email: john@example.com
? Vendor name: Acme
? Vendor namespace: Acme
? Package description: Analytics module for Hunter
? Directory: ./hunter-analytics

  Summary:
    Package:   acme/hunter-analytics
    Namespace: Acme\Analytics
    Directory: ./hunter-analytics

? Proceed? Yes

✔ Downloaded skeleton from GitHub
✔ Replaced placeholders
✔ Renamed files
✔ Cleaned up
✔ Initialized git repository (branch: 1.x)

? Install composer dependencies? Yes
✔ Installed composer dependencies

? Install npm dependencies? Yes
✔ Installed npm dependencies

  ✨ Success! Created hunter-analytics

  Next steps:
    cd ./hunter-analytics
    composer test

  ────────────────────────────────────────

  ⭐ If you like Hunter, give us a star!
     https://github.com/akira-foundation/hunter-module-skeleton

  ────────────────────────────────────────

  Happy coding!
```

## Alternative installation methods

If you prefer not to use `npx`, you can also create a module using:

### GitHub Template

1. Go to [hunter-module-skeleton](https://github.com/akira-foundation/hunter-module-skeleton)
2. Click "Use this template"
3. Clone your new repository
4. Run `php configure.php`

### Git clone

```bash
git clone https://github.com/akira-foundation/hunter-module-skeleton hunter-my-module
cd hunter-my-module
php configure.php
```

## License

MIT
