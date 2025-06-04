// src/components/FavoriteButton.jsx
import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext" //
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button" //
import { Heart } from "lucide-react"
import { addNovelToFavorites, removeNovelFromFavorites, fetchUserFavorites } from "@/services/contentService" //
import { toast } from "sonner"
import { cn } from "@/lib/utils" //

export function FavoriteButton({ novelId: novelIdProp, initialIsFavorited, className, onToggle }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Ensure novelId is an integer
  const novelId = parseInt(novelIdProp, 10)

  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  console.log(
    `FavoriteButton (${novelId}): Initial state - initialIsFavorited: ${initialIsFavorited}, current isFavorited: ${isFavorited}`
  )

  const { data: userFavorites, isLoading: isLoadingUserFavorites } = useQuery({
    queryKey: ["userFavoritesSimpleList", user?.id], // Add user.id to key for user-specific caching
    queryFn: () => {
      console.log(`FavoriteButton (${novelId}): Fetching userFavoritesSimpleList for user: ${user?.id}`)
      return fetchUserFavorites({ limit: 100 }) // Fetch more if needed, or implement better status check
    },
    enabled: !!user && initialIsFavorited === undefined,
    select: (data) => {
      const favoritesArray = data?.results || (Array.isArray(data) ? data : [])
      console.log(
        `FavoriteButton (${novelId}): userFavoritesSimpleList raw data:`,
        data,
        "Selected array:",
        favoritesArray
      )
      return favoritesArray
    },
    onError: (error) => {
      console.error(`FavoriteButton (${novelId}): Error fetching userFavoritesSimpleList`, error)
    },
  })

  useEffect(() => {
    console.log(
      `FavoriteButton (${novelId}): useEffect for favorite status triggered. initialIsFavorited: ${initialIsFavorited}, userFavorites:`,
      userFavorites
    )
    if (initialIsFavorited !== undefined) {
      if (isFavorited !== initialIsFavorited) {
        // Only set if different to avoid loop if parent passes state
        console.log(`FavoriteButton (${novelId}): Setting isFavorited from prop: ${initialIsFavorited}`)
        setIsFavorited(initialIsFavorited)
      }
    } else if (userFavorites) {
      const found = userFavorites.some((fav) => fav.novelId === novelId)
      console.log(`FavoriteButton (${novelId}): Checking userFavorites. Novel found: ${found}`)
      if (isFavorited !== found) {
        setIsFavorited(found)
      }
    }
  }, [initialIsFavorited, userFavorites, novelId, isFavorited]) // Added isFavorited to dependencies to re-check if it changes externally

  const addFavoriteMutation = useMutation({
    mutationFn: () => {
      console.log(`FavoriteButton (${novelId}): Calling addNovelToFavorites (POST)`)
      return addNovelToFavorites(novelId)
    },
    onSuccess: (data) => {
      console.log(`FavoriteButton (${novelId}): addNovelToFavorites SUCCESS`, data)
      toast.success("Added to favorites!")
      setIsFavorited(true)
      queryClient.invalidateQueries({ queryKey: ["userFavorites"] })
      queryClient.invalidateQueries({ queryKey: ["userFavoritesSimpleList", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["novel", novelIdProp] }) // Invalidate by original prop if it could be a slug
      queryClient.invalidateQueries({ queryKey: ["novel", novelId] }) // And by integer ID
      if (onToggle) onToggle(true)
    },
    onError: (error) => {
      console.error(`FavoriteButton (${novelId}): addNovelToFavorites ERROR`, error.response?.data || error.message)
      toast.error(error.response?.data?.message || "Could not add to favorites.")
    },
  })

  const removeFavoriteMutation = useMutation({
    mutationFn: () => {
      console.log(`FavoriteButton (${novelId}): Calling removeNovelFromFavorites (DELETE)`)
      return removeNovelFromFavorites(novelId)
    },
    onSuccess: (data) => {
      console.log(`FavoriteButton (${novelId}): removeNovelFromFavorites SUCCESS`, data)
      toast.info("Removed from favorites.")
      setIsFavorited(false)
      queryClient.invalidateQueries({ queryKey: ["userFavorites"] })
      queryClient.invalidateQueries({ queryKey: ["userFavoritesSimpleList", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["novel", novelIdProp] })
      queryClient.invalidateQueries({ queryKey: ["novel", novelId] })
      if (onToggle) onToggle(false)
    },
    onError: (error) => {
      console.error(
        `FavoriteButton (${novelId}): removeNovelFromFavorites ERROR`,
        error.response?.data || error.message
      )
      // This is where you are likely seeing the wrong error message.
      // The error object should clarify if the request was indeed a DELETE.
      toast.error(error.response?.data?.message || "Could not remove from favorites.")
    },
  })

  const handleToggleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log(`FavoriteButton (${novelId}): handleToggleFavorite called. Current isFavorited state: ${isFavorited}`)
    if (!user) {
      toast.error("Please login to add favorites.")
      return
    }
    if (isFavorited) {
      console.log(`FavoriteButton (${novelId}): Attempting to REMOVE favorite.`)
      removeFavoriteMutation.mutate()
    } else {
      console.log(`FavoriteButton (${novelId}): Attempting to ADD favorite.`)
      addFavoriteMutation.mutate()
    }
  }

  if (!user || (initialIsFavorited === undefined && isLoadingUserFavorites)) {
    console.log(
      `FavoriteButton (${novelId}): Rendering disabled/loading state. User: ${!!user}, initialIsFavorited: ${initialIsFavorited}, isLoadingUserFavorites: ${isLoadingUserFavorites}`
    )
    return (
      <Button
        variant='ghost'
        size='icon'
        disabled
        className={cn("rounded-full", className)}
        aria-label='Loading favorite status'>
        <Heart className={cn("h-5 w-5 animate-pulse")} />
      </Button>
    )
  }

  console.log(`FavoriteButton (${novelId}): Rendering button. isFavorited: ${isFavorited}`)
  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={handleToggleFavorite}
      disabled={addFavoriteMutation.isLoading || removeFavoriteMutation.isLoading}
      className={cn("rounded-full hover:bg-destructive/10", isFavorited && "text-destructive", className)}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}>
      <Heart className={cn("h-5 w-5", isFavorited && "fill-destructive")} />
    </Button>
  )
}
