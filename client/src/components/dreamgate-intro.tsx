import { useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import introImage from "@assets/Copy_of_Holistic_Coach_Instagram_Kit_(Square_Posts)_1788595169788.png";

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
    const timeoutId = window.setTimeout(finish, 1200);
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
        onError={onError}
      />
      <div className="dashboard-intro__loader" aria-label="Opening DreamGate">
        <KeyRound aria-hidden="true" />
      </div>
    </div>
  );
}
