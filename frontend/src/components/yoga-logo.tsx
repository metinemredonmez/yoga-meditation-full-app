interface YogaLogoProps {
  className?: string;
  showText?: boolean;
}

export function YogaLogo({ className = 'h-8 w-8', showText = true }: YogaLogoProps) {
  return (
    <div className='flex items-center gap-2'>
      <svg
        className={className}
        viewBox='0 0 100 100'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        {/* Lotus flower base */}
        <ellipse cx='50' cy='85' rx='30' ry='8' fill='currentColor' opacity='0.2' />

        {/* Center petal */}
        <path
          d='M50 20C50 20 35 45 35 60C35 75 42 80 50 80C58 80 65 75 65 60C65 45 50 20 50 20Z'
          fill='currentColor'
          opacity='0.9'
        />

        {/* Left petal */}
        <path
          d='M30 35C30 35 15 55 18 68C21 81 30 82 38 75C46 68 45 50 30 35Z'
          fill='currentColor'
          opacity='0.7'
        />

        {/* Right petal */}
        <path
          d='M70 35C70 35 85 55 82 68C79 81 70 82 62 75C54 68 55 50 70 35Z'
          fill='currentColor'
          opacity='0.7'
        />

        {/* Far left petal */}
        <path
          d='M20 50C20 50 8 62 12 72C16 82 25 80 32 72C39 64 35 52 20 50Z'
          fill='currentColor'
          opacity='0.5'
        />

        {/* Far right petal */}
        <path
          d='M80 50C80 50 92 62 88 72C84 82 75 80 68 72C61 64 65 52 80 50Z'
          fill='currentColor'
          opacity='0.5'
        />

        {/* Person silhouette in meditation */}
        <circle cx='50' cy='38' r='6' fill='white' opacity='0.9' />
        <path
          d='M50 45C50 45 42 52 40 58C38 64 44 66 50 66C56 66 62 64 60 58C58 52 50 45 50 45Z'
          fill='white'
          opacity='0.9'
        />
      </svg>
      {showText && (
        <span className='text-xl font-bold tracking-tight'>
          Yoga Admin
        </span>
      )}
    </div>
  );
}

export function YogaLogoLight({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 100 100'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient id='lotusGradient' x1='0%' y1='0%' x2='0%' y2='100%'>
          <stop offset='0%' stopColor='#8B5CF6' />
          <stop offset='100%' stopColor='#6366F1' />
        </linearGradient>
        <linearGradient id='lotusGradientLight' x1='0%' y1='0%' x2='0%' y2='100%'>
          <stop offset='0%' stopColor='#A78BFA' />
          <stop offset='100%' stopColor='#818CF8' />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx='50' cy='88' rx='25' ry='6' fill='#E5E7EB' />

      {/* Center petal */}
      <path
        d='M50 15C50 15 32 42 32 58C32 74 40 80 50 80C60 80 68 74 68 58C68 42 50 15 50 15Z'
        fill='url(#lotusGradient)'
      />

      {/* Left petal */}
      <path
        d='M28 32C28 32 10 54 14 68C18 82 28 82 38 74C48 66 46 48 28 32Z'
        fill='url(#lotusGradientLight)'
      />

      {/* Right petal */}
      <path
        d='M72 32C72 32 90 54 86 68C82 82 72 82 62 74C52 66 54 48 72 32Z'
        fill='url(#lotusGradientLight)'
      />

      {/* Far left petal */}
      <path
        d='M18 48C18 48 4 62 10 73C16 84 26 80 34 71C42 62 36 50 18 48Z'
        fill='#C4B5FD'
      />

      {/* Far right petal */}
      <path
        d='M82 48C82 48 96 62 90 73C84 84 74 80 66 71C58 62 64 50 82 48Z'
        fill='#C4B5FD'
      />

      {/* Person in meditation */}
      <circle cx='50' cy='36' r='7' fill='white' />
      <path
        d='M50 44C50 44 40 52 38 60C36 68 44 70 50 70C56 70 64 68 62 60C60 52 50 44 50 44Z'
        fill='white'
      />
    </svg>
  );
}
