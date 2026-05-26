import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none outline-none transition-all duration-300 overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-primary/20 bg-primary/10 text-primary [a&]:hover:bg-primary/20',
        secondary:
          'border-border/80 bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80',
        destructive:
          'border-destructive/20 bg-destructive/10 text-destructive [a&]:hover:bg-destructive/20',
        outline:
          'border-border text-foreground bg-background [a&]:hover:bg-muted',
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
