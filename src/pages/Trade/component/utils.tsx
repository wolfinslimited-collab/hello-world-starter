import { Loader2 } from "lucide-react";

export function LoadingUI({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm z-10">
      <Loader2 size={32} className="animate-spin mb-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em]">
        {message}
      </span>
    </div>
  );
}

export function EmptyUI({ icon, title, subtitle }: any) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center opacity-30">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-black uppercase italic">{title}</h3>
      <p className="text-sm max-w-[280px] font-medium">{subtitle}</p>
    </div>
  );
}
