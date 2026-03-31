import { describe, expect, test } from "vitest";
import { FOOTER_SIDEBAR_INSET_PX } from "../lib/footerSidebarInset";

describe("footerSidebarInset", () => {
  test("exports sidebar width token for footer CSS", () => {
    expect(FOOTER_SIDEBAR_INSET_PX).toBe(220);
  });
});
