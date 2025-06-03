
import React from 'react';

interface MicrosoftLogoProps extends React.SVGProps<SVGSVGElement> {}

export function MicrosoftLogo({ className, ...props }: MicrosoftLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 23 23"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Microsoft Logo"
      {...props}
    >
      <path fill="#f3f3f3" d="M0 0H23V23H0z" />
      <path fill="#F35325" d="M1 1h10v10H1z" />
      <path fill="#81BC06" d="M12 1h10v10H12z" />
      <path fill="#05A6F0" d="M1 12h10v10H1z" />
      <path fill="#FFBA08" d="M12 12h10v10H12z" />
    </svg>
  );
}
