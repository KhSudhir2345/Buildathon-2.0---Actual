// Online/offline indicator
export default function StatusDot({ online = true, size = 'sm' }) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full ${online ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
  );
}