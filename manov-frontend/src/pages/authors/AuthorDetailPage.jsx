import React from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchAuthorById, fetchNovels } from "@/services/contentService"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NovelCard } from "@/components/NovelCard" // Re-use NovelCard for author's works
import { User, CalendarDays, Languages } from "lucide-react"

export function AuthorDetailPage() {
  const { authorId } = useParams()

  const {
    data: author,
    isLoading: authorLoading,
    isError: authorIsError,
    error: authorError,
  } = useQuery({
    queryKey: ["author", authorId],
    queryFn: () => fetchAuthorById(authorId),
    enabled: !!authorId,
  })

  // Fetch novels by this author
  const {
    data: novelsData,
    isLoading: novelsLoading,
    isError: novelsIsError,
    error: novelsError,
  } = useQuery({
    queryKey: ["novelsByAuthor", authorId],
    queryFn: () => fetchNovels({ authorId: parseInt(authorId), limit: 20, isActive: true }), // Fetch up to 20 novels
    enabled: !!authorId, // Only run if authorId is available
  })

  if (authorLoading) return <LoadingSpinner />
  if (authorIsError) return <ErrorMessage error={authorError} />
  if (!author) return <ErrorMessage message='Author not found.' />

  const authorNovels = Array.isArray(novelsData) ? novelsData : novelsData?.results

  return (
    <div className='max-w-4xl mx-auto py-8'>
      <Card>
        <CardHeader className='flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6'>
          <Avatar className='h-32 w-32'>
            <AvatarImage src={author.profileImageUrl || undefined} alt={author.name} />
            <AvatarFallback className='text-4xl'>
              {author.name ? author.name.substring(0, 2).toUpperCase() : <User size={48} />}
            </AvatarFallback>
          </Avatar>
          <div className='text-center md:text-left'>
            <CardTitle className='text-3xl'>{author.nameRomanized || author.name}</CardTitle>
            {author.nameRomanized && <p className='text-md text-muted-foreground'>{author.name} (Original)</p>}
            <div className='mt-2 text-sm text-muted-foreground space-y-1'>
              {author.nationality && <p>Nationality: {author.nationality}</p>}
              {author.originalLanguage && (
                <p>
                  <Languages className='inline w-4 h-4 mr-1' />
                  Original Language: {author.originalLanguage.toUpperCase()}
                </p>
              )}
              {author.birthDate && (
                <p>
                  <CalendarDays className='inline w-4 h-4 mr-1' />
                  Born: {new Date(author.birthDate).toLocaleDateString()}
                </p>
              )}
              {author.deathDate && (
                <p>
                  <CalendarDays className='inline w-4 h-4 mr-1' />
                  Died: {new Date(author.deathDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {author.biography && (
            <>
              <h3 className='text-xl font-semibold mt-6 mb-2'>Biography</h3>
              <p className='prose dark:prose-invert max-w-none whitespace-pre-line'>{author.biography}</p>
            </>
          )}

          <h3 className='text-xl font-semibold mt-8 mb-4'>Works by {author.name}</h3>
          {novelsLoading && <LoadingSpinner size='sm' />}
          {novelsIsError && <ErrorMessage error={novelsError} />}
          {authorNovels && authorNovels.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {authorNovels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          ) : (
            !novelsLoading && !novelsIsError && <p>No novels found for this author.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
