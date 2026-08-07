export function SearchIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size} className={className}>
      <path
        d="m21 21-4.35-4.35M11 5a6 6 0 0 1 6 6m3 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
