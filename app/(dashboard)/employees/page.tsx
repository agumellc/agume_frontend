'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Button,
  Input,
  Modal,
  Form,
  Select,
  Switch,
  message,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { employeesApi } from '@/lib/api';
import PageHeader from '../components/PageHeader';

const ROLES = [
  { value: 'driver', label: 'Жолооч' },
  { value: 'operator', label: 'Оператор' },
  { value: 'manager', label: 'Менежер' },
  { value: 'admin', label: 'Админ' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'red',
  manager: 'blue',
  operator: 'green',
  driver: 'purple',
};

export default function EmployeesPage() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data: res } = await employeesApi.list(Object.keys(params).length ? params : undefined);
      setData((res?.results ?? res) as Record<string, unknown>[]);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter((r) => r.is_active === true).length;
    const withUser = data.filter((r) => (r.user_detail as Record<string, unknown> | null)?.['username']).length;
    const byRole = ROLES.reduce((acc, { value }) => {
      acc[value] = data.filter((r) => r.role === value).length;
      return acc;
    }, {} as Record<string, number>);
    return { total, active, withUser, byRole };
  }, [data]);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

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
      role: record.role,
      phone: record.phone,
      is_active: record.is_active !== false,
    });
    setModalOpen(true);
  };

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      if (editingId) {
        await employeesApi.update(editingId, values);
        message.success('Шинэчлэгдлээ');
      } else {
        await employeesApi.create(values);
        message.success('Нэмэгдлээ');
      }
      setModalOpen(false);
      fetchEmployees();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      message.error(String(e?.response?.data?.detail || e?.response?.data || 'Алдаа'));
    }
  };

  const onDelete = async (id: number) => {
    try {
      await employeesApi.delete(id);
      message.success('Устгагдлаа');
      fetchEmployees();
    } catch {
      message.error('Устгахад алдаа гарлаа');
    }
  };

  const renderUser = (record: Record<string, unknown>, key: string, formatter?: (ud: Record<string, unknown>) => React.ReactNode) => {
    const ud = record.user_detail as Record<string, unknown> | undefined;
    if (!ud) return <span className="agume-employees-cell-muted">—</span>;
    if (formatter) return <>{formatter(ud)}</>;
    const v = ud[key];
    return v != null && String(v) ? <span>{String(v)}</span> : <span className="agume-employees-cell-muted">—</span>;
  };

  const columns = [
    {
      title: 'Ажилтан',
      children: [
        {
          title: 'Код',
          dataIndex: 'code',
          key: 'code',
          width: 100,
          fixed: 'left' as const,
          render: (code: string, record: Record<string, unknown>) => (
            <a
              href={`/employees/${record.id}`}
              onClick={(e) => { e.preventDefault(); router.push(`/employees/${record.id}`); }}
              className="agume-employees-table-link"
            >
              {code}
            </a>
          ),
        },
        {
          title: 'Нэр',
          dataIndex: 'name',
          key: 'name',
          width: 140,
          render: (name: string, record: Record<string, unknown>) => (
            <a
              href={`/employees/${record.id}`}
              onClick={(e) => { e.preventDefault(); router.push(`/employees/${record.id}`); }}
              className="agume-employees-table-link agume-employees-cell-main"
            >
              {name}
            </a>
          ),
        },
        {
          title: 'Үүрэг',
          dataIndex: 'role',
          key: 'role',
          width: 110,
          render: (role: string, record: Record<string, unknown>) => (
            <Tag color={ROLE_COLORS[role] || 'default'} className="agume-employees-role-tag">
              {(record.role_display as string) || role}
            </Tag>
          ),
        },
        {
          title: 'Утас',
          dataIndex: 'phone',
          key: 'phone',
          width: 110,
          className: 'agume-employees-cell-muted',
          render: (v: string) => v || '—',
        },
        {
          title: 'Идэвхтэй',
          dataIndex: 'is_active',
          key: 'is_active',
          width: 90,
          render: (v: boolean) => (
            <Tag color={v ? 'green' : 'default'}>{v ? 'Тийм' : 'Үгүй'}</Tag>
          ),
        },
      ],
    },
    {
      title: 'Нэвтрэлтийн хэрэглэгч',
      children: [
        {
          title: 'Username',
          key: 'username',
          width: 110,
          render: (_: unknown, record: Record<string, unknown>) => renderUser(record, 'username'),
        },
        {
          title: 'И-мэйл',
          key: 'user_email',
          width: 160,
          ellipsis: true,
          render: (_: unknown, record: Record<string, unknown>) =>
            renderUser(record, 'email', (ud) =>
              ud.email && String(ud.email) ? <span>{String(ud.email)}</span> : <span className="agume-employees-cell-muted">—</span>
            ),
        },
        {
          title: 'Бүртгүүлсэн',
          key: 'date_joined',
          width: 128,
          className: 'agume-employees-cell-muted',
          render: (_: unknown, record: Record<string, unknown>) => {
            const ud = record.user_detail as Record<string, unknown> | undefined;
            if (!ud?.date_joined) return <span className="agume-employees-cell-muted">—</span>;
            return (
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {new Date(String(ud.date_joined)).toLocaleString('mn-MN', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            );
          },
        },
      ],
    },
    {
      title: 'Үйлдэл',
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => router.push(`/employees/${record.id}`)}
            className="agume-employees-action-btn"
          >
            Засах
          </Button>
          <Popconfirm title="Устгах уу?" onConfirm={() => onDelete(record.id as number)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Устгах
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const pathname = usePathname();

  return (
    <div className="agume-employees-page">
      <PageHeader
        pathname={pathname}
        title="Ажилтан"
        description="Ажилтны бүртгэл, үүрэг"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="agume-employees-add-btn">
            Нэмэх
          </Button>
        }
      />

      <section className="agume-employees-stats" aria-label="Тойм">
        <div className="agume-employees-stats-inner">
          <div className="agume-employees-stat agume-employees-stat-main">
            <div className="agume-employees-stat-icon-wrap">
              <TeamOutlined className="agume-employees-stat-icon" />
            </div>
            <div className="agume-employees-stat-body">
              <span className="agume-employees-stat-label">Нийт ажилтан</span>
              <span className="agume-employees-stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="agume-employees-stat">
            <div className="agume-employees-stat-body">
              <span className="agume-employees-stat-label">Идэвхтэй</span>
              <span className="agume-employees-stat-value">{stats.active}</span>
            </div>
          </div>
          <div className="agume-employees-stat">
            <div className="agume-employees-stat-icon-wrap agume-employees-stat-icon-wrap-muted">
              <UserOutlined className="agume-employees-stat-icon" />
            </div>
            <div className="agume-employees-stat-body">
              <span className="agume-employees-stat-label">Холбогдсон хэрэглэгч</span>
              <span className="agume-employees-stat-value">{stats.withUser}</span>
            </div>
          </div>
        </div>
        {(stats.byRole.admin ?? 0) + (stats.byRole.manager ?? 0) + (stats.byRole.operator ?? 0) + (stats.byRole.driver ?? 0) > 0 && (
          <div className="agume-employees-stats-roles">
            <span className="agume-employees-stats-roles-label">Үүргээр</span>
            <div className="agume-employees-stats-roles-list">
              {ROLES.map(({ value, label }) =>
                (stats.byRole[value] ?? 0) > 0 ? (
                  <span key={value} className="agume-employees-stat-role-pill">
                    <Tag color={ROLE_COLORS[value]} className="agume-employees-stat-role-tag">
                      {label}
                    </Tag>
                    <span className="agume-employees-stat-role-value">{stats.byRole[value]}</span>
                  </span>
                ) : null
              )}
            </div>
          </div>
        )}
      </section>

      <Card className="agume-employees-filters" size="small">
        <div className="agume-employees-filters-label">Шүүлтрүүлэг</div>
        <Space wrap size="middle" style={{ width: '100%' }}>
          <Input.Search
            placeholder="Нэр / Код / Утас хайх"
            allowClear
            onSearch={setSearch}
            className="agume-employees-search"
            style={{ width: 240 }}
          />
          <Select
            placeholder="Үүргээр"
            allowClear
            style={{ width: 140 }}
            value={roleFilter ?? undefined}
            onChange={(v) => setRoleFilter(v ?? null)}
            options={ROLES}
          />
        </Space>
      </Card>

      <Card className="agume-employees-table-card" size="small">
        <div className="agume-employees-table-header">
          <h3 className="agume-employees-table-title">Жагсаалт</h3>
          <span className="agume-employees-table-count">Нийт {data.length} ажилтан</span>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1200 }}
          className="agume-employees-table"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Нийт ${total} ажилтан`,
          }}
          onRow={(record, index) => ({
            className: `agume-employees-table-row ${index !== undefined && index % 2 === 0 ? 'agume-employees-row-even' : 'agume-employees-row-odd'}`,
            onClick: () => router.push(`/employees/${record.id}`),
          })}
          locale={{ emptyText: 'Ажилтан олдсонгүй. Дээрх "Нэмэх" товчоор нэмнэ үү.' }}
        />
      </Card>
      <Modal
        title={editingId ? 'Ажилтан засах' : 'Ажилтан нэмэх'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="code" label="Код" rules={[{ required: true }]}>
            <Input placeholder="Код" />
          </Form.Item>
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
            <Input placeholder="Нэр" />
          </Form.Item>
          <Form.Item name="role" label="Үүрэг" rules={[{ required: true }]}>
            <Select placeholder="Сонгох" options={ROLES} />
          </Form.Item>
          <Form.Item name="phone" label="Утас">
            <Input placeholder="Утас" />
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
