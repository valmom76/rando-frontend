import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadProps } from 'antd';
import {
  CheckOutlined,
  PictureOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';

import { http } from '../api/http';
import { authStore, type SportType } from '../auth/store';

const { Title, Text } = Typography;

type TenantSettings = {
  groupName: string;
  sportType: SportType;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
};

const FALLBACK_LOGO = '/images/boraver-logo-transparent.png';

const COLOR_SCHEMES = [
  { name: 'Verde R4NDO', primary: '#01ff69', secondary: '#0b0f0c' },
  { name: 'Azul Arena', primary: '#2f9bff', secondary: '#08111f' },
  { name: 'Roxo Elite', primary: '#a970ff', secondary: '#120b1d' },
  { name: 'Laranja Energia', primary: '#ff9f1a', secondary: '#1b1004' },
  { name: 'Vermelho Clássico', primary: '#ff4d4f', secondary: '#1c0809' },
];

type ApiError = {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError;
  return apiError.response?.data?.error || apiError.response?.data?.message || fallback;
};

export default function GroupSettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    http
      .get<TenantSettings>('/tenant/settings')
      .then(({ data }) => setSettings(data))
      .catch((error) => message.error(getErrorMessage(error, 'Não foi possível carregar as configurações.')))
      .finally(() => setLoading(false));
  }, []);

  const syncLocalBranding = (next: TenantSettings) => {
    const auth = authStore.get();
    authStore.set({
      ...auth,
      groupName: next.groupName,
      sportType: next.sportType,
      logoUrl: next.logoUrl,
      primaryColor: next.primaryColor,
      secondaryColor: next.secondaryColor,
    });
  };

  const saveColors = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { data } = await http.put<TenantSettings>('/tenant/settings', {
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
      });
      setSettings(data);
      syncLocalBranding(data);
      message.success('Esquema de cores atualizado.');
    } catch (error) {
      message.error(getErrorMessage(error, 'Não foi possível salvar as cores.'));
    } finally {
      setSaving(false);
    }
  };

  const validateLogo: UploadProps['beforeUpload'] = (file) => {
    if (file.type !== 'image/png') {
      message.error('Selecione uma imagem no formato PNG.');
      return Upload.LIST_IGNORE;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('A imagem deve ter no máximo 5 MB.');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const uploadLogo: UploadProps['customRequest'] = async ({ file, onError, onSuccess }) => {
    if (!settings) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file as File);

      const { data } = await http.post<{ logoUrl: string }>(
        '/tenant/settings/logo',
        formData,
      );

      const next = { ...settings, logoUrl: data.logoUrl };
      setSettings(next);
      syncLocalBranding(next);
      onSuccess?.(data);
      message.success('Escudo atualizado. Ele já será usado nos próximos flyers.');
    } catch (error) {
      onError?.(error as Error);
      message.error(getErrorMessage(error, 'Não foi possível enviar o escudo.'));
    } finally {
      setUploading(false);
    }
  };

  if (loading || !settings) {
    return (
      <main className="group-settings-page">
        <Card><Skeleton active /></Card>
      </main>
    );
  }

  const sportLabel = settings.sportType === 'FOOTBALL' ? 'Futebol' : 'Vôlei';
  const sportIcon = settings.sportType === 'FOOTBALL' ? '⚽' : '🏐';

  return (
    <main className="group-settings-page">
      <header className="group-settings-header">
        <div>
          <Title level={2}>Identidade do grupo</Title>
          <Text type="secondary">
            Personalize a aparência do sistema e dos materiais gerados.
          </Text>
        </div>
        <Tag className="group-sport-tag">{sportIcon} {sportLabel}</Tag>
      </header>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={10}>
          <Card title="Escudo do grupo" className="group-settings-card">
            <div className="group-logo-preview" style={{ background: settings.secondaryColor }}>
              <img
                src={settings.logoUrl || FALLBACK_LOGO}
                alt={`Escudo ${settings.groupName}`}
                onError={(event) => { event.currentTarget.src = FALLBACK_LOGO; }}
              />
            </div>

            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Upload
                accept="image/png,.png"
                maxCount={1}
                showUploadList={false}
                beforeUpload={validateLogo}
                customRequest={uploadLogo}
              >
                <Button
                  icon={settings.logoUrl ? <PictureOutlined /> : <UploadOutlined />}
                  loading={uploading}
                  block
                >
                  {settings.logoUrl ? 'Substituir escudo' : 'Enviar escudo PNG'}
                </Button>
              </Upload>
              <Text type="secondary" className="group-settings-help">
                Use PNG com fundo transparente, preferencialmente quadrado. Tamanho máximo: 5 MB.
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Esquema de cores" className="group-settings-card">
            <div className="color-scheme-grid">
              {COLOR_SCHEMES.map((scheme) => {
                const selected =
                  settings.primaryColor.toLowerCase() === scheme.primary.toLowerCase()
                  && settings.secondaryColor.toLowerCase() === scheme.secondary.toLowerCase();

                return (
                  <button
                    type="button"
                    key={scheme.name}
                    className={`color-scheme-option ${selected ? 'selected' : ''}`}
                    onClick={() => setSettings({
                      ...settings,
                      primaryColor: scheme.primary,
                      secondaryColor: scheme.secondary,
                    })}
                  >
                    <span className="color-scheme-swatches">
                      <span style={{ background: scheme.primary }} />
                      <span style={{ background: scheme.secondary }} />
                    </span>
                    <span>{scheme.name}</span>
                    {selected && <CheckOutlined />}
                  </button>
                );
              })}
            </div>

            <div className="custom-colors">
              <label>
                <span>Cor principal</span>
                <span className="color-input-wrap">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(event) => setSettings({
                      ...settings,
                      primaryColor: event.target.value,
                    })}
                  />
                  <code>{settings.primaryColor.toUpperCase()}</code>
                </span>
              </label>

              <label>
                <span>Cor de fundo</span>
                <span className="color-input-wrap">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(event) => setSettings({
                      ...settings,
                      secondaryColor: event.target.value,
                    })}
                  />
                  <code>{settings.secondaryColor.toUpperCase()}</code>
                </span>
              </label>
            </div>

            <div
              className="branding-preview"
              style={{
                background: settings.secondaryColor,
                borderColor: settings.primaryColor,
              }}
            >
              <img
                src={settings.logoUrl || FALLBACK_LOGO}
                alt="Prévia do escudo"
                onError={(event) => { event.currentTarget.src = FALLBACK_LOGO; }}
              />
              <div>
                <strong style={{ color: settings.primaryColor }}>{settings.groupName}</strong>
                <span>Prévia da identidade visual</span>
              </div>
            </div>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={saveColors}
              block
              size="large"
            >
              Salvar esquema de cores
            </Button>
          </Card>
        </Col>
      </Row>
    </main>
  );
}
