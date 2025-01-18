// src/lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}
