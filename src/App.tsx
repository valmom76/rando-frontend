import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ConfigProvider, Layout } from "antd";
import { useMediaQuery } from "react-responsive";
import Nav from "./components/Nav";
import RequireAuth from "./auth/RequireAuth";
import { authStore } from "./auth/store";

import Login from "./pages/Login";
import SignupTenant from "./pages/SignupTenant";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./pages/Dashboard";
import Skills from "./pages/Skills";
import Players from "./pages/PlayersPage";
import PlayerRatings from "./pages/PlayerRatings";
import TeamGenerator from "./pages/TeamGeneratorPage";
import ChampionshipsPage from "./pages/ChampionshipsPage";
import ChampionshipDetailPage from "./pages/ChampionshipDetailPage";
import ManualTeamPage from "./pages/ManualTeamPage";
import FriendlySessionsPage from "./pages/FriendlySessionsPage";
import FriendlySessionDetailPage from "./pages/FriendlySessionDetailPage";
import PlayerPerformancePage from "./pages/PlayerPerformancePage";
import PositionsPage from "./pages/PositionsPage";
import Upgrade from './pages/Upgrade';
import SessionHistory from "./pages/SessionHistory";
import { usePlanSync } from './hooks/usePlanSync';
import { useTenantTheme } from './hooks/useTenantTheme';
import GroupSettingsPage from './pages/GroupSettingsPage';

const { Content } = Layout;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const tenantTheme = useTenantTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("nav:collapsed") === "1"
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!authStore.getToken()
  );

  const isMobile = useMediaQuery({ maxWidth: 768 });

  usePlanSync(60000);

  useEffect(() => {
    localStorage.setItem("nav:collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    setIsAuthenticated(!!authStore.getToken());
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) return;

    authStore.syncTenantSettings().catch(() => {
      console.warn('Não foi possível sincronizar as configurações do grupo');
    });
  }, [isAuthenticated]);

  const toggleCollapsed = () => setCollapsed((c) => !c);

  return (
    <ConfigProvider theme={tenantTheme}>
      <QueryClientProvider client={queryClient}>
      <Layout
        style={{ minHeight: "100vh" }}
        hasSider={isAuthenticated && !isMobile}
      >
        {isAuthenticated && (
          <Nav collapsed={collapsed} onToggle={toggleCollapsed} />
        )}
        <Layout
          style={{
            marginLeft: isAuthenticated && !isMobile ? (collapsed ? 72 : 220) : 0,
            transition: "margin-left 0.2s",
            minHeight: "100vh",
          }}
        >
          <Content style={{ 
            padding: isMobile ? '8px' : 24,
            overflowX: 'hidden', 
            maxWidth: '100vw',
            boxSizing: 'border-box',            
          }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignupTenant />} />
              <Route path="/verify" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />   {/* ← nova */}
              <Route path="/reset-password" element={<ResetPasswordPage />} />     {/* ← nova */}
              <Route path="/upgrade" element={<Upgrade />} />

              {/* Rotas protegidas */}
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/performance" element={<RequireAuth><PlayerPerformancePage /></RequireAuth>} />
              <Route path="/skills" element={<RequireAuth><Skills /></RequireAuth>} />
              <Route path="/positions" element={<RequireAuth><PositionsPage /></RequireAuth>} />
              <Route path="/players" element={<RequireAuth><Players /></RequireAuth>} />
              <Route path="/generator" element={<RequireAuth><TeamGenerator /></RequireAuth>} />
              <Route path="/players/:playerId/ratings" element={<RequireAuth><PlayerRatings /></RequireAuth>} />
              <Route path="/sessions" element={<RequireAuth><SessionHistory /></RequireAuth>} />
              <Route path="/friendly-sessions" element={<RequireAuth><FriendlySessionsPage /></RequireAuth>} />
              <Route path="/friendly-sessions/:sessionId" element={<RequireAuth><FriendlySessionDetailPage /></RequireAuth>} />
              <Route path="/championships" element={<RequireAuth><ChampionshipsPage /></RequireAuth>} />
              <Route path="/championships/:id" element={<RequireAuth><ChampionshipDetailPage /></RequireAuth>} />
              <Route path="/manual-teams" element={<RequireAuth><ManualTeamPage /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><GroupSettingsPage /></RequireAuth>} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
      </QueryClientProvider>
    </ConfigProvider>
  );
}
