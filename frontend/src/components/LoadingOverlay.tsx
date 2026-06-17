interface Props {
  message?: string;
}

export default function LoadingOverlay({ message = "Loading…" }: Props) {
  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-sky-400" />
        <p className="text-sm text-white/70">{message}</p>
      </div>
    </div>
  );
}
