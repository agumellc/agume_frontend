import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${baseURL.replace(/\/api\/?$/, '')}/api/auth/refresh/`,
            { refresh }
          );
          localStorage.setItem('access_token', data.access);
          error.config.headers.Authorization = `Bearer ${data.access}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          if (typeof window !== 'undefined') window.location.href = '/login';
        }
      } else if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export interface ProductSalesRow {
  product_id: number;
  product_code: string;
  product_name: string;
  category_name: string | null;
  unit: string;
  quantity_sold: number;
  total_amount: number;
  stock_quantity: number | null;
}

export const ordersApi = {
  list: (params?: Record<string, string>) => api.get('/orders/', { params }),
  detail: (id: number) => api.get(`/orders/${id}/`),
  create: (data: unknown) => api.post('/orders/', data),
  update: (id: number, data: unknown) => api.put(`/orders/${id}/`, data),
  delete: (id: number) => api.delete(`/orders/${id}/`),
  updateStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}/update_status/`, { status }),
  createFromImage: (formData: FormData) =>
    api.post('/orders/create_from_image/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  dailyReportExcel: (date: string) =>
    api.get('/orders/daily_report_excel/', { params: { date }, responseType: 'blob' }),
  dailyStats: (date: string) => api.get('/orders/daily_stats/', { params: { date } }),
  productSalesReport: (params: { date_from?: string; date_to?: string }) =>
    api.get<{ results: ProductSalesRow[]; date_from: string; date_to: string }>('/orders/product_sales_report/', { params }),
  invoicePdfUrl: (id: number) =>
    `${baseURL.replace(/\/api\/?$/, '')}/api/orders/${id}/invoice_pdf/`,
  voucherPdfUrl: (id: number) =>
    `${baseURL.replace(/\/api\/?$/, '')}/api/orders/${id}/expense_voucher_pdf/`,
  /** Fetch PDF with auth and open in new tab */
  openInvoicePdf: async (id: number) => {
    const { data } = await api.get(`/orders/${id}/invoice_pdf/`, { responseType: 'blob' });
    const url = URL.createObjectURL(data as Blob);
    window.open(url);
  },
  openVoucherPdf: async (id: number) => {
    const { data } = await api.get(`/orders/${id}/expense_voucher_pdf/`, { responseType: 'blob' });
    const url = URL.createObjectURL(data as Blob);
    window.open(url);
  },
  /** Send invoice PDF to customer email (or optional email). */
  sendInvoiceEmail: (id: number, email?: string) =>
    api.post(`/orders/${id}/send_invoice_email/`, email != null && email.trim() !== '' ? { email: email.trim() } : {}),
};

export const productsApi = {
  list: (params?: Record<string, string>) => api.get('/products/', { params }),
  detail: (id: number) => api.get(`/products/${id}/`),
  categories: () => api.get('/product-categories/'),
  create: (data: unknown) => api.post('/products/', data),
  update: (id: number, data: unknown) => api.put(`/products/${id}/`, data),
  delete: (id: number) => api.delete(`/products/${id}/`),
};

export const customersApi = {
  list: (params?: Record<string, string>) => api.get('/customers/', { params }),
  create: (data: unknown) => api.post('/customers/', data),
  update: (id: number, data: unknown) => api.put(`/customers/${id}/`, data),
  delete: (id: number) => api.delete(`/customers/${id}/`),
};

export const employeesApi = {
  list: (params?: Record<string, string>) => api.get('/employees/', { params }),
  detail: (id: number) => api.get(`/employees/${id}/`),
  create: (data: unknown) => api.post('/employees/', data),
  update: (id: number, data: unknown) => api.put(`/employees/${id}/`, data),
  delete: (id: number) => api.delete(`/employees/${id}/`),
};

export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login/', { username, password }),
  /** Current Django auth user (first_name, last_name, username). */
  me: () => api.get<AuthUser>('/auth/me/'),
};

export const logsApi = {
  activity: (params?: Record<string, string>) => api.get<{ results?: Record<string, unknown>[] }>('/logs/activity/', { params }),
  login: (params?: Record<string, string>) => api.get<{ results?: Record<string, unknown>[] }>('/logs/login/', { params }),
};

export interface CompanySettings {
  id?: number;
  name: string;
  register_number: string;
  address: string;
  phone: string;
  email: string;
  bank_name: string;
  bank_account: string;
  bank_code: string;
}

export const configApi = {
  getCompany: () => api.get<CompanySettings>('/config/company/'),
  updateCompany: (data: Partial<CompanySettings>) => api.patch<CompanySettings>('/config/company/', data),
};
