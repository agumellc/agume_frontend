'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Card, Table, message } from 'antd';
import { logsApi } from '@/lib/api';
import PageHeader from '../../components/PageHeader';

export default function LogLoginPage() {
  const pathname = usePathname();
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    logsApi
      .login()
      .then(({ data: res }) => setData((res?.results ?? res ?? []) as Record<string, unknown>[]))
      .catch(() => {
        message.error('Нэвтрэлтийн түүх ачааллахад алдаа гарлаа');
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'Огноо', dataIndex: 'created_at', key: 'created_at', width: 180, render: (v: string) => v ? new Date(v).toLocaleString('mn-MN') : '—' },
    { title: 'Хэрэглэгч', dataIndex: 'username', key: 'username', width: 140 },
    { title: 'IP хаяг', dataIndex: 'ip_address', key: 'ip_address', width: 140 },
    { title: 'Амжилттай', dataIndex: 'success', key: 'success', width: 100, render: (v: boolean) => (v ? 'Тийм' : 'Үгүй') },
  ];

  return (
    <div>
      <PageHeader
        pathname={pathname}
        title="Нэвтрэлтийн түүх"
        description="Системд нэвтэрсэн оролдлогуудын түүх"
      />
      <Card>
        <Table
          rowKey={(r) => String((r as Record<string, unknown>).id ?? (r as Record<string, unknown>).created_at ?? Math.random())}
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `Нийт ${t} бүртгэл` }}
          locale={{ emptyText: 'Одоогоор нэвтрэлтийн түүх байхгүй байна.' }}
        />
      </Card>
    </div>
  );
}
