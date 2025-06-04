import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function HomePage() {
  return (
    <div className='text-center'>
      <h1 className='text-4xl font-bold tracking-tight lg:text-5xl mb-6'>Welcome to Manov</h1>
      <p className='text-lg text-muted-foreground mb-8'>Discover your next favorite novel.</p>
      <div className='space-x-4'>
        <Button size='lg' asChild>
          <Link to='/novels'>Browse Novels</Link>
        </Button>
        <Button size='lg' variant='outline' asChild>
          <Link to='/authors'>Explore Authors</Link>
        </Button>
      </div>
      {/* Placeholder content below */}
      <div className='mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className='p-6 border rounded-lg bg-card text-card-foreground'>
            <h3 className='text-xl font-semibold mb-2'>Featured Novel Title {i}</h3>
            <p className='text-sm text-muted-foreground'>
              A brief synopsis or some catchy detail about this amazing novel would go here. Engage the reader and make
              them want to click!
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
