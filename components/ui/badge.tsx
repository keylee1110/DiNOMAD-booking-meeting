import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-none border-2 px-2 py-0.5 text-xs font-black uppercase tracking-wider w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 outline-none transition-[color,box-shadow,transform] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_var(--color-foreground)] [a&]:hover:bg-foreground [a&]:hover:text-background [a&]:hover:shadow-[2px_2px_0px_0px_#64B5F6] [a&]:hover:-translate-y-0.5',
        secondary:
          'border-border bg-secondary text-secondary-foreground shadow-[2px_2px_0px_0px_var(--color-border)] [a&]:hover:border-primary [a&]:hover:shadow-[2px_2px_0px_0px_#64B5F6]',
        destructive:
          'border-foreground bg-destructive text-destructive-foreground shadow-[2px_2px_0px_0px_var(--color-foreground)] [a&]:hover:bg-foreground [a&]:hover:text-background',
        outline:
          'border-border text-foreground shadow-[2px_2px_0px_0px_var(--color-border)] bg-background [a&]:hover:border-primary [a&]:hover:bg-primary/5 [a&]:hover:text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
