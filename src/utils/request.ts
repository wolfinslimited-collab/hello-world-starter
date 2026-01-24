/**
 * HTTP Request Utilities
 * Now uses Supabase Edge Functions as the backend
 */
import { get as apiGet, json as apiJson, getToken } from "services/api-client";

interface RequestOptions {
  token?: string;
  file?: boolean;
}

// Get the base URL for display purposes (not used for actual requests)
export const baseUrl: string = import.meta.env.VITE_SUPABASE_URL + "/functions/v1/api";

/**
 * GET request
 * @deprecated Use services/api-client directly
 */
export const get = async <T>(
  path: string,
  opt?: RequestOptions
): Promise<T> => {
  const token = opt?.token || getToken() || undefined;
  const result = await apiGet(path, { token });
  return result as T;
};

/**
 * POST request with form data
 * @deprecated Use services/api-client directly
 */
export const post = async <T>(
  path: string,
  items: any,
  opt?: RequestOptions
): Promise<T> => {
  const token = opt?.token || getToken() || undefined;
  const result = await apiJson(path, items, { token });
  return result as T;
};

/**
 * POST request with JSON body
 * @deprecated Use services/api-client directly
 */
export const json = async <T>(
  path: string,
  items: any,
  opt?: RequestOptions
): Promise<T> => {
  const token = opt?.token || getToken() || undefined;
  const result = await apiJson(path, items, { token });
  return result as T;
};
