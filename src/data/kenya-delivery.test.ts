import { describe, expect, it } from "vitest";
import {
  getParcelTownNamesForCounty,
  KENYA_COUNTIES,
  TOWNS_BY_COUNTY,
} from "./kenya-delivery";

describe("Kenya nearest-town data", () => {
  it("covers every non-Nairobi county with multiple town options", () => {
    for (const county of KENYA_COUNTIES) {
      if (county === "Nairobi") continue;
      const towns = getParcelTownNamesForCounty(county);
      expect(towns.length, county).toBeGreaterThanOrEqual(5);
      expect(towns).not.toEqual([`${county} Town`]);
    }
  });

  it("includes curated Kiambu centres used at checkout", () => {
    const towns = getParcelTownNamesForCounty("Kiambu");
    for (const expected of [
      "Kimende",
      "Banana",
      "Wangige",
      "Ruaka",
      "Thika",
      "Ruiru",
    ]) {
      expect(towns).toContain(expected);
    }
  });

  it("lists major towns for metro and remote counties", () => {
    expect(getParcelTownNamesForCounty("Kajiado")).toEqual(
      expect.arrayContaining(["Kitengela", "Ngong", "Ongata Rongai"]),
    );
    expect(getParcelTownNamesForCounty("Machakos")).toEqual(
      expect.arrayContaining(["Machakos Town", "Athi River", "Mlolongo"]),
    );
    expect(getParcelTownNamesForCounty("Mandera")).toEqual(
      expect.arrayContaining(["Mandera Town", "El Wak", "Takaba"]),
    );
    expect(getParcelTownNamesForCounty("Trans Nzoia")).toContain("Kitale");
  });

  it("keeps town lists sorted and free of empty names", () => {
    for (const [county, towns] of Object.entries(TOWNS_BY_COUNTY)) {
      expect(towns.every((town) => town.trim().length > 0), county).toBe(true);
      expect([...towns].sort((a, b) => a.localeCompare(b, "en")), county).toEqual(
        [...towns],
      );
    }
  });
});
