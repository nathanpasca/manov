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

  const { data: userFavorites, isLoading: isLoadingUserFavorites } = useQuery({
    queryKey: ["userFavoritesSimpleList", user?.id], // Add user.id to key for user-specific caching
    queryFn: () => {
      return fetchUserFavorites({ limit: 100 })
    },
    enabled: !!user && initialIsFavorited === undefined,
    select: (data) => {
      const favoritesArray = data?.results || (Array.isArray(data) ? data : [])
      return favoritesArray
    },
    onError: (error) => {
      console.error(`FavoriteButton (${novelId}): Error fetching userFavoritesSimpleList`, error)
    },
  })

  useEffect(() => {
    if (initialIsFavorited !== undefined) {
      if (isFavorited !== initialIsFavorited) {
        // Only set if different to avoid loop if parent passes state
        setIsFavorited(initialIsFavorited)
      }
    } else if (userFavorites) {
      const found = userFavorites.some((fav) => fav.novelId === novelId)
      if (isFavorited !== found) {
        setIsFavorited(found)
      }
    }
  }, [initialIsFavorited, userFavorites, novelId, isFavorited]) // Added isFavorited to dependencies to re-check if it changes externally

  const addFavoriteMutation = useMutation({
    mutationFn: () => {
      return addNovelToFavorites(novelId)
    },
    onSuccess: (data) => {
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
      return removeNovelFromFavorites(novelId)
    },
    onSuccess: (data) => {
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
    if (!user) {
      toast.error("Please login to add favorites.")
      return
    }
    if (isFavorited) {
      removeFavoriteMutation.mutate()
    } else {
      addFavoriteMutation.mutate()
    }
  }

  if (!user || (initialIsFavorited === undefined && isLoadingUserFavorites)) {
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
