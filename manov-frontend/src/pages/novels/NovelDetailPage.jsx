import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchNovelByIdentifier,
  fetchChaptersByNovelId,
  fetchReadingProgressForNovel,
  // --- Phase 5 Imports ---
  fetchNovelRatings,
  fetchUserRatingForNovel,
  upsertNovelRating,
  deleteUserRatingForNovel,
  fetchNovelComments,
  postNovelComment,
  postReplyToComment,
  updateCommentById,
  deleteCommentById,
} from "@/services/contentService"
import { useAuth } from "@/contexts/AuthContext"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Badge } from "@/components/ui/badge"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { LanguageSelector } from "@/components/LanguageSelector"
import { PaginationControls } from "@/components/PaginationControls"
import { ChapterListItemSkeleton } from "@/components/ChapterListItemSkeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, UserCircle, CalendarDays, Tag, Star, ListChecks, MessageCircle, Edit3, ThumbsUp } from "lucide-react" // Added icons
import { toast } from "sonner"

// --- Phase 5 Component Imports ---
import { FavoriteButton } from "@/components/FavoriteButton"
import { StarRatingDisplay } from "@/components/StarRating"
import { ReviewForm } from "@/components/ReviewForm"
import { ReviewList } from "@/components/ReviewList"
import { CommentForm } from "@/components/CommentForm"
import { CommentList } from "@/components/CommentList"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const CHAPTER_LIMIT = 15
const REVIEWS_LIMIT = 5
const COMMENTS_LIMIT = 5

