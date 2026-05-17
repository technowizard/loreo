import { describe, expect, it } from "vitest";

import { pageRows } from "./cursor.js";

describe("pageRows", () => {
	it("returns all rows when the result does not exceed the limit", () => {
		const rows = [{ id: "1" }, { id: "2" }];

		expect(pageRows(rows, 2)).toEqual({ items: rows, hasMore: false });
	});

	it("drops the extra row when the result exceeds the limit", () => {
		const rows = [{ id: "1" }, { id: "2" }, { id: "3" }];

		expect(pageRows(rows, 2)).toEqual({
			items: rows.slice(0, 2),
			hasMore: true,
		});
	});
});
