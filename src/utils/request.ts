import axios, { type AxiosResponse } from "axios";
import { env } from "./helper";

interface RequestOptions {
  token?: string;
  file?: boolean;
}

export const baseUrl: string = String(env("DEX_API_URL"));

const axiosBase = axios.create({
  baseURL: baseUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const get = async <T>(
  path: string,
  opt?: RequestOptions
): Promise<T> => {
  const headers: any = {};
  try {
    if (opt?.token) {
      headers.Authorization = `Bearer ${opt?.token}`;
    }
    const res: AxiosResponse<T> = await axiosBase.get<T>(path, { headers });
    const { data } = res;
    return data;
  } catch (error) {
    return errorHandle(error);
  }
};

export const post = async <T>(
  path: string,
  items: any,
  opt?: RequestOptions
): Promise<T> => {
  const headers: any = {};
  try {
    if (opt?.token) {
      headers.Authorization = `Bearer ${opt?.token}`;
    }
    if (opt?.file) {
      headers["Content-Type"] = "multipart/form-data;";
    } else {
      // Handle other content types if needed
    }
    const res: AxiosResponse<T> = await axiosBase.post<T>(path, items, {
      headers,
    });
    const { data } = res;
    return data;
  } catch (error) {
    return errorHandle(error);
  }
};

export const json = async <T>(
  path: string,
  items: any,
  opt?: RequestOptions
): Promise<T> => {
  const headers: any = {};
  try {
    if (opt?.token) {
      headers.Authorization = `Bearer ${opt?.token}`;
    }
    const form: any = JSON.stringify(items);
    const res: AxiosResponse<T> = await axiosBase.post<T>(path, form, {
      headers,
    });
    const { data } = res;
    return data;
  } catch (error) {
    return errorHandle(error);
  }
};

const errorHandle = (error: any) => {
  console.log(error);
  window.postMessage({ event: ["error", "try-later"] }, "*");

  if (error.response) {
    if (error.response.status === 401) {
      window.postMessage({ login: true }, "*");
    }
    return error.response.data;
  } else if (error.request) {
    // Handle request without response
  } else {
    return 0;
  }
};
