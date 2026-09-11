import dreamGateEye from "@assets/obj__(2)_1788380180447.png";

export function setMeditationMediaSession(title: string) {
  if (
    typeof navigator === "undefined" ||
    !("mediaSession" in navigator) ||
    typeof MediaMetadata === "undefined"
  ) {
    return;
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist: "DreamGate",
    album: "DreamGate Meditations",
    artwork: [
      {
        src: dreamGateEye,
        sizes: "1280x1221",
        type: "image/png",
      },
    ],
  });
}