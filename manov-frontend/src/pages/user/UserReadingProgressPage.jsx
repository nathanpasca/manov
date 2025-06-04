import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchAllUserReadingProgress } from "@/services/contentService"
import { useAuth } from "@/contexts/AuthContext"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Link, useSearchParams } from "react-router-dom"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { BookOpen } from "lucide-react"
import { PaginationControls } from "@/components/PaginationControls"

const DEFAULT_LIMIT = 10

export function UserReadingProgressPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))

  const {
    data: progressResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["allUserReadingProgress", user?.id, page, DEFAULT_LIMIT],
    queryFn: () => fetchAllUserReadingProgress({ page, limit: DEFAULT_LIMIT }),
    enabled: !!user,
    keepPreviousData: true,
  })

  useEffect(() => {
    const newSearchParams = new URLSearchParams()
    if (page > 1) newSearchParams.set("page", page.toString())
    setSearchParams(newSearchParams, { replace: true })
  }, [page, setSearchParams])

  const progressList = progressResponse?.results || []
  const totalPages = progressResponse?.totalPages || 1
  const currentPageFromApi = progressResponse?.page || 1

  useEffect(() => {
    if (progressResponse?.page && page !== progressResponse.page) {
      setPage(progressResponse.page)
    }
  }, [progressResponse?.page, page])

  if (isLoading && !progressResponse) return <LoadingSpinner />

  return (
    <div className='max-w-4xl mx-auto py-8'>
      <h1 className='text-3xl font-bold mb-8'>Your Reading Progress</h1>
      {isFetching && <div className='text-center text-sm text-muted-foreground my-2'>Updating...</div>}
      {isError && <ErrorMessage error={error} />}

      {!isError && progressList.length > 0 ? (
        <div className='space-y-6'>
          {progressList.map((item) => (
            <Card key={item.id} className='flex flex-col md:flex-row overflow-hidden'>
              <div className='md:w-1/4'>
                <AspectRatio ratio={3 / 4} className='bg-muted'>
                  <Link to={`/novels/${item.novel.slug || item.novel.id}`}>
                    {item.novel.coverImageUrl ? (
                      <img
                        src={item.novel.coverImageUrl}
                        alt={`Cover of ${item.novel.title}`}
                        className='object-cover w-full h-full'
                      />
                    ) : (
                      <div className='flex items-center justify-center h-full'>
                        <BookOpen className='w-12 h-12 text-muted-foreground' />
                      </div>
                    )}
                  </Link>
                </AspectRatio>
              </div>
              <div className='flex-grow p-6 md:w-3/4'>
                <CardHeader className='p-0 mb-2'>
                  <CardTitle className='text-xl'>
                    <Link to={`/novels/${item.novel.slug || item.novel.id}`} className='hover:text-primary'>
                      {item.novel.title}
                    </Link>
                  </CardTitle>
                  {item.novel.author && (
                    <CardDescription>By: {item.novel.author.nameRomanized || item.novel.author.name}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className='p-0'>
                  <p className='text-sm text-muted-foreground mb-1'>
                    Last Read: Chapter {item.chapter.chapterNumber}
                    {item.chapter.title ? `: ${item.chapter.title}` : ""}
                  </p>
                  {item.progressPercentage !== null && item.progressPercentage !== undefined && (
                    <div className='flex items-center gap-2 mb-2'>
                      <Progress value={item.progressPercentage} className='w-full' />
                      <span className='text-sm text-muted-foreground'>{item.progressPercentage}%</span>
                    </div>
                  )}
                  <p className='text-xs text-muted-foreground'>
                    Last activity: {new Date(item.lastReadAt).toLocaleString()}
                  </p>
                </CardContent>
                <CardFooter className='p-0 mt-4'>
                  <Button asChild>
                    <Link to={`/novels/${item.novel.id}/chapters/${item.chapter.chapterNumber}`}>Continue Reading</Link>
                  </Button>
                </CardFooter>
              </div>
            </Card>
          ))}
          {totalPages > 1 && (
            <PaginationControls currentPage={currentPageFromApi} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      ) : (
        !isLoading &&
        !isError &&
        !isFetching && (
          <p className='text-center text-muted-foreground py-10'>
            You haven't started reading any novels yet, or no progress has been saved.
          </p>
        )
      )}
    </div>
  )
}
