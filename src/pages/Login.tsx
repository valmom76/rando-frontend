import { Card, Form, Input, message } from "antd";
import { loginBySlug } from "../api/auth";
import { authStore } from "../auth/store";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import AppButton from "../components/AppButton";

export default function Login() {
  const [form] = Form.useForm();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onFinish(values: any) {
    setLoading(true);
    try {
      const res = await loginBySlug(values);

      authStore.set({
        token: res.token,
        tenantId: res.tenantId,
        userId: res.userId,
        role: res.role,
        tenantSlug: values.tenantSlug,
        userName: res.userName,
        primaryColor: res.primaryColor,
        secondaryColor: res.secondaryColor,
        logoUrl: res.logoUrl,
        planName: res.planName,
        features: res.features,
        emailVerified: res.emailVerified,
        groupName: res.groupName,
        sportType: res.sportType,
      });

      message.success("Bem-vindo!");
      nav(`/t/${values.tenantSlug}/dashboard`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Falha no login";

      if (msg.toLowerCase().includes("não verificado") || msg.toLowerCase().includes("email não verificado")) {
        message.warning({
          content: "E-mail não verificado. Verifique sua caixa de entrada ou solicite um novo link.",
          duration: 6,
        });
      } else {
        message.error(msg);
      }
    } finally {
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
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src="/images/logo_light.svg"
            alt="Bora Ver"
            style={{ width: 180, height: "auto" }}
          />
        </div>

        <Card title="Entrar">
          <Form
            layout="vertical"
            form={form}
            onFinish={onFinish}
            initialValues={{
              tenantSlug: authStore.getTenantSlug() ?? "",
            }}
          >
            <Form.Item
              label="Grupo"
              name="tenantSlug"
              rules={[{ required: true, message: "Informe o grupo" }]}
            >
              <Input disabled={loading} />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, type: "email" }]}
            >
              <Input type="email" disabled={loading} />
            </Form.Item>

            <Form.Item
              label="Senha"
              name="password"
              rules={[{ required: true }]}
            >
              <Input.Password disabled={loading} />
            </Form.Item>

            {/* Link de recuperação de senha */}
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: 13 }}>
                Esqueceu a senha?
              </Link>
            </div>

            <AppButton tone="generate" htmlType="submit" block loading={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </AppButton>
          </Form>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link to="/signup">Criar novo grupo</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
