/**
 * Safe JSON fetch helper for client-side API calls.
 * Checks response.ok before parsing, returns a structured error on failure.
 */
export async function safeJsonFetch(
	url: string,
	options?: RequestInit,
): Promise<{ data: unknown; error: string | null }> {
	try {
		const response = await fetch(url, options);

		if (!response.ok) {
			// Try to extract an error message from the response body
			const contentType = response.headers.get("content-type") || "";
			if (contentType.includes("application/json")) {
				try {
					const body = (await response.json()) as Record<string, unknown>;
					return {
						data: null,
						error: (body.error as string) || "Request failed",
					};
				} catch {
					return { data: null, error: `Server error (${response.status})` };
				}
			}
			const text = await response.text();
			return {
				data: null,
				error: text || `Request failed (${response.status})`,
			};
		}

		const data = await response.json();
		return { data, error: null };
	} catch (err) {
		const message = err instanceof Error ? err.message : "Network error";
		return { data: null, error: message };
	}
}

/**
 * Get a human-readable error message from a fetch response.
 */
export async function getErrorMessage(
	response: Response,
	fallback: string = "An unexpected error occurred",
): Promise<string> {
	if (response.ok) return "";

	const contentType = response.headers.get("content-type") || "";
	if (contentType.includes("application/json")) {
		try {
			const body = (await response.json()) as Record<string, unknown>;
			return (body.error as string) ?? fallback;
		} catch {
			return fallback;
		}
	}

	try {
		const text = await response.text();
		return text || fallback;
	} catch {
		return fallback;
	}
}
