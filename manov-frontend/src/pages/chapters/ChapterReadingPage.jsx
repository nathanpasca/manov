import React, { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchChapterByNovelAndNumber, fetchChaptersByNovelId, upsertReadingProgress } from "@/services/contentService"
import { useAuth } from "@/contexts/AuthContext"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LanguageSelector } from "@/components/LanguageSelector"
import { ArrowLeft, ArrowRight, Settings2, BookOpen, ListChecks } from "lucide-react"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

// Custom hook for debouncing
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

export function ChapterReadingPage() {
  const { novelId, chapterNumber } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const contentRef = useRef(null) // Ref for the scrollable content area

  const queryParams = new URLSearchParams(location.search)
  const initialLang = queryParams.get("lang") || ""
  const [selectedLang, setSelectedLang] = useState(initialLang)

  // Fetch current chapter
  const {
    data: chapter,
    isLoading,
    isError,
    error,
    refetch: refetchChapter,
  } = useQuery({
    queryKey: ["chapter", novelId, chapterNumber, selectedLang],
    queryFn: () => fetchChapterByNovelAndNumber(novelId, chapterNumber, { lang: selectedLang || undefined }),
    enabled: !!novelId && !!chapterNumber,
  })

  // Fetch chapter list for navigation (only IDs and numbers needed)
  const { data: chapterList } = useQuery({
    queryKey: ["chapterListForNav", novelId],
    queryFn: () =>
      fetchChaptersByNovelId(novelId, { limit: 1000, isPublished: true, sortBy: "chapterNumber", sortOrder: "asc" }), // Fetch all published chapters
    enabled: !!novelId,
    select: (data) => (Array.isArray(data) ? data : data?.results), // Ensure we get an array
  })

  // Reading Progress Mutation
  const { mutate: updateProgress } = useMutation({
    mutationFn: (progressData) => upsertReadingProgress(novelId, progressData),
    onSuccess: () => {
      toast.success("Progress saved!")
      queryClient.invalidateQueries({ queryKey: ["readingProgress", novelId, user?.id] })
      queryClient.invalidateQueries({ queryKey: ["allUserReadingProgress", user?.id] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to save progress.")
    },
  })

  // Scroll and Progress Tracking
  const [scrollPosition, setScrollPosition] = useState(0)
  const debouncedScrollPosition = useDebounce(scrollPosition, 1000) // Debounce scroll updates

  const handleScroll = useCallback(() => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current.children[1] // Access viewport div
      if (scrollHeight <= clientHeight) {
        // Content is not scrollable or fully scrolled
        setScrollPosition(100)
        return
      }
      const currentPosition = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
      setScrollPosition(currentPosition)
    }
  }, [])

  // Effect for updating progress when debounced scroll position or chapter changes
  useEffect(() => {
    if (user && chapter && chapter.id && debouncedScrollPosition > 0) {
      updateProgress({
        chapterId: chapter.id,
        readingPosition: `scroll:${debouncedScrollPosition}`, // Example format
        progressPercentage: debouncedScrollPosition,
      })
    }
  }, [debouncedScrollPosition, chapter, user, updateProgress])

  // Update progress to 100% if user reaches the end and clicks next/previous or leaves
  const markChapterAsRead = useCallback(() => {
    if (user && chapter && chapter.id) {
      updateProgress({
        chapterId: chapter.id,
        readingPosition: `scroll:100`,
        progressPercentage: 100,
      })
    }
  }, [user, chapter, updateProgress])

  // Find next/previous chapter numbers
  const currentChapterIndex = chapterList?.findIndex((c) => c.chapterNumber === parseFloat(chapterNumber))
  const prevChapter = currentChapterIndex > 0 ? chapterList[currentChapterIndex - 1] : null
  const nextChapter =
    chapterList && currentChapterIndex < chapterList.length - 1 ? chapterList[currentChapterIndex + 1] : null

  const navigateToChapter = (targetChapterNumber) => {
    if (!targetChapterNumber) return
    markChapterAsRead() // Mark current as read before navigating
    navigate(`/novels/${novelId}/chapters/${targetChapterNumber}?lang=${selectedLang || ""}`)
  }

  const handleLanguageChange = (langCode) => {
    setSelectedLang(langCode)
    const currentParams = new URLSearchParams(location.search)
    if (langCode) {
      currentParams.set("lang", langCode)
    } else {
      currentParams.delete("lang")
    }
    navigate(`${location.pathname}?${currentParams.toString()}`, { replace: true })
    // refetchChapter will be triggered by queryKey change
  }

  useEffect(() => {
    // Set initial scroll position to 0 when chapter changes
    if (contentRef.current) contentRef.current.children[1].scrollTop = 0
    setScrollPosition(0)
  }, [chapter?.id])

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage error={error} />
  if (!chapter) return <ErrorMessage message='Chapter not found.' />

  // The content from chapterService is already translated based on `lang` if provided
  const displayTitle = chapter.title || `Chapter ${chapter.chapterNumber}`
  const displayContent = chapter.content || "Content not available."

  return (
    <div className='max-w-3xl mx-auto py-8 px-2 md:px-0'>
      <div className='mb-6 p-4 bg-card text-card-foreground rounded-lg shadow'>
        <div className='flex justify-between items-center mb-3'>
          <Link to={`/novels/${novelId}`} className='text-sm text-primary hover:underline flex items-center'>
            <BookOpen className='w-4 h-4 mr-1' /> {chapter.novel?.title || "Back to Novel"}
          </Link>
          {/* Settings could include font size, theme for reading area etc. */}
          {/* <Button variant="outline" size="icon"><Settings2 className="w-5 h-5" /></Button> */}
        </div>
        <h1 className='text-2xl md:text-3xl font-bold mb-1'>{displayTitle}</h1>
        <p className='text-sm text-muted-foreground'>
          Novel: {chapter.novel?.title} - Chapter {chapter.chapterNumber}
          {chapter.servedLanguageCode && (
            <Badge variant='outline' className='ml-2 text-xs'>
              Lang: {chapter.servedLanguageCode.toUpperCase()}
            </Badge>
          )}
        </p>
        <div className='mt-2'>
          <LanguageSelector
            selectedLang={selectedLang}
            onLangChange={handleLanguageChange}
            placeholder='Default Language'
          />
        </div>
      </div>

      <ScrollArea
        className='h-[calc(100vh-20rem)] md:h-[calc(100vh-18rem)] border rounded-md bg-background'
        onScroll={handleScroll}
        ref={contentRef}>
        {/* WARNING: Ensure chapter.content is sanitized if it's HTML from untrusted sources */}
        {/* For rich text, consider a dedicated renderer. For Markdown, use a Markdown component. */}
        <div className='p-6 prose dark:prose-invert max-w-none' dangerouslySetInnerHTML={{ __html: displayContent }} />
      </ScrollArea>

      <div className='mt-6 flex justify-between items-center'>
        <Button onClick={() => navigateToChapter(prevChapter?.chapterNumber)} disabled={!prevChapter} variant='outline'>
          <ArrowLeft className='w-4 h-4 mr-2' /> Previous
        </Button>
        <Link to={`/novels/${novelId}?tab=chapters`} className='text-sm text-primary hover:underline flex items-center'>
          <ListChecks className='w-4 h-4 mr-1' /> Chapter List
        </Link>
        <Button onClick={() => navigateToChapter(nextChapter?.chapterNumber)} disabled={!nextChapter} variant='outline'>
          Next <ArrowRight className='w-4 h-4 ml-2' />
        </Button>
      </div>
    </div>
  )
}
