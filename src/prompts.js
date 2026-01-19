import prompts from "prompts";
import { slugify, studlyCase, titleCase, getGitConfig } from "./utils.js";

export async function getModuleConfig(moduleName, options) {
  const gitName = getGitConfig("user.name");
  const gitEmail = getGitConfig("user.email");

  const questions = [];

  if (!moduleName) {
    questions.push({
      type: "text",
      name: "moduleName",
      message: "Module name",
      initial: "MyModule",
      validate: (value) => value.length > 0 || "Module name is required",
    });
  }

  if (!options.author) {
    questions.push({
      type: "text",
      name: "authorName",
      message: "Author name",
      initial: gitName || "Your Name",
    });
  }

  if (!options.email) {
    questions.push({
      type: "text",
      name: "authorEmail",
      message: "Author email",
      initial: gitEmail || "your@email.com",
    });
  }

  if (!options.vendor) {
    questions.push({
      type: "text",
      name: "vendorName",
      message: "Vendor name",
      initial: "Hunter",
    });
  }

  if (!options.namespace) {
    questions.push({
      type: "text",
      name: "vendorNamespace",
      message: "Vendor namespace",
      initial: (prev) => studlyCase(prev || options.vendor || "Hunter"),
    });
  }

  if (!options.description) {
    questions.push({
      type: "text",
      name: "description",
      message: "Package description",
      initial: (answers) => {
        const name = moduleName || answers.moduleName || "MyModule";
        return `The ${name} module for Hunter`;
      },
    });
  }

  if (!options.dir && !options.yes) {
    questions.push({
      type: "text",
      name: "directory",
      message: "Directory",
      initial: (answers) => {
        const name = moduleName || answers.moduleName || "my-module";
        return `./hunter-${slugify(name)}`;
      },
    });
  }

  const answers = await prompts(questions, {
    onCancel: () => {
      console.log("\nAborted.");
      process.exit(1);
    },
  });

  const finalModuleName = moduleName || answers.moduleName;
  const vendorName = options.vendor || answers.vendorName;

  return {
    authorName: options.author || answers.authorName,
    authorEmail: options.email || answers.authorEmail,
    vendorName,
    vendorSlug: slugify(vendorName),
    vendorNamespace:
      options.namespace || answers.vendorNamespace || studlyCase(vendorName),
    moduleName: finalModuleName,
    moduleSlug: slugify(finalModuleName),
    moduleTitle: titleCase(finalModuleName),
    studlyModuleName: studlyCase(finalModuleName),
    description: options.description || answers.description,
    directory:
      options.dir ||
      answers.directory ||
      `./hunter-${slugify(finalModuleName)}`,
  };
}

export async function confirmConfig(config) {
  console.log();
  console.log("  Summary:");
  console.log(
    `    Package:   ${config.vendorSlug}/hunter-${config.moduleSlug}`,
  );
  console.log(
    `    Namespace: ${config.vendorNamespace}\\${config.studlyModuleName}`,
  );
  console.log(`    Directory: ${config.directory}`);
  console.log();

  const { confirmed } = await prompts({
    type: "confirm",
    name: "confirmed",
    message: "Proceed?",
    initial: true,
  });

  return confirmed;
}

export async function askInstallDeps(skipPrompts = false) {
  if (skipPrompts) {
    return { composer: true, npm: true };
  }

  const { composer } = await prompts({
    type: "confirm",
    name: "composer",
    message: "Install composer dependencies?",
    initial: true,
  });

  const { npm } = await prompts({
    type: "confirm",
    name: "npm",
    message: "Install npm dependencies?",
    initial: true,
  });

  return { composer, npm };
}

export async function askStar(skipPrompts = false) {
  if (skipPrompts) {
    return false;
  }

  const { star } = await prompts({
    type: "confirm",
    name: "star",
    message: "Star the Hunter repo on GitHub?",
    initial: true,
  });

  return star;
}
