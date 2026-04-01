'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Tabs,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Space,
  Card,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePathname } from 'next/navigation';
import PageHeader from '../components/PageHeader';
import { inventoryApi, productsApi } from '@/lib/api';

type Row = Record<string, unknown>;

export default function InventoryPage() {
  const pathname = usePathname();
  const [lowStock, setLowStock] = useState<Row[]>([]);
  const [suppliers, setSuppliers] = useState<Row[]>([]);
  const [links, setLinks] = useState<Row[]>([]);
  const [waste, setWaste] = useState<Row[]>([]);
  const [products, setProducts] = useState<{ id: number; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [supModal, setSupModal] = useState(false);
  const [linkModal, setLinkModal] = useState(false);
  const [supForm] = Form.useForm();
  const [linkForm] = Form.useForm();
  const [wasteForm] = Form.useForm();

  const loadLow = useCallback(async () => {
    const { data } = await inventoryApi.lowStock();
    setLowStock(data.results || []);
  }, []);

  const loadSuppliers = useCallback(async () => {
    const { data } = await inventoryApi.suppliers.list({ is_active: 'true' });
    const body = data as { results?: Row[] };
    setSuppliers(body.results ?? (Array.isArray(data) ? data : []));
  }, []);

  const loadLinks = useCallback(async () => {
    const { data } = await inventoryApi.supplierProducts.list();
    const body = data as { results?: Row[] };
    setLinks(body.results ?? (Array.isArray(data) ? data : []));
  }, []);

  const loadWaste = useCallback(async () => {
    const { data } = await inventoryApi.wasteRecords.list();
    const body = data as { results?: Row[] };
    setWaste(body.results ?? (Array.isArray(data) ? data : []));
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadLow(), loadSuppliers(), loadLinks(), loadWaste()]);
    } catch {
      message.error('Ачааллахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [loadLow, loadLinks, loadSuppliers, loadWaste]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    productsApi.list({ is_active: 'true', page_size: '500' }).then(({ data }) => {
      const list = (data as { results?: Row[] }).results ?? data;
      const arr = Array.isArray(list) ? list : [];
      setProducts(
        arr.map((p) => ({
          id: p.id as number,
          label: `${p.code} — ${p.name}`,
        }))
      );
    });
  }, []);

  const lowCols: ColumnsType<Row> = [
    { title: 'Код', dataIndex: 'code', width: 100 },
    { title: 'Бараа', dataIndex: 'name' },
    { title: 'Нэгж', dataIndex: 'unit', width: 80 },
    { title: 'Үлдэгдэл', dataIndex: 'stock_quantity', align: 'right', width: 110 },
    { title: 'Доод хязгаар', dataIndex: 'stock_min_threshold', align: 'right', width: 120 },
  ];

  const supCols: ColumnsType<Row> = [
    { title: 'Код', dataIndex: 'code', width: 100 },
    { title: 'Нэр', dataIndex: 'name' },
    { title: 'Утас', dataIndex: 'phone', width: 120 },
    {
      title: '',
      key: 'act',
      width: 80,
      render: (_, r) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            supForm.setFieldsValue(r);
            setSupModal(true);
          }}
        >
          Засах
        </Button>
      ),
    },
  ];

  const linkCols: ColumnsType<Row> = [
    { title: 'Нийлүүлэгч', dataIndex: 'supplier_name', width: 160 },
    { title: 'Бараа', dataIndex: 'product_name' },
    { title: 'Үнэ', dataIndex: 'unit_cost', align: 'right', width: 100 },
    { title: 'Давтамж', dataIndex: 'delivery_frequency' },
  ];

  const wasteCols: ColumnsType<Row> = [
    { title: 'Огноо', dataIndex: 'created_at', width: 170, render: (v) => String(v).slice(0, 19) },
    { title: 'Бараа', dataIndex: 'product_name' },
    { title: 'Төрөл', dataIndex: 'waste_type', width: 140 },
    { title: 'Тоо', dataIndex: 'quantity', align: 'right', width: 90 },
    { title: 'Тэмдэглэл', dataIndex: 'note', ellipsis: true },
  ];

  return (
    <div>
      <PageHeader
        pathname={pathname}
        title="Нөөц, нийлүүлэгч"
        description="Доод хязгаар, нийлүүлэгчийн холбоос, хаягдал/буцаалтын бүртгэл"
        extra={
          <Button icon={<ReloadOutlined />} onClick={refreshAll} loading={loading}>
            Шинэчлэх
          </Button>
        }
      />

      <Tabs
        items={[
          {
            key: 'low',
            label: `Дутуу нөөц (${lowStock.length})`,
            children: (
              <Card>
                <Table rowKey="id" columns={lowCols} dataSource={lowStock} loading={loading} pagination={false} size="small" />
              </Card>
            ),
          },
          {
            key: 'sup',
            label: 'Нийлүүлэгч',
            children: (
              <Card
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      supForm.resetFields();
                      supForm.setFieldsValue({ is_active: true });
                      setSupModal(true);
                    }}
                  >
                    Нэмэх
                  </Button>
                }
              >
                <Table rowKey="id" columns={supCols} dataSource={suppliers} loading={loading} pagination={false} size="small" />
              </Card>
            ),
          },
          {
            key: 'link',
            label: 'Бараа — нийлүүлэгч',
            children: (
              <Card
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      linkForm.resetFields();
                      linkForm.setFieldsValue({ is_active: true, unit_cost: 0 });
                      setLinkModal(true);
                    }}
                  >
                    Холбоос нэмэх
                  </Button>
                }
              >
                <Table rowKey="id" columns={linkCols} dataSource={links} loading={loading} pagination={false} size="small" />
              </Card>
            ),
          },
          {
            key: 'waste',
            label: 'Хаягдал / буцаалт',
            children: (
              <Card
                title="Шинэ бүртгэл"
                style={{ marginBottom: 16 }}
              >
                <Form
                  form={wasteForm}
                  layout="inline"
                  onFinish={async (v) => {
                    try {
                      await inventoryApi.wasteRecords.create({
                        product: v.product,
                        waste_type: v.waste_type,
                        quantity: v.quantity,
                        note: v.note || '',
                        adjust_stock: v.adjust_stock !== false,
                      });
                      message.success('Бүртгэгдлээ');
                      wasteForm.resetFields();
                      loadWaste();
                      loadLow();
                    } catch {
                      message.error('Алдаа');
                    }
                  }}
                >
                  <Form.Item name="product" rules={[{ required: true }]}>
                    <Select placeholder="Бараа" style={{ width: 260 }} options={products.map((p) => ({ value: p.id, label: p.label }))} showSearch optionFilterProp="label" />
                  </Form.Item>
                  <Form.Item name="waste_type" initialValue="damaged" rules={[{ required: true }]}>
                    <Select
                      style={{ width: 200 }}
                      options={[
                        { value: 'damaged', label: 'Гэмтсэн' },
                        { value: 'returned_customer', label: 'Харилцагчаас буцаасан' },
                        { value: 'returned_other', label: 'Бусад буцаалт' },
                        { value: 'other', label: 'Бусад' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="quantity" rules={[{ required: true }]}>
                    <InputNumber min={0.0001} step={0.1} placeholder="Тоо" />
                  </Form.Item>
                  <Form.Item name="adjust_stock" valuePropName="checked" initialValue>
                    <Switch checkedChildren="Үлдэгдэл хасах" unCheckedChildren="Зөвхөн бүртгэл" />
                  </Form.Item>
                  <Form.Item name="note">
                    <Input placeholder="Тэмдэглэл" style={{ width: 200 }} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      Хадгалах
                    </Button>
                  </Form.Item>
                </Form>
                <Table rowKey="id" columns={wasteCols} dataSource={waste} loading={loading} pagination={{ pageSize: 20 }} size="small" style={{ marginTop: 16 }} />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title="Нийлүүлэгч"
        open={supModal}
        onCancel={() => setSupModal(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form
          form={supForm}
          layout="vertical"
          onFinish={async (v) => {
            try {
              const rawId = v.id as number | undefined;
              const { id: _omit, ...rest } = v as Record<string, unknown> & { id?: number };
              if (rawId) await inventoryApi.suppliers.update(rawId, rest);
              else await inventoryApi.suppliers.create(rest);
              message.success('Хадгалагдлаа');
              setSupModal(false);
              loadSuppliers();
            } catch {
              message.error('Алдаа');
            }
          }}
        >
          <Form.Item name="id" hidden>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="code" label="Код" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Утас">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Хаяг">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="email" label="И-мэйл">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="Тэмдэглэл">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked" initialValue>
            <Switch />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Хадгалах
            </Button>
            <Button onClick={() => setSupModal(false)}>Цуцлах</Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        title="Нийлүүлэгч — бараа"
        open={linkModal}
        onCancel={() => setLinkModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={linkForm}
          layout="vertical"
          initialValues={{ is_active: true, unit_cost: 0 }}
          onFinish={async (v) => {
            try {
              await inventoryApi.supplierProducts.create(v);
              message.success('Нэмэгдлээ');
              setLinkModal(false);
              loadLinks();
            } catch {
              message.error('Алдаа');
            }
          }}
        >
          <Form.Item name="supplier" label="Нийлүүлэгч" rules={[{ required: true }]}>
            <Select
              options={suppliers.map((s) => ({ value: s.id as number, label: String(s.name) }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="product" label="Бараа" rules={[{ required: true }]}>
            <Select options={products.map((p) => ({ value: p.id, label: p.label }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="unit_cost" label="Нэгжийн үнэ" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="delivery_frequency" label="Нийлүүлэлтийн давтамж">
            <Input placeholder="Ж: 7 хоногт 1" />
          </Form.Item>
          <Form.Item name="supplier_sku" label="Нийлүүлэгчийн код">
            <Input />
          </Form.Item>
          <Form.Item name="is_active" valuePropName="checked" initialValue hidden>
            <Switch />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Хадгалах
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
