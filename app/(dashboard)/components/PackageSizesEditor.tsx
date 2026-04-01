'use client';

import { Button, Form, InputNumber, Space, Typography } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

type Props = {
  /** Form.List нэр — API руу шууд `package_sizes` массив болно */
  name?: string;
  /** InputNumber хажууд харагдах нэгж */
  unitLabel?: string;
};

/**
 * Нэг бараанд олон савлагааны хэмжээ (жишээ 20 кг, 5 кг) — тусдаа product үүсгэлгүй.
 */
export default function PackageSizesEditor({ name = 'package_sizes', unitLabel = 'кг' }: Props) {
  return (
    <div>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 10, fontSize: 13 }}>
        Ижил бараанд зардаг савлагаануудын жин оруулна (жишээ 20 ба 5). «Үйлдвэрийн нэгтгэл» нийт
        захиалгыг эдгээр хэмжээгээр томоос нь эхлэн задлаж харуулна.
      </Typography.Paragraph>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name: fieldName, ...rest }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...rest}
                  name={fieldName}
                  rules={[{ required: true, message: 'Жин оруулна уу' }]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber
                    min={0.01}
                    max={99999}
                    step={0.5}
                    style={{ width: 200 }}
                    addonAfter={unitLabel}
                    placeholder="Жишээ 20"
                  />
                </Form.Item>
                <MinusCircleOutlined
                  style={{ color: 'var(--agume-text-tertiary)', fontSize: 18, cursor: 'pointer' }}
                  onClick={() => remove(fieldName)}
                />
              </Space>
            ))}
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="small">
              Савлагааны хэмжээ нэмэх
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
}
