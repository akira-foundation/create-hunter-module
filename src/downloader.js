import degit from "degit";

const SKELETON_REPO = "akira-foundation/hunter-module-skeleton";

export async function downloadSkeleton(destination) {
  const emitter = degit(SKELETON_REPO, {
    cache: false,
    force: true,
    verbose: false,
  });

  await emitter.clone(destination);
}
