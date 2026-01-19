import { execSync } from "node:child_process";

export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function studlyCase(str) {
  return str
    .replace(/[-_\s]+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

export function upperSnakeCase(str) {
  return str.replace(/[-\s]+/g, "_").toUpperCase();
}

export function getGitConfig(key) {
  try {
    return execSync(`git config ${key}`, { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

export function hasCommand(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function runCommand(cmd, cwd) {
  try {
    execSync(cmd, { cwd, stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}
