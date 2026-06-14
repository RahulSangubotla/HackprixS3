// lib/authClient.ts

import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || '/api'; // Use env var or relative URL for dev proxy

// 🔑 Single source of truth for keys
const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

/* -----------------------------
   Token helpers
-------------------------------- */
async function saveTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}

async function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

async function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export async function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/* -----------------------------
   Axios instance
-------------------------------- */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

/* -----------------------------
   Request interceptor
-------------------------------- */
api.interceptors.request.use(async (config) => {
  const skipAuth =
    config.url?.includes("/auth/login/") ||
    config.url?.includes("/auth/register/") ||
    config.url?.includes("/auth/refresh/") ||
    config.url?.includes("/users/institutions/");

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

/* -----------------------------
   Response interceptor (auto-refresh)
-------------------------------- */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      const refresh = await getRefreshToken();
      if (!refresh) {
        await clearTokens();
        // Optionally redirect to login page
        // window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await api.post("/auth/refresh/", { refresh });
        const newAccess = (res.data as any).access;

        await saveTokens(newAccess, refresh);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return api(originalRequest);
      } catch {
        await clearTokens();
        // window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

/* -----------------------------
   Auth API helpers
-------------------------------- */
export async function loginRequest(username: string, password: string) {
  const { data } = await api.post("/auth/login/", {
    username,
    password,
  });

  await saveTokens(data.access, data.refresh);

  const meRes = await api.get("/auth/me/");
  return meRes.data;
}

export async function registerRequest(userData: any) {
  const { data } = await api.post("/auth/register/", userData);
  
  if (data.access && data.refresh) {
    await saveTokens(data.access, data.refresh);
    if (data.user) {
        return data.user;
    } else {
        const meRes = await api.get("/auth/me/");
        return meRes.data;
    }
  }
  return data;
}

export async function fetchCurrentUser() {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await api.get("/auth/me/");
    return res.data;
  } catch {
    return null;
  }
}

export async function updateProfileRequest(formData: FormData | object) {
    const isFormData = formData instanceof FormData;
    const res = await api.patch("/auth/profile/", formData, {
      headers: {
        "Content-Type": isFormData ? "multipart/form-data" : "application/json",
      },
    });
    return res.data;
  }

export async function fetchWalletInfo() {
    try {
        const res = await api.get("/auth/wallet/");
        return res.data;
    } catch (error) {
        console.error("Failed to fetch wallet info", error);
        return null;
    }
}

/* -----------------------------
   Marketplace API helpers
-------------------------------- */

export async function fetchProducts() {
    const { data } = await api.get("/marketplace/products/");
    return data;
  }
  
  export async function fetchProduct(id: string) {
    const { data } = await api.get(`/marketplace/products/${id}/`);
    return data;
  }
  
  export async function fetchProductCategories() {
    const { data } = await api.get("/marketplace/categories/");
    return data;
  }
  
  export async function fetchCart() {
    const { data } = await api.get("/marketplace/cart/");
    return data;
  }
  
  export async function addToCart(productId:string, quantity: number) {
    const { data } = await api.post("/marketplace/cart/add/", {
      product_id: productId,
      quantity,
    });
    return data;
  }
  
  export async function removeFromCart(cartItemId: string) {
    const { data } = await api.post("/marketplace/cart/remove/", {
      cart_item_id: cartItemId,
    });
    return data;
  }
  
  export async function clearCart() {
    const { data } = await api.post("/marketplace/cart/clear/");
    return data;
  }
  
  export async function redeemCart() {
    const { data } = await api.post("/marketplace/cart/redeem/");
    return data;
  }
  
  export async function fetchRedemptionHistory() {
    const { data } = await api.get("/marketplace/redemption/history/");
    return data;
  }
  

// Inside lib/authClient.ts

export async function sendChatMessage(message: string, history: any[]) {
  const { data } = await api.post("/chat/", {
    message: message,
    history: history,
  });
  return data;
}

// lib/authClient.ts

// ... existing axios 'api' instance ...

export async function generateQuizQuestions(subject: string) {
  const { data } = await api.get(`/lectures/multi-quiz/generate/${subject}/`);
  return data;
}

export async function submitQuizScore(subject: string, score: number) {
  const { data } = await api.post("/lectures/multi-quiz/submit-score/", {
    subject,
    score,
  });
  return data;
}

export async function fetchScholarObservations(): Promise<string[]> {
  const { data } = await api.get("/scholar-observations/", { timeout: 30000 });
  return data.observations as string[];
}

/** * Note: Real-time Socket interactions don't usually go through the REST client, 
 * but you'll use the 'accessToken' from here to authenticate the socket.
 */