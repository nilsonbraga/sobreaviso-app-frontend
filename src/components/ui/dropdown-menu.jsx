import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';

/**
 * Wrapper leve do shadcn para DropdownMenu usando Radix UI.
 * Exporta:
 * - DropdownMenu (Root)
 * - DropdownMenuTrigger
 * - DropdownMenuContent
 * - DropdownMenuItem
 * - DropdownMenuLabel
 * - DropdownMenuSeparator
 *
 * Suporta `asChild` no Trigger e nos itens, igual ao shadcn.
 */

export const DropdownMenu = DropdownMenuPrimitive.Root;

export const DropdownMenuTrigger = React.forwardRef(
  ({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Trigger
      ref={ref}
      className={className}
      {...props}
    />
  )
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export const DropdownMenuContent = React.forwardRef(
  ({ className, sideOffset = 8, align = 'end', children, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={clsx(
          // container
          'z-50 min-w-[12rem] rounded-md border bg-white p-1 shadow-lg',
          // animação opcional
          'data-[side=bottom]:animate-in data-[side=bottom]:fade-in-0 data-[side=bottom]:zoom-in-95',
          'data-[side=top]:animate-in data-[side=top]:fade-in-0 data-[side=top]:zoom-in-95',
          'data-[side=left]:animate-in data-[side=left]:fade-in-0 data-[side=left]:zoom-in-95',
          'data-[side=right]:animate-in data-[side=right]:fade-in-0 data-[side=right]:zoom-in-95',
          className
        )}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = React.forwardRef(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={clsx(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none',
        'focus:bg-slate-100 focus:text-slate-900',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuLabel = React.forwardRef(
  ({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={clsx(
        'px-2 py-1.5 text-xs font-medium text-slate-500',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = React.forwardRef(
  ({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={clsx('my-1 h-px bg-slate-200', className)}
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
