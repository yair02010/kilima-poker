import { describe, expect, it } from "vitest";
import { AppError, Errors, isAppError, toErrorResponse } from "../../src/errors.js";

describe("AppError", () => {
  it("carries code, status, message and details", () => {
    const err = new AppError("TABLE_FULL", 409, "Table is full", { details: { tableId: "t1" } });
    expect(err).toBeInstanceOf(Error);
    expect(isAppError(err)).toBe(true);
    expect(err.code).toBe("TABLE_FULL");
    expect(err.status).toBe(409);
    expect(err.details).toEqual({ tableId: "t1" });
  });

  it("keeps the cause for logs", () => {
    const cause = new Error("db down");
    expect(new AppError("X", 500, "x", { cause }).cause).toBe(cause);
  });
});

describe("toErrorResponse", () => {
  it("maps an AppError to its status and a standard body", () => {
    const { status, body } = toErrorResponse(Errors.notFound("Table"), "req-1");
    expect(status).toBe(404);
    expect(body).toEqual({ error: { code: "NOT_FOUND", message: "Table not found", requestId: "req-1" } });
  });

  it("includes details only when present", () => {
    const { body } = toErrorResponse(Errors.validation({ field: "amount" }), "req-2");
    expect(body.error.details).toEqual({ field: "amount" });
    expect("details" in toErrorResponse(Errors.forbidden(), "r").body.error).toBe(false);
  });

  it("hides unknown errors behind a 500 with only the request id", () => {
    const { status, body } = toErrorResponse(new Error("secret stack detail"), "req-3");
    expect(status).toBe(500);
    expect(body).toEqual({ error: { code: "INTERNAL", message: "Internal error", requestId: "req-3" } });
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  it("treats thrown non-errors as internal", () => {
    expect(toErrorResponse("boom", "r").status).toBe(500);
  });
});
