export function BackgroundOrnaments() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-30" aria-hidden="true">
      {/* Temple Ornament */}
      <svg
        className="absolute left-[-50px] bottom-[-30px] w-[360px] text-secondary/20"
        fill="none"
        viewBox="0 0 300 200"
      >
        <path d="M20 170h260v10H20z" fill="currentColor" opacity="0.18" />
        <path d="M60 160h180v10H60z" fill="currentColor" opacity="0.15" />
        <path d="M80 120h140l-20 40H100l-20-40z" fill="currentColor" opacity="0.12" />
        <path d="M120 80h60l-20 40h-20l-20-40z" fill="currentColor" opacity="0.10" />
        <circle cx="150" cy="70" fill="currentColor" opacity="0.15" r="6" />
      </svg>

      {/* Mountain Ornament */}
      <svg
        className="absolute right-[-70px] top-[-50px] w-[460px] text-primary/20"
        fill="none"
        viewBox="0 0 400 240"
      >
        <path
          d="M0 180l60-40 40 20 40-60 40 40 40-80 40 60 40-20 40 40v60H0v-20z"
          fill="currentColor"
          opacity="0.12"
        />
      </svg>

      {/* Globe Ornament */}
      <svg
        className="absolute left-1/2 -translate-x-1/2 bottom-[-100px] w-[640px] text-foreground/10"
        fill="none"
        viewBox="0 0 600 600"
      >
        <circle cx="300" cy="300" opacity="0.12" r="280" stroke="currentColor" strokeWidth="2" />
        <ellipse
          cx="300"
          cy="300"
          opacity="0.10"
          rx="260"
          ry="120"
          stroke="currentColor"
          strokeWidth="1"
        />
        <ellipse
          cx="300"
          cy="300"
          opacity="0.10"
          rx="120"
          ry="260"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
