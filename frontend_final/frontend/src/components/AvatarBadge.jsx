// Show user's initials or avatar
export default function AvatarBadge({ name, size = 'md' }) {
  const initials = name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-forest-800 to-forest-900 border border-forest-400 rounded-full flex items-center justify-center text-white font-bold`}>
      {initials}
    </div>
  );
}