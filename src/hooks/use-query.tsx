import { useEffect, useState } from "react";
import useStorage from "context";
import { get, json } from "utils/request";

export const useProfile = () => {
  const {
    setting: { token, isLoged },
    setApp,
  } = useStorage();

  const getProfile = (callback?: any) => {
    if (!isLoged) return;
    get("user/profile", { token }).then((res: any) => {
      if (res?.success) {
        setApp(res?.data);
      }
      if (callback) {
        callback(res);
      }
    });
  };

  return { getProfile };
};
export const useAuth = () => {
  const { setSetting } = useStorage();
  const [loading, setLoding] = useState(false);

  const auth = (
    { wallet, type, ref }: { wallet: string; type: string; ref?: number },
    callback?: any
  ) => {
    setLoding(true);
    json("user/auth", { wallet, type, referId: ref }).then((res: any) => {
      setLoding(false);
      if (res?.success) {
        const { token } = res.data;
        setSetting({ login: { token } });
      }
      if (callback) {
        callback(res);
      }
    });
  };

  return { auth, loading };
};

export const useWallet = (force = true) => {
  const {
    app: { wallet },
    setting: { token, isLoged },
    setApp,
  } = useStorage();
  const [loading, setLoading] = useState(false);

  const fetchWallet = () => {
    if (isLoged) {
      setLoading(true);
      get("wallet/balance", { token }).then((res: any) => {
        setLoading(false);
        if (res?.success) {
          // Transform object with numeric keys to array
          let walletArray: any[] = [];
          const walletData = res?.data || res;
          
          if (Array.isArray(walletData)) {
            walletArray = walletData;
          } else if (walletData && typeof walletData === 'object') {
            // API returns { "0": {...}, "1": {...}, success: true }
            walletArray = Object.entries(walletData)
              .filter(([key]) => !isNaN(Number(key)))
              .map(([, value]) => value);
          }
          
          setApp({ wallet: walletArray });
        }
      });
    }
  };
  useEffect(() => {
    if (force) {
      fetchWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, wallet, fetchWallet };
};

export const useGetData = ({
  path,
  auth = false,
}: {
  path?: string | null;
  auth?: boolean;
}) => {
  const {
    setting: { token, isLoged },
  } = useStorage();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (path) {
      fetchData(path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async (xpath?: string, force?: boolean) => {
    const effectivePath = xpath || path; // Use parent path if xpath is not provided
    if (!effectivePath) {
      setError("Path is not defined.");
      return;
    }
    if (auth && !isLoged) return;

    setLoading(true);

    try {
      const res: any = await get(effectivePath, auth ? { token } : {});
      setTimeout(() => {
        setLoading(false);
      }, 200);
      if (res?.success) {
        setData(res.data);
        setError("");
      } else {
        setError("Failed to fetch profile.");
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
      setTimeout(() => {
        setLoading(false);
      }, 200);
    }
  };
  const refetch = () => {
    if (path) fetchData(path, true);
  };

  return { data, error, loading, fetchData, setData, refetch };
};

export const usePost = ({ auth = false }: { auth?: boolean }) => {
  const {
    setting: { token, isLoged },
  } = useStorage();

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendData = async (path: string, body: any, callback?: any) => {
    if (auth && !isLoged) return callback?.(null);
    setLoading(true);
    try {
      json(path, body, auth ? { token } : {}).then((res: any) => {
        setLoading(false);

        if (callback) {
          callback(res);
        }
        if (res?.success) {
          setData(res.data);
          setError("");
        } else {
          setError(
            typeof res.data === "string"
              ? res.data
              : "Problem, try another time!"
          );
        }
      });
    } catch (err: any) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return { data, error, loading, sendData };
};
