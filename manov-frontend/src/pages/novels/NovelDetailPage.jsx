import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchNovelByIdentifier, fetchChaptersByNovelId, fetchReadingProgressForNovel } from "@/services/contentService"
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
import { ChapterListItemSkeleton } from "@/components/ChapterListItemSkeleton" // New
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, UserCircle, CalendarDays, Tag, Star, ListChecks } from "lucide-react"

const CHAPTER_LIMIT = 15

export function NovelDetailPage() {
  const { identifier: novelIdentifier } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const initialTab = searchParams.get("tab") || "synopsis"
  const initialChapterPage = parseInt(searchParams.get("chapterPage") || "1")

  const [selectedContentLang, setSelectedContentLang] = useState(searchParams.get("lang") || "")
  const [activeTab, setActiveTab] = useState(initialTab)

  const [chapterPage, setChapterPage] = useState(initialChapterPage)
  const [chapterSortBy, setChapterSortBy] = useState(searchParams.get("chapterSortBy") || "chapterNumber")
  const [chapterSortOrder, setChapterSortOrder] = useState(searchParams.get("chapterSortOrder") || "asc")

  const {
    data: novel,
    isLoading: novelLoading,
    isError: novelIsError,
    error: novelError,
  } = useQuery({
    queryKey: ["novel", novelIdentifier, selectedContentLang],
    queryFn: () => fetchNovelByIdentifier(novelIdentifier, { lang: selectedContentLang || undefined }),
    enabled: !!novelIdentifier,
  })

  const chaptersQueryEnabled = !!novel?.id && activeTab === "chapters"
  const {
    data: chaptersResponse,
    isLoading: chaptersLoading,
    isError: chaptersIsError,
    error: chaptersError,
    isFetching: chaptersFetching,
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
  })

  const chaptersList = chaptersResponse?.results || []
  const totalChapterPages = chaptersResponse?.totalPages || 1
  const currentChapterPageFromApi = chaptersResponse?.page || 1

  useEffect(() => {
    if (chaptersResponse?.page && chapterPage !== chaptersResponse.page) {
      setChapterPage(chaptersResponse.page)
    }
  }, [chaptersResponse?.page, chapterPage])

  const { data: readingProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["readingProgress", novel?.id, user?.id],
    queryFn: () => fetchReadingProgressForNovel(novel.id),
    enabled: !!user && !!novel?.id,
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
    setSearchParams(newSearchParams, { replace: true })
  }, [selectedContentLang, activeTab, chapterPage, chapterSortBy, chapterSortOrder, setSearchParams])

  const handleLanguageChange = (langCode) => {
    setSelectedContentLang(langCode || "")
    setChapterPage(1) // Reset chapter page when language changes
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

  if (novelLoading) return <LoadingSpinner />
  if (novelIsError) return <ErrorMessage error={novelError} />
  if (!novel) return <ErrorMessage message='Novel not found.' />

  const displayTitle = novel.titleTranslated || novel.title

  return (
    <div className='max-w-4xl mx-auto py-8'>
      <div className='md:flex md:space-x-8'>
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

          {user && !progressLoading && readingProgress && (
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
            chaptersList.length > 0 && (
              <Button
                onClick={() => getContinueReadingLink() && navigate(getContinueReadingLink())}
                className='w-full mt-6'
                disabled={!getContinueReadingLink()}>
                Start Reading
              </Button>
            )}
        </div>

        <div className='md:w-2/3'>
          <h1 className='text-3xl md:text-4xl font-bold mb-2'>{displayTitle}</h1>
          {displayTitle !== novel.title && (
            <p className='text-lg text-muted-foreground mb-4'>Original: {novel.title}</p>
          )}
          <div className='flex items-center space-x-4 mb-4 text-muted-foreground'>
            {novel.author && (
              <Link to={`/authors/${novel.author.id}`} className='hover:text-primary flex items-center'>
                <UserCircle className='w-5 h-5 mr-1' /> {novel.author.nameRomanized || novel.author.name}
              </Link>
            )}
            {novel.averageRating && (
              <span className='flex items-center'>
                <Star className='w-5 h-5 mr-1 text-yellow-500 fill-yellow-400' /> {novel.averageRating.toFixed(1)}/5
              </span>
            )}
          </div>
          <div className='flex flex-wrap gap-2 mb-6'>
            {novel.publicationStatus && <Badge variant='secondary'>Status: {novel.publicationStatus}</Badge>}
            {novel.originalLanguage && (
              <Badge variant='outline'>Original Lang: {novel.originalLanguage.toUpperCase()}</Badge>
            )}
            {novel.totalChapters && <Badge variant='outline'>Chapters: {novel.totalChapters}</Badge>}
          </div>
          {novel.genreTags?.length > 0 && (
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
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='synopsis'>Synopsis</TabsTrigger>
              <TabsTrigger value='details'>Details</TabsTrigger>
              <TabsTrigger value='chapters'>Chapters</TabsTrigger>
            </TabsList>
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
                      {chaptersList.map((chapter, index) => (
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
                    <p>No chapters available for this novel with the current filters.</p>
                  )}
                  {totalChapterPages > 1 && (
                    <PaginationControls
                      currentPage={currentChapterPageFromApi}
                      totalPages={totalChapterPages}
                      onPageChange={(newPage) => setChapterPage(newPage)}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
