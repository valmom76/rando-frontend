import { Button, Card, Space, Table, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { listSkills } from "../api/skills";
import type { Skill } from "../api/skills";
import { getCurrentRatings, upsertRatings } from "../api/ratings";
import RatingStars from "../components/RatingStars";

type Row = Skill & { rating: number };

export default function PlayerRatings() {
  const { playerId } = useParams();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [current, setCurrent] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const rows: Row[] = useMemo(() => {
    return skills.map((s) => ({ ...s, rating: current[s.id] ?? 0 }));
  }, [skills, current]);

  async function load() {
    if (!playerId) return;
    setLoading(true);
    try {
      const [sk, cur] = await Promise.all([listSkills(), getCurrentRatings(playerId)]);
      setSkills(sk);
      setCurrent(cur);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Erro ao carregar ratings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [playerId]);

  async function saveAll() {
    if (!playerId) return;
    setSaving(true);
    try {
      const payload = {
        playerId,
        ratings: rows.map((r) => ({ skillId: r.id, rating: r.rating })),
      };
      await upsertRatings(payload);
      message.success("Ratings salvos!");
      await load();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Erro ao salvar ratings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Space orientation="vertical" style={{ width: "100%" }} size={16}>
      <Card title={`Ratings do jogador: ${playerId}`}>
        <Button 
          className="dashboard-btn primary"
          onClick={saveAll} 
          loading={saving} 
          disabled={loading}
        >
          Salvar
        </Button>
      </Card>

      <Card title="Fundamentos">
        <Table<Row>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={false}
          columns={[
            { title: "Code", dataIndex: "code", width: 160 },
            { title: "Nome", dataIndex: "name" },
            {
              title: "Rating (0–5)",
              dataIndex: "rating",
              render: (_, r) => (
                <RatingStars
                  value={r.rating}
                  onChange={(v) => setCurrent((prev) => ({ ...prev, [r.id]: v }))}
                />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
