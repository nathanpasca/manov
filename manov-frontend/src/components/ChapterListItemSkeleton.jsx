import { Skeleton } from "@/components/ui/skeleton"

export function ChapterListItemSkeleton() {
  return (
    <div className='flex items-center space-x-4 py-3 border-b border-border/40'>
      <div className='space-y-2 flex-grow'>
        <Skeleton className='h-5 w-3/4' />
        <Skeleton className='h-4 w-1/2' />
      </div>
      <Skeleton className='h-8 w-16' />
    </div>
  )
}
