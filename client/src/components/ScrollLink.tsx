import { ReactNode } from "react";
import { useLocation } from "wouter";

interface ScrollLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ScrollLink({
  href,
  children,
  className,
  onClick,
}: ScrollLinkProps) {
  const [location, setLocation] = useLocation();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Always scroll to top
    window.scrollTo({ top: 0, left: 0 });

    // If clicking the same route, stop wouter from swallowing the click
    if (location === href) {
      e.preventDefault();
    } else {
      setLocation(href);
    }

    onClick?.();
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
