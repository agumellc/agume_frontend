import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/** Ерөнхий API дуудлага */
const DEFAULT_TIMEOUT_MS = 30000;
/** Зургаас AI унших — гар бичмэл/том файл удаан болно */
export const AI_ORDER_IMAGE_TIMEOUT_MS = 240000;

const api = axios.create({
  baseURL,
  timeout: DEFAULT_TIMEOUT_MS,
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
  patch: (id: number, data: unknown) => api.patch(`/orders/${id}/`, data),
  delete: (id: number) => api.delete(`/orders/${id}/`),
  updateStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}/update_status/`, { status }),
  createFromImage: (formData: FormData) =>
    api.post('/orders/create_from_image/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: AI_ORDER_IMAGE_TIMEOUT_MS,
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
  patch: (id: number, data: unknown) => api.patch(`/products/${id}/`, data),
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

export interface AuthEmployee {
  id: number;
  name: string;
  code: string;
  role: string;
}

export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  employee?: AuthEmployee | null;
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
  route_origin_latitude?: number | string | null;
  route_origin_longitude?: number | string | null;
}

export const configApi = {
  getCompany: () => api.get<CompanySettings>('/config/company/'),
  updateCompany: (data: Partial<CompanySettings>) => api.patch<CompanySettings>('/config/company/', data),
};

export interface DailyAggregateLine {
  product_id: number;
  product_code: string;
  product_name: string;
  unit: string;
  total_quantity: string;
  has_urgent: boolean;
  preparation_bonus_percent: string;
  package_sizes: number[];
  package_breakdown: { size: number | null; count: number; amount: number; label: string }[];
}

export const preparationApi = {
  dailyAggregate: (date: string) =>
    api.get<{ date: string; lines: DailyAggregateLine[]; urgent_open_orders: number }>(
      '/preparation/daily_aggregate/',
      { params: { date } }
    ),
  urgentPoll: (date: string) =>
    api.get<{ date: string; urgent_open_orders: number; orders: Record<string, unknown>[] }>(
      '/preparation/urgent_poll/',
      { params: { date } }
    ),
  myReminders: () => api.get('/preparation/my_reminders/'),
  managerAlerts: () => api.get<{ results: { id: number; task: number; task_summary: string; created_at: string }[] }>(
    '/preparation/manager_alerts/'
  ),
  ackAlert: (id: number) => api.post(`/preparation/alerts/${id}/ack/`),
  bonusPreview: (params: { employee: number; year: number; month: number }) =>
    api.get('/preparation/bonus_preview/', { params }),
  tasks: {
    list: (params?: Record<string, string>) => api.get('/preparation/tasks/', { params }),
    create: (data: unknown) => api.post('/preparation/tasks/', data),
    setParticipants: (id: number, participants: { employee_id: number; share_percent: number }[]) =>
      api.post(`/preparation/tasks/${id}/set_participants/`, { participants }),
    markComplete: (id: number, participants?: { employee_id: number; share_percent: number }[]) =>
      api.post(`/preparation/tasks/${id}/mark_complete/`, participants?.length ? { participants } : {}),
    syncFromOrders: (body: { date: string; preparation_method?: string; refresh_quantities?: boolean }) =>
      api.post('/preparation/tasks/sync_from_orders/', body),
  },
  complaints: {
    list: (params?: Record<string, string>) => api.get('/preparation/complaints/', { params }),
    create: (data: { order: number; product: number; preparer: number; message: string }) =>
      api.post('/preparation/complaints/', data),
  },
};

export const inventoryApi = {
  lowStock: () =>
    api.get<{ results: Record<string, unknown>[]; count: number }>('/inventory/low_stock/'),
  suppliers: {
    list: (params?: Record<string, string>) => api.get('/inventory/suppliers/', { params }),
    create: (data: unknown) => api.post('/inventory/suppliers/', data),
    update: (id: number, data: unknown) => api.put(`/inventory/suppliers/${id}/`, data),
    delete: (id: number) => api.delete(`/inventory/suppliers/${id}/`),
  },
  supplierProducts: {
    list: (params?: Record<string, string>) => api.get('/inventory/supplier-products/', { params }),
    create: (data: unknown) => api.post('/inventory/supplier-products/', data),
    update: (id: number, data: unknown) => api.put(`/inventory/supplier-products/${id}/`, data),
    delete: (id: number) => api.delete(`/inventory/supplier-products/${id}/`),
  },
  wasteRecords: {
    list: (params?: Record<string, string>) => api.get('/inventory/waste-records/', { params }),
    create: (data: unknown) => api.post('/inventory/waste-records/', data),
  },
};

export type DeliveryRouteStop = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  latitude: string | null;
  longitude: string | null;
  total_amount: string;
  status: string;
  items: {
    product_id: number;
    product_name: string;
    product_code: string;
    quantity: string;
    unit: string;
    line_total: string;
  }[];
  delivered_at: string | null;
  customer_disputed_delivery: boolean;
  has_delivery_proof: boolean;
  delivery_signature_url: string | null;
  delivery_photo_url: string | null;
};

export const deliveryApi = {
  myRoute: (date: string) =>
    api.get<{ date: string; driver_id: number; stops: DeliveryRouteStop[] }>('/delivery/my_route/', {
      params: { date },
    }),
  confirmDelivery: (orderId: number, formData: FormData) =>
    api.post(`/delivery/orders/${orderId}/confirm/`, formData),
  returnGoods: (orderId: number, body: Record<string, unknown>) =>
    api.post(`/delivery/orders/${orderId}/return_goods/`, body),
  issue: (orderId: number, body: FormData | Record<string, unknown>) =>
    api.post(`/delivery/orders/${orderId}/issue/`, body),
};
