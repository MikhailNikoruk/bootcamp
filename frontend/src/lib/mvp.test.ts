import { describe, expect, it } from "vitest";
import { filterVenuesForStep, formatPercent, getOccupancyLevel } from "./mvp";

describe("mvp utils", () => {
  it("calculates occupancy level", () => {
    expect(getOccupancyLevel(2, 20)).toBe("low");
    expect(getOccupancyLevel(8, 20)).toBe("medium");
    expect(getOccupancyLevel(16, 20)).toBe("high");
  });

  it("filters venues by sport and district", () => {
    const data = [
      { id: "a", sports: ["football"], district: "Центр" },
      { id: "b", sports: ["running"], district: "Север" },
    ];

    const result = filterVenuesForStep(data as any, "football", "Центр");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("a");
  });

  it("formats occupancy to percent", () => {
    expect(formatPercent(5, 20)).toBe(25);
    expect(formatPercent(20, 20)).toBe(100);
  });
});
