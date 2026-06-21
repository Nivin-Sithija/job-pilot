import { Stagehand } from "@browserbasehq/stagehand";

// Factory only — caller owns init()/close(). One short-lived local Chromium instance per
// research request, never reused across requests. `headless: true` is mandatory for server
// contexts — never flip to false outside local debugging, there is no display to render to.
export function createLocalStagehand(): Stagehand {
  return new Stagehand({
    env: "LOCAL",
    model: { modelName: "google/gemini-2.5-flash", apiKey: process.env.GEMINI_API_KEY! },
    localBrowserLaunchOptions: {
      headless: true,
      // The deployed container runs Chromium as root with no extra Docker capabilities
      // (no --cap-add=SYS_ADMIN, no custom seccomp profile) — Chromium's own setuid sandbox
      // needs one of those to work, so it's disabled here. The container boundary is the
      // sandbox in this deployment, same tradeoff Puppeteer's own Docker docs document.
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });
}
