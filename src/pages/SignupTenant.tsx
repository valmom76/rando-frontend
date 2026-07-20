import { useState } from "react";
import { Card, Form, Input, Select, Typography, message } from "antd";
import { registerTenant } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import AppButton from "../components/AppButton";

export default function SignupTenant() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const nav = useNavigate();

  async function onFinish(values: any) {
    setLoading(true);
    try {
      await registerTenant(values);

      message.success({
        content: "Conta criada com sucesso! Verifique seu e-mail para definir sua senha.",
        duration: 6,
      });

      nav("/login?verified=pending");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Falha ao criar conta";

      if (msg.toLowerCase().includes("já existe")) {
        message.warning("Este identificador de grupo já está em uso. Escolha outro.");
      } else {
        message.error(msg);
      }
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0d0d0d",
        padding: 16,
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src="/images/logo_light.svg"
            alt="Bora Ver"
            style={{ width: 400, height: "auto" }}
          />
        </div>

        <Card title="Criar Grupo + Administrador">
          <Form
            layout="vertical"
            form={form}
            onFinish={onFinish}
            initialValues={{ sportType: 'VOLLEYBALL' }}
          >
            <Form.Item
              label="Nome do grupo"
              name="tenantName"
              rules={[{ required: true, message: "Informe o nome do grupo" }]}
            >
              <Input placeholder="Ex.: Vôlei Bora Ver" />
            </Form.Item>

            <Form.Item
              label="Esporte do grupo"
              name="sportType"
              rules={[{ required: true, message: "Selecione o esporte" }]}
              extra={
                <Typography.Text type="secondary" style={{ fontSize: 12, color: "#FFF" }}>
                  O esporte não poderá ser alterado depois que o grupo tiver jogadores ou campeonatos.
                </Typography.Text>
              }
            >
              <Select
                options={[
                  { value: 'VOLLEYBALL', label: '🏐 Vôlei' },
                  { value: 'FOOTBALL', label: '⚽ Futebol' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Identificador"
              name="tenantSlug"
              rules={[
                { required: true, message: "Informe um identificador único" },
                { pattern: /^[a-z0-9-]+$/, message: "Apenas letras minúsculas, números e hífen" },
                { min: 3, message: "Mínimo de 3 caracteres" },
              ]}
            >
              <Input placeholder="Ex.: boraver" />
            </Form.Item>

            <Form.Item
              label="Nome do administrador"
              name="adminName"
              rules={[{ required: true, message: "Informe o nome do admin" }]}
            >
              <Input placeholder="Seu nome completo" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Informe o e-mail" },
                { type: "email", message: "E-mail inválido" },
              ]}
            >
              <Input placeholder="admin@exemplo.com" type="email" />
            </Form.Item>

            <AppButton tone="generate" htmlType="submit" block loading={loading}>
              {loading ? "Criando Conta..." : "Criar Conta"}
            </AppButton>            
          </Form>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link to="/login">Já possui uma conta? Faça login</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
