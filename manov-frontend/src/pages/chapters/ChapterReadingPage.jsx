import React, { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchChapterByNovelAndNumber,
  fetchChaptersByNovelId, // For nav
  upsertReadingProgress,
  // --- Phase 5 Imports ---
  fetchChapterComments,
  postChapterComment,
  postReplyToComment,
  updateCommentById,
  deleteCommentById,
} from "@/services/contentService"
import { useAuth } from "@/contexts/AuthContext"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { LanguageSelector } from "@/components/LanguageSelector"
import { ArrowLeft, ArrowRight, Settings2, BookOpen, ListChecks, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // For comments section

// --- Phase 5 Component Imports ---
import { CommentForm } from "@/components/CommentForm"
import { CommentList } from "@/components/CommentList"

// (Keep useDebounce hook as is)
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

const CHAPTER_COMMENTS_LIMIT = 10

export function ChapterReadingPage() {
  const { novelId, chapterNumber } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const scrollViewportRef = useRef(null)

  const queryParams = new URLSearchParams(location.search)
  const initialLang = queryParams.get("lang") || ""
  const [selectedLang, setSelectedLang] = useState(initialLang)

  // --- Phase 5 State for Comments ---
  const [commentPage, setCommentPage] = useState(1)

  const {
    data: chapter,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["chapter", novelId, chapterNumber, selectedLang],
    queryFn: () => fetchChapterByNovelAndNumber(novelId, chapterNumber, { lang: selectedLang || undefined }),
    enabled: !!novelId && !!chapterNumber,
  })

  const { data: chapterList } = useQuery({
    // For Next/Prev navigation
    queryKey: ["chapterListForNav", novelId],
    queryFn: () =>
      fetchChaptersByNovelId(novelId, { limit: 1000, isPublished: true, sortBy: "chapterNumber", sortOrder: "asc" }),
    enabled: !!novelId,
    select: (data) => data?.results || (Array.isArray(data) ? data : []),
  })

  // --- Phase 5: Chapter Comments Query ---
  const {
    data: commentsResponse,
    isLoading: commentsLoading,
    isFetching: commentsFetching,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["chapterComments", chapter?.id, commentPage, CHAPTER_COMMENTS_LIMIT],
    queryFn: () =>
      fetchChapterComments(chapter.id, {
        page: commentPage,
        limit: CHAPTER_COMMENTS_LIMIT,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    enabled: !!chapter?.id, // Only fetch if chapter.id is available
    keepPreviousData: true,
  })
  const chapterCommentsList = commentsResponse?.results || []
  // const totalCommentPages = commentsResponse?.totalPages || 1; // Use if your comment list needs pagination

  // Reading Progress Mutation (Keep as is)
  const { mutate: updateProgress } = useMutation({
    /* ... */
  })
  // Scroll and Progress Tracking (Keep as is)
  const [currentScrollPercentage, setCurrentScrollPercentage] = useState(0)
  const debouncedScrollPercentage = useDebounce(currentScrollPercentage, 2000)
  const handleScroll = useCallback(() => {
    /* ... */
  }, [])
  const saveCurrentProgress = useCallback(
    (percentageOverride) => {
      /* ... */
    },
    [user, chapter, currentScrollPercentage, updateProgress]
  )
  useEffect(() => {
    /* ... for debounced scroll save ... */
  }, [debouncedScrollPercentage, saveCurrentProgress])
  useEffect(() => {
    /* ... for unmount/nav away save ... */ return () => saveCurrentProgress()
  }, [saveCurrentProgress, novelId, chapterNumber])

  // Navigation and Language Handlers (Keep as is)
  const currentChapterIndex = chapterList?.findIndex((c) => c.chapterNumber === parseFloat(chapterNumber))
  const prevChapter = chapterList && currentChapterIndex > 0 ? chapterList[currentChapterIndex - 1] : null
  const nextChapter =
    chapterList && currentChapterIndex >= 0 && currentChapterIndex < chapterList.length - 1
      ? chapterList[currentChapterIndex + 1]
      : null
  const navigateToChapter = (targetChapter) => {
    if (!targetChapter) return
    saveCurrentProgress(100)
    navigate(`/novels/${novelId}/chapters/${targetChapter.chapterNumber}?lang=${selectedLang || ""}`)
  }
  const handleLanguageChange = (langCode) => {
    const newLang = langCode || ""
    // 1. Update the state. This will trigger the useQuery to refetch.
    setSelectedLang(newLang)

    // 2. Update the URL to reflect the new state, without a full page reload.
    const newSearchParams = new URLSearchParams(location.search)
    if (newLang) {
      newSearchParams.set("lang", newLang)
    } else {
      newSearchParams.delete("lang")
    }
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true })
  }

  useEffect(() => {
    if (scrollViewportRef.current) scrollViewportRef.current.scrollTop = 0
    setCurrentScrollPercentage(0)
  }, [chapter?.id])
  useEffect(() => {
    if (scrollViewportRef.current) scrollViewportRef.current.scrollTop = 0
    setCurrentScrollPercentage(0)
  }, [chapter?.id])

  // --- Phase 5: Comment Mutations ---
  const postCommentMutation = useMutation({
    mutationFn: ({ targetId, data, type }) => {
      if (type === "chapter") return postChapterComment(targetId, data)
      if (type === "reply") return postReplyToComment(targetId, data)
    },
    onSuccess: () => {
      toast.success("Comment posted!")
      queryClient.invalidateQueries({ queryKey: ["chapterComments", chapter?.id] })
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to post comment."),
  })

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, data }) => updateCommentById(commentId, data),
    onSuccess: () => {
      toast.success("Comment updated!")
      queryClient.invalidateQueries({ queryKey: ["chapterComments", chapter?.id] })
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to update comment."),
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => deleteCommentById(commentId),
    onSuccess: () => {
      toast.info("Comment deleted.")
      queryClient.invalidateQueries({ queryKey: ["chapterComments", chapter?.id] })
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to delete comment."),
  })

  // --- Phase 5 Comment Event Handlers ---
  const handlePostChapterComment = (data, formResetCallback) => {
    postCommentMutation.mutate(
      { targetId: chapter.id, data, type: "chapter" },
      {
        onSuccess: () => formResetCallback(),
      }
    )
  }
  const handlePostReply = (parentCommentId, content, formResetCallback) => {
    postCommentMutation.mutate(
      { targetId: parentCommentId, data: { content }, type: "reply" },
      {
        onSuccess: () => formResetCallback(),
      }
    )
  }
  const handleEditComment = (commentId, content, formResetCallback) => {
    updateCommentMutation.mutate(
      { commentId, data: { content } },
      {
        onSuccess: () => formResetCallback(),
      }
    )
  }
  const handleDeleteComment = (commentId) => {
    deleteCommentMutation.mutate(commentId)
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage error={error} />
  if (!chapter) return <ErrorMessage message='Chapter not found.' />

  const displayTitle = chapter.title || `Chapter ${chapter.chapterNumber}`
  const displayContent = chapter.content || "Content not available."

  return (
    <div className='max-w-3xl mx-auto py-4 md:py-8 px-1 md:px-0'>
      {/* ... (Existing Chapter Header with Title, Lang Selector) ... */}
      <div className='mb-4 p-3 md:p-4 bg-card text-card-foreground rounded-lg shadow sticky top-16 md:top-20 z-40'>
        <div className='flex justify-between items-center mb-2'>
          <Button variant='ghost' size='sm' asChild className='text-primary hover:underline'>
            <Link to={`/novels/${novelId}?tab=chapters&chapterPage=${Math.floor((currentChapterIndex || 0) / 15) + 1}`}>
              <BookOpen className='w-4 h-4 mr-1' /> {chapter.novel?.title || "Novel Details"}
            </Link>
          </Button>
        </div>
        <h1 className='text-xl md:text-2xl font-bold mb-1'>{displayTitle}</h1>
        <p className='text-xs md:text-sm text-muted-foreground mb-2'>
          Chapter {chapter.chapterNumber}
          {chapter.servedLanguageCode && (
            <Badge variant='outline' className='ml-2 text-xs'>
              Lang: {chapter.servedLanguageCode.toUpperCase()}
            </Badge>
          )}
        </p>
        <LanguageSelector
          selectedLang={selectedLang}
          onLangChange={handleLanguageChange}
          placeholder='Default Language'
        />
      </div>

      <ScrollArea
        className='h-[calc(100vh-20rem)] md:h-[calc(100vh-18rem)] border rounded-md bg-background shadow'
        viewportRef={scrollViewportRef}
        onScroll={handleScroll}>
        <div
          className='p-4 md:p-6 prose dark:prose-invert max-w-none'
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
        <ScrollBar orientation='vertical' />
      </ScrollArea>

      {/* ... (Existing Next/Prev Chapter Navigation Bar) ... */}
      <div className='mt-4 py-2 flex justify-between items-center sticky bottom-0 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t md:rounded-b-lg'>
        <Button onClick={() => navigateToChapter(prevChapter)} disabled={!prevChapter} variant='outline' size='sm'>
          <ArrowLeft className='w-4 h-4 md:mr-2' /> <span className='hidden md:inline'>Previous</span>
        </Button>
        <Button variant='outline' size='sm' asChild>
          <Link to={`/novels/${novelId}?tab=chapters&chapterPage=${Math.floor((currentChapterIndex || 0) / 15) + 1}`}>
            <ListChecks className='w-4 h-4 md:mr-2' /> <span className='hidden md:inline'>Chapters</span>
          </Link>
        </Button>
        <Button onClick={() => navigateToChapter(nextChapter)} disabled={!nextChapter} variant='outline' size='sm'>
          <span className='hidden md:inline'>Next</span> <ArrowRight className='w-4 h-4 md:ml-2' />
        </Button>
      </div>

      {/* --- Phase 5: Comments Section for Chapter --- */}
      <Card className='mt-8'>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <MessageCircle className='mr-2 h-6 w-6' /> Chapter Comments ({commentsResponse?.totalCount || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <CommentForm
              onSubmit={handlePostChapterComment}
              isSubmitting={postCommentMutation.isLoading && postCommentMutation.variables?.type === "chapter"}
              placeholder={`Commenting on Chapter ${chapter.chapterNumber}...`}
            />
          ) : (
            <p className='text-sm text-muted-foreground'>
              Please{" "}
              <Link to='/login' className='underline'>
                login
              </Link>{" "}
              to post a comment on this chapter.
            </p>
          )}
          <div className='mt-6'>
            {(commentsLoading || commentsFetching) && <LoadingSpinner size='sm' />}
            <CommentList
              commentsData={commentsResponse} // Pass the whole response for pagination data
              isLoading={commentsLoading && !commentsResponse}
              onPostReply={handlePostReply}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              page={commentPage} // chapter's comment page
              setPage={setCommentPage} // chapter's comment page setter
              isSubmittingReply={postCommentMutation.isLoading && postCommentMutation.variables?.type === "reply"}
              isSubmittingEdit={updateCommentMutation.isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
