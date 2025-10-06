// src/components/ui/navigation-menu.jsx
import React from 'react';
import clsx from 'clsx';

export function NavigationMenu({ className, children, ...props }) {
  return (
    <nav className={clsx('flex items-center', className)} {...props}>
      {children}
    </nav>
  );
}

export function NavigationMenuList({ className, children, ...props }) {
  return (
    <ul className={clsx('flex items-center gap-1', className)} {...props}>
      {children}
    </ul>
  );
}

export function NavigationMenuItem({ className, children, ...props }) {
  return (
    <li className={clsx('list-none', className)} {...props}>
      {children}
    </li>
  );
}

// Mantemos a API usada no layout (NavigationMenuLink asChild)
export function NavigationMenuLink({ asChild, className, children, ...props }) {
  const Comp = asChild ? 'span' : 'a';
  return (
    <Comp className={clsx('inline-flex items-center', className)} {...props}>
      {children}
    </Comp>
  );
}
