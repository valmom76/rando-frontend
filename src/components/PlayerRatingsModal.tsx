import { Button, Modal, Card, Space, Table, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { listSkills } from "../api/skills";
import type { Skill } from "../api/skills";
import { getCurrentRatings, upsertRatings } from "../api/ratings";
import RatingStars from "./RatingStars";
import AppButton from "./AppButton";
import { CloseOutlined } from "@ant-design/icons";

type Row = Skill & { rating: number };

type Props = {
  open: boolean;
  playerId: string | null;
  playerName?: string;
  onClose: () => void;
  /** opcional: avisar o parent que salvou */
  onSaved?: () => void;
};

export default function PlayerRatingsModal({
  open,
  playerId,
  playerName,
  onClose,
  onSaved,
}: Props) {
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

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, playerId]);

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
      onSaved?.();
      onClose(); // fecha ao salvar (como você pediu)
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Erro ao salvar ratings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Ratings • ${playerName ?? playerId ?? ""}`}
      width={860}
      centered
      footer={null}
      destroyOnHidden
      closeIcon={<CloseOutlined style={{ color: 'var(--primary)' }} />}
    >
      <Space orientation="vertical" style={{ width: "100%" }} size={12}>
        <Card
          size="small"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button 
              className="dashboard-btn primary"
              onClick={saveAll} 
              loading={saving} 
              disabled={loading}
            >
              Salvar
            </Button>            
            <AppButton tone="copy" onClick={onClose} disabled={saving}>
              Cancelar
            </AppButton>
          </div>
        </Card>

        <Card
          title="Skills"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          styles={{
            header: { borderColor: "var(--border)" },
            body: { padding: 0 },
          }}
        >
          <Table<Row>
            rowKey="id"
            loading={loading}
            dataSource={rows}
            pagination={false}
            columns={[
              { title: "Code", dataIndex: "code", width: 140 },
              { title: "Nome", dataIndex: "name" },
              {
                title: "Rating (0–5)",
                dataIndex: "rating",
                width: 260,
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
    </Modal>
  );
}