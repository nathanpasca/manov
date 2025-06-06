import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { adminChapterSchema } from "@/lib/validators/adminSchemas"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { RichTextEditor } from "../RichTextEditor" // Ensure this is the correct path

export function ChapterFormDialog({ open, onOpenChange, chapter, onSubmit, isSubmitting }) {
  const isEditing = !!chapter

  const form = useForm({
    resolver: zodResolver(adminChapterSchema),
    defaultValues: {
      chapterNumber: 0.0,
      title: "",
      content: "",
      wordCount: null,
      isPublished: false,
      publishedAt: null,
      translatorNotes: "",
      originalChapterUrl: "",
      readingTimeEstimate: null,
    },
  })

  useEffect(() => {
    if (open) {
      if (chapter) {
        form.reset({
          chapterNumber: chapter.chapterNumber !== undefined ? parseFloat(chapter.chapterNumber) : 0.0,
          title: chapter.title || "",
          content: chapter.content || "",
          wordCount: chapter.wordCount !== null ? Number(chapter.wordCount) : null,
          isPublished: chapter.isPublished !== undefined ? chapter.isPublished : false,
          publishedAt: chapter.publishedAt ? new Date(chapter.publishedAt) : null,
          translatorNotes: chapter.translatorNotes || "",
          originalChapterUrl: chapter.originalChapterUrl || "",
          readingTimeEstimate: chapter.readingTimeEstimate !== null ? Number(chapter.readingTimeEstimate) : null,
        })
      } else {
        form.reset({
          chapterNumber: 0.0,
          title: "",
          content: "",
          wordCount: null,
          isPublished: false,
          publishedAt: null,
          translatorNotes: "",
          originalChapterUrl: "",
          readingTimeEstimate: null,
        })
      }
    }
  }, [chapter, open, form])

  const handleFormSubmit = (data) => {
    const submissionData = {
      ...data,
      chapterNumber: parseFloat(data.chapterNumber),
      wordCount: data.wordCount !== null && data.wordCount !== "" ? parseInt(data.wordCount, 10) : null,
      readingTimeEstimate:
        data.readingTimeEstimate !== null && data.readingTimeEstimate !== ""
          ? parseInt(data.readingTimeEstimate, 10)
          : null,
      publishedAt: data.publishedAt ? data.publishedAt.toISOString() : null,
    }
    onSubmit(submissionData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl h-[90vh] flex flex-col p-0'>
        <DialogHeader className='p-6 pb-4 flex-shrink-0'>
          <DialogTitle>{isEditing ? `Edit Chapter ${chapter?.chapterNumber}` : "Add New Chapter"}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update details for Chapter ${chapter?.chapterNumber}.` : "Enter details for the new chapter."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          {/* The form itself is now the main flex container for the content and footer */}
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className='flex flex-col flex-grow min-h-0'>
            {/* This div will contain all form fields and will scroll if needed */}
            <div className='flex-grow px-6 py-2 space-y-4 overflow-y-auto'>
              <FormField
                control={form.control}
                name='chapterNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Chapter Number <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.1'
                        placeholder='e.g., 1 or 1.5'
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Title (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='Chapter title' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* KEY CHANGE: The FormItem for the editor is now a flex container */}
              <FormField
                control={form.control}
                name='content'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>
                      Content <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      {/* The editor will now use its own height and scroll properties from the CSS */}
                      <RichTextEditor
                        placeholder='Chapter content goes here...'
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='wordCount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Word Count</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='0'
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='readingTimeEstimate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reading Time (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='0'
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='publishedAt'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Published At (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}>
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {field.value ? format(field.value, "PPP HH:mm") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0'>
                        <Calendar mode='single' selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='isPublished'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className='font-normal'>Is Published</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='translatorNotes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Translator Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='Any notes...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='originalChapterUrl'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Chapter URL (Optional)</FormLabel>
                    <FormControl>
                      <Input type='url' placeholder='https://...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className='p-6 pt-4 border-t flex-shrink-0'>
              <DialogClose asChild>
                <Button type='button' variant='outline'>
                  Cancel
                </Button>
              </DialogClose>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (isEditing ? "Saving..." : "Adding...") : isEditing ? "Save Changes" : "Add Chapter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
