import { useCallback, useState } from "react";
import { Tabs, Typography } from "antd";
import type { TabsProps } from "antd";
import { DatabaseOutlined, FundOutlined } from "@ant-design/icons";

import DbTeamGenerator from "../components/DbTeamGenerator";
import { PotSelection } from "../components/PotSelection";

const { Title, Text } = Typography;

export type PlayerColumns = {
  coluna1: string[];
  coluna2: string[];
  coluna3: string[];
  coluna4: string[];
};

type TabKey = "database" | "potes";

export default function TeamGenerator() {
  const [activeTab, setActiveTab] = useState<TabKey>("database");

  const tabsItems: TabsProps["items"] = [
    {
      key: "database",
      label: (
        <span className="team-generator-tab-label">
          <DatabaseOutlined />
          Sorteio
        </span>
      ),
    },
    {
      key: "potes",
      label: (
        <span className="team-generator-tab-label">
          <FundOutlined />
          Potes
        </span>
      ),
    },
  ];

  const onTabChange = useCallback((key: string) => {
    setActiveTab(key as TabKey);
  }, []);

  return (
    <main className="team-generator-page">
      <header className="team-generator-header">
        <Title level={2} className="team-generator-title">
          Geração de Times
        </Title>

        <Text className="team-generator-subtitle">
          Monte times por sorteio inteligente ou organize manualmente por potes.
        </Text>
      </header>

      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={tabsItems}
        size="large"
        className="team-generator-tabs"
      />

      {activeTab === "database" && <DbTeamGenerator />}

      {activeTab === "potes" && <PotSelection />}
    </main>
  );
}