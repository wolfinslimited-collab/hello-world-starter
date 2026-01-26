import { Routes, Route } from "react-router-dom";
import PrivateRoute from "components/common/private-route";
import Home from "./Home";
import Airdrops from "./Airdrops";
import Wallet from "./Wallet";
import Missions from "./Missions";
import Friends from "./Friends";
import Leaderboards from "./Leaderboards";
import Profile from "./Profile";
import Portfolio from "./Portfolio";
import TokenDetailsPage from "./Token";
import ScrollToTop from "components/common/scroll-top";
import Trade from "./Trade";
import NotFound from "components/specific/not-found";

const AppRoutes = () => {
  return (
    <div className="mt-[65px]">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/airdrops" element={<Airdrops />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/token/:slug" element={<TokenDetailsPage />} />

        <Route
          path="/profile"
          element={<PrivateRoute children={<Profile />} />}
        />
        <Route
          path="/portfolio"
          element={<PrivateRoute children={<Portfolio />} />}
        />
        <Route path="/trade/:type/:pair" element={<Trade />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default AppRoutes;
