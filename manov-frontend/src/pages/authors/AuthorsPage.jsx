import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchAuthors } from "@/services/contentService"
import { AuthorCard } from "@/components/AuthorCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { PaginationControls } from "@/components/PaginationControls"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const DEFAULT_LIMIT = 12

export function AuthorsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))
  const [isActiveFilter, setIsActiveFilter] = useState(searchParams.get("isActive") === "true") // Default to true (show active)

  const queryParams = { page, limit: DEFAULT_LIMIT, isActive: isActiveFilter }

  const {
    data: authorsResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["authors", queryParams],
    queryFn: () => fetchAuthors(queryParams),
    keepPreviousData: true,
  })

  useEffect(() => {
    const newSearchParams = new URLSearchParams()
    if (page > 1) newSearchParams.set("page", page.toString())
    if (isActiveFilter) newSearchParams.set("isActive", "true") // Only add if true to keep URL cleaner
    setSearchParams(newSearchParams, { replace: true })
  }, [page, isActiveFilter, setSearchParams])

  const authorsList = authorsResponse?.results || []
  const totalPages = authorsResponse?.totalPages || 1
  const currentPageFromApi = authorsResponse?.page || 1

  useEffect(() => {
    if (authorsResponse?.page && page !== authorsResponse.page) {
      setPage(authorsResponse.page)
    }
  }, [authorsResponse?.page, page])

  return (
    <div>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold'>Meet Our Authors</h1>
        <div className='flex items-center space-x-2'>
          <Switch
            id='active-filter'
            checked={isActiveFilter}
            onCheckedChange={(checked) => {
              setIsActiveFilter(checked)
              setPage(1)
            }}
          />
          <Label htmlFor='active-filter'>Show Only Active</Label>
        </div>
      </div>

      {isLoading && !authorsResponse && <LoadingSpinner />}
      {isFetching && <div className='text-center text-sm text-muted-foreground my-2'>Updating...</div>}
      {isError && <ErrorMessage error={error} />}

      {!isError && authorsList.length > 0 ? (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            {authorsList.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
          <PaginationControls
            currentPage={currentPageFromApi}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      ) : (
        !isLoading &&
        !isError &&
        !isFetching && <p className='text-center text-muted-foreground py-10'>No authors found.</p>
      )}
    </div>
  )
}
