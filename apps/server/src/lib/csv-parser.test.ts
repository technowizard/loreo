import { describe, expect, it } from "vitest";

import { detectTagSeparator, parseTags } from "./csv-parser.js";

describe("CSV tag parsing", () => {
	it("defaults to comma when value is empty", () => {
		expect(detectTagSeparator("")).toBe(",");
	});

	it("detects the most common supported separator", () => {
		expect(detectTagSeparator("one|two|three")).toBe("|");
		expect(detectTagSeparator("one;two;three")).toBe(";");
		expect(detectTagSeparator("one,two,three")).toBe(",");
	});

	it("parses and trims tags", () => {
		expect(parseTags(" one | two |  | three ")).toEqual([
			"one",
			"two",
			"three",
		]);
	});

	it("returns an empty array for empty input", () => {
		expect(parseTags("")).toEqual([]);
	});
});
