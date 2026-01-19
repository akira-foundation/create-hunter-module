import { program } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs-extra";
import { execSync } from "node:child_process";

import {
  getModuleConfig,
  confirmConfig,
  askInstallDeps,
  askStar,
} from "./prompts.js";
import { downloadSkeleton } from "./downloader.js";
import {
  replacePlaceholders,
  renameFiles,
  removeConfigureScript,
  addWorkbenchToGitignore,
} from "./replacer.js";
import { runCommand, hasCommand } from "./utils.js";

const VERSION = "1.0.0";
const SKELETON_REPO_URL =
  "https://github.com/akira-foundation/hunter-module-skeleton";

function terminalLink(url, text = url) {
  return `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`;
}

function showBanner() {
  console.log();
  console.log(chalk.cyan(`  _   _             _            `));
  console.log(chalk.cyan(` | | | |_   _ _ __ | |_ ___ _ __ `));
  console.log(chalk.cyan(` | |_| | | | | '_ \\| __/ _ \\ '__|`));
  console.log(chalk.cyan(` |  _  | |_| | | | | ||  __/ |   `));
  console.log(chalk.cyan(` |_| |_|\\__,_|_| |_|\\__\\___|_|   `));
  console.log();
  console.log(chalk.gray(`  Create Hunter Module v${VERSION}`));
  console.log();
}

function showSuccess(config) {
  console.log();
  console.log(
    chalk.green(
      `  ✨ Success! Created ${chalk.bold(`hunter-${config.moduleSlug}`)}`,
    ),
  );
  console.log();
  console.log("  Next steps:");
  console.log(chalk.cyan(`    cd ${config.directory}`));
  console.log(chalk.cyan("    composer test"));
  console.log();
}

function showStarPrompt() {
  console.log(chalk.gray("  ────────────────────────────────────────"));
  console.log();
  console.log(chalk.yellow(`  ⭐ If you like Hunter, give us a star!`));
  console.log(chalk.gray(`     ${terminalLink(SKELETON_REPO_URL)}`));
  console.log();
  console.log(chalk.gray("  ────────────────────────────────────────"));
  console.log();
}

async function openUrl(url) {
  const platform = process.platform;

  try {
    if (platform === "darwin") {
      execSync(`open ${url}`, { stdio: "ignore" });
    } else if (platform === "win32") {
      execSync(`start ${url}`, { stdio: "ignore" });
    } else {
      execSync(`xdg-open ${url}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

export async function run() {
  program
    .name("create-hunter-module")
    .description(
      "CLI to scaffold Hunter modules from the official skeleton template",
    )
    .version(VERSION)
    .argument("[module-name]", "Name of the module to create")
    .option("--vendor <name>", "Vendor name")
    .option("--namespace <namespace>", "Vendor namespace")
    .option("--author <name>", "Author name")
    .option("--email <email>", "Author email")
    .option("--description <desc>", "Package description")
    .option("--dir <directory>", "Target directory")
    .option("-y, --yes", "Skip confirmation prompts and use defaults")
    .parse();

  const moduleName = program.args[0];
  const options = program.opts();

  showBanner();

  // Get configuration from prompts or flags
  const config = await getModuleConfig(moduleName, options);

  // Confirm configuration (skip if --yes)
  if (!options.yes) {
    const confirmed = await confirmConfig(config);
    if (!confirmed) {
      console.log(chalk.red("\n  Aborted."));
      process.exit(1);
    }
  }

  console.log();

  // Resolve absolute path
  const targetDir = path.resolve(process.cwd(), config.directory);

  // Check if directory exists
  if (await fs.pathExists(targetDir)) {
    const files = await fs.readdir(targetDir);
    if (files.length > 0) {
      console.log(
        chalk.red(`  Error: Directory ${config.directory} is not empty.`),
      );
      process.exit(1);
    }
  }

  // Download skeleton
  const downloadSpinner = ora("Downloading skeleton...").start();
  try {
    await downloadSkeleton(targetDir);
    downloadSpinner.succeed("Downloaded skeleton");
  } catch (error) {
    downloadSpinner.fail("Failed to download skeleton");
    console.error(chalk.red(`  ${error.message}`));
    process.exit(1);
  }

  // Replace placeholders
  const replaceSpinner = ora("Replacing placeholders...").start();
  try {
    await replacePlaceholders(targetDir, config);
    replaceSpinner.succeed("Replaced placeholders");
  } catch (error) {
    replaceSpinner.fail("Failed to replace placeholders");
    console.error(chalk.red(`  ${error.message}`));
    process.exit(1);
  }

  // Rename files
  const renameSpinner = ora("Renaming files...").start();
  try {
    await renameFiles(targetDir, config);
    renameSpinner.succeed("Renamed files");
  } catch (error) {
    renameSpinner.fail("Failed to rename files");
    console.error(chalk.red(`  ${error.message}`));
    process.exit(1);
  }

  // Remove configure.php (not needed when using CLI)
  const cleanupSpinner = ora("Cleaning up...").start();
  try {
    await removeConfigureScript(targetDir);
    await addWorkbenchToGitignore(targetDir);
    cleanupSpinner.succeed("Cleaned up");
  } catch (error) {
    cleanupSpinner.fail("Failed to clean up");
  }

  // Initialize git
  const gitSpinner = ora("Initializing git repository...").start();
  try {
    execSync("git init -b 1.x", { cwd: targetDir, stdio: "ignore" });
    gitSpinner.succeed("Initialized git repository (branch: 1.x)");
  } catch (error) {
    gitSpinner.fail("Failed to initialize git");
  }

  // Ask about installing dependencies
  console.log();
  const deps = await askInstallDeps(options.yes);

  if (deps.composer && hasCommand("composer")) {
    const composerSpinner = ora("Installing composer dependencies...").start();
    const success = runCommand("composer install --quiet", targetDir);
    if (success) {
      composerSpinner.succeed("Installed composer dependencies");
    } else {
      composerSpinner.fail("Failed to install composer dependencies");
    }
  }

  if (deps.npm && hasCommand("npm")) {
    const npmSpinner = ora("Installing npm dependencies...").start();
    const success = runCommand("npm install --silent", targetDir);
    if (success) {
      npmSpinner.succeed("Installed npm dependencies");
    } else {
      npmSpinner.fail("Failed to install npm dependencies");
    }
  }

  // Show success message
  showSuccess(config);

  // Ask about starring
  showStarPrompt();

  const wantsStar = await askStar(options.yes);
  if (wantsStar) {
    const opened = await openUrl(SKELETON_REPO_URL);
    if (opened) {
      console.log(chalk.green("  Thanks for your support!"));
    } else {
      console.log(chalk.gray(`  Visit: ${terminalLink(SKELETON_REPO_URL)}`));
    }
  }

  console.log();
  console.log(chalk.cyan("  Happy coding!"));
  console.log();
}
