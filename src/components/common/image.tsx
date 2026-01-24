import React from "react";

interface ProfileBackgroundProps {
  src?: string;
  fallbackColor?: string;
  className?: string;
}

export default function Img({
  src,
  fallbackColor = "bg-neutral-300/30",
  className = "",
}: ProfileBackgroundProps) {
  return (
    <div
      role="img"
      draggable={false}
      className={`w-full h-full ${fallbackColor} ${className}`}
      style={{
        backgroundImage: src ? `url(${src})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
}
