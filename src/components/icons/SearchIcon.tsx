export function SearchIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size} className={className}>
      <path
        d="m14 14-2.9-2.9M7.333 4a3.333 3.333 0 0 1 3.334 3.333m2 0A5.333 5.333 0 1 1 2 7.333a5.333 5.333 0 0 1 10.667 0Z"
        stroke="currentColor"
        strokeWidth="1.333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
