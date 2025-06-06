import React, { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchChapterByNovelAndNumber,
  fetchChaptersByNovelId,
  upsertReadingProgress,
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
import { ArrowLeft, ArrowRight, BookOpen, ListChecks, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CommentForm } from "@/components/CommentForm"
import { CommentList } from "@/components/CommentList"
import { useReadingSettings } from "../../hooks/useReadingSettings"
import { ReadingSettingsMenu } from "../../components/ReadingSettingsMenu"
import { cn } from "@/lib/utils"

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
const CHAPTER_LIST_LIMIT_FOR_NAV = 1000

export function ChapterReadingPage() {
  const { novelId, chapterNumber } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const scrollViewportRef = useRef(null)
  const uiVisibilityTimer = useRef(null)

  // --- STATE MANAGEMENT ---
  const queryParams = new URLSearchParams(location.search)
  const [selectedLang, setSelectedLang] = useState(queryParams.get("lang") || "")
  const [commentPage, setCommentPage] = useState(parseInt(queryParams.get("commentPage") || "1"))
  const [readingSettings, setReadingSettings] = useReadingSettings()
  const [isUiVisible, setIsUiVisible] = useState(true)
  const [currentScrollPercentage, setCurrentScrollPercentage] = useState(0)
  const debouncedScrollPercentage = useDebounce(currentScrollPercentage, 2500)

  // --- DATA FETCHING ---
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
    queryKey: ["chapterListForNav", novelId],
    queryFn: () =>
      fetchChaptersByNovelId(novelId, {
        limit: CHAPTER_LIST_LIMIT_FOR_NAV,
        isPublished: true,
        sortBy: "chapterNumber",
        sortOrder: "asc",
      }),
    enabled: !!novelId,
    select: (data) => data?.results || (Array.isArray(data) ? data : []),
    staleTime: 1000 * 60 * 10,
  })

  // --- DERIVED DATA & NAVIGATION LOGIC (MOVED UP) ---
  const currentChapterIndex = chapterList?.findIndex((c) => c.chapterNumber === parseFloat(chapterNumber))
  const prevChapter = chapterList && currentChapterIndex > 0 ? chapterList[currentChapterIndex - 1] : null
  const nextChapter =
    chapterList && currentChapterIndex > -1 && currentChapterIndex < chapterList.length - 1
      ? chapterList[currentChapterIndex + 1]
      : null

  // --- DATA MUTATIONS ---
  const { mutate: updateProgress } = useMutation({
    mutationFn: (progressData) => upsertReadingProgress(novelId, progressData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readingProgress", novelId, user?.id] })
      queryClient.invalidateQueries({ queryKey: ["allUserReadingProgress", user?.id] })
    },
    onError: (err) => console.error("Failed to save progress:", err.response?.data?.message || err.message),
  })

  const { data: commentsResponse, isLoading: commentsLoading } = useQuery({
    queryKey: ["chapterComments", chapter?.id, commentPage],
    queryFn: () => fetchChapterComments(chapter.id, { page: commentPage, limit: CHAPTER_COMMENTS_LIMIT }),
    enabled: !!chapter?.id,
    keepPreviousData: true,
  })

  const { mutate: postComment, isLoading: isSubmittingComment } = useMutation({
    mutationFn: ({ targetId, data, type }) =>
      type === "chapter" ? postChapterComment(targetId, data) : postReplyToComment(targetId, data),
    onSuccess: () => {
      toast.success("Comment posted!")
      queryClient.invalidateQueries({ queryKey: ["chapterComments", chapter?.id] })
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to post comment."),
  })

  const { mutate: updateComment, isLoading: isUpdatingComment } = useMutation({
    mutationFn: ({ commentId, data }) => updateCommentById(commentId, data),
    onSuccess: () => {
      toast.success("Comment updated!")
      queryClient.invalidateQueries({ queryKey: ["chapterComments", chapter?.id] })
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update comment."),
  })

  const { mutate: deleteComment } = useMutation({
    mutationFn: (commentId) => deleteCommentById(commentId),
    onSuccess: () => {
      toast.info("Comment deleted.")
      queryClient.invalidateQueries({ queryKey: ["chapterComments", chapter?.id] })
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete comment."),
  })

  // --- HANDLERS & LOGIC ---
  const saveCurrentProgress = useCallback(
    (percentageOverride) => {
      if (user && chapter?.id) {
        const progressToSave = typeof percentageOverride === "number" ? percentageOverride : currentScrollPercentage
        if (progressToSave > 0) {
          updateProgress({ chapterId: chapter.id, progressPercentage: progressToSave })
        }
      }
    },
    [user, chapter, currentScrollPercentage, updateProgress]
  )

  const navigateToChapter = useCallback(
    (targetChapter) => {
      if (!targetChapter) return
      saveCurrentProgress(100)
      navigate(`/novels/${novelId}/chapters/${targetChapter.chapterNumber}?lang=${selectedLang || ""}`)
    },
    [novelId, selectedLang, navigate, saveCurrentProgress]
  )

  const handleLanguageChange = (langCode) => {
    const newLang = langCode || ""
    setSelectedLang(newLang)
    const newParams = new URLSearchParams(location.search)
    if (newLang) newParams.set("lang", newLang)
    else newParams.delete("lang")
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true })
  }

  const handleScroll = useCallback(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return
    const { scrollTop, scrollHeight, clientHeight } = viewport
    const scrollableHeight = scrollHeight - clientHeight
    const percentage = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 100
    setCurrentScrollPercentage(Math.min(100, percentage))
  }, [])

  // --- EFFECTS ---
  useEffect(() => {
    if (debouncedScrollPercentage > 0 && debouncedScrollPercentage < 100) {
      saveCurrentProgress()
    }
  }, [debouncedScrollPercentage, saveCurrentProgress])

  useEffect(() => {
    return () => saveCurrentProgress()
  }, [saveCurrentProgress, novelId, chapterNumber])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName.toLowerCase() === "textarea" || e.target.tagName.toLowerCase() === "input") return
      if (e.key === "ArrowRight") navigateToChapter(nextChapter)
      if (e.key === "ArrowLeft") navigateToChapter(prevChapter)
    }

    const resetUiTimer = () => {
      setIsUiVisible(true)
      if (uiVisibilityTimer.current) clearTimeout(uiVisibilityTimer.current)
      uiVisibilityTimer.current = setTimeout(() => setIsUiVisible(false), 3500)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("mousemove", resetUiTimer)
    resetUiTimer()

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("mousemove", resetUiTimer)
      if (uiVisibilityTimer.current) clearTimeout(uiVisibilityTimer.current)
    }
  }, [nextChapter, prevChapter, navigateToChapter]) // <-- Now `nextChapter` and `prevChapter` are declared before this runs

  useEffect(() => {
    if (scrollViewportRef.current) scrollViewportRef.current.scrollTop = 0
  }, [chapter?.id])

  useEffect(() => {
    const newParams = new URLSearchParams(location.search)
    if (commentPage > 1) newParams.set("commentPage", commentPage.toString())
    else newParams.delete("commentPage")
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true })
  }, [commentPage, location.pathname, navigate])

  // --- RENDER ---
  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage error={error} />
  if (!chapter) return <ErrorMessage message='Chapter not found.' />

  const displayTitle = chapter.title || `Chapter ${chapter.chapterNumber}`
  const displayContent = chapter.content || "Content not available."

  return (
    <div className='relative max-w-4xl mx-auto'>
      <div className='fixed top-0 left-0 w-full h-1 z-50 bg-muted'>
        <div
          className='bg-primary h-full transition-all duration-150'
          style={{ width: `${currentScrollPercentage}%` }}
        />
      </div>

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 p-2 transition-transform duration-300 ease-in-out",
          !isUiVisible && "-translate-y-full"
        )}>
        <div className='max-w-3xl mx-auto flex justify-between items-center bg-card/80 text-card-foreground rounded-lg shadow-lg p-2 backdrop-blur-sm border'>
          <Button variant='ghost' size='sm' asChild className='shrink-0'>
            <Link to={`/novels/${novelId}`} title={chapter.novel?.title || "Back to Novel"}>
              <BookOpen className='w-4 h-4 mr-2' />{" "}
              <span className='hidden sm:inline truncate max-w-xs'>{chapter.novel?.title || "Novel Details"}</span>
            </Link>
          </Button>
          <div className='flex-grow text-center truncate px-2 text-sm font-medium'>{displayTitle}</div>
          <div className='flex items-center gap-1 shrink-0'>
            <LanguageSelector selectedLang={selectedLang} onLangChange={handleLanguageChange} />
            <ReadingSettingsMenu settings={readingSettings} setSettings={setReadingSettings} />
          </div>
        </div>
      </header>

      <div
        className='fixed inset-y-0 left-0 w-[15%] md:w-[20%] z-20'
        role='button'
        onClick={() => navigateToChapter(prevChapter)}
        title='Previous Chapter (Left Arrow)'></div>
      <div
        className='fixed inset-y-0 right-0 w-[15%] md:w-[20%] z-20'
        role='button'
        onClick={() => navigateToChapter(nextChapter)}
        title='Next Chapter (Right Arrow)'></div>

      <ScrollArea className='h-screen pt-24 pb-20' viewportRef={scrollViewportRef} onScroll={handleScroll}>
        <div className='max-w-prose mx-auto px-4'>
          <div
            className={cn(
              "prose dark:prose-invert max-w-none transition-all",
              readingSettings.fontFamily === "serif" ? "font-serif" : "font-sans"
            )}
            style={{ fontSize: `${readingSettings.fontSize}px`, lineHeight: readingSettings.lineHeight }}
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />
        </div>

        <div className='max-w-prose mx-auto mt-16 px-4'>
          <Card id='comments'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <MessageCircle className='inline-block mr-2 h-6 w-6' /> Chapter Comments (
                {commentsResponse?.totalCount || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <CommentForm
                  onSubmit={(data, cb) =>
                    postComment({ targetId: chapter.id, data, type: "chapter" }, { onSuccess: cb })
                  }
                  isSubmitting={isSubmittingComment}
                  placeholder={`Commenting on Chapter ${chapter.chapterNumber}...`}
                />
              ) : (
                <p className='text-sm text-muted-foreground'>
                  Please{" "}
                  <Link to='/login' className='underline'>
                    login
                  </Link>{" "}
                  to comment.
                </p>
              )}
              <div className='mt-6'>
                {commentsLoading && !commentsResponse ? (
                  <LoadingSpinner size='sm' />
                ) : (
                  <CommentList
                    commentsData={commentsResponse?.results}
                    isLoading={false}
                    onPostReply={(parentCommentId, content, cb) =>
                      postComment({ targetId: parentCommentId, data: { content }, type: "reply" }, { onSuccess: cb })
                    }
                    onEditComment={(commentId, content, cb) =>
                      updateComment({ commentId, data: { content } }, { onSuccess: cb })
                    }
                    onDeleteComment={deleteComment}
                    page={commentPage}
                    setPage={setCommentPage}
                    isSubmittingReply={isSubmittingComment && postComment.variables?.type === "reply"}
                    isSubmittingEdit={isUpdatingComment}
                    // Pass totalPages to CommentList if it supports pagination
                    totalPages={commentsResponse?.totalPages}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <footer
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 p-2 transition-transform duration-300 ease-in-out",
          !isUiVisible && "translate-y-full"
        )}>
        <div className='max-w-3xl mx-auto flex justify-between items-center'>
          <Button onClick={() => navigateToChapter(prevChapter)} disabled={!prevChapter} variant='outline' size='sm'>
            <ArrowLeft className='w-4 h-4 md:mr-2' /> <span className='hidden md:inline'>Previous</span>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link to={`/novels/${novelId}?tab=chapters`}>
              <ListChecks className='w-4 h-4' />
            </Link>
          </Button>
          <Button onClick={() => navigateToChapter(nextChapter)} disabled={!nextChapter} variant='outline' size='sm'>
            <span className='hidden md:inline'>Next</span> <ArrowRight className='w-4 h-4 md:ml-2' />
          </Button>
        </div>
      </footer>
    </div>
  )
}
