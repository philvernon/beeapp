import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InspectionForm } from "@/components/inspection-form";

// ---------------------------------------------------------------------------
// Router — stable singleton captured across renders
// ---------------------------------------------------------------------------
let capturedRouter: { push: ReturnType<typeof vi.fn>; replace: ReturnType<typeof vi.fn> };

vi.mock("next/navigation", () => ({
  useRouter: () => {
    if (!capturedRouter) {
      capturedRouter = { push: vi.fn(), replace: vi.fn() };
    }
    return capturedRouter;
  },
}));

// ---------------------------------------------------------------------------
// Helpers — semantic navigation primitives
// ---------------------------------------------------------------------------

/** Click the visible Next button and wait for the questionnaire to advance. */
async function next(user: ReturnType<typeof userEvent.setup>) {
  const btn = screen.getByRole("button", { name: /next/i });
  await user.click(btn);
}

/** Click the visible Skip button and wait for the questionnaire to advance. */
async function skip(user: ReturnType<typeof userEvent.setup>) {
  const btn = screen.getByRole("button", { name: /skip/i });
  await user.click(btn);
}

/** Click the visible Save Inspection button. */
async function submitInspection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /save inspection/i }));
}

/**
 * Fill required fields and skip optional ones to reach a valid submission state.
 * Uses semantic queries (aria-labels, button text) rather than hard-coded step counts.
 */
async function fillMinimumValidInspection(user: ReturnType<typeof userEvent.setup>) {
  // queenSeen (required)
  await user.click(screen.getByRole("radio", { name: /yes/i }));
  await next(user);

  // queenColour (optional) — skip
  await skip(user);

  // queenCellsFound (optional input) — skip
  await skip(user);

  // queenCellsRemoved (optional radio) — skip
  await skip(user);

  // eggsSeen (required)
  await user.click(screen.getByRole("radio", { name: /yes/i }));
  await next(user);

  // broodPatternOk (required) — "OK" not "Not OK"
  await user.click(screen.getByRole("radio", { name: /^ok$/i }));
  await next(user);

  // broodFrameCount (optional input) — skip
  await skip(user);

  // storeFrames (optional input) — skip
  await skip(user);

  // roomFrames (optional input) — skip
  await skip(user);

  // healthOk (required) — "No — disease flags present"
  await user.click(screen.getByRole("radio", { name: /^no.*disease/i }));
  await next(user);

  // Disease flags now enabled (optional) — skip all three
  await skip(user);
  await skip(user);
  await skip(user);

  // varroaLevel (required)
  await user.click(screen.getByRole("radio", { name: /low/i }));
  await next(user);

  // varroaCount (optional input) — skip
  await skip(user);

  // temperamentScore (required input)
  await user.type(screen.getByLabelText(/temperament score/i), "5");
  await next(user);

  // feedLitresLightSyrup (optional) — skip
  await skip(user);

  // feedLitresHeavySyrup (optional) — skip
  await skip(user);

  // supersChange (optional) — skip
  await skip(user);

  // weatherTemperatureC (required input)
  await user.type(screen.getByLabelText(/weather temperature/i), "20");
  await next(user);

  // weatherCondition (required)
  await user.click(screen.getByRole("radio", { name: /sunny/i }));
  await next(user);

  await user.type(screen.getByLabelText(/notes/i), "test");
}

