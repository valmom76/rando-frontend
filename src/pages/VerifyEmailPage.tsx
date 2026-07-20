import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, Form, Input, message, Card } from 'antd';
import { http } from '../api/http';
import { authStore } from '../auth/store';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    authStore.clear(); 
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    setStatus('form');
  }, [token]);

  const handleSetPassword = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('As senhas não coincidem');
      return;
    }
    setSubmitting(true);
    try {
      await http.post('/auth/verify-email', { token, password: values.password });
      setStatus('success');
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.error || 
        e?.response?.data?.message ||  
        e?.message ||  
        'Erro ao verificar e-mail';
      
      message.error(errorMsg);
      setStatus('error');  
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') return <Spin size="large" style={{ display: 'block', marginTop: 100 }} />;

  if (status === 'form') {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0d0d0d',
          padding: 16,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img
              src="/images/logo_light.svg"
              alt="Bora Ver"
              style={{ width: 180, height: 'auto' }}
            />
          </div>

          <Card title="Definir Senha">
            <Form layout="vertical" onFinish={handleSetPassword}>
              <Form.Item
                label="Senha"
                name="password"
                rules={[
                  { required: true, message: 'Informe a senha' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                    message: 'Mín. 8 caracteres, maiúscula, minúscula, número e especial (@$!%*?&)',
                  },
                ]}
              >
                <Input.Password disabled={submitting} />
              </Form.Item>
              <Form.Item
                label="Confirmar Senha"
                name="confirmPassword"
                rules={[
                  { required: true, message: 'Confirme a senha' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('As senhas não coincidem'));
                    },
                  }),
                ]}
              >
                <Input.Password disabled={submitting} />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                style={{
                  backgroundColor: 'var(--primary)',
                  borderColor: 'var(--primary)',
                  color: '#000',
                  fontWeight: 'bold',
                  borderRadius: 6,
                  height: 40,
                  fontSize: 16,
                }}
              >
                Ativar Conta
              </Button>
            </Form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0d0d0d',
        padding: 16,
      }}
    >
      <Result
        status={status === 'success' ? 'success' : 'error'}
        title={status === 'success' ? 'Conta ativada!' : 'Link inválido ou expirado'}
        subTitle={
          status === 'success'
            ? 'Sua senha foi definida. Faça login para começar.'
            : 'Solicite um novo link de verificação.'
        }
        extra={
          <Button
            type="primary"
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: 'var(--primary)',
              borderColor: 'var(--primary)',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: 6,
              height: 40,
              fontSize: 16,
            }}
          >
            Ir para o Login
          </Button>
        }
      />
    </div>
  );
}