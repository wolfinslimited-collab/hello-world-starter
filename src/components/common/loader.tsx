/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useStorage from "context";
import { useProfile } from "hooks/use-query";
import { get } from "utils/request";

const Loader = ({ children }: { children: any }) => {
  const {
    setting: { isLoged },
    setSetting,
    setMemory,
    setApp,
  } = useStorage();
  const { search } = useLocation();
  const queryToken = new URLSearchParams(search).get("token");

  const { getProfile } = useProfile();
  const [profileFetched, setProfileFetched] = useState(false);

  useEffect(() => {
    const _ref = new URLSearchParams(search).get("ref");
    if (_ref) {
      setApp({ ref: Number(_ref) });
    }
  }, [search]);

  const _getProfile = () => {
    getProfile((res: any) => {
      if (res?.success) {
        setApp(res.data);
        setProfileFetched(true);
      }
    });
  };

  const get_token = async () => {
    const res: any = await get("tokens");
    console.log("[Loader] Token API response:", res);
    if (res?.success) {
      // Store airdrop token list in memory (for token listing pages)
      const tokensList = res?.tokens || res?.data?.tokens || [];
      console.log("[Loader] Tokens loaded and cached:", tokensList.length, "items", tokensList);
      setMemory({ tokens: tokensList });
    } else {
      console.warn("[Loader] Failed to load tokens:", res?.error);
    }
  };
  useEffect(() => {
    get_token();
  }, []);
  useEffect(() => {
    if (queryToken) {
      setSetting({ login: { token: queryToken } });
      setTimeout(() => {
        _getProfile();
      }, 200);
    } else if (isLoged && !profileFetched) {
      _getProfile();
    }
  }, [isLoged, queryToken]);

  return <>{children}</>;
};

export default Loader;
