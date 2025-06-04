import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"

export function AuthorCard({ author }) {
  const displayName = author.nameRomanized || author.name
  return (
    <Card className='hover:shadow-lg transition-shadow duration-200'>
      <Link to={`/authors/${author.id}`}>
        <CardHeader className='flex flex-row items-center space-x-4 p-4'>
          <Avatar className='h-16 w-16'>
            <AvatarImage src={author.profileImageUrl || undefined} alt={displayName} />
            <AvatarFallback>{displayName ? displayName.substring(0, 2).toUpperCase() : <User />}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className='text-lg hover:text-primary transition-colors'>{displayName}</CardTitle>
            <p className='text-sm text-muted-foreground'>Novels: {author._count?.novels || "N/A"}</p>{" "}
            {/* Assuming _count might be added later */}
          </div>
        </CardHeader>
        <CardContent className='p-4 pt-0'>
          {author.biography && <p className='text-sm text-muted-foreground line-clamp-3'>{author.biography}</p>}
        </CardContent>
      </Link>
    </Card>
  )
}
