import fs from "fs-extra";
import path from "path";
import { upperSnakeCase } from "./utils.js";

const EXCLUDED_PATTERNS = [
  "node_modules",
  "vendor",
  ".git",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
];

const WINDOWS_PLACEHOLDER_CHAR = "\uf03a";
const IS_WINDOWS = process.platform === "win32";

function placeholderToken(token) {
  return IS_WINDOWS ? token.replaceAll(":", WINDOWS_PLACEHOLDER_CHAR) : token;
}

function placeholderVariants(token) {
  return IS_WINDOWS
    ? [token, token.replaceAll(":", WINDOWS_PLACEHOLDER_CHAR)]
    : [token];
}

function shouldProcessFile(filePath) {
  return !EXCLUDED_PATTERNS.some((pattern) => filePath.includes(pattern));
}

async function getAllFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_PATTERNS.includes(entry.name)) {
        files.push(...(await getAllFiles(fullPath)));
      }
    } else if (entry.isFile() && shouldProcessFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function replacePlaceholders(directory, config) {
  const replacementEntries = [
    [":author_name", config.authorName],
    [":author_email", config.authorEmail],
    [":vendor_name", config.vendorName],
    [":vendor_slug", config.vendorSlug],
    [":VendorNamespace:", config.vendorNamespace],
    [":module_name", config.moduleName],
    [":module_slug", config.moduleSlug],
    [":module_title", config.moduleTitle],
    [":StudlyModuleName:", config.studlyModuleName],
    [":package_description", config.description],
    [
      ":MODULE_SLUG_UPPER_ENABLED",
      `${upperSnakeCase(config.moduleSlug)}_ENABLED`,
    ],
  ];

  const replacements = new Map();
  for (const [token, value] of replacementEntries) {
    for (const variant of placeholderVariants(token)) {
      replacements.set(variant, value);
    }
  }

  const files = await getAllFiles(directory);

  for (const file of files) {
    let content = await fs.readFile(file, "utf-8");
    let modified = false;

    for (const [placeholder, value] of replacements.entries()) {
      if (content.includes(placeholder)) {
        content = content.split(placeholder).join(value);
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(file, content);
    }
  }
}

export async function renameFiles(directory, config) {
  const renames = [
    {
      from: path.join(
        directory,
        "src",
        `${placeholderToken(":StudlyModuleName:")}ServiceProvider.php`,
      ),
      to: path.join(
        directory,
        "src",
        `${config.studlyModuleName}ServiceProvider.php`,
      ),
    },
    {
      from: path.join(
        directory,
        "src",
        "Http",
        "Controllers",
        `${placeholderToken(":StudlyModuleName:")}Controller.php`,
      ),
      to: path.join(
        directory,
        "src",
        "Http",
        "Controllers",
        `${config.studlyModuleName}Controller.php`,
      ),
    },
    {
      from: path.join(
        directory,
        "config",
        `${placeholderToken(":module_slug")}.php`,
      ),
      to: path.join(directory, "config", `${config.moduleSlug}.php`),
    },
    {
      from: path.join(
        directory,
        "routes",
        `${placeholderToken(":module_slug")}.php`,
      ),
      to: path.join(directory, "routes", `${config.moduleSlug}.php`),
    },
    {
      from: path.join(
        directory,
        "resources",
        "js",
        "pages",
        placeholderToken(":StudlyModuleName:"),
      ),
      to: path.join(
        directory,
        "resources",
        "js",
        "pages",
        config.studlyModuleName,
      ),
    },
  ];

  for (const { from, to } of renames) {
    if (await fs.pathExists(from)) {
      await fs.rename(from, to);
    }
  }
}

export async function removeConfigureScript(directory) {
  const configurePath = path.join(directory, "configure.php");

  if (await fs.pathExists(configurePath)) {
    await fs.remove(configurePath);
  }
}

export async function addDevRuntimeToGitignore(directory) {
  const gitignorePath = path.join(directory, ".gitignore");

  if (await fs.pathExists(gitignorePath)) {
    let content = await fs.readFile(gitignorePath, "utf-8");

    // Add dev runtime files if not already present
    if (!content.includes("dev/vendor")) {
      content += `
# Dev environment runtime files
/dev/vendor
/dev/node_modules
/dev/.env
/dev/composer.lock
/dev/package-lock.json
/dev/public/build
/dev/database/*.sqlite
`;
      await fs.writeFile(gitignorePath, content);
    }
  }
}
