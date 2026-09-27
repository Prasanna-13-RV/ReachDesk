import { describe, expect, it } from "vitest";
import { autoMapColumns, getUnmappedColumns } from "@/lib/excel/columnMapping";

describe("autoMapColumns", () => {
  it("maps the supplied Excel schema columns automatically", () => {
    const mapping = autoMapColumns([
      "title",
      "totalScore",
      "reviewsCount",
      "city",
      "state",
      "countryCode",
      "phone",
      "categories/0",
      "categories/1",
      "url",
      "categoryName",
      "unknownColumn",
    ]);

    expect(mapping.title).toBe("title");
    expect(mapping.totalScore).toBe("total_score");
    expect(mapping.reviewsCount).toBe("reviews_count");
    expect(mapping.countryCode).toBe("country_code");
    expect(mapping.phone).toBe("phone_raw");
    expect(mapping["categories/0"]).toBe("source_categories");
    expect(mapping["categories/1"]).toBe("source_categories");
    expect(mapping.url).toBe("source_url");
    expect(mapping.categoryName).toBe("category_name");
    expect(mapping.unknownColumn).toBeNull();
  });

  it("reports unmapped columns for manual mapping (FR-003)", () => {
    const mapping = autoMapColumns(["title", "mysteryColumn"]);
    expect(getUnmappedColumns(mapping)).toEqual(["mysteryColumn"]);
  });
});
