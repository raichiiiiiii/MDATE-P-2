import { useEffect, useState } from "react";

type UseSplashLoadingOptions = {
  messages: string[];
  intervalMs?: number;
  enabled?: boolean;
};

export function useSplashLoading({
  messages,
  intervalMs = 8000,
  enabled = true,
}: UseSplashLoadingOptions) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [messages]);

  useEffect(() => {
    if (!enabled || messages.length < 2) return;

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [messages.length, intervalMs, enabled]);

  return {
    message: messages[index] ?? "Getting things ready for you.",
    index,
  };
}
