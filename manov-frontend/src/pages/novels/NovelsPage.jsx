import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchNovels, fetchLanguages } from "@/services/contentService"
import { NovelCard } from "@/components/NovelCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { PaginationControls } from "@/components/PaginationControls"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { LanguageSelector } from "@/components/LanguageSelector"

const PUBLICATION_STATUSES = ["ONGOING", "COMPLETED", "HIATUS", "DROPPED"]
const SORT_OPTIONS = [
  { value: "updatedAt_desc", label: "Last Updated" },
  { value: "createdAt_desc", label: "Newest" },
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "title_desc", label: "Title (Z-A)" },
  { value: "viewCount_desc", label: "Most Viewed" },
  { value: "favoriteCount_desc", label: "Most Favorited" },
  { value: "averageRating_desc", label: "Highest Rated" },
]
const DEFAULT_LIMIT = 12

export function NovelsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))
  const [lang, setLang] = useState(searchParams.get("lang") || "")
  const [originalLanguage, setOriginalLanguage] = useState(searchParams.get("originalLanguage") || "")
  const [publicationStatus, setPublicationStatus] = useState(searchParams.get("publicationStatus") || "")
  const [genre, setGenre] = useState(searchParams.get("genre") || "")
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "updatedAt_desc")

  const { data: languagesData, isLoading: langLoading } = useQuery({
    queryKey: ["languages"],
    queryFn: fetchLanguages,
  })

  const queryParams = {
    page,
    limit: DEFAULT_LIMIT,
    ...(lang && { lang }),
    ...(originalLanguage && { originalLanguage }),
    ...(publicationStatus && { publicationStatus }),
    ...(genre && { genre }),
    ...(sortBy && { sortBy: sortBy.split("_")[0], sortOrder: sortBy.split("_")[1] }),
    isActive: true,
  }

  const {
    data: novelsResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["novels", queryParams],
    queryFn: () => fetchNovels(queryParams),
    keepPreviousData: true,
  })

  useEffect(() => {
    const newSearchParams = new URLSearchParams()
    if (page > 1) newSearchParams.set("page", page.toString())
    if (lang) newSearchParams.set("lang", lang)
    if (originalLanguage) newSearchParams.set("originalLanguage", originalLanguage)
    if (publicationStatus) newSearchParams.set("publicationStatus", publicationStatus)
    if (genre) newSearchParams.set("genre", genre)
    if (sortBy !== "updatedAt_desc") newSearchParams.set("sortBy", sortBy)

    setSearchParams(newSearchParams, { replace: true })
  }, [page, lang, originalLanguage, publicationStatus, genre, sortBy, setSearchParams])

  const novelsList = novelsResponse?.results || []
  const totalPages = novelsResponse?.totalPages || 1
  const currentPageFromApi = novelsResponse?.page || 1

  // Sync page state if API dictates a different page (e.g. after filters change and page count reduces)
  useEffect(() => {
    if (novelsResponse?.page && page !== novelsResponse.page) {
      setPage(novelsResponse.page)
    }
  }, [novelsResponse?.page, page])

  return (
    <div>
      <h1 className='text-3xl font-bold mb-8'>Browse Novels</h1>

      <div className='mb-8 p-4 border rounded-lg bg-card text-card-foreground'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end'>
          <div>
            <label htmlFor='content-lang' className='block text-sm font-medium mb-1'>
              Content Language
            </label>
            <LanguageSelector
              selectedLang={lang}
              onLangChange={(value) => {
                setLang(value || "")
                setPage(1)
              }}
              placeholder='Any Content Lang'
            />
          </div>
          <div>
            <label htmlFor='orig-lang' className='block text-sm font-medium mb-1'>
              Original Language
            </label>
            {langLoading ? (
              <Skeleton className='h-10 w-full' />
            ) : (
              <Select
                value={originalLanguage}
                onValueChange={(value) => {
                  setOriginalLanguage(value || "")
                  setPage(1)
                }}>
                <SelectTrigger id='orig-lang'>
                  <SelectValue placeholder='Any Original Lang' />
                </SelectTrigger>
                <SelectContent>
                  {languagesData
                    ?.filter((l) => l.isActive)
                    .map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.name} ({l.nativeName || l.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label htmlFor='status' className='block text-sm font-medium mb-1'>
              Publication Status
            </label>
            <Select
              value={publicationStatus}
              onValueChange={(value) => {
                setPublicationStatus(value || "")
                setPage(1)
              }}>
              <SelectTrigger id='status'>
                <SelectValue placeholder='Any Status' />
              </SelectTrigger>
              <SelectContent>
                {PUBLICATION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor='genre' className='block text-sm font-medium mb-1'>
              Genre Tag
            </label>
            <Input
              id='genre'
              placeholder='e.g., Fantasy'
              defaultValue={genre}
              onBlur={(e) => {
                setGenre(e.target.value)
                setPage(1)
              }} // Or use a submit button
            />
          </div>
          <div>
            <label htmlFor='sort' className='block text-sm font-medium mb-1'>
              Sort By
            </label>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value)
                setPage(1)
              }}>
              <SelectTrigger id='sort'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading && !novelsResponse && <LoadingSpinner />}
      {isFetching && <div className='text-center text-sm text-muted-foreground my-2'>Updating...</div>}
      {isError && <ErrorMessage error={error} />}

      {!isError && novelsList.length > 0 ? (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            {novelsList.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
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
        !isFetching && (
          <p className='text-center text-muted-foreground py-10'>No novels found matching your criteria.</p>
        )
      )}
    </div>
  )
}
