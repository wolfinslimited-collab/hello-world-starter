import Modal from "components/specific/modal";
import {
  Globe,
  Clock,
  Calendar,
  CheckCircle,
  LayoutGrid,
  ArrowUpRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import HeroSection from "./hero";
import useStorage from "context";

const Sidebar = () => {
  const {
    setting: { isLoged },
  } = useStorage();
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  const menuItems: any = [
    { name: "All airdrops", icon: Globe, link: "/airdrops?type=all" },
    ...(isLoged
      ? [
          {
            name: "My airdrops",
            icon: CheckCircle,
            link: "/airdrops?type=mine",
          },
        ]
      : []),

    { name: "Upcoming", icon: Calendar, link: "/airdrops?type=upcoming" },
    { name: "Live", icon: LayoutGrid, link: "/airdrops?type=live" },
    { name: "Past", icon: Clock, link: "/airdrops?type=past" },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-8 hidden lg:block  ">
      <div className="flex flex-col space-y-1">
        {menuItems.map((item: any) => {
          const Icon = item.icon;

          // 2. Compare full link (path + query) to current URL
          // This ensures '/airdrops' doesn't highlight when you are on '/airdrops?type=upcoming'
          const isActive = currentPath === item.link;

          return (
            <Link
              to={item.link}
              key={item.name}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="size-[18px]" strokeWidth={2} />
                <span>{item.name}</span>
              </div>
              {isActive && <span className="text-neutral-400">›</span>}
            </Link>
          );
        })}
      </div>
      <Modal
        bodyClass="!max-w-6xl !p-0"
        trigger={
          <div className="relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-b from-white to-blue-50 dark:from-neutral-900 dark:to-blue-900/20 border border-neutral-100 dark:border-neutral-800 p-5 shadow-sm">
            <div className="relative z-10">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Introduction
              </span>
              <h3 className="mt-1 text-base font-bold text-neutral-900 dark:text-white">
                What is an airdrop?
              </h3>
              <div className="my-4 h-16 w-full rounded-lg bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-pink-900/40 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/50 blur-lg rounded-full"></div>
                  <span className="relative text-2xl">🪐</span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 mb-4">
                Partner with our platform and list your airdrop to leverage our
                extensive user network.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 dark:text-white hover:underline"
              >
                Feature your project's airdrop{" "}
                <ArrowUpRight className="size-3" />
              </a>
            </div>
          </div>
        }
      >
        <HeroSection />
      </Modal>
    </aside>
  );
};

export default Sidebar;
