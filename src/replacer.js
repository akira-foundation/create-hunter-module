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
  const replacements = {
    ":author_name": config.authorName,
    ":author_email": config.authorEmail,
    ":vendor_name": config.vendorName,
    ":vendor_slug": config.vendorSlug,
    ":VendorNamespace:": config.vendorNamespace,
    ":module_name": config.moduleName,
    ":module_slug": config.moduleSlug,
    ":StudlyModuleName:": config.studlyModuleName,
    ":package_description": config.description,
    ":MODULE_SLUG_UPPER_ENABLED": `${upperSnakeCase(config.moduleSlug)}_ENABLED`,
  };

  const files = await getAllFiles(directory);

  for (const file of files) {
    let content = await fs.readFile(file, "utf-8");
    let modified = false;

    for (const [placeholder, value] of Object.entries(replacements)) {
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
        ":StudlyModuleName:ServiceProvider.php",
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
        ":StudlyModuleName:Controller.php",
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
      from: path.join(directory, "config", ":module_slug.php"),
      to: path.join(directory, "config", `${config.moduleSlug}.php`),
    },
    {
      from: path.join(directory, "resources", "js", "pages", ":module_slug"),
      to: path.join(directory, "resources", "js", "pages", config.moduleSlug),
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
