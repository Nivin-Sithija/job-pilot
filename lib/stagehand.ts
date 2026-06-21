import { Stagehand } from "@browserbasehq/stagehand";

// Factory only — caller owns init()/close(). One short-lived local Chromium instance per
// research request, never reused across requests. `headless: true` is mandatory for server
// contexts — never flip to false outside local debugging, there is no display to render to.
export function createLocalStagehand(): Stagehand {
  return new Stagehand({
    env: "LOCAL",
    model: { modelName: "google/gemini-2.5-flash", apiKey: process.env.GEMINI_API_KEY! },
    localBrowserLaunchOptions: { headless: true },
  });
}
