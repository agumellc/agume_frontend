'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Tag,
  Form,
  Input,
  Select,
  Switch,
  message,
  Space,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { employeesApi } from '@/lib/api';
import PageHeader from '../../components/PageHeader';

const ROLES = [
  { value: 'driver', label: 'Жолооч' },
  { value: 'operator', label: 'Оператор' },
  { value: 'manager', label: 'Менежер' },
  { value: 'admin', label: 'Админ' },
];

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [employee, setEmployee] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchEmployee = () => {
    if (!id) return;
    setLoading(true);
    employeesApi
      .detail(id)
      .then(({ data }) => setEmployee(data))
      .catch(() => message.error('Ажилтан олдсонгүй'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  useEffect(() => {
    if (employee && editing) {
      form.setFieldsValue({
        code: employee.code,
        name: employee.name,
        role: employee.role,
        phone: employee.phone,
        is_active: employee.is_active !== false,
      });
    }
  }, [employee, editing, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await employeesApi.update(id, values);
      message.success('Шинэчлэгдлээ');
      setEditing(false);
      fetchEmployee();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      message.error(String(e?.response?.data?.detail || e?.response?.data || 'Алдаа'));
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    form.resetFields();
  };

  if (loading || !employee) {
    return (
      <Card loading={loading}>
        <div style={{ minHeight: 200 }} />
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader
        pathname={`/employees/${id}`}
        items={[
          { title: 'Нүүр', href: '/dashboard' },
          { title: 'Ажилтан', href: '/employees' },
          { title: editing ? 'Засах' : String(employee.name) },
        ]}
        extra={
          !editing ? (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
              style={{ background: '#25671E' }}
            >
              Засах
            </Button>
          ) : null
        }
      />
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/employees')}>
          Буцах
        </Button>
      </div>

      {editing ? (
        <Card title="Ажилтан засах">
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="code" label="Код" rules={[{ required: true, message: 'Код оруулна уу' }]}>
              <Input placeholder="Ажилтны код" />
            </Form.Item>
            <Form.Item name="name" label="Нэр" rules={[{ required: true, message: 'Нэр оруулна уу' }]}>
              <Input placeholder="Нэр" />
            </Form.Item>
            <Form.Item name="role" label="Үүрэг" rules={[{ required: true }]}>
              <Select options={ROLES} placeholder="Сонгох" />
            </Form.Item>
            <Form.Item name="phone" label="Утас">
              <Input placeholder="Утасны дугаар" />
            </Form.Item>
            <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving} style={{ background: '#25671E' }}>
                  Хадгалах
                </Button>
                <Button onClick={cancelEdit} disabled={saving}>
                  Цуцлах
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <Card>
          <div className="agume-product-detail-rows">
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Код</span>
              <span className="agume-product-detail-value">{String(employee.code)}</span>
            </div>
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Нэр</span>
              <span className="agume-product-detail-value">{String(employee.name)}</span>
            </div>
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Үүрэг</span>
              <span className="agume-product-detail-value">
                {String(employee.role_display || employee.role || '-')}
              </span>
            </div>
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Утас</span>
              <span className="agume-product-detail-value">{String(employee.phone || '-')}</span>
            </div>
            <div className="agume-product-detail-row">
              <span className="agume-product-detail-label">Идэвхтэй</span>
              <span className="agume-product-detail-value">
                {employee.is_active ? <Tag color="green">Тийм</Tag> : <Tag color="default">Үгүй</Tag>}
              </span>
            </div>
          </div>
        </Card>
      )}

      {!editing && (employee.user_detail as Record<string, unknown> | null) && (
        <Card title="Нэвтрэлтийн хэрэглэгч (Django User)" style={{ marginTop: 16 }}>
          <div className="agume-product-detail-rows">
            {(() => {
              const u = employee.user_detail as Record<string, unknown>;
              const dateJoined = u.date_joined ? new Date(String(u.date_joined)).toLocaleString('mn-MN') : '-';
              return (
                <>
                  <div className="agume-product-detail-row">
                    <span className="agume-product-detail-label">Username</span>
                    <span className="agume-product-detail-value">{String(u.username || '-')}</span>
                  </div>
                  <div className="agume-product-detail-row">
                    <span className="agume-product-detail-label">И-мэйл</span>
                    <span className="agume-product-detail-value">{String(u.email || '-')}</span>
                  </div>
                  <div className="agume-product-detail-row">
                    <span className="agume-product-detail-label">Нэр</span>
                    <span className="agume-product-detail-value">
                      {[String(u.first_name || ''), String(u.last_name || '')].filter(Boolean).join(' ') || '-'}
                    </span>
                  </div>
                  <div className="agume-product-detail-row">
                    <span className="agume-product-detail-label">Идэвхтэй</span>
                    <span className="agume-product-detail-value">
                      {u.is_active ? <Tag color="green">Тийм</Tag> : <Tag color="default">Үгүй</Tag>}
                    </span>
                  </div>
                  <div className="agume-product-detail-row">
                    <span className="agume-product-detail-label">Staff</span>
                    <span className="agume-product-detail-value">
                      {u.is_staff ? <Tag color="blue">Тийм</Tag> : <Tag color="default">Үгүй</Tag>}
                    </span>
                  </div>
                  <div className="agume-product-detail-row">
                    <span className="agume-product-detail-label">Супер админ</span>
                    <span className="agume-product-detail-value">
                      {u.is_superuser ? <Tag color="red">Тийм</Tag> : <Tag color="default">Үгүй</Tag>}
                    </span>
                  </div>
                  <div className="agume-product-detail-row">
                    <span className="agume-product-detail-label">Бүртгүүлсэн огноо</span>
                    <span className="agume-product-detail-value">{dateJoined}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </Card>
      )}
    </div>
  );
}
