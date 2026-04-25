export interface ApiResponse<T> {
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export async function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      // Address Defect 39: Do not silence errors
      throw new Error(data.error?.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`API Error (${url}):`, error);
    return {
      error: {
        code: 'FETCH_ERROR',
        message: error.message || 'Network request failed',
      },
    };
  }
}
