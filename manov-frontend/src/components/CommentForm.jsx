import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { commentSchema } from "@/lib/validators/interactionSchemas"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserCircle } from "lucide-react"

export function CommentForm({
  onSubmit,
  placeholder = "Write a comment...",
  submitText = "Post Comment",
  initialContent = "",
  onCancel,
  isSubmitting,
}) {
  const { user } = useAuth()

  const form = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: initialContent,
    },
  })

  React.useEffect(() => {
    // To reset form if initialContent changes (e.g. for editing)
    form.reset({ content: initialContent })
  }, [initialContent, form])

  const handleFormSubmit = (data) => {
    onSubmit(data, () => form.reset({ content: "" })) // Pass form reset callback
  }

  if (!user) {
    return (
      <p className='text-sm text-muted-foreground'>
        Please{" "}
        <Link to='/login' className='underline'>
          login
        </Link>{" "}
        to comment.
      </p>
    )
  }

  return (
    <div className='flex items-start space-x-3 py-4'>
      <Avatar className='mt-1'>
        <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.username} />
        <AvatarFallback>
          {user.displayName ? user.displayName.substring(0, 1).toUpperCase() : <UserCircle size={20} />}
        </AvatarFallback>
      </Avatar>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className='flex-grow space-y-3'>
          <FormField
            control={form.control}
            name='content'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea placeholder={placeholder} className='resize-none min-h-[80px]' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex justify-end space-x-2'>
            {onCancel && (
              <Button type='button' variant='ghost' onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : submitText}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
