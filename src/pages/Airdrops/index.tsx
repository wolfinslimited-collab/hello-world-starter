import { useLocation } from "react-router-dom";
import Sidebar from "pages/Airdrops/sidebar";
import AirdropTable from "../Token/tokens";
import Portfolio from "pages/Portfolio";
import useStorage from "context";
import { LayoutDashboard } from "lucide-react";
import { useState } from "react";
import OnboardingModal from "./onboarding";
import TimeTradeOnboarding from "./landing";

export default function MainSection() {
  const {
    app: { user },
  } = useStorage();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const location = useLocation();

  // Check if the current route is the Portfolio page
  const isPortfolio = location.search === "?type=mine";
  return (
    <>
      {!location.search && <TimeTradeOnboarding />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pb-24 pt-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <Sidebar />

          <div className="flex-1 min-w-0 space-y-12">
            <div className="mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {isPortfolio ? "My Airdrops" : "Explore Airdrops"}
              </h1>
              <p className="mt-3 text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl">
                {isPortfolio
                  ? "Track your participation, view claimed tokens, and manage your rewards all in one place."
                  : "Discover the latest token distributions, track your portfolio, and never miss an upcoming opportunity."}
              </p>
              {user?.status === "Pending" && (
                <div className="mt-6">
                  <button
                    onClick={() => setIsOnboardingOpen(true)}
                    className="relative group overflow-hidden rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-black px-5 py-3  hover:scale-105 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <span className="flex items-center gap-2 ">
                      <LayoutDashboard className="w-5 h-5" /> Activate Now
                    </span>
                  </button>
                </div>
              )}
            </div>

            <OnboardingModal
              isOpen={isOnboardingOpen}
              onClose={() => setIsOnboardingOpen(false)}
            />
            {isPortfolio ? <Portfolio mini={true} /> : <AirdropTable />}
          </div>
        </div>
      </main>
    </>
  );
}
