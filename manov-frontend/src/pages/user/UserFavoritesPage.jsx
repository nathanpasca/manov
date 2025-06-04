import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchUserFavorites } from "@/services/contentService" //
import { useAuth } from "@/contexts/AuthContext" //
import { NovelCard } from "@/components/NovelCard" //
import { LoadingSpinner } from "@/components/LoadingSpinner" //
import { ErrorMessage } from "@/components/ErrorMessage" //
import { PaginationControls } from "@/components/PaginationControls" //
import { useSearchParams } from "react-router-dom"

const FAVORITES_LIMIT = 12

export function UserFavoritesPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))

  console.log(`UserFavoritesPage: Initializing. User: ${user?.id}, Page: ${page}`)

  const {
    data: favoritesDataFromApi, // Renamed for clarity - this will be the array
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["userFavorites", user?.id, page, FAVORITES_LIMIT],
    queryFn: () => {
      console.log(
        `UserFavoritesPage: Calling fetchUserFavorites with params: user.id=${user?.id}, page=${page}, limit=${FAVORITES_LIMIT}`
      )
      return fetchUserFavorites({ page, limit: FAVORITES_LIMIT })
    },
    enabled: !!user,
    keepPreviousData: true,
    onSuccess: (data) => {
      console.log("UserFavoritesPage: fetchUserFavorites successful. API Response data:", data)
    },
    onError: (err) => {
      console.error("UserFavoritesPage: fetchUserFavorites ERROR:", err.response?.data || err.message)
    },
  })

  useEffect(() => {
    const newSearchParams = new URLSearchParams()
    if (page > 1) newSearchParams.set("page", page.toString())
    setSearchParams(newSearchParams, { replace: true })
  }, [page, setSearchParams])

  // --- CORE FIX HERE ---
  // If the API returns a direct array, use it.
  // If it might sometimes return the object structure (e.g., if backend changes later),
  // you can add a check, but based on your current network log, it's a direct array.
  const favoritesList = Array.isArray(favoritesDataFromApi) ? favoritesDataFromApi : []

  // --- Handling Pagination without totalCount from this specific API response ---
  // If the API returns EXACTLY `FAVORITES_LIMIT` items, we can assume there *might* be a next page.
  // If it returns fewer, this is the last page for the current item set.
  // This makes `totalPages` a heuristic unless your API provides `X-Total-Count` header
  // or your `fetchUserFavorites` is adapted to parse it.
  const hasMoreDataPotential = favoritesList.length === FAVORITES_LIMIT
  const totalPagesGuess = hasMoreDataPotential ? page + 1 : page // Simplistic guess for pagination controls
  const currentPageFromApi = page // Since API response is just an array, current page is our 'page' state.

  // Note: The useEffect that synced `page` with `favoritesResponse.page` is removed
  // because `favoritesDataFromApi` (the array) won't have a `.page` property.

  console.log("UserFavoritesPage: Processed data:", {
    favoritesList,
    // totalCount: favoritesList.length, // This would only be count for current page
    totalPagesGuess,
    currentPageFromApi,
    isLoading,
    isError,
    isFetching,
  })

  if (isLoading && favoritesList.length === 0) {
    // Show spinner on initial load or if list is still empty during load
    return <LoadingSpinner />
  }

  return (
    <div className='max-w-6xl mx-auto py-8'>
      <h1 className='text-3xl font-bold mb-8'>My Favorite Novels</h1>
      {isFetching && <div className='text-center text-sm text-muted-foreground my-2'>Updating...</div>}
      {isError && <ErrorMessage error={error} />}

      {!isError && favoritesList.length > 0 ? (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
            {favoritesList.map((fav) =>
              // The API response shows the novel object is directly under 'fav.novel'
              fav.novel && fav.novel.id ? (
                <NovelCard key={fav.novel.id} novel={fav.novel} />
              ) : (
                <div key={fav.id || Math.random()}>Favorite item is missing novel data.</div>
              )
            )}
          </div>
          {/* Pagination will be basic: only shows if page > 1 or if we fetched a full page's worth of items */}
          {(page > 1 || hasMoreDataPotential) && (
            <PaginationControls
              currentPage={currentPageFromApi}
              totalPages={totalPagesGuess} // Using the guessed totalPages
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        !isLoading &&
        !isError &&
        !isFetching && <p className='text-center text-muted-foreground py-10'>You haven't favorited any novels yet.</p>
      )}
    </div>
  )
}
