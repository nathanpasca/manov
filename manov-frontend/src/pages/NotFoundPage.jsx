import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function NotFoundPage() {
  return (
    <div className='text-center py-20'>
      <h1 className='text-9xl font-bold text-primary animate-bounce'>404</h1>
      <h2 className='text-3xl font-semibold mt-4 mb-2'>Page Not Found</h2>
      <p className='text-muted-foreground mb-8'>Oops! The page you're looking for doesn't seem to exist.</p>
      <Button asChild>
        <Link to='/'>Go Back Home</Link>
      </Button>
    </div>
  )
}
