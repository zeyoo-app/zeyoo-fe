/** An API failure with the server's message and, when it sends one, a machine-readable reason. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Server reasons the screens branch on. */
export const API_ERROR = {
  accountNotFound: 'ACCOUNT_NOT_FOUND',
  accountTypeRequired: 'ACCOUNT_TYPE_REQUIRED',
} as const;

export function errorCodeOf(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}
