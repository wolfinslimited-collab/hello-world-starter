import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "assets/images/logo.png";
import { Menu, X, Moon, Sun } from "lucide-react";
import useStorage from "context";
import { lazy, Suspense } from "react";

const WalletButton = lazy(() => import("components/web3/connect-wallet"));

const menuItems = [
  { name: "Futures", path: "/trade/perpetual/BTC-USDT" },
  { name: "Spot", path: "/trade/spot/ETH-USDT" },
  { name: "Portfolio", path: "/wallet" },
  { name: "Airdrops", path: "/airdrops" },
  { name: "Leaderboards", path: "/leaderboards" },
  { name: "Missions", path: "/missions" },
  { name: "Referral", path: "/friends" },
];

export default function Navbar() {
  const {
    setting: { theme },
    setSetting,
  } = useStorage();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      setSetting({ theme: "dark" });
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      setSetting({ theme: "light" });
    }
  };

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme || "dark");
  }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 w-full bg-black/5 dark:bg-white/7 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section: Logo & Nav */}
          <div className="flex items-center gap-8">
            {/* Logo & Beta Badge */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={logo}
                alt="logo"
                className="size-6 transition-transform group-hover:scale-105"
              />
              {/* <span className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                Timetrade
              </span> */}
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "text-black dark:text-white font-semibold"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section: Actions & Wallet */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {theme == "dark" ? (
                <Sun className="size-5" />
              ) : (
                <Moon className="size-5" />
              )}
            </button>

            <Suspense
              fallback={
                <button className="px-5 py-2 text-sm bg-neutral-200 rounded-lg">
                  Loading…
                </button>
              }
            >
              <WalletButton />
            </Suspense>
            <button
              className="md:hidden p-2 text-neutral-600 dark:text-neutral-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-gray-950 absolute w-full shadow-lg">
          <div className="space-y-1 px-4 py-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-3 text-base font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
