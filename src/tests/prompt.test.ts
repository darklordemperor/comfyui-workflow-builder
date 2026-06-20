import { describe, expect, it } from "./test-api.ts";
import { buildPrompts, joinWaiPromptSections, previewPromptSections, resolveRequest } from "../index.ts";
import { makeRegistry, makeRequest } from "./fixtures.ts";

describe("request resolution and prompt assembly", () => {
  it("replaces female appearance", () => {
    const result = resolveRequest(makeRequest({ promptOverrides: { femaleAppearance: { replace: ["blue hair"] } } }), makeRegistry());
    expect(result.sections.female.appearance).toEqual(["blue hair"]);
  });

  it("appends and removes female appearance terms", () => {
    const appended = resolveRequest(makeRequest({ promptOverrides: { femaleAppearance: { append: ["tall"] } } }), makeRegistry());
    const removed = resolveRequest(makeRequest({ promptOverrides: { femaleAppearance: { remove: ["red eyes"] } } }), makeRegistry());
    expect(appended.sections.female.appearance).toEqual(["silver hair", "red eyes", "tall"]);
    expect(removed.sections.female.appearance).toEqual(["silver hair"]);
  });

  it("replaces generated males and validates their count", () => {
    const male = { id: "custom", appearance: ["masked"], clothing: [], position: [], additional: [] };
    expect(resolveRequest(makeRequest({ maleOverrides: [male] }), makeRegistry()).sections.males).toEqual([male]);
    expect(() => resolveRequest(makeRequest({ maleOverrides: [] }), makeRegistry())).toThrow("exactly 1");
  });

  it("generates stable male IDs", () => {
    const result = resolveRequest(makeRequest({ maleCount: 2, posePresetId: "trio" }), makeRegistry());
    expect(result.sections.males.map((male) => male.id)).toEqual(["male-1", "male-2"]);
  });

  it("sources interaction actions only from the pose", () => {
    const result = resolveRequest(makeRequest(), makeRegistry());
    expect(result.sections.interaction.femaleToMales).toEqual(["woman holding male-1 hand"]);
    expect(result.sections.interaction.malesToFemale).toEqual(["male-1 facing woman"]);
    expect(result.sections.males.every((male) => !("action" in male))).toBe(true);
  });

  it("replaces main pose without changing other interaction sections", () => {
    const result = resolveRequest(makeRequest({ promptOverrides: { mainPose: { replace: ["sitting"] } } }), makeRegistry());
    expect(result.sections.interaction.mainPose).toEqual(["sitting"]);
    expect(result.sections.interaction.femaleToMales).toEqual(["woman holding male-1 hand"]);
  });

  it("style and quality overrides remain isolated", () => {
    const style = resolveRequest(makeRequest({ stylePresetId: "ink" }), makeRegistry());
    const quality = resolveRequest(makeRequest({ promptOverrides: { quality: { replace: ["clean"] } } }), makeRegistry());
    expect(style.sections.interaction.mainPose).toEqual(["standing together"]);
    expect(style.sections.quality).toContain("masterpiece");
    expect(quality.sections.style).toContain("anime illustration");
    expect(quality.sections.female.identity).toContain("Claire");
  });

  it("places additional positive in master and additional negative in its own section", () => {
    const resolved = resolveRequest(makeRequest({ promptOverrides: {
      additionalPositive: { append: ["final positive"] },
      additionalNegative: { append: ["final negative"] },
    } }), makeRegistry());
    const built = buildPrompts(resolved);
    expect(resolved.waiSections.master.at(-1)).toBe("final positive");
    expect(built.positive.indexOf("1woman")).toBeGreaterThan(built.positive.indexOf("final positive"));
    expect(resolved.negativeSections.additionalNegative).toEqual(["final negative"]);
    expect(resolved.negativeSections.anatomy).not.toContain("final negative");
  });

  it("keeps pose negatives in the pose section", () => {
    const result = resolveRequest(makeRequest(), makeRegistry());
    expect(result.negativeSections.posePreset).toEqual(["incorrect pose"]);
    expect(result.negativeSections.quality).not.toContain("incorrect pose");
  });

  it("emits no extra commas and removes duplicate prompt terms", () => {
    const resolved = resolveRequest(makeRequest({ promptOverrides: { additionalPositive: { append: ["masterpiece", ""] } } }), makeRegistry());
    const built = buildPrompts(resolved);
    expect(built.positive).not.toMatch(/,,|,\s*$/);
    expect(built.positive.match(/masterpiece/g)).toHaveLength(1);
  });

  it("uses the exact WAI positive section order", () => {
    const resolved = resolveRequest(makeRequest({ promptOverrides: {
      femaleAdditional: { append: ["female extra"] }, background: { append: ["studio"] },
      additionalPositive: { append: ["last"] },
    } }), makeRegistry());
    const prompt = buildPrompts(resolved).positive;
    const terms = ["masterpiece", "anime illustration", "last", "claire_trigger", "formal_trigger", "anime_trigger", "couple_pose", "1woman", "silver hair", "white dress", "female extra", "bald man", "woman holding", "male-1 facing", "standing together", "close composition", "medium shot", "studio"];
    let cursor = -1;
    for (const term of terms) {
      const next = prompt.indexOf(term);
      expect(next).toBeGreaterThan(cursor);
      cursor = next;
    }
  });

  it("exposes exactly six WAI prompt sections with LoRA triggers isolated", () => {
    const preview = previewPromptSections(makeRequest(), makeRegistry());
    expect(Object.keys(preview.waiSections)).toEqual(["master", "triggerWords", "female", "male", "interactionPose", "background"]);
    for (const term of ["masterpiece", "anime illustration"]) expect(preview.waiSections.master).toContain(term);
    expect(preview.waiSections.triggerWords).toEqual(["claire_trigger", "formal_trigger", "anime_trigger", "couple_pose"]);
    for (const term of ["1woman", "silver hair"]) expect(preview.waiSections.female).toContain(term);
    expect(preview.waiSections.female).not.toContain("claire_trigger");
    for (const term of ["bald man", "plain black formal clothing"]) expect(preview.waiSections.male).toContain(term);
    for (const term of ["standing together", "medium shot"]) expect(preview.waiSections.interactionPose).toContain(term);
    expect(preview.waiSections.interactionPose).not.toContain("couple_pose");
    expect(preview.positivePrompt).toBe(joinWaiPromptSections(preview.waiSections));
  });

  it("normalizes WAI section overrides and deduplicates across sections", () => {
    const waiPromptSections = {
      master: ["masterpiece", ""],
      triggerWords: ["character_trigger"],
      female: ["1woman"],
      male: ["1man"],
      interactionPose: ["holding hands"],
      background: ["lobby", "masterpiece"],
    };
    const resolved = resolveRequest(makeRequest({ waiPromptSections }), makeRegistry());
    expect(resolved.waiSections).toEqual({ ...waiPromptSections, master: ["masterpiece"], background: ["lobby", "masterpiece"] });
    expect(buildPrompts(resolved).positive).toBe("masterpiece, character_trigger, 1woman, 1man, holding hands, lobby");
  });

  it("throws descriptive errors before section construction", () => {
    expect(() => resolveRequest(makeRequest({ posePresetId: "missing" }), makeRegistry())).toThrow("missing");
    expect(() => resolveRequest(makeRequest({ maleCount: 2 }), makeRegistry())).toThrow(/couple.*2 subjects.*3 subjects/);
  });

  it("does not mutate character or pose presets", () => {
    const registry = makeRegistry();
    const before = structuredClone(registry);
    resolveRequest(makeRequest({ promptOverrides: { mainPose: { append: ["changed"] }, femaleAppearance: { remove: ["red eyes"] } } }), registry);
    expect(registry).toEqual(before);
  });

  it("previews every positive and negative section", () => {
    const preview = previewPromptSections(makeRequest(), makeRegistry());
    expect(preview.positiveSectionBreakdown.map((section) => section.sectionName)).toEqual(["master", "triggerWords", "female", "male", "interactionPose", "background"]);
    expect(preview.negativeSectionBreakdown.map((section) => section.sectionName)).toEqual([
      "quality", "anatomy", "subjectCount", "identityLeakage", "maleSpecific", "interaction", "posePreset", "additionalNegative",
    ]);
  });

  it("swaps all pose-owned sections atomically", () => {
    const couple = resolveRequest(makeRequest(), makeRegistry());
    const trio = resolveRequest(makeRequest({ maleCount: 2, posePresetId: "trio" }), makeRegistry());
    expect(trio.loraStack.at(-1)?.fileName).toBe("trio.safetensors");
    expect(trio.sections.poseTrigger).toEqual(["trio_pose"]);
    expect(trio.sections.interaction.mainPose).not.toEqual(couple.sections.interaction.mainPose);
    expect(trio.sections.camera).toEqual(["wide shot"]);
    expect(trio.negativeSections.posePreset).toEqual(["incorrect trio pose"]);
  });
});
