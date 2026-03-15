'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Card, Table, message } from 'antd';
import { logsApi } from '@/lib/api';
import PageHeader from '../../components/PageHeader';

export default function LogActivityPage() {
  const pathname = usePathname();
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    logsApi
      .activity()
      .then(({ data: res }) => setData((res?.results ?? res ?? []) as Record<string, unknown>[]))
      .catch(() => {
        message.error('Үйлдэлийн түүх ачааллахад алдаа гарлаа');
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'Огноо', dataIndex: 'created_at', key: 'created_at', width: 180, render: (v: string) => v ? new Date(v).toLocaleString('mn-MN') : '—' },
    { title: 'Хэрэглэгч', dataIndex: 'username', key: 'username', width: 140 },
    { title: 'Үйлдэл', dataIndex: 'action', key: 'action', width: 120 },
    { title: 'Объект', dataIndex: 'object_type', key: 'object_type', width: 120 },
    { title: 'Дэлгэрэнгүй', dataIndex: 'message', key: 'message', ellipsis: true },
  ];

  return (
    <div>
      <PageHeader
        pathname={pathname}
        title="Үйлдэлийн түүх"
        description="Систем дээр хийгдсэн үйлдлүүдийн түүх"
      />
      <Card>
        <Table
          rowKey={(r) => String((r as Record<string, unknown>).id ?? (r as Record<string, unknown>).created_at ?? Math.random())}
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `Нийт ${t} бүртгэл` }}
          locale={{ emptyText: 'Одоогоор үйлдлийн түүх байхгүй байна.' }}
        />
      </Card>
    </div>
  );
}
