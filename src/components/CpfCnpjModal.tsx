import { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { http } from '../api/http';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CpfCnpjModal({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { cpfCnpj: string }) => {
    setLoading(true);
    try {
      await http.put('/user/cpf-cnpj', values);
      message.success('Documento salvo!');
      onSuccess();
      onClose();
    } catch {
      message.error('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Documento necessário"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Salvar e continuar"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="cpfCnpj"
          label="CPF ou CNPJ"
          rules={[
            { required: true, message: 'Informe o documento' },
            { pattern: /^\d{11}$|^\d{14}$/, message: '11 dígitos (CPF) ou 14 (CNPJ)' }
          ]}
        >
          <Input placeholder="Apenas números" maxLength={14} />
        </Form.Item>
      </Form>
    </Modal>
  );
}