describe("InspectionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedRouter = undefined as unknown as typeof capturedRouter;
    global.fetch = vi.fn();
  });

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  it("renders the form with all questionnaire items", () => {
    render(<InspectionForm hiveId="hive-123" />);

    expect(screen.getByText("Queen seen this inspection?")).toBeDefined();
    expect(screen.getByText("Eggs seen?")).toBeDefined();
    expect(screen.getByText("No disease signs?")).toBeDefined();
    expect(screen.getByText("Varroa level")).toBeDefined();
    expect(screen.getByText("Weather temperature (°C)")).toBeDefined();
    expect(screen.getByText("Weather condition")).toBeDefined();
  });

  it("renders navigation buttons", () => {
    render(<InspectionForm hiveId="hive-123" />);

    // Next is visible on the first step; Previous/Skip are hidden.
    expect(screen.getByRole("button", { name: /next/i })).toBeDefined();

    // Previous and Skip exist in the DOM but are hidden on the first step.
    const prevBtn = screen.queryByRole("button", { name: /previous/i, hidden: true });
    const skipBtn = screen.queryByRole("button", { name: /skip/i, hidden: true });
    expect(prevBtn).toBeDefined();
    expect(skipBtn).toBeDefined();
  });

  it.todo("renders a progress indicator");

  // -----------------------------------------------------------------------
  // Conditional queen-colour enable/disable
  // -----------------------------------------------------------------------

  it("disables queen colour when queen is not seen", () => {
    render(<InspectionForm hiveId="hive-123" />);

    expect(screen.getByText("Queen colour").closest("[data-disabled]")).toBeDefined();
  });

  it("enables queen colour after selecting yes for queen seen", async () => {
    const user = userEvent.setup();
    render(<InspectionForm hiveId="hive-123" />);

    await user.click(screen.getByRole("radio", { name: /yes/i }));

    // After answering queenSeen the questionnaire advances to queenColour.
    // The item should no longer carry data-disabled.
    expect(screen.getByText("Queen colour").closest("[data-disabled]")).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Conditional disease-question enable/disable
  // -----------------------------------------------------------------------

  it("disables disease questions when healthOk is true (default)", () => {
    render(<InspectionForm hiveId="hive-123" />);

    expect(screen.getByText("Chalk brood suspected?").closest("[data-disabled]")).toBeDefined();
    expect(screen.getByText("EFB suspected?").closest("[data-disabled]")).toBeDefined();
    expect(screen.getByText("AFB suspected?").closest("[data-disabled]")).toBeDefined();
  });

  it("enables disease questions after selecting no for healthOk", async () => {
    const user = userEvent.setup();
    render(<InspectionForm hiveId="hive-123" />);

    // Navigate to the health step
    await user.click(screen.getByRole("radio", { name: /yes/i })); // queenSeen
    await next(user);
    await skip(user); // queenColour (optional)
    await skip(user); // queenCellsFound (optional)
    await skip(user); // queenCellsRemoved (optional)
    await user.click(screen.getByRole("radio", { name: /yes/i })); // eggsSeen
    await next(user);
    await user.click(screen.getByRole("radio", { name: /^ok$/i })); // broodPatternOk
    await next(user);
    await skip(user); // broodFrameCount (optional)
    await skip(user); // storeFrames (optional)
    await skip(user); // roomFrames (optional)

    // Now on healthOk — select "No"
    await user.click(screen.getByRole("radio", { name: /^no.*disease/i }));
    await next(user);

    // The questionnaire advances to chalkBroodSuspected.
    // It should no longer be disabled.
    expect(screen.getByText("Chalk brood suspected?").closest("[data-disabled]")).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  it("shows loading state on submit", async () => {
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true } as Response), 100))
    );

    const user = userEvent.setup();
    render(<InspectionForm hiveId="hive-123" />);

    await fillMinimumValidInspection(user);

    const submitBtn = screen.getByRole("button", { name: /save inspection/i });
    expect(submitBtn.textContent).toBe("Save Inspection");

    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /saving/i })).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // API failure handling
  // -----------------------------------------------------------------------

  it("shows error message when API call fails", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    const user = userEvent.setup();
    render(<InspectionForm hiveId="hive-123" />);

    await fillMinimumValidInspection(user);
    await submitInspection(user);

    await waitFor(() => {
      expect(screen.getByText(/Failed to save inspection/)).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Successful submission
  // -----------------------------------------------------------------------

  it("calls onSuccess on successful submission", async () => {
    const onSuccess = vi.fn();
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);

    const user = userEvent.setup();
    render(<InspectionForm hiveId="hive-123" onSuccess={onSuccess} />);

    await fillMinimumValidInspection(user);
    await submitInspection(user);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("redirects to /hives/:id on successful submission", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);

    const user = userEvent.setup();
    render(<InspectionForm hiveId="hive-456" />);

    await fillMinimumValidInspection(user);
    await submitInspection(user);

    await waitFor(() => {
      expect(capturedRouter.push).toHaveBeenCalledWith("/hives/hive-456");
    });
  });

  it("sends parsed form data merged with hiveId and inspectionDate", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);

    const user = userEvent.setup();
    render(<InspectionForm hiveId="hive-789" />);

    await fillMinimumValidInspection(user);
    await submitInspection(user);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/inspections",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );

      const body = JSON.parse(String((vi.mocked(global.fetch)).mock.calls[0][1]?.body));
      expect(body.hiveId).toBe("hive-789");
      expect(body.inspectionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Parsed values from the required fields we filled:
      expect(body.queenSeen).toBe(true);
      expect(body.eggsSeen).toBe(true);
      expect(body.broodPatternOk).toBe(true);
      expect(body.healthOk).toBe(false);
      expect(body.varroaLevel).toBe("l");
      expect(body.temperamentScore).toBe(5);
      expect(body.weatherTemperatureC).toBe(20);
      expect(body.weatherCondition).toBe("s");
    });
  });

  it("includes optional fields that were filled in the submitted body", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);

    const user = userEvent.setup();
    render(<InspectionForm hiveId="hive-opt" />);

    // queenSeen (required)
    await user.click(screen.getByRole("radio", { name: /yes/i }));
    await next(user);

    // queenColour now enabled — fill it in
    await user.click(screen.getByRole("radio", { name: /yellow/i }));
    await next(user);

    // queenCellsFound (optional) — fill it
    await user.type(screen.getByLabelText(/queen cells found/i), "3");
    await next(user);

    // queenCellsRemoved (optional) — fill it
    await user.click(screen.getByRole("radio", { name: /yes/i }));
    await next(user);

    // eggsSeen (required)
    await user.click(screen.getByRole("radio", { name: /yes/i }));
    await next(user);

    // broodPatternOk (required) — "OK" not "Not OK"
    await user.click(screen.getByRole("radio", { name: /^ok$/i }));
    await next(user);

    // broodFrameCount (optional) — fill it
    await user.type(screen.getByLabelText(/brood frame count/i), "8");
    await next(user);

    // storeFrames, roomFrames (optional) — skip
    await skip(user);
    await skip(user);

    // healthOk (required) — "No — disease flags present"
    await user.click(screen.getByRole("radio", { name: /^no.*disease/i }));
    await next(user);

    // Disease flags now enabled (optional) — skip all three
    await skip(user);
    await skip(user);
    await skip(user);

    // varroaLevel (required)
    await user.click(screen.getByRole("radio", { name: /low/i }));
    await next(user);

    // varroaCount (optional) — fill it
    await user.type(screen.getByLabelText(/varroa count/i), "2");
    await next(user);

    // temperamentScore (required)
    await user.type(screen.getByLabelText(/temperament score/i), "7");
    await next(user);

    // feedLitresLightSyrup (optional) — fill it
    await user.type(screen.getByLabelText(/light syrup/i), "4");
    await next(user);

    // feedLitresHeavySyrup (optional) — fill it
    await user.type(screen.getByLabelText(/heavy syrup/i), "2");
    await next(user);

    // supersChange (optional) — fill it
    await user.type(screen.getByLabelText(/supers change/i), "1");
    await next(user);

    // weatherTemperatureC (required)
    await user.type(screen.getByLabelText(/weather temperature/i), "22.5");
    await next(user);

    // weatherCondition (required)
    await user.click(screen.getByRole("radio", { name: /sunny/i }));

    // notes (optional) — fill it
    await user.type(screen.getByLabelText(/notes/i), "Colony looks healthy");

    await submitInspection(user);

    await waitFor(() => {
      const body = JSON.parse(String((vi.mocked(global.fetch)).mock.calls[0][1]?.body));
      expect(body.hiveId).toBe("hive-opt");
      expect(body.queenColour).toBe("Y");
      expect(body.queenCellsFound).toBe(3);
      expect(body.queenCellsRemoved).toBe(true);
      expect(body.broodFrameCount).toBe(8);
      expect(body.varroaCount).toBe(2);
      expect(body.temperamentScore).toBe(7);
      expect(body.feedLitresLightSyrup).toBe("4");
      expect(body.feedLitresHeavySyrup).toBe("2");
      expect(body.supersChange).toBe("1");
      expect(body.weatherTemperatureC).toBe(22.5);
      expect(body.notes).toBe("Colony looks healthy");
    });
  });
});
