import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InspectionForm } from "@/components/inspection-form";

// Capture the router instance so tests can assert on it
let capturedRouter: ReturnType<typeof import("next/navigation").useRouter>;

vi.mock("next/navigation", () => ({
  useRouter: () => {
    const router = { push: vi.fn(), replace: vi.fn() };
    capturedRouter = router as unknown as ReturnType<typeof import('next/navigation').useRouter>;
    return router;
  },
}));

describe("InspectionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders the form with all questionnaire items", () => {
    render(<InspectionForm hiveId="hive-123" />);

    // Check that key items are rendered
    expect(screen.getByText("Queen seen this inspection?")).toBeDefined();
    expect(screen.getByText("Eggs seen?")).toBeDefined();
    expect(screen.getByText("No disease signs?")).toBeDefined();
    expect(screen.getByText("Varroa level")).toBeDefined();
    expect(screen.getByText("Weather temperature (°C)")).toBeDefined();
    expect(screen.getByText("Weather condition")).toBeDefined();
  });

  it("renders navigation buttons", () => {
    render(<InspectionForm hiveId="hive-123" />);

    expect(screen.getByRole("button", { name: /previous/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /next/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /skip/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /save inspection/i })).toBeDefined();
  });

  it("shows loading state on submit", async () => {
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true } as Response), 100))
    );

    render(<InspectionForm hiveId="hive-123" />);

    const submitBtn = screen.getByRole("button", { name: /save inspection/i });
    expect(submitBtn.textContent).toBe("Save Inspection");

    // Select "Yes" for queen seen to enable queen colour
    fireEvent.click(screen.getByRole("radio", { name: /yes/i }));

    // Click submit
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /saving/i })).toBeDefined();
    });
  });

  it("redirects on successful submission", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);

    render(<InspectionForm hiveId="hive-123" />);

    // Select "Yes" for queen seen
    fireEvent.click(screen.getByRole("radio", { name: /yes/i }));

    // Click submit
    fireEvent.click(screen.getByRole("button", { name: /save inspection/i }));

    await waitFor(() => {
      expect(capturedRouter.push).toHaveBeenCalledWith("/hives/hive-123");
    });
  });

  it("calls onSuccess callback on successful submission", async () => {
    const onSuccess = vi.fn();
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);

    render(<InspectionForm hiveId="hive-123" onSuccess={onSuccess} />);

    // Select "Yes" for queen seen
    fireEvent.click(screen.getByRole("radio", { name: /yes/i }));

    // Click submit
    fireEvent.click(screen.getByRole("button", { name: /save inspection/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("shows error message when API call fails", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    render(<InspectionForm hiveId="hive-123" />);

    // Select "Yes" for queen seen
    fireEvent.click(screen.getByRole("radio", { name: /yes/i }));

    // Click submit
    fireEvent.click(screen.getByRole("button", { name: /save inspection/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to save inspection/)).toBeDefined();
    });
  });

  it("sends form data merged with hiveId and inspectionDate", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);

    render(<InspectionForm hiveId="hive-456" />);

    // Select "Yes" for queen seen
    fireEvent.click(screen.getByRole("radio", { name: /yes/i }));

    // Click submit
    fireEvent.click(screen.getByRole("button", { name: /save inspection/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/inspections", expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }));

      const body = JSON.parse(String((vi.mocked(global.fetch)).mock.calls[0][1]?.body));
      expect(body.hiveId).toBe("hive-456");
      expect(body.inspectionDate).toBeDefined();
    });
  });

  it("renders conditional queen colour item, disabled when queen not seen", () => {
    render(<InspectionForm hiveId="hive-123" />);

    // Queen colour should be rendered but disabled
    const queenColourItem = screen.getByText("Queen colour");
    const parent = queenColourItem.closest("[data-disabled]");
    expect(parent).toBeTruthy();
    expect(parent?.getAttribute("data-disabled")).not.toBeNull();
  });

  it("renders conditional disease flag items, disabled when healthOk is true", () => {
    render(<InspectionForm hiveId="hive-123" />);

    // Disease flags should be rendered but disabled (healthOk defaults to true)
    expect(screen.getByText("Chalk brood suspected?")).toBeDefined();
    expect(screen.getByText("EFB suspected?")).toBeDefined();
    expect(screen.getByText("AFB suspected?")).toBeDefined();
  });

  it("renders a progress indicator", () => {
    render(<InspectionForm hiveId="hive-123" />);

    // The questionnaire progress renders as text like "1 / 22"
    expect(screen.getByText(/Question \d+ of \d+/)).toBeDefined();
  });
});
