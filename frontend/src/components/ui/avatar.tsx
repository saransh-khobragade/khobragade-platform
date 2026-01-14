import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const Avatar = ({ className, children, ...props }: AvatarProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
