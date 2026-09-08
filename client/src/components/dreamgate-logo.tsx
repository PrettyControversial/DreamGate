import logoImage from "@assets/dreamgate_brand/dreamgate-logo.webp";

interface DreamGateLogoProps {
  className?: string;
}

export function DreamGateLogo({ className = "h-8 w-8" }: DreamGateLogoProps) {
  return (
    <img
      className={`dreamgate-logo-mark ${className}`}
      src={logoImage}
      alt=""
      aria-hidden="true"
    />
  );
}