'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Tag,
  Space,
  message,
  Dropdown,
  Steps,
  Modal,
  Switch,
  Form,
  Select,
  Input,
} from 'antd';
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  SwapOutlined,
  DownloadOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { employeesApi, ordersApi, preparationApi } from '@/lib/api';
import PageHeader from '../../components/PageHeader';
import { InvoicePdfTemplate, type OrderForPdf } from '../components/InvoicePdfTemplate';
import { VoucherPdfTemplate } from '../components/VoucherPdfTemplate';
import { exportElementToPdf } from '../utils/pdfFromHtml';
import { companySettingsToInvoiceInfo, defaultInvoiceCompany } from '../config/invoiceCompany';
import { configApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  processing: 'blue',
  delivering: 'purple',
  delivered: 'green',
  cancelled: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Хүлээгдэж буй',
  processing: 'Бэлдэж байна',
  delivering: 'Хүргэлтэнд гарсан',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
};

const ORDER_PROGRESS_STEPS = ['pending', 'processing', 'delivering', 'delivered'] as const;

type PdfType = 'invoice' | 'voucher' | null;

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfType, setPdfType] = useState<PdfType>(null);
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  const [invoiceCompany, setInvoiceCompany] = useState<ReturnType<typeof companySettingsToInvoiceInfo> | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintSaving, setComplaintSaving] = useState(false);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [complaintForm] = Form.useForm();
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!invoicePreviewOpen) return;
    configApi
      .getCompany()
      .then(({ data }) => setInvoiceCompany(companySettingsToInvoiceInfo(data)))
      .catch(() => setInvoiceCompany(defaultInvoiceCompany));
  }, [invoicePreviewOpen]);

  const invoiceOrder: OrderForPdf | null = order
    ? {
        order_number: order.order_number as string | undefined,
        order_date: order.order_date as string | undefined,
        customer_name: order.customer_name as string | undefined,
        customer_code: order.customer_code as string | undefined,
        customer_phone: order.customer_phone as string | undefined,
        customer_address: order.customer_address as string | undefined,
        customer_register_number: order.customer_register_number as string | undefined,
        customer_tax_id: order.customer_tax_id as string | undefined,
        customer_account_number: order.customer_account_number as string | undefined,
        total_amount: order.total_amount as number | undefined,
        items: order.items as OrderForPdf['items'],
      }
    : null;

  useEffect(() => {
    if (!id) return;
    ordersApi
      .detail(id)
      .then(({ data }) => setOrder(data))
      .catch(() => message.error('Захиалга олдсонгүй'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    employeesApi.list({ is_active: 'true' }).then(({ data }) => {
      const list = (data as { results?: { id: number; name: string }[] }).results ?? data;
      setEmployees(Array.isArray(list) ? list.map((e) => ({ id: e.id, name: e.name })) : []);
    });
  }, []);

  useEffect(() => {
    if (!pdfType || !order || !pdfContainerRef.current) return;
    const el = pdfContainerRef.current.firstElementChild as HTMLElement | null;
    if (!el) return;
    const orderNumber = String(order.order_number ?? id);
    const filename = pdfType === 'invoice' ? `invoice_${orderNumber}.pdf` : `voucher_${orderNumber}.pdf`;
    const run = async () => {
      try {
        await exportElementToPdf(el, filename);
        message.success('PDF татагдлаа');
      } catch (e) {
        message.error('PDF үүсгэхэд алдаа гарлаа');
      } finally {
        setPdfType(null);
      }
    };
    const t = setTimeout(run, 100);
    return () => clearTimeout(t);
  }, [pdfType, order, id]);

  const updateStatus = async (status: string) => {
    try {
      await ordersApi.updateStatus(id, status);
      const { data } = await ordersApi.detail(id);
      setOrder(data);
      message.success('Статус шинэчлэгдлээ');
    } catch {
      message.error('Статус солиход алдаа гарлаа');
    }
  };

  const setUrgent = async (checked: boolean) => {
    try {
      await ordersApi.patch(id, { is_urgent: checked });
      const { data } = await ordersApi.detail(id);
      setOrder(data);
      message.success('Хадгалагдлаа');
    } catch {
      message.error('Хадгалахад алдаа');
    }
  };

  const handleSendInvoiceEmail = async () => {
    const email = (order?.customer_email as string)?.trim?.();
    setSendingEmail(true);
    try {
      await ordersApi.sendInvoiceEmail(id, email || undefined);
      message.success('И-мэйл амжилттай илгээгдлээ.');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      message.error(detail || 'И-мэйл илгээхэд алдаа гарлаа.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !order) {
    return (
      <Card loading={loading}>
        <div style={{ minHeight: 200 }} />
      </Card>
    );
  }

  const items = (order.items as Record<string, unknown>[]) || [];

  const itemColumns = [
    { title: '№', width: 50, render: (_: unknown, __: unknown, index: number) => index + 1 },
    { title: 'Барааны нэр', dataIndex: ['product_name'], key: 'product_name' },
    { title: 'Тоо хэмжээ', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'right' as const },
    { title: 'Нэгж', dataIndex: ['product_unit'], key: 'product_unit', width: 70 },
    { title: 'Нэгжийн үнэ', dataIndex: 'unit_price', key: 'unit_price', width: 110, align: 'right' as const, render: (v: number) => v != null ? `${Number(v).toLocaleString()} ₮` : '-' },
    { title: 'Нийт', dataIndex: 'total_price', key: 'total_price', width: 110, align: 'right' as const, render: (v: number) => v != null ? `${Number(v).toLocaleString()} ₮` : '-' },
  ];

  const pathname = usePathname();
  const status = String(order.status ?? '');
  const isCancelled = status === 'cancelled';
  const currentStepIndex = isCancelled ? -1 : ORDER_PROGRESS_STEPS.indexOf(status as (typeof ORDER_PROGRESS_STEPS)[number]);
  const progressSteps = ORDER_PROGRESS_STEPS.map((key, index) => {
    let stepStatus: 'wait' | 'process' | 'finish' | 'error' = 'wait';
    if (isCancelled) {
      stepStatus = 'wait';
    } else if (index < currentStepIndex) {
      stepStatus = 'finish';
    } else if (index === currentStepIndex) {
      stepStatus = 'process';
    }
    return {
      title: STATUS_LABELS[key],
      status: stepStatus,
      key,
    };
  });

  return (
    <div className="print-area">
      <div className="no-print" style={{ marginBottom: 16 }}>
        <PageHeader
          pathname={pathname}
          items={[
            { title: 'Нүүр', href: '/orders' },
            { title: 'Захиалга', href: '/orders' },
            { title: `#${String(order.order_number)}` },
          ]}
        />
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/orders')} style={{ marginTop: 8 }}>
          Буцах
        </Button>
      </div>
      <Card
        title={
          <Space>
            <span>Захиалга #{String(order.order_number)}</span>
            <Tag color={STATUS_COLORS[order.status as string]}>
              {String(STATUS_LABELS[order.status as string] ?? order.status ?? '')}
            </Tag>
            {Boolean(order.created_by_ai) && <Tag color="blue">AI</Tag>}
          </Space>
        }
        loading={loading}
        extra={
          <div className="no-print">
            <Space>
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={() => setInvoicePreviewOpen(true)}
                style={{ background: '#25671E' }}
              >
                Нэхэмжлэх
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => setPdfType('voucher')}
              >
                Зарлагийн баримт
              </Button>
              <Dropdown
                menu={{
                  items: (['pending', 'processing', 'delivering', 'delivered', 'cancelled'] as const).map(
                    (s) => ({
                      key: s,
                      label: STATUS_LABELS[s],
                      onClick: () => updateStatus(s),
                    })
                  ),
                }}
              >
                <Button icon={<SwapOutlined />}>Статус солих</Button>
              </Dropdown>
              <Button onClick={() => setComplaintOpen(true)}>Гомдол бүртгэх</Button>
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                Хэвлэх
              </Button>
            </Space>
          </div>
        }
      >
        <div className="agume-order-detail-progress no-print" style={{ marginBottom: 24 }}>
          <div className="agume-order-detail-progress-label">Захиалгын явц</div>
          <Steps
            current={isCancelled ? -1 : currentStepIndex}
            items={progressSteps.map((s, i) => ({
              title: s.title,
              status: s.status,
              icon: <span className="agume-order-step-num">{i + 1}</span>,
            }))}
            className="agume-order-detail-steps"
          />
          {isCancelled && (
            <div className="agume-order-detail-cancelled-badge">
              <Tag color="red">Захиалга цуцлагдсан</Tag>
            </div>
          )}
        </div>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Харилцагч">{String(order.customer_name)}</Descriptions.Item>
          <Descriptions.Item label="Утас">{String(order.customer_phone || '-')}</Descriptions.Item>
          <Descriptions.Item label="Хаяг">{String(order.customer_address || '-')}</Descriptions.Item>
          <Descriptions.Item label="Захиалгын огноо">{String(order.order_date)}</Descriptions.Item>
          <Descriptions.Item label="Хүргэлтийн огноо">{String(order.delivery_date || '-')}</Descriptions.Item>
          <Descriptions.Item label="Оператор">{String(order.operator_name || '-')}</Descriptions.Item>
          <Descriptions.Item label="Жолооч">{String(order.driver_name || '-')}</Descriptions.Item>
          <Descriptions.Item label="Нийт дүн">
            <strong>{Number(order.total_amount).toLocaleString()} ₮</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Яаралтай">
            <Switch checked={Boolean(order.is_urgent)} onChange={setUrgent} checkedChildren="Тийм" unCheckedChildren="Үгүй" />
          </Descriptions.Item>
          {Boolean(order.note) && (
            <Descriptions.Item label="Тайлбар" span={3}>
              {String(order.note)}
            </Descriptions.Item>
          )}
        </Descriptions>
        <Table
          dataSource={items}
          columns={itemColumns}
          rowKey="id"
          pagination={false}
          size="small"
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4} align="right">
                  <strong>НИЙТ ДҮН</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} colSpan={2} align="right">
                  <strong>{Number(order.total_amount).toLocaleString()} ₮</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      <Modal
        title="Бэлтгэлийн гомдол / санал"
        open={complaintOpen}
        onCancel={() => setComplaintOpen(false)}
        okText="Илгээх"
        confirmLoading={complaintSaving}
        onOk={async () => {
          try {
            const v = await complaintForm.validateFields();
            setComplaintSaving(true);
            await preparationApi.complaints.create({
              order: id,
              product: v.product,
              preparer: v.preparer,
              message: v.message,
            });
            message.success('Бүртгэгдлээ');
            complaintForm.resetFields();
            setComplaintOpen(false);
          } catch (e: unknown) {
            const d = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
            if (d && typeof d === 'object' && 'detail' in d) message.error(String(d.detail));
          } finally {
            setComplaintSaving(false);
          }
        }}
        destroyOnClose
      >
        <Form form={complaintForm} layout="vertical">
          <Form.Item name="product" label="Бараа" rules={[{ required: true, message: 'Сонгоно уу' }]}>
            <Select
              placeholder="Захиалгын мөрөөс"
              options={items.map((it) => ({
                value: it.product as number,
                label: `${String(it.product_name ?? '')} (${String(it.quantity ?? '')} ${String(it.product_unit ?? '')})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="preparer" label="Бэлтгэсэн ажилтан" rules={[{ required: true, message: 'Сонгоно уу' }]}>
            <Select
              placeholder="Ажилтан"
              options={employees.map((e) => ({ value: e.id, label: e.name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="message" label="Тайлбар" rules={[{ required: true, message: 'Бичнэ үү' }]}>
            <Input.TextArea rows={3} placeholder="Гомдлын агуулга" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Нэхэмжлэх preview modal */}
      <Modal
        title="Нэхэмжлэх - Урьдчилан харах"
        open={invoicePreviewOpen}
        onCancel={() => setInvoicePreviewOpen(false)}
        width="90%"
        style={{ maxWidth: 800 }}
        footer={[
          <Button key="close" onClick={() => setInvoicePreviewOpen(false)}>
            Хаах
          </Button>,
          <Button
            key="email"
            icon={<MailOutlined />}
            loading={sendingEmail}
            onClick={handleSendInvoiceEmail}
          >
            И-мэйлээр илгээх
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              setInvoicePreviewOpen(false);
              setPdfType('invoice');
            }}
            style={{ background: '#25671E' }}
          >
            PDF татах
          </Button>,
        ]}
      >
        <div
          style={{
            maxHeight: '70vh',
            overflow: 'auto',
            padding: 8,
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
          }}
        >
          {invoiceOrder && (
            <InvoicePdfTemplate
              order={invoiceOrder}
              company={invoiceCompany ?? defaultInvoiceCompany}
            />
          )}
        </div>
      </Modal>

      {/* Hidden container for HTML → PDF (off-screen render) */}
      <div
        ref={pdfContainerRef}
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          width: '210mm',
          zIndex: -1,
          pointerEvents: 'none',
        }}
        aria-hidden
      >
        {pdfType === 'invoice' && invoiceOrder && (
          <InvoicePdfTemplate
            order={invoiceOrder}
            company={invoiceCompany ?? defaultInvoiceCompany}
          />
        )}
        {pdfType === 'voucher' && order && (
          <VoucherPdfTemplate
            order={{
              order_number: order.order_number as string,
              order_date: order.order_date as string,
              customer_name: order.customer_name as string,
              driver_name: order.driver_name as string,
              total_amount: order.total_amount as number,
              items: (order.items as Record<string, unknown>[]) ?? [],
            }}
          />
        )}
      </div>
    </div>
  );
}
