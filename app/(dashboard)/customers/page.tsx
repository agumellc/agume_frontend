'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Card,
  Table,
  Button,
  Input,
  Modal,
  Form,
  Switch,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { customersApi } from '@/lib/api';
import PageHeader from '../components/PageHeader';

export default function CustomersPage() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> | undefined = search ? { search } : undefined;
      const { data: res } = await customersApi.list(params);
      setData((res?.results ?? res) as Record<string, unknown>[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as number);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      phone: record.phone,
      address: record.address,
      email: record.email,
      register_number: record.register_number,
      note: record.note,
      is_active: record.is_active !== false,
    });
    setModalOpen(true);
  };

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      if (editingId) {
        await customersApi.update(editingId, values);
        message.success('Шинэчлэгдлээ');
      } else {
        await customersApi.create(values);
        message.success('Нэмэгдлээ');
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      message.error(String(e?.response?.data?.detail || e?.response?.data || 'Алдаа'));
    }
  };

  const onDelete = async (id: number) => {
    try {
      await customersApi.delete(id);
      message.success('Устгагдлаа');
      fetchCustomers();
    } catch {
      message.error('Устгахад алдаа гарлаа');
    }
  };

  const columns = [
    { title: 'Код', dataIndex: 'code', width: 100 },
    { title: 'Нэр', dataIndex: 'name', ellipsis: true },
    { title: 'Утас', dataIndex: 'phone', width: 120 },
    { title: 'Хаяг', dataIndex: 'address', ellipsis: true },
    { title: 'Идэвхтэй', dataIndex: 'is_active', width: 80, render: (v: boolean) => (v ? 'Тийм' : 'Үгүй') },
    {
      title: 'Үйлдэл',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Record<string, unknown>) => (
        <span>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Засах
          </Button>
          <Popconfirm title="Устгах уу?" onConfirm={() => onDelete(record.id as number)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Устгах
            </Button>
          </Popconfirm>
        </span>
      ),
    },
  ];

  const pathname = usePathname();

  return (
    <div>
      <PageHeader pathname={pathname} title="Харилцагч" description="Харилцагчийн бүртгэл, хайлт" />
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Input.Search
            placeholder="Нэр / Утас / Хаяг хайх"
            allowClear
            onSearch={setSearch}
            style={{ width: 260 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ background: '#25671E' }}>
            Нэмэх
          </Button>
        </div>
      </Card>
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
      <Modal
        title={editingId ? 'Харилцагч засах' : 'Харилцагч нэмэх'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="code" label="Код" rules={[{ required: true }]}>
            <Input placeholder="Код" />
          </Form.Item>
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
            <Input placeholder="Нэр" />
          </Form.Item>
          <Form.Item name="phone" label="Утас">
            <Input placeholder="Утас" />
          </Form.Item>
          <Form.Item name="address" label="Хаяг">
            <Input.TextArea rows={2} placeholder="Хаяг" />
          </Form.Item>
          <Form.Item name="email" label="И-мэйл">
            <Input type="email" placeholder="И-мэйл" />
          </Form.Item>
          <Form.Item name="register_number" label="Регистр">
            <Input placeholder="Регистрийн дугаар" />
          </Form.Item>
          <Form.Item name="note" label="Тайлбар">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ background: '#25671E' }}>
              Хадгалах
            </Button>
            <Button onClick={() => setModalOpen(false)} style={{ marginLeft: 8 }}>
              Цуцлах
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
