import { Button } from "antd";
import type { ButtonProps } from "antd";
import clsx from "clsx";
type Tone = "generate" | "save" | "copy" | "reset";

type AppButtonProps = Omit<ButtonProps, "variant"> & {
  tone?: Tone;
};

export default function AppButton({
  tone = "generate",
  className,
  children,
  ...props
}: AppButtonProps) {
  return (
    <Button
      {...props}
      className={clsx("action-btn-compact", tone, className)}
    >
      {children}
    </Button>
  );
}
