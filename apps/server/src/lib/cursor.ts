import { Buffer } from "node:buffer";

export interface CursorData {
	createdAt: string;
	id: string;
}

export function encodeCursor(data: CursorData): string {
	const json = JSON.stringify(data);
	return Buffer.from(json).toString("base64url");
}

export function decodeCursor(cursor: string): CursorData {
	try {
		const json = Buffer.from(cursor, "base64url").toString("utf8");
		const data = JSON.parse(json);

		// Validate cursor data structure
		if (!data.createdAt || typeof data.createdAt !== "string") {
			throw new Error("Invalid cursor: missing or invalid createdAt");
		}

		if (!data.id || typeof data.id !== "string") {
			throw new Error("Invalid cursor: missing or invalid id");
		}

		return data;
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new Error("Invalid cursor: malformed JSON");
		}
		if (error instanceof TypeError) {
			throw new Error("Invalid cursor: invalid base64 encoding");
		}
		throw error;
	}
}

export function extractCursor(
	items: Array<{ createdAt: string; id: string }>,
): string | undefined {
	if (items.length === 0) {
		return undefined;
	}

	const lastItem = items.at(-1);

	if (lastItem) {
		if (!lastItem.createdAt || !lastItem.id) {
			return undefined;
		}

		return encodeCursor({
			createdAt: lastItem.createdAt,
			id: lastItem.id,
		});
	}
}

export function isValidCursor(cursor: string): boolean {
	try {
		decodeCursor(cursor);
		return true;
	} catch {
		return false;
	}
}

export function createCursorCondition(
	cursor?: string,
	direction: "forward" | "backward" = "forward",
): { condition: string; params: any[] } {
	if (!cursor) {
		return { condition: "", params: [] };
	}

	const cursorData = decodeCursor(cursor);

	if (direction === "forward") {
		return {
			condition: `(created_at < ? OR (created_at = ? AND id < ?))`,
			params: [cursorData.createdAt, cursorData.createdAt, cursorData.id],
		};
	}

	return {
		condition: `(created_at > ? OR (created_at = ? AND id > ?))`,
		params: [cursorData.createdAt, cursorData.createdAt, cursorData.id],
	};
}

export function pageRows<T>(
	rows: T[],
	limit: number,
): { items: T[]; hasMore: boolean } {
	const hasMore = rows.length > limit;
	const items = hasMore ? rows.slice(0, limit) : rows;

	return { items, hasMore };
}
