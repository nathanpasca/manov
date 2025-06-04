import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { searchContent } from "@/services/contentService"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NovelCard } from "@/components/NovelCard"
import { AuthorCard } from "@/components/AuthorCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { PaginationControls } from "@/components/PaginationControls"
import { SearchIcon } from "lucide-react"

// Custom hook for debouncing (ensure this is defined or imported)
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

const DEFAULT_LIMIT = 10

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [inputValue, setInputValue] = useState(searchParams.get("q") || "") // For controlled input
  const [searchType, setSearchType] = useState(searchParams.get("type") || "novels")
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))

  // Debounce the input value to use in the query
  const debouncedQuery = useDebounce(inputValue, 500)

  const queryParams = {
    q: debouncedQuery,
    type: searchType,
    page,
    limit: DEFAULT_LIMIT,
  }

  const {
    data: searchResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["search", queryParams],
    queryFn: () => searchContent(queryParams),
    enabled: !!debouncedQuery && debouncedQuery.length >= 2,
    keepPreviousData: true,
  })

  useEffect(() => {
    const newSearchParams = new URLSearchParams()
    if (inputValue) newSearchParams.set("q", inputValue) // Use immediate input value for URL
    if (searchType !== "novels") newSearchParams.set("type", searchType)
    if (page > 1) newSearchParams.set("page", page.toString())
    setSearchParams(newSearchParams, { replace: true })
  }, [inputValue, searchType, page, setSearchParams])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    // Query will refetch due to queryKey change if debouncedQuery changes,
    // or trigger refetch manually if needed, but debouncing should handle it.
  }

  const searchResultsList = searchResponse?.results || []
  const totalResults = searchResponse?.totalCount || searchResponse?.total || 0 // Adapt to consistent backend field
  const totalPages = searchResponse?.totalPages || (totalResults ? Math.ceil(totalResults / DEFAULT_LIMIT) : 1)
  const currentPageFromApi = searchResponse?.page || 1

  useEffect(() => {
    if (searchResponse?.page && page !== searchResponse.page) {
      setPage(searchResponse.page)
    }
  }, [searchResponse?.page, page])

  return (
    <div>
      <h1 className='text-3xl font-bold mb-6'>Search</h1>
      <form onSubmit={handleSearchSubmit} className='flex items-center gap-2 mb-8'>
        <Input
          type='search'
          placeholder='Search for novels or authors...'
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className='flex-grow'
        />
        <Select
          value={searchType}
          onValueChange={(value) => {
            setSearchType(value)
            setPage(1)
          }}>
          <SelectTrigger className='w-[120px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='novels'>Novels</SelectItem>
            <SelectItem value='authors'>Authors</SelectItem>
          </SelectContent>
        </Select>
        <Button type='submit' disabled={isFetching || !inputValue || inputValue.length < 2}>
          <SearchIcon className='h-4 w-4 mr-2' /> Search
        </Button>
      </form>

      {isLoading && !searchResponse && <LoadingSpinner />}
      {isFetching && <div className='text-center text-sm text-muted-foreground my-2'>Searching...</div>}
      {isError && <ErrorMessage error={error} />}

      {debouncedQuery && debouncedQuery.length >= 2 && searchResponse && (
        <>
          <p className='text-muted-foreground mb-4'>
            Found {totalResults} result(s) for "{searchResponse.query}" in {searchResponse.type}.
          </p>
          {searchResultsList.length > 0 ? (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 ${
                searchResponse.type === "novels" ? "md:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-3"
              } gap-6`}>
              {searchResponse.type === "novels" &&
                searchResultsList.map((novel) => <NovelCard key={novel.id} novel={novel} />)}
              {searchResponse.type === "authors" &&
                searchResultsList.map((author) => <AuthorCard key={author.id} author={author} />)}
            </div>
          ) : (
            !isLoading && !isFetching && <p className='text-center py-10'>No results found.</p>
          )}
          <PaginationControls currentPage={currentPageFromApi} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
      {debouncedQuery && debouncedQuery.length < 2 && !isLoading && (
        <p className='text-center text-muted-foreground py-10'>Please enter at least 2 characters to search.</p>
      )}
    </div>
  )
}
