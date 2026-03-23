'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { usePathname } from 'next/navigation';
import PageHeader from '../components/PageHeader';
import { configApi, type CompanySettings } from '@/lib/api';
import { useToast } from '../components/ToastContext';

export default function SettingsPage() {
  const pathname = usePathname();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    configApi
      .getCompany()
      .then(({ data }) => {
        form.setFieldsValue({
          name: data.name ?? '',
          register_number: data.register_number ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          bank_name: data.bank_name ?? '',
          bank_account: data.bank_account ?? '',
          bank_code: data.bank_code ?? '',
        });
      })
      .catch(() => {
        addToast({ type: 'error', title: 'Тохиргоо ачааллахад алдаа гарлаа' });
      })
      .finally(() => setLoading(false));
  }, [form, addToast]);

  const onFinish = async (values: CompanySettings) => {
    setSaving(true);
    try {
      await configApi.updateCompany(values);
      addToast({ type: 'success', title: 'Тохиргоо хадгалагдлаа' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      addToast({
        type: 'error',
        title: 'Алдаа',
        description: String(e?.response?.data?.detail ?? 'Хадгалахад алдаа гарлаа'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="agume-products-page">
      <PageHeader pathname={pathname} title="Тохиргоо" description="Байгууллагын мэдээлэл, нэхэмжлэх тохиргоо" />
      <Card title="Байгууллагын мэдээлэл (нэхэмжлэх дээр харагдана)" loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ maxWidth: 560 }}
        >
          <Form.Item name="name" label="Байгууллагын нэр" rules={[{ required: true, message: 'Оруулна уу' }]}>
            <Input placeholder="Жишээ: AGUME" />
          </Form.Item>
          <Form.Item name="register_number" label="Регистрийн дугаар">
            <Input placeholder="РД" />
          </Form.Item>
          <Form.Item name="address" label="Хаяг">
            <Input.TextArea rows={2} placeholder="Хаяг" />
          </Form.Item>
          <Form.Item name="phone" label="Утас">
            <Input placeholder="Утасны дугаар" />
          </Form.Item>
          <Form.Item name="email" label="И-мэйл">
            <Input type="email" placeholder="И-мэйл хаяг" />
          </Form.Item>
          <Form.Item name="bank_name" label="Банкны нэр">
            <Input placeholder="Банкны нэр" />
          </Form.Item>
          <Form.Item name="bank_account" label="Дансны дугаар">
            <Input placeholder="Дансны дугаар" />
          </Form.Item>
          <Form.Item name="bank_code" label="Банкны код">
            <Input placeholder="Банкны код (заавал биш)" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              style={{ background: 'var(--agume-primary)' }}
            >
              Хадгалах
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
