import { useState } from 'react';
import { Button, Form, Input, Card, Typography, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { http } from '../api/http';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      await http.post('/auth/forgot-password', { email: values.email });
      setSent(true);
      message.success('E-mail enviado! Verifique sua caixa de entrada.');
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Erro ao enviar e-mail');
    } finally {
      setLoading(false);
    }
  };

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

        {!sent ? (
          <Card title="Recuperar Senha">
            <Text style={{ color: '#aaa', display: 'block', marginBottom: 16 }}>
              Digite seu e-mail para receber um link de recuperação.
            </Text>
            <Form layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Informe o e-mail' },
                  { type: 'email', message: 'E-mail inválido' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="seu@email.com" />
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
                Enviar Link
              </Button>
            </Form>
          </Card>
        ) : (
          <Card>
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Title level={4} style={{ color: 'var(--primary)' }}>E-mail enviado!</Title>
              <Text style={{ color: '#aaa' }}>
                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
              </Text>
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
                Voltar ao Login
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}