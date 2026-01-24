import useStorage from "context";
import { useEffect } from "react";
import { get } from "utils/request";

const TokenLoader = () => {
  const {
    memory: { tokens = [] },
    setMemory,
  } = useStorage();

  useEffect(() => {
    if (!tokens.length) {
      const fetchTokens = async () => {
        const res: any = await get("tokens");

        if (res?.success) {
          setMemory({ tokens: res.data?.tokens ?? [] });
        }
      };

      fetchTokens();
    }
  }, []);

  return null;
};

export default TokenLoader;
