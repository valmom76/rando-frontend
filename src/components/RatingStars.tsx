import { Rate } from "antd";

export default function RatingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <Rate value={value} count={5} onChange={onChange} />;
}
