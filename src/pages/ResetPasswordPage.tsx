import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Form, Input, Card, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { http } from '../api/http';

const { Title } = Typography;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token]);

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      await http.post('/auth/reset-password', { token, password: values.password });
      setSuccess(true);
      message.success('Senha alterada com sucesso!');
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0d0d0d',
        padding: 16,
      }}>
        <Card style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
          <Title level={4} style={{ color: 'var(--primary)' }}>Senha alterada!</Title>
          <Button
            type="primary"
            block
            onClick={() => navigate('/login')}
            style={{
              marginTop: 16,
              backgroundColor: 'var(--primary)',
              borderColor: 'var(--primary)',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: 6,
              height: 40,
            }}
          >
            Ir para o Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0d0d0d',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/images/logo_light.svg" alt="Bora Ver" style={{ width: 180 }} />
        </div>

        <Card title="Redefinir Senha">
          <Form layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Nova Senha"
              name="password"
              rules={[
                { required: true, message: 'Informe a nova senha' },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message: 'Mín. 8 caracteres, maiúscula, minúscula, número e especial (@$!%*?&)',
                },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} disabled={loading} />
            </Form.Item>
            <Form.Item
              label="Confirmar Nova Senha"
              name="confirmPassword"
              rules={[
                { required: true, message: 'Confirme a nova senha' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('As senhas não coincidem'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} disabled={loading} />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                backgroundColor: 'var(--primary)',
                borderColor: 'var(--primary)',
                color: '#000',
                fontWeight: 'bold',
                borderRadius: 6,
                height: 40,
              }}
            >
              Redefinir Senha
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
}