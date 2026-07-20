import React, { useState } from 'react';
import { FloatButton, Drawer, Menu } from 'antd';
import {
  DashboardOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  UserOutlined,
  SettingOutlined,
  FundOutlined,
  TrophyOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/upgrade', icon: <CrownOutlined />, label: 'Planos' },
  { key: '/generator', icon: <ThunderboltOutlined />, label: 'Gerar Times' },
  { key: '/players', icon: <UserOutlined />, label: 'Jogadores' },
  { key: '/skills', icon: <SettingOutlined />, label: 'Skills' },
  { key: '/positions', icon: <FundOutlined />, label: 'Posições' },
  { key: '/championships', icon: <TrophyOutlined />, label: 'Campeonatos' },
  { key: '/performance', icon: <DashboardOutlined />, label: 'Desempenho' },
];

const MobileMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    setOpen(false);
  };

  return (
    <>
      <FloatButton
        icon={<MenuOutlined />}
        type="primary"
        style={{
          right: 20,
          bottom: 20,
          backgroundColor: 'var(--primary)',
          color: 'var(--surface-2)',
        }}
        onClick={() => setOpen(true)}
      />
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setOpen(false)}
        open={open}
        size="default"    
        styles={{
          header: { backgroundColor: 'var(--surface-2)', color: 'var(--primary)' },
          body: { backgroundColor: 'var(--surface-2)', padding: 0 },
        }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ backgroundColor: 'var(--surface-2)', color: '#fff' }}
          theme="dark"
        />
      </Drawer>
    </>
  );
};

export default MobileMenu;