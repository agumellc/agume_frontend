import type { CompanySettings } from '@/lib/api';

/** Нэхэмжлэх дээр харагдах байгууллагын мэдээлэл */
export interface InvoiceCompanyInfo {
  name: string;
  registerNumber: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccount: string;
  bankCode?: string;
}

/** API-аас ирсэн CompanySettings-ийг InvoiceCompanyInfo болгох */
export function companySettingsToInvoiceInfo(c: CompanySettings | null | undefined): InvoiceCompanyInfo {
  if (!c) return defaultInvoiceCompany;
  return {
    name: c.name ?? 'AGUME',
    registerNumber: c.register_number ?? '',
    address: c.address ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    bankName: c.bank_name ?? '',
    bankAccount: c.bank_account ?? '',
    bankCode: c.bank_code,
  };
}

export const defaultInvoiceCompany: InvoiceCompanyInfo = {
  name: 'AGUME',
  registerNumber: '',
  address: '',
  phone: '',
  email: '',
  bankName: '',
  bankAccount: '',
  bankCode: '',
};
