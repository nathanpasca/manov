import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { LanguageSelector } from "@/components/LanguageSelector"
import { ScrollArea } from "@/components/ui/scroll-area"

// Define Zod schemas for validation
const translationSchema = z.object({
  languageCode: z.string().min(1, "Language is required."),
  title: z.string().min(1, "Title is required.").max(255),
  synopsis: z.string().optional(), // For Novels
  content: z.string().optional(), // For Chapters
  // translatorId could be added here if needed
})

export function TranslationFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  existingTranslation,
  translationType = "novel", // 'novel' or 'chapter'
}) {
  const isEditing = !!existingTranslation

  const form = useForm({
    resolver: zodResolver(translationSchema),
    defaultValues: {
      languageCode: "",
      title: "",
      synopsis: "",
      content: "",
    },
  })

  useEffect(() => {
    if (open) {
      if (existingTranslation) {
        form.reset({
          languageCode: existingTranslation.languageCode || "",
          title: existingTranslation.title || "",
          synopsis: translationType === "novel" ? existingTranslation.synopsis || "" : "",
          content: translationType === "chapter" ? existingTranslation.content || "" : "",
        })
      } else {
        form.reset({
          languageCode: "",
          title: "",
          synopsis: "",
          content: "",
        })
      }
    }
  }, [existingTranslation, open, form, translationType])

  const description =
    translationType === "novel"
      ? "Manage the translated title and synopsis for this novel in a specific language."
      : "Manage the translated title and content for this chapter in a specific language."

  const mainContentLabel = translationType === "novel" ? "Synopsis" : "Content"
  const mainContentField = translationType === "novel" ? "synopsis" : "content"
  const mainContentPlaceholder =
    translationType === "novel" ? "Enter the translated synopsis..." : "Enter the translated chapter content..."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit ${existingTranslation.languageCode.toUpperCase()} Translation` : "Add New Translation"}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className='flex-grow pr-6 -mr-6'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 py-2 pl-1'>
              <FormField
                control={form.control}
                name='languageCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Language <span className='text-destructive'>*</span>
                    </FormLabel>
                    <LanguageSelector
                      selectedLang={field.value}
                      onLangChange={field.onChange}
                      placeholder='Select a language'
                      disabled={isEditing} // Can't change language when editing
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Title <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder='Translated title' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={mainContentField}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {mainContentLabel} {translationType === "chapter" && <span className='text-destructive'>*</span>}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={mainContentPlaceholder}
                        className='min-h-[150px] max-h-[300px] font-mono text-sm resize-y'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className='pt-4 sticky bottom-0 bg-background py-3 border-t'>
                <DialogClose asChild>
                  <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Translation"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
