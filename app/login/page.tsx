'use client';

import { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await authApi.login(values.username, values.password);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user_username', values.username);
      message.success('Нэвтэрлээ');
      router.push('/orders');
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { detail?: string } } };
      const msg =
        axErr?.response?.data?.detail || 'Нэвтрэх нэр эсвэл нууц үг буруу байна';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7f5 0%, #e8f5e9 100%)',
        padding: 16,
      }}
    >
      <Card
        style={{
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 4px 24px rgba(37, 103, 30, 0.15)',
          borderRadius: 12,
        }}
        styles={{ header: { borderBottom: '2px solid #25671E', textAlign: 'center' } }}
        title={
          <span style={{ color: '#25671E', fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>
            🌿 AGUME
          </span>
        }
      >
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Нэвтрэх нэрээ оруулна уу' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Нэвтрэх нэр" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Нууц үгээ оруулна уу' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Нууц үг" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ background: '#25671E', height: 44 }}
            >
              Нэвтрэх
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
