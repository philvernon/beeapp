import { describe, it, expect, vi } from "vitest";
import { act, render } from "@testing-library/react";
import Home from "../(app)/page";
import { mockApiaries, mockHives, mockInspections } from "../../mocks/data";

// Mock DB methods
vi.mock("@/lib/data", () => ({
  getApiaries: async () => mockApiaries,
  getHives: async () => mockHives,
  getInspections: async () => mockInspections,
}));

vi.mock("@/components/apiary-hives", () => ({
  ApiaryHives: () => <div data-testid="apiary-hives" />,
}));

describe("Home page", () => {
  it("render", async () => {
    let container: HTMLElement;

    await act(async () => {
      ({ container } = render(await Home()));
    });

    expect(container!).toMatchSnapshot();
  });

  it.todo("write Home tests", () => {});
});
