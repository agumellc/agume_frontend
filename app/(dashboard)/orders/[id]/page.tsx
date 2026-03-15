'use client';

import { useState, useEffect } from 'react';
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
} from 'antd';
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import PageHeader from '../../components/PageHeader';

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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    ordersApi
      .detail(id)
      .then(({ data }) => setOrder(data))
      .catch(() => message.error('Захиалга олдсонгүй'))
      .finally(() => setLoading(false));
  }, [id]);

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
                onClick={() => ordersApi.openInvoicePdf(id)}
                style={{ background: '#25671E' }}
              >
                Нэхэмжлэх PDF
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => ordersApi.openVoucherPdf(id)}
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
    </div>
  );
}
