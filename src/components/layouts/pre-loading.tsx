import React from "react";
import logo from "assets/images/logo.png";

export default function BraceLoader({
  fullscreen = true,
  text = "Timetrade",
}: {
  fullscreen?: boolean;
  text?: string;
}) {
  return (
    <div
      className={
        fullscreen
          ? "flex flex-col items-center justify-center min-h-screen"
          : "flex flex-col items-center justify-center"
      }
    >
      <img src={logo} alt="logo" className="w-24" />

      <div className="text-xl mt-4 text-center font-bold animate-pulse uppercase">
        {text}
      </div>
    </div>
  );
}
