export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/$/, "");

interface ApiProblem {
  detail?: unknown;
  message?: unknown;
  code?: unknown;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly problem?: ApiProblem;

  constructor(message: string, status: number, problem?: ApiProblem) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = typeof problem?.code === "string" ? problem.code : undefined;
    this.problem = problem;
  }
}

function getToken(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem("token");
}

export function getAuthHeaders(includeJson = true): HeadersInit {
  const token = getToken();
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function detailMessage(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail)) return null;

  const messages = detail
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const message = "msg" in item ? item.msg : null;
      return typeof message === "string" ? message : null;
    })
    .filter((message): message is string => Boolean(message));

  return messages.length ? messages.join(". ") : null;
}

async function parseProblem(response: Response): Promise<ApiProblem | undefined> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return undefined;
  return response.json().catch(() => undefined) as Promise<ApiProblem | undefined>;
}

// Compatibility default is deliberately centralized here while legacy endpoint
// response schemas are migrated feature by feature.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiRequest<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const bodyIsFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(!bodyIsFormData),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const problem = await parseProblem(response);
    const message =
      detailMessage(problem?.detail) ||
      (typeof problem?.message === "string" ? problem.message : null) ||
      `Yêu cầu không thành công (${response.status})`;
    throw new ApiError(message, response.status, problem);
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return response as T;
  return response.json() as Promise<T>;
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  const response = await apiRequest<Response>(path);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function getErrorMessage(error: unknown, fallback = "Đã có lỗi xảy ra. Vui lòng thử lại."): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
