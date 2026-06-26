export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-primary space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-text-secondary">Establishing uplink to cluster...</p>
    </div>
  );
}
