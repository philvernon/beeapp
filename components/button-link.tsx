import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"

interface ButtonLinkProps
  extends React.ComponentPropsWithoutRef<typeof Link>,
    VariantProps<typeof buttonVariants> {}

export function ButtonLink({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}
