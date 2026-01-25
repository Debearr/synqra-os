export class AuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = "AuthError";
    this.status = options?.status ?? 401;
    this.code = options?.code ?? "unauthorized";
  }
}
