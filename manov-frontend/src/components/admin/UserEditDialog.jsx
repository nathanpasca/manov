import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { adminUserUpdateSchema } from "@/lib/validators/adminSchemas"
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
import { LanguageSelector } from "@/components/LanguageSelector" // Assuming you want to use this

export function UserEditDialog({ open, onOpenChange, user, onSubmit, isSubmitting }) {
  const form = useForm({
    resolver: zodResolver(adminUserUpdateSchema),
    defaultValues: {
      displayName: "",
      email: "",
      isActive: true,
      isAdmin: false,
      preferredLanguage: "en",
      avatarUrl: "",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
        email: user.email || "",
        isActive: user.isActive !== undefined ? user.isActive : true,
        isAdmin: user.isAdmin !== undefined ? user.isAdmin : false,
        preferredLanguage: user.preferredLanguage || "en",
        avatarUrl: user.avatarUrl || "",
      })
    }
  }, [user, form, open]) // Reset form when dialog opens or user data changes

  const handleFormSubmit = (data) => {
    // Filter out fields that were not changed or are empty optional strings
    // to prevent sending them if not intended.
    // The backend validator `validateAdminUserUpdate` expects at least one field.
    const changedData = {}
    if (data.displayName !== (user?.displayName || "")) changedData.displayName = data.displayName
    if (data.email !== (user?.email || "")) changedData.email = data.email
    if (data.isActive !== user?.isActive) changedData.isActive = data.isActive
    if (data.isAdmin !== user?.isAdmin) changedData.isAdmin = data.isAdmin
    if (data.preferredLanguage !== (user?.preferredLanguage || "en"))
      changedData.preferredLanguage = data.preferredLanguage
    if (data.avatarUrl !== (user?.avatarUrl || "")) changedData.avatarUrl = data.avatarUrl

    // Ensure empty optional strings are sent as empty strings if that's intended,
    // or convert to undefined/null if backend expects that for clearing.
    // For now, sending as is if changed.
    if (data.displayName === "" && user?.displayName) changedData.displayName = ""
    if (data.email === "" && user?.email) changedData.email = ""
    if (data.preferredLanguage === "" && user?.preferredLanguage) changedData.preferredLanguage = ""
    if (data.avatarUrl === "" && user?.avatarUrl) changedData.avatarUrl = ""

    if (Object.keys(changedData).length === 0) {
      form.setError("_form", { type: "manual", message: "No changes detected." })
      return
    }
    onSubmit(changedData)
  }

  if (!user) return null // Or some placeholder if needed while user data might be loading async (not current design)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>Edit User: {user.username}</DialogTitle>
          <DialogDescription>Modify the details for this user. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className='space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2'>
            <FormField
              control={form.control}
              name='displayName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="User's display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type='email' placeholder='user@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='avatarUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL (Optional)</FormLabel>
                  <FormControl>
                    <Input type='url' placeholder='https://example.com/avatar.png' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='preferredLanguage'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Language</FormLabel>
                  <LanguageSelector
                    selectedLang={field.value}
                    onLangChange={field.onChange}
                    placeholder='Select language'
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isAdmin'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className='font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                      Is Admin
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {form.formState.errors._form && (
              <p className='text-sm font-medium text-destructive'>{form.formState.errors._form.message}</p>
            )}
            <DialogFooter className='pt-4'>
              <DialogClose asChild>
                <Button type='button' variant='outline'>
                  Cancel
                </Button>
              </DialogClose>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
