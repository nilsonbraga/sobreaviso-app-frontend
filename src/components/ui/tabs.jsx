// prettier Apple-like tabs
import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // container tipo "segmented control" do macOS
      'inline-flex items-center gap-1 rounded-2xl border border-black/5 bg-white/60 ' +
        'dark:bg-slate-900/40 dark:border-white/10 ' +
        'backdrop-blur supports-[backdrop-filter]:bg-white/50 ' +
        'px-1 py-1 shadow-sm ' +
        // brilho sutil superior (neumorphism leve)
        'shadow-[inset_0_1px_0_rgba(255,255,255,.8)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,.06)]',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // pill
      'inline-flex select-none items-center justify-center rounded-xl px-4 py-2 text-sm ' +
        'font-medium leading-none transition-all duration-200 ' +
        'text-slate-600 dark:text-slate-300 ' +
        // hover “vidro”
        'hover:bg-white/40 dark:hover:bg-white/10 ' +
        // foco acessível
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-0 ' +
        // estado desabilitado
        'disabled:opacity-50 disabled:pointer-events-none ' +
        // estado ativo: pílula branca com sombra suave e tipografia mais escura
        'data-[state=active]:bg-white data-[state=active]:text-slate-900 ' +
        'dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white ' +
        'data-[state=active]:shadow-[0_1px_1px_rgba(0,0,0,.06),inset_0_-1px_0_rgba(0,0,0,.03),inset_0_1px_0_rgba(255,255,255,.9)] ' +
        // animação sutil ao ativar
        'data-[state=active]:translate-y-[-0.5px]',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      // espaço acima e transição elegante
      'mt-4 outline-none ' +
        'animate-in fade-in-0 slide-in-from-top-1 duration-200',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
