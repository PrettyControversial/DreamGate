import loadingKey from "@assets/dreamgate-loading-key.webp";

type PsyraLoadingKeyProps = {
  active?: boolean;
  label?: string;
};

export function PsyraLoadingKey({
  active = true,
  label = "Loading",
}: PsyraLoadingKeyProps) {
  if (!active) return null;

  return (
    <div className="psyra-loading-key" role="status" aria-label={label}>
      <img src={loadingKey} alt="" aria-hidden="true" />
    </div>
  );
}