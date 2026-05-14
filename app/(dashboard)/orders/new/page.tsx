import { Suspense } from 'react';
import { Spin } from 'antd';
import NewOrderForm from './NewOrderForm';

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 400, margin: '80px auto', textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      }
    >
      <NewOrderForm />
    </Suspense>
  );
}
