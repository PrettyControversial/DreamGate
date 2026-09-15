import { useEffect, useRef, useState } from "react";
import introImage from "@assets/Copy_of_Holistic_Coach_Instagram_Kit_(Square_Posts)_1788595169788.png";
import loadingKey from "@assets/dreamgate-loading-key.webp";

interface DreamgateIntroProps {
  onComplete: () => void;
  onError?: () => void;
}

export function DreamgateIntro({ onComplete, onError }: DreamgateIntroProps) {
  const [isEnding, setIsEnding] = useState(false);
  const hasFinished = useRef(false);

  const finish = () => {
    if (hasFinished.current) return;
    hasFinished.current = true;
    setIsEnding(true);
    window.setTimeout(onComplete, 180);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(finish, 2400);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div
      className={`dashboard-intro${isEnding ? " dashboard-intro--ending" : ""}`}
      role="presentation"
      onClick={finish}
    >
      <img
        src={introImage}
        alt="Who looks outside, dreams; who looks inside, awakes. — Carl Jung"
        className="dashboard-intro__art"
        onError={onError}
      />
      <DreamgateLoadingKey />
    </div>
  );
}

export function DreamgateLoadingKey({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`dashboard-intro__loader${compact ? " dashboard-intro__loader--compact" : ""}`} aria-label="Opening DreamGate">
      <img src={loadingKey} alt="" aria-hidden="true" />
    </div>
  );
}
