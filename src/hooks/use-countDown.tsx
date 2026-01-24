import { useState, useEffect, useCallback } from "react";

const useCountdown = (initialCount: number) => {
  const [countdown, setCountdown] = useState<number>(initialCount);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  const startCountdown = useCallback(() => {
    setIsDisabled(true);
    setCountdown(initialCount);
  }, [initialCount]);

  useEffect(() => {
    let timer: any;

    if (isDisabled) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(timer);
            setIsDisabled(false);
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isDisabled]);

  return { countdown, isDisabled, startCountdown };
};

export default useCountdown;
