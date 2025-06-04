import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { adminNovelSchema } from "@/lib/validators/adminSchemas"
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LanguageSelector } from "@/components/LanguageSelector"
import { useQuery } from "@tanstack/react-query"
import { adminFetchAuthors } from "@/services/adminService" // To fetch authors for select
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../ui/calendar"

const PUBLICATION_STATUSES = ["ONGOING", "COMPLETED", "HIATUS", "DROPPED"]
const TRANSLATION_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED", "DROPPED"]

export function NovelFormDialog({ open, onOpenChange, novel, onSubmit, isSubmitting }) {
  const isEditing = !!novel

  const { data: authorsData, isLoading: authorsLoading } = useQuery({
    queryKey: ["adminAuthorsForSelect"],
    queryFn: () => adminFetchAuthors({ limit: 1000 }), // Fetch a large list for select
    select: (data) => data?.results || [],
  })

  const form = useForm({
    resolver: zodResolver(adminNovelSchema),
    defaultValues: {
      title: "",
      authorId: "",
      originalLanguage: "en",
      titleTranslated: "",
      synopsis: "",
      coverImageUrl: "",
      sourceUrl: "",
      publicationStatus: "ONGOING",
      translationStatus: "ACTIVE",
      genreTags: [],
      totalChapters: null,
      firstPublishedAt: null,
      isActive: true,
    },
  })

  useEffect(() => {
    if (open) {
      if (novel) {
        form.reset({
          title: novel.title || "",
          authorId: novel.authorId?.toString() || "", // Ensure string for Select value
          originalLanguage: novel.originalLanguage || "en",
          titleTranslated: novel.titleTranslated || "",
          synopsis: novel.synopsis || "",
          coverImageUrl: novel.coverImageUrl || "",
          sourceUrl: novel.sourceUrl || "",
          publicationStatus: novel.publicationStatus || "ONGOING",
          translationStatus: novel.translationStatus || "ACTIVE",
          genreTags: Array.isArray(novel.genreTags) ? novel.genreTags : [],
          totalChapters: novel.totalChapters !== null ? Number(novel.totalChapters) : null,
          firstPublishedAt: novel.firstPublishedAt ? new Date(novel.firstPublishedAt) : null,
          isActive: novel.isActive !== undefined ? novel.isActive : true,
        })
      } else {
        form.reset({
          title: "",
          authorId: "",
          originalLanguage: "en",
          titleTranslated: "",
          synopsis: "",
          coverImageUrl: "",
          sourceUrl: "",
          publicationStatus: "ONGOING",
          translationStatus: "ACTIVE",
          genreTags: [],
          totalChapters: null,
          firstPublishedAt: null,
          isActive: true,
        })
      }
    }
  }, [novel, open, form])

  const handleFormSubmit = (data) => {
    const submissionData = {
      ...data,
      authorId: parseInt(data.authorId, 10), // Ensure authorId is number
      totalChapters: data.totalChapters !== null && data.totalChapters !== "" ? parseInt(data.totalChapters, 10) : null,
      firstPublishedAt: data.firstPublishedAt ? data.firstPublishedAt.toISOString().split("T")[0] : null,
      genreTags:
        typeof data.genreTags === "string"
          ? data.genreTags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : data.genreTags,
    }
    onSubmit(submissionData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit Novel: ${novel?.title || ""}` : "Add New Novel"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className='flex-grow pr-6 -mr-6'>
          {" "}
          {/* Make form content scrollable */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className='space-y-4 py-2 pl-1'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Original Title <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Novel's original title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='authorId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Author <span className='text-destructive'>*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={authorsLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select an author' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {authorsData?.map((author) => (
                            <SelectItem key={author.id} value={author.id.toString()}>
                              {author.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='originalLanguage'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Original Language <span className='text-destructive'>*</span>
                      </FormLabel>
                      <LanguageSelector
                        selectedLang={field.value}
                        onLangChange={field.onChange}
                        placeholder='Select language'
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='titleTranslated'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Translated Title (e.g., English)</FormLabel>
                    <FormControl>
                      <Input placeholder='Translated title' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='synopsis'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Synopsis (e.g., English)</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Novel synopsis...' className='min-h-[120px]' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='coverImageUrl'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL</FormLabel>
                      <FormControl>
                        <Input type='url' placeholder='https://...' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='sourceUrl'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Source URL</FormLabel>
                      <FormControl>
                        <Input type='url' placeholder='https://...' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='publicationStatus'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publication Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PUBLICATION_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='translationStatus'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Translation Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TRANSLATION_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='genreTags'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Fantasy, Action, Romance'
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.split(",").map((t) => t.trim()))}
                        value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='totalChapters'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Chapters (Estimate)</FormLabel>
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
                  name='firstPublishedAt'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>First Published At</FormLabel>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <FormField
                          control={form.control}
                          name='birthDate'
                          render={({ field }) => (
                            <FormItem className='flex flex-col'>
                              <FormLabel>Birth Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}>
                                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                      <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className='w-auto p-0' align='start'>
                                  <Calendar
                                    mode='single'
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date() || date < new Date("1000-01-01")}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='deathDate'
                          render={({ field }) => (
                            <FormItem className='flex flex-col'>
                              <FormLabel>Death Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}>
                                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                      <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className='w-auto p-0' align='start'>
                                  <Calendar
                                    mode='single'
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date()} // Can't die in the future
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className='font-normal'>Is Active (Visible to users)</FormLabel>
                  </FormItem>
                )}
              />
              {/* TODO: Add section for NovelTranslations if backend endpoints become available */}
              <DialogFooter className='pt-4 sticky bottom-0 bg-background py-3 border-t'>
                <DialogClose asChild>
                  <Button type='button' variant='outline'>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type='submit' disabled={isSubmitting || authorsLoading}>
                  {isSubmitting ? (isEditing ? "Saving..." : "Adding...") : isEditing ? "Save Changes" : "Add Novel"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