export function NovelDetailPage() {
  const { identifier: novelIdentifier } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const initialTab = searchParams.get("tab") || "synopsis"
  const initialChapterPage = parseInt(searchParams.get("chapterPage") || "1")
  const initialReviewPage = parseInt(searchParams.get("reviewPage") || "1")
  const initialCommentPage = parseInt(searchParams.get("commentPage") || "1")

  const [selectedContentLang, setSelectedContentLang] = useState(searchParams.get("lang") || "")
  const [activeTab, setActiveTab] = useState(initialTab)

  const [chapterPage, setChapterPage] = useState(initialChapterPage)
  const [chapterSortBy, setChapterSortBy] = useState(searchParams.get("chapterSortBy") || "chapterNumber")
  const [chapterSortOrder, setChapterSortOrder] = useState(searchParams.get("chapterSortOrder") || "asc")

  const [reviewPage, setReviewPage] = useState(initialReviewPage)
  const [commentPage, setCommentPage] = useState(initialCommentPage)
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false)
  const [editingReview, setEditingReview] = useState(null)

  const {
    data: novel,
    isLoading: novelLoading,
    isError: novelIsError,
    error: novelError,
  } = useQuery({
    queryKey: ["novel", novelIdentifier, selectedContentLang],
    queryFn: () => fetchNovelByIdentifier(novelIdentifier, { lang: selectedContentLang || undefined }),
    enabled: !!novelIdentifier,
    onError: (error) => {
      console.error("NovelDetailPage: Error fetching novel data", error)
    },
  })

  const chaptersQueryEnabled = !!novel?.id && activeTab === "chapters"
  const {
    data: chaptersResponse,
    isLoading: chaptersLoading,
    isFetching: chaptersFetching,
    isError: chaptersIsError,
    error: chaptersError,
  } = useQuery({
    queryKey: ["chapters", novel?.id, selectedContentLang, chapterPage, CHAPTER_LIMIT, chapterSortBy, chapterSortOrder],
    queryFn: () =>
      fetchChaptersByNovelId(novel.id, {
        lang: selectedContentLang || undefined,
        page: chapterPage,
        limit: CHAPTER_LIMIT,
        isPublished: true,
        sortBy: chapterSortBy,
        sortOrder: chapterSortOrder,
      }),
    enabled: chaptersQueryEnabled,
    keepPreviousData: true,
    onError: (error) => {
      console.error("NovelDetailPage: Error fetching chapters data", error)
    },
  })
  const chaptersList = chaptersResponse?.results || []
  const totalChapterPages = chaptersResponse?.totalPages || 1
  const currentChapterPageFromApi = chaptersResponse?.page || 1
  useEffect(() => {
    if (chaptersResponse?.page && chapterPage !== chaptersResponse.page) setChapterPage(chaptersResponse.page)
  }, [chaptersResponse?.page, chapterPage])

  const { data: readingProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["readingProgress", novel?.id, user?.id],
    queryFn: () => fetchReadingProgressForNovel(novel.id),
    enabled: !!user && !!novel?.id,
  })

  const { data: userReview, refetch: refetchUserReview } = useQuery({
    queryKey: ["userRating", novel?.id, user?.id],
    queryFn: () => fetchUserRatingForNovel(novel.id),
    enabled: !!user && !!novel?.id && activeTab === "reviews",
  })

  const ratingsQueryEnabled = !!novel?.id && activeTab === "reviews"
  const {
    data: ratingsResponse,
    isLoading: ratingsLoading,
    isFetching: ratingsFetching,
    refetch: refetchRatings,
  } = useQuery({
    queryKey: ["novelRatings", novel?.id, reviewPage, REVIEWS_LIMIT],
    queryFn: () => fetchNovelRatings(novel.id, { page: reviewPage, limit: REVIEWS_LIMIT }),
    enabled: ratingsQueryEnabled,
    keepPreviousData: true,
  })
  const novelRatingsList = ratingsResponse?.results || []
  const totalReviewPages = ratingsResponse?.totalPages || 1
  const currentReviewPageFromApi = ratingsResponse?.page || 1
  useEffect(() => {
    if (ratingsResponse?.page && reviewPage !== ratingsResponse.page) setReviewPage(ratingsResponse.page)
  }, [ratingsResponse?.page, reviewPage])

  const commentsQueryEnabled = !!novel?.id // Fetch comments regardless of tab to show count, CommentList will handle display based on tab
  const {
    data: commentsResponse,
    isLoading: commentsLoading,
    isFetching: commentsFetching,
    isError: commentsIsError, // Added to track comment fetch errors
    error: commentsError, // Added to track comment fetch errors
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["novelComments", novel?.id, commentPage, COMMENTS_LIMIT],
    queryFn: () =>
      fetchNovelComments(novel.id, {
        page: commentPage,
        limit: COMMENTS_LIMIT,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    enabled: commentsQueryEnabled, // Keep this enabled to fetch comment count at least
    keepPreviousData: true,
    onError: (error) => {
      console.error("NovelDetailPage: Error fetching comments data", error)
    },
  })
  const novelCommentsList = commentsResponse?.results || []
  const totalCommentPages = commentsResponse?.totalPages || 1
  const currentCommentPageFromApi = commentsResponse?.page || 1
  useEffect(() => {
    if (commentsResponse?.page && commentPage !== commentsResponse.page) setCommentPage(commentsResponse.page)
  }, [commentsResponse?.page, commentPage])

  const upsertRatingMutation = useMutation({
    mutationFn: (ratingData) => upsertNovelRating(novel.id, ratingData),
    onSuccess: () => {
      toast.success("Review submitted successfully!")
      queryClient.invalidateQueries({ queryKey: ["novelRatings", novel?.id] })
      queryClient.invalidateQueries({ queryKey: ["userRating", novel?.id, user?.id] })
      queryClient.invalidateQueries({ queryKey: ["novel", novelIdentifier] })
      setIsReviewFormOpen(false)
      setEditingReview(null)
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to submit review."),
  })

  const deleteRatingMutation = useMutation({
    mutationFn: () => deleteUserRatingForNovel(novel.id),
    onSuccess: () => {
      toast.info("Your review has been deleted.")
      queryClient.invalidateQueries({ queryKey: ["novelRatings", novel?.id] })
      queryClient.invalidateQueries({ queryKey: ["userRating", novel?.id, user?.id] })
      queryClient.invalidateQueries({ queryKey: ["novel", novelIdentifier] })
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to delete review."),
  })

  const postCommentMutation = useMutation({
    mutationFn: ({ targetId, data, type }) => {
      if (type === "novel") return postNovelComment(targetId, data)
      if (type === "reply") return postReplyToComment(targetId, data)
    },
    onSuccess: (data) => {
      toast.success("Comment posted!")
      queryClient.invalidateQueries({ queryKey: ["novelComments", novel?.id] }) // This should trigger refetch
    },
    onError: (error) => {
      console.error("NovelDetailPage: Error posting comment", error)
      toast.error(error.response?.data?.message || "Failed to post comment.")
    },
  })

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, data }) => updateCommentById(commentId, data),
    onSuccess: () => {
      toast.success("Comment updated!")
      queryClient.invalidateQueries({ queryKey: ["novelComments", novel?.id] })
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to update comment."),
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => deleteCommentById(commentId),
    onSuccess: () => {
      toast.info("Comment deleted.")
      queryClient.invalidateQueries({ queryKey: ["novelComments", novel?.id] })
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to delete comment."),
  })

  useEffect(() => {
    const newSearchParams = new URLSearchParams()
    if (selectedContentLang) newSearchParams.set("lang", selectedContentLang)
    if (activeTab !== "synopsis") newSearchParams.set("tab", activeTab)
    if (activeTab === "chapters") {
      if (chapterPage > 1) newSearchParams.set("chapterPage", chapterPage.toString())
      if (chapterSortBy !== "chapterNumber") newSearchParams.set("chapterSortBy", chapterSortBy)
      if (chapterSortOrder !== "asc") newSearchParams.set("chapterSortOrder", chapterSortOrder)
    }
    if (activeTab === "reviews" && reviewPage > 1) newSearchParams.set("reviewPage", reviewPage.toString())
    if (activeTab === "comments" && commentPage > 1) newSearchParams.set("commentPage", commentPage.toString())
    setSearchParams(newSearchParams, { replace: true })
  }, [
    selectedContentLang,
    activeTab,
    chapterPage,
    chapterSortBy,
    chapterSortOrder,
    reviewPage,
    commentPage,
    setSearchParams,
  ])

  const handleLanguageChange = (langCode) => {
    setSelectedContentLang(langCode || "")
    setChapterPage(1)
  }
  const handleChapterSortChange = (value) => {
    const [sortBy, sortOrder] = value.split("_")
    setChapterSortBy(sortBy)
    setChapterSortOrder(sortOrder)
    setChapterPage(1)
  }
  const getContinueReadingLink = () => {
    if (readingProgress && readingProgress.chapter) {
      return `/novels/${novel.id}/chapters/${readingProgress.chapter.chapterNumber}?lang=${
        selectedContentLang || novel.servedLanguageCode || ""
      }`
    }
    if (chaptersList && chaptersList.length > 0) {
      const firstChapter = [...chaptersList].sort((a, b) => a.chapterNumber - b.chapterNumber)[0]
      if (firstChapter)
        return `/novels/${novel.id}/chapters/${firstChapter.chapterNumber}?lang=${
          selectedContentLang || novel.servedLanguageCode || ""
        }`
    }
    return null
  }

  const handleReviewSubmit = (data) => {
    upsertRatingMutation.mutate(data)
  }
  const handleEditReview = (reviewToEdit) => {
    setEditingReview(reviewToEdit)
    setIsReviewFormOpen(true)
  }
  const handleDeleteReview = () => {
    deleteRatingMutation.mutate()
  }

  const handlePostNovelComment = (data, formResetCallback) => {
    postCommentMutation.mutate(
      { targetId: novel.id, data, type: "novel" },
      {
        onSuccess: () => {
          formResetCallback()
          // No need to manually refetch, invalidation should handle it.
        },
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

  if (novelLoading) return <LoadingSpinner />
  if (novelIsError) return <ErrorMessage error={novelError} />
  if (!novel) return <ErrorMessage message='Novel not found.' />

  const displayTitle = novel.titleTranslated || novel.title
  const novelIdForInteractions = novel.id

  return (
    <div className='max-w-4xl mx-auto py-8'>
      <div className='md:flex md:space-x-8'>
        {/* Left Column (Cover, Language, Progress, Favorite) */}
        <div className='md:w-1/3 mb-6 md:mb-0'>
          <AspectRatio ratio={3 / 4} className='bg-muted rounded-lg overflow-hidden shadow-lg'>
            {novel.coverImageUrl ? (
              <img src={novel.coverImageUrl} alt={`Cover of ${displayTitle}`} className='object-cover w-full h-full' />
            ) : (
              <div className='flex items-center justify-center h-full'>
                <BookOpen className='w-24 h-24 text-muted-foreground' />
              </div>
            )}
          </AspectRatio>
          {user && (
            <div className='mt-4 -mb-2 flex justify-end'>
              <FavoriteButton novelId={novelIdForInteractions} />
            </div>
          )}
          <div className='mt-4'>
            <h3 className='text-md font-semibold mb-2'>Content Language:</h3>
            <LanguageSelector
              selectedLang={selectedContentLang}
              onLangChange={handleLanguageChange}
              placeholder='Default Language'
            />
            <p className='text-xs text-muted-foreground mt-1'>
              Displayed language: {novel.servedLanguageCode || novel.originalLanguage}
            </p>
          </div>
          {user && !progressLoading && readingProgress /* Your existing progress display */ && (
            <Card className='mt-6'>
              <CardHeader>
                <CardTitle className='text-lg'>Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-2'>
                  Last read: Chapter {readingProgress.chapter.chapterNumber}
                  {readingProgress.chapter.title ? `: ${readingProgress.chapter.title}` : ""}
                </p>
                {readingProgress.progressPercentage !== null && (
                  <Progress value={readingProgress.progressPercentage} className='w-full mb-2' />
                )}
                <Button
                  onClick={() => getContinueReadingLink() && navigate(getContinueReadingLink())}
                  className='w-full mt-2'
                  disabled={!getContinueReadingLink()}>
                  Continue Reading
                </Button>
              </CardContent>
            </Card>
          )}
          {user &&
            !progressLoading &&
            !readingProgress &&
            chaptersQueryEnabled &&
            chaptersList &&
            chaptersList.length > 0 /* Your existing start reading */ && (
              <Button
                onClick={() => getContinueReadingLink() && navigate(getContinueReadingLink())}
                className='w-full mt-6'
                disabled={!getContinueReadingLink()}>
                Start Reading
              </Button>
            )}
        </div>

        {/* Right Column (Details, Tabs) */}
        <div className='md:w-2/3'>
          <h1 className='text-3xl md:text-4xl font-bold mb-2'>{displayTitle}</h1>
          {displayTitle !== novel.title && (
            <p className='text-lg text-muted-foreground mb-4'>Original: {novel.title}</p>
          )}
          <div className='flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-muted-foreground'>
            {novel.author && (
              <Link to={`/authors/${novel.author.id}`} className='hover:text-primary flex items-center'>
                <UserCircle className='w-5 h-5 mr-1' /> {novel.author.nameRomanized || novel.author.name}
              </Link>
            )}
            {novel.averageRating ? (
              <StarRatingDisplay rating={novel.averageRating} showText={true} />
            ) : (
              <span className='text-sm'>No ratings yet</span>
            )}
          </div>
          <div className='flex flex-wrap gap-2 mb-6'>
            {novel.publicationStatus && <Badge variant='secondary'>Status: {novel.publicationStatus}</Badge>}
            {novel.originalLanguage && (
              <Badge variant='outline'>Original Lang: {novel.originalLanguage.toUpperCase()}</Badge>
            )}
            {novel.totalChapters && <Badge variant='outline'>Chapters: {novel.totalChapters}</Badge>}
          </div>
          {novel.genreTags?.length > 0 /* ... (your existing genre display) ... */ && (
            <div className='mb-6'>
              <h3 className='text-sm font-semibold uppercase text-muted-foreground mb-1'>Genres</h3>
              <div className='flex flex-wrap gap-2'>
                {novel.genreTags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full mt-6'>
            <TabsList className='grid w-full grid-cols-2 md:grid-cols-4'>
              {" "}
              {/* Adjusted for more tabs */}
              <TabsTrigger value='synopsis'>Synopsis</TabsTrigger>
              <TabsTrigger value='details'>Details</TabsTrigger>
              <TabsTrigger value='chapters'>Chapters</TabsTrigger>
              <TabsTrigger value='reviews'>Reviews</TabsTrigger> {/* New Tab */}
              {/* Comments tab will be below reviews or separate section */}
            </TabsList>
            {/* Synopsis & Details Tabs (Your existing code) */}
            <TabsContent value='synopsis'>
              <Card>
                <CardHeader>
                  <CardTitle>Synopsis</CardTitle>
                </CardHeader>
                <CardContent className='prose dark:prose-invert max-w-none'>
                  <p>{novel.synopsis || "No synopsis available."}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value='details'>
              <Card>
                <CardHeader>
                  <CardTitle>Additional Details</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2 text-sm'>
                  {novel.firstPublishedAt && (
                    <p>
                      <CalendarDays className='inline w-4 h-4 mr-2' />
                      First Published: {new Date(novel.firstPublishedAt).toLocaleDateString()}
                    </p>
                  )}
                  {novel.sourceUrl && (
                    <p>
                      <Link
                        to={novel.sourceUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary hover:underline'>
                        Original Source
                      </Link>
                    </p>
                  )}
                  <p>Last Updated: {new Date(novel.updatedAt).toLocaleString()}</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chapters Tab (Your existing code, ensure to use currentChapterPageFromApi for pagination) */}
            <TabsContent value='chapters'>
              <Card>
                <CardHeader>
                  <div className='flex justify-between items-center'>
                    <CardTitle>Chapter List</CardTitle>
                    <Select value={`${chapterSortBy}_${chapterSortOrder}`} onValueChange={handleChapterSortChange}>
                      <SelectTrigger className='w-[180px]'>
                        <SelectValue placeholder='Sort chapters' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='chapterNumber_asc'>Number (Asc)</SelectItem>
                        <SelectItem value='chapterNumber_desc'>Number (Desc)</SelectItem>
                        <SelectItem value='publishedAt_desc'>Newest Published</SelectItem>
                        <SelectItem value='publishedAt_asc'>Oldest Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {(chaptersLoading || chaptersFetching) && !chaptersList.length ? (
                    <div className='space-y-1'>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <ChapterListItemSkeleton key={i} />
                      ))}
                    </div>
                  ) : chaptersIsError ? (
                    <ErrorMessage error={chaptersError} />
                  ) : chaptersList.length > 0 ? (
                    <Accordion type='single' collapsible className='w-full'>
                      {chaptersList.map((chapter) => (
                        <AccordionItem value={`ch-${chapter.id}`} key={chapter.id}>
                          <AccordionTrigger>
                            <div className='flex justify-between w-full pr-2 items-center'>
                              <span className='text-left'>
                                Ch. {chapter.chapterNumber}
                                {chapter.title ? `: ${chapter.title}` : ""}
                              </span>
                              <div className='flex items-center space-x-2'>
                                {chapter.servedLanguageCode &&
                                  chapter.servedLanguageCode !== novel.originalLanguage && (
                                    <Badge variant='outline' className='text-xs'>
                                      {chapter.servedLanguageCode.toUpperCase()}
                                    </Badge>
                                  )}
                                {readingProgress?.chapterId === chapter.id && (
                                  <Badge variant='default' className='text-xs'>
                                    Reading
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className='space-x-2 pt-1 pb-3'>
                            <Button asChild variant='default' size='sm'>
                              <Link
                                to={`/novels/${novel.id}/chapters/${chapter.chapterNumber}?lang=${
                                  selectedContentLang || ""
                                }`}>
                                Read
                              </Link>
                            </Button>
                            {chapter.publishedAt && (
                              <span className='text-xs text-muted-foreground'>
                                Published: {new Date(chapter.publishedAt).toLocaleDateString()}
                              </span>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <p>No chapters available.</p>
                  )}
                  {totalChapterPages > 1 && (
                    <PaginationControls
                      currentPage={currentChapterPageFromApi}
                      totalPages={totalChapterPages}
                      onPageChange={setChapterPage}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- New Reviews Tab --- */}
            <TabsContent value='reviews'>
              <Card>
                <CardHeader>
                  <div className='flex justify-between items-center'>
                    <CardTitle>Ratings & Reviews</CardTitle>
                    {user && (
                      <Button
                        onClick={() => {
                          setEditingReview(userReview || null)
                          setIsReviewFormOpen(true)
                        }}
                        variant='outline'>
                        <Edit3 className='mr-2 h-4 w-4' />
                        {userReview ? "Edit Your Review" : "Write a Review"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {ratingsLoading || (ratingsFetching && <LoadingSpinner size='sm' />)}
                  <ReviewList
                    reviewsData={ratingsResponse}
                    isLoading={ratingsLoading && !ratingsResponse}
                    isError={false} // Error handling is part of the parent component
                    error={null}
                    onEditReview={handleEditReview}
                    onDeleteReview={() => {
                      /* Trigger AlertDialog for confirmation */
                      const reviewToDelete = novelRatingsList.find((r) => r.user.id === user?.id) // Or use userReview.id
                      if (reviewToDelete) {
                        // Use AlertDialog here before calling handleDeleteReview()
                        // For simplicity, directly calling, but confirm dialog is better UX
                        if (window.confirm("Are you sure you want to delete your review?")) handleDeleteReview()
                      }
                    }}
                    page={reviewPage}
                    setPage={setReviewPage}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* --- Comments Section (Below Tabs or as another Tab) --- */}
          <Card className='mt-6'>
            <CardHeader>
              <CardTitle>Comments ({commentsResponse?.totalCount || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <CommentForm
                  onSubmit={handlePostNovelComment}
                  isSubmitting={postCommentMutation.isLoading}
                  placeholder={`Commenting on ${displayTitle}...`}
                />
              ) : (
                <p className='text-sm text-muted-foreground'>
                  Please{" "}
                  <Link to='/login' className='underline'>
                    login
                  </Link>{" "}
                  to post a comment.
                </p>
              )}

              <div className='mt-6'>
                {/* Show spinner on initial load or when fetching without existing data */}
                {(commentsLoading && !commentsResponse) || (commentsFetching && !novelCommentsList.length) ? (
                  <LoadingSpinner size='sm' />
                ) : commentsIsError ? (
                  <ErrorMessage error={commentsError} />
                ) : (
                  <>
                    <CommentList
                      commentsData={novelCommentsList}
                      isLoading={commentsLoading && !commentsResponse} // Initial load
                      isError={commentsIsError} // Correct: use actual error state
                      error={commentsError}
                      onPostReply={handlePostReply}
                      onEditComment={handleEditComment}
                      onDeleteComment={handleDeleteComment}
                      page={commentPage}
                      setPage={setCommentPage}
                      isSubmittingReply={
                        postCommentMutation.isLoading && postCommentMutation.variables?.type === "reply"
                      }
                      isSubmittingEdit={updateCommentMutation.isLoading}
                    />
                    {/* Pagination for comments */}
                    {novelCommentsList.length > 0 && totalCommentPages > 1 && (
                      <PaginationControls
                        currentPage={currentCommentPageFromApi}
                        totalPages={totalCommentPages}
                        onPageChange={setCommentPage}
                      />
                    )}
                    {novelCommentsList.length === 0 && !commentsLoading && !commentsFetching && (
                      <p className='text-center py-4 text-muted-foreground'>
                        No comments yet. Be the first to comment!
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Review Form Dialog */}
      <ReviewForm
        novelId={novelIdForInteractions}
        open={isReviewFormOpen}
        onOpenChange={setIsReviewFormOpen}
        existingReview={editingReview || userReview} // Pass user's current review if editing or available
        onSubmitSuccess={handleReviewSubmit}
      />
    </div>
  )
}
