import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "../src/settings";

describe("DEFAULT_SETTINGS", () => {
  it("has preferredTranslation ''", () => {
    expect(DEFAULT_SETTINGS.preferredTranslation).toBe("");
  });
});
