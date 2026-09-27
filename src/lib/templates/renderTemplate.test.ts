import { describe, expect, it } from "vitest";
import { renderTemplate } from "@/lib/templates/renderTemplate";

describe("renderTemplate", () => {
  it("resolves known placeholders", () => {
    const result = renderTemplate("Hi {{title}} in {{city}}", {
      title: "Acme",
      city: "Austin",
    });
    expect(result.text).toBe("Hi Acme in Austin");
    expect(result.missingPlaceholders).toEqual([]);
    expect(result.unknownPlaceholders).toEqual([]);
  });

  it("reports missing placeholder values without throwing", () => {
    const result = renderTemplate("Hi {{title}}, based in {{city}}", { title: "Acme" });
    expect(result.text).toBe("Hi Acme, based in ");
    expect(result.missingPlaceholders).toEqual(["city"]);
  });

  it("reports unknown placeholders and does not resolve them", () => {
    const result = renderTemplate("Hi {{title}} {{unknownField}}", { title: "Acme" });
    expect(result.text).toBe("Hi Acme ");
    expect(result.unknownPlaceholders).toEqual(["unknownField"]);
  });

  it("does not mutate the original template string", () => {
    const template = "Hi {{title}}";
    renderTemplate(template, { title: "Acme" });
    expect(template).toBe("Hi {{title}}");
  });
});
