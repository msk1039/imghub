"use client"
import { cva, type VariantProps } from "class-variance-authority"
import { Crown } from "lucide-react"
import { cn } from "@/lib/utils"


interface ButtonProps {
  onClick?: () => void
  className?: string
  variant?: VariantProps<typeof buttonVariants>["variant"]
  children: React.ReactNode
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "relative flex items-center justify-center gap-2 px-6 py-3 rounded-md text-black text-md font-medium transition-all duration-200 active:translate-y-0.5 ",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        selected: "relative flex items-center justify-center gap-2 px-6 py-3 rounded-md text-white text-md font-medium bg-gradient-to-b from-[#353f5b] to-[#232a40] shadow-[0_6px_15px_rgba(109,120,161,0.8)] transition-all duration-200  active:translate-y-0.5 ",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
export default function ShinyButton({ onClick, className ,variant,  children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(buttonVariants({ variant , className }))}
    >
      {/* Inner highlight effect */}
      {variant === "selected" && <>
      
      <div className="absolute inset-x-0 top-0 h-[2px] bg-white/40 rounded-t-xl blur-[1px]" />
      <div className="absolute inset-y-0 right-0 w-[1px] h-full bg-white/40 rounded-t-xl blur-[1px]" />
      </>
      }
        {children}

    </button>
  )
}

