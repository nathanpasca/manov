import { Loader2 } from "lucide-react"

export function LoadingSpinner({ size = "md" }) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-24 w-24",
  }
  return (
    <div className='flex justify-center items-center py-10'>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
    </div>
  )
}
