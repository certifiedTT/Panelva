"use client";

import { useEffect, useState } from "react";

interface TimeAgoProps {
  date: Date | string;
}

export function TimeAgo({ date }: TimeAgoProps) {
  const [mounted, setMounted] = useState(false);
  const [timeText, setTimeText] = useState("");

  useEffect(() => {
    setMounted(true);
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const diffMs = Date.now() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      setTimeText("Just now");
    } else if (diffMins < 60) {
      setTimeText(`${diffMins}m ago`);
    } else if (diffHours < 24) {
      setTimeText(`${diffHours}h ago`);
    } else if (diffDays === 1) {
      setTimeText("Yesterday");
    } else {
      setTimeText(dateObj.toLocaleDateString());
    }
  }, [date]);

  if (!mounted) {
    return <span className="time-placeholder">...</span>;
  }

  return <time className="time-text">{timeText}</time>;
}
