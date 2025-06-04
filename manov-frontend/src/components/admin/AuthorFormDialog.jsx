import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { adminAuthorSchema } from "@/lib/validators/adminSchemas"
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { LanguageSelector } from "@/components/LanguageSelector" // Re-use
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export function AuthorFormDialog({ open, onOpenChange, author, onSubmit, isSubmitting }) {
  const isEditing = !!author

  const form = useForm({
    resolver: zodResolver(adminAuthorSchema),
    defaultValues: {
      name: "",
      originalLanguage: "en", // Default or fetch from a list
      nameRomanized: "",
      biography: "",
      birthDate: null,
      deathDate: null,
      nationality: "",
      profileImageUrl: "",
      isActive: true,
    },
  })

  useEffect(() => {
    if (open) {
      if (author) {
        form.reset({
          name: author.name || "",
          originalLanguage: author.originalLanguage || "en",
          nameRomanized: author.nameRomanized || "",
          biography: author.biography || "",
          birthDate: author.birthDate ? new Date(author.birthDate) : null,
          deathDate: author.deathDate ? new Date(author.deathDate) : null,
          nationality: author.nationality || "",
          profileImageUrl: author.profileImageUrl || "",
          isActive: author.isActive !== undefined ? author.isActive : true,
        })
      } else {
        form.reset({
          name: "",
          originalLanguage: "en",
          nameRomanized: "",
          biography: "",
          birthDate: null,
          deathDate: null,
          nationality: "",
          profileImageUrl: "",
          isActive: true,
        })
      }
    }
  }, [author, open, form])

  const handleFormSubmit = (data) => {
    // Convert Date objects to ISO strings if backend expects that,
    // otherwise, JSON.stringify might handle it.
    // Backend validator uses .toDate(), so ISO string is fine.
    const submissionData = {
      ...data,
      birthDate: data.birthDate ? data.birthDate.toISOString().split("T")[0] : null, // YYYY-MM-DD
      deathDate: data.deathDate ? data.deathDate.toISOString().split("T")[0] : null, // YYYY-MM-DD
    }
    onSubmit(submissionData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit Author: ${author?.name}` : "Add New Author"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details for this author." : "Enter the details for the new author."}
          </DialogDescription>
        </DialogHeader>
        <div className='flex-grow overflow-y-auto pr-2 -mr-2 pl-1'>
          {" "}
          {/* Added pl-1 */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className='space-y-4 py-2'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Author's full name" {...field} />
                    </FormControl>
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
              <FormField
                control={form.control}
                name='nameRomanized'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Romanized Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Romanized name (if applicable)' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='biography'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biography</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Author's biography..." className='min-h-[100px]' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='nationality'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g., Chinese, American' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='profileImageUrl'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Image URL</FormLabel>
                    <FormControl>
                      <Input type='url' placeholder='https://example.com/image.jpg' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className='font-normal leading-none'>Is Active</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter className='pt-4 sticky bottom-0 bg-background py-3'>
                <DialogClose asChild>
                  <Button type='button' variant='outline'>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? (isEditing ? "Saving..." : "Adding...") : isEditing ? "Save Changes" : "Add Author"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
