import { Link } from "react-router-dom"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Star } from "lucide-react"

// Helper to truncate text
const truncateText = (text, length = 100) => {
  if (!text) return ""
  return text.length > length ? text.substring(0, length) + "..." : text
}

export function NovelCard({ novel }) {
  // Determine which title to display based on servedLanguageCode and originalLanguage
  // novel.titleTranslated holds the served title, novel.title is the original.
  // novel.servedLanguageCode indicates the language of titleTranslated and synopsis.
  const displayTitle = novel.titleTranslated || novel.title

  return (
    <Card className='flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow duration-200'>
      <Link to={`/novels/${novel.slug || novel.id}`} className='block'>
        <AspectRatio ratio={3 / 4} className='bg-muted'>
          {novel.coverImageUrl ? (
            <img src={novel.coverImageUrl} alt={`Cover of ${displayTitle}`} className='object-cover w-full h-full' />
          ) : (
            <div className='flex items-center justify-center h-full'>
              <BookOpen className='w-16 h-16 text-muted-foreground' />
            </div>
          )}
        </AspectRatio>
      </Link>
      <CardHeader className='p-4 flex-grow'>
        <Link to={`/novels/${novel.slug || novel.id}`}>
          <CardTitle className='text-lg hover:text-primary transition-colors'>
            {truncateText(displayTitle, 60)}
          </CardTitle>
        </Link>
        {novel.author && (
          <p className='text-sm text-muted-foreground'>
            By:{" "}
            <Link to={`/authors/${novel.author.id}`} className='hover:underline'>
              {novel.author.nameRomanized || novel.author.name}
            </Link>
          </p>
        )}
        {novel.averageRating && (
          <div className='flex items-center text-sm text-muted-foreground mt-1'>
            <Star className='w-4 h-4 mr-1 fill-yellow-400 text-yellow-500' />
            {novel.averageRating.toFixed(1)}
          </div>
        )}
      </CardHeader>
      <CardContent className='p-4 pt-0 text-sm text-muted-foreground flex-grow'>
        <p>{truncateText(novel.synopsis, 100)}</p>
      </CardContent>
      <CardFooter className='p-4 pt-0'>
        {novel.publicationStatus && <Badge variant='outline'>{novel.publicationStatus}</Badge>}
        {novel.genreTags && novel.genreTags.length > 0 && (
          <Badge variant='secondary' className='ml-2'>
            {novel.genreTags[0]}
          </Badge>
        )}
      </CardFooter>
    </Card>
  )
}
