"use client";

import * as React from "react";

export function ReadingProgress() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      if (windowHeight <= 0) {
        setProgress(0);
        return;
      }
      const currentProgress = (totalScroll / windowHeight) * 100;
      setProgress(Math.min(100, Math.max(0, currentProgress)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-night/50 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-gold/70 via-gold to-gold-soft transition-all duration-150 shadow-[0_0_10px_rgba(230,175,46,0.85)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
