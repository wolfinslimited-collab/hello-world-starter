import { Wallet as WalletIcon, Lock, CreditCard } from "lucide-react";

const PortfolioCard = ({ equity, available, locked }: any) => (
  <div className="relative overflow-hidden rounded-3xl bg-neutral-100 dark:bg-neutral-900 p-6 text-black dark:text-white md:p-8">
    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-black/10 dark:bg-white/10 blur-3xl" />
    <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 dark:bg-white/10 blur-3xl" />

    <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
          <WalletIcon className="size-4" /> Total Equity
        </div>
        <div className=" text-4xl font-bold tracking-tighter md:text-5xl">
          ${equity}
        </div>
      </div>

      <div className="flex gap-8">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Available
          </span>
          <div className="flex items-center gap-2  text-xl font-semibold text-neutral-800 dark:text-neutral-200">
            <CreditCard className="size-4 text-teal-400" />${available}
          </div>
        </div>
        <div className="h-10 w-px bg-neutral-200 dark:bg-neutral-800" />
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Locked
          </span>
          <div className="flex items-center gap-2  text-xl font-semibold text-neutral-800 dark:text-neutral-200">
            <Lock className="size-4 text-rose-300" />${locked}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PortfolioCard;
