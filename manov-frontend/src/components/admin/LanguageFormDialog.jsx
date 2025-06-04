import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { adminLanguageSchema } from "@/lib/validators/adminSchemas"
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

export function LanguageFormDialog({ open, onOpenChange, language, onSubmit, isSubmitting }) {
  const isEditing = !!language

  const form = useForm({
    resolver: zodResolver(adminLanguageSchema),
    defaultValues: {
      code: "",
      name: "",
      nativeName: "",
      isActive: true,
    },
  })

  useEffect(() => {
    if (language && open) {
      form.reset({
        code: language.code || "",
        name: language.name || "",
        nativeName: language.nativeName || "",
        isActive: language.isActive !== undefined ? language.isActive : true,
      })
    } else if (!language && open) {
      form.reset({ code: "", name: "", nativeName: "", isActive: true })
    }
  }, [language, open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Language" : "Add New Language"}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for ${language.name}.` : "Enter the details for the new language."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 py-2'>
            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Language Code <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., en, pt-BR' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., English, Portuguese (Brazil)' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='nativeName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Native Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., English, Português (Brasil)' {...field} />
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
                  <FormLabel className='font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Is Active
                  </FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter className='pt-4'>
              <DialogClose asChild>
                <Button type='button' variant='outline'>
                  Cancel
                </Button>
              </DialogClose>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (isEditing ? "Saving..." : "Adding...") : isEditing ? "Save Changes" : "Add Language"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
