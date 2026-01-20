import degit from "degit";
import fs from "fs-extra";
import os from "os";
import path from "path";

const SKELETON_REPO = "akira-foundation/hunter-module-skeleton#1.x";

export async function downloadSkeleton(destination) {
  // Clear degit cache to ensure fresh download
  await clearDegitCache();

  const emitter = degit(SKELETON_REPO, {
    cache: false,
    force: true,
    verbose: false,
  });

  await emitter.clone(destination);
}

async function clearDegitCache() {
  const cacheDir = path.join(os.homedir(), ".degit");
  try {
    await fs.remove(cacheDir);
  } catch {
    // Ignore errors if cache doesn't exist
  }
}
