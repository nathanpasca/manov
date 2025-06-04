import React, { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { profileUpdateSchema } from "@/lib/validators/userSchemas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

export function ProfilePage() {
  const { user, updateUserProfileData, isLoading: authLoading } = useAuth()

  const form = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: "",
      avatarUrl: "",
      preferredLanguage: "",
      readingPreferences: "",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
        avatarUrl: user.avatarUrl || "",
        preferredLanguage: user.preferredLanguage || "en",
        readingPreferences:
          typeof user.readingPreferences === "object"
            ? JSON.stringify(user.readingPreferences, null, 2)
            : user.readingPreferences || "",
      })
    }
  }, [user, form])

  const onSubmit = async (data) => {
    // Filter out unchanged fields to prevent sending empty strings for optional fields
    // if they were not changed from their initial empty state.
    const changedData = {}
    if (data.displayName !== (user?.displayName || "")) changedData.displayName = data.displayName
    if (data.avatarUrl !== (user?.avatarUrl || "")) changedData.avatarUrl = data.avatarUrl
    if (data.preferredLanguage !== (user?.preferredLanguage || ""))
      changedData.preferredLanguage = data.preferredLanguage

    const currentReadingPrefs =
      typeof user?.readingPreferences === "object"
        ? JSON.stringify(user.readingPreferences, null, 2)
        : user?.readingPreferences || ""
    if (data.readingPreferences !== currentReadingPrefs) {
      changedData.readingPreferences = data.readingPreferences
    }

    if (Object.keys(changedData).length === 0) {
      toast.info("No changes detected to update.")
      return
    }

    // Ensure readingPreferences is valid JSON if provided, or send as undefined
    if (changedData.readingPreferences) {
      try {
        JSON.parse(changedData.readingPreferences)
      } catch (e) {
        form.setError("readingPreferences", { type: "manual", message: "Invalid JSON format." })
        return
      }
    } else if (changedData.hasOwnProperty("readingPreferences") && changedData.readingPreferences === "") {
      // If user explicitly clears the field, send it as such if backend handles empty string as nullify/clear
      // Or convert to null: changedData.readingPreferences = null;
      // For this example, we send an empty string if it was cleared.
    }

    try {
      await updateUserProfileData(changedData)
    } catch (error) {
      // Error toast is handled by AuthContext
      console.error("Profile update submission error:", error)
    }
  }

  if (authLoading && !user) {
    return <div className='text-center py-10'>Loading profile...</div>
  }

  if (!user) {
    return <div className='text-center py-10'>User not found. Please login.</div>
  }

  return (
    <div className='max-w-2xl mx-auto py-10'>
      <Card>
        <CardHeader>
          <div className='flex items-center space-x-4 mb-4'>
            <Avatar className='h-20 w-20'>
              <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.username} />
              <AvatarFallback>{(user.displayName || user.username).substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className='text-2xl'>{user.displayName || user.username}</CardTitle>
              <CardDescription>
                @{user.username} &bull; {user.email}
              </CardDescription>
              <CardDescription>Joined: {new Date(user.createdAt).toLocaleDateString()}</CardDescription>
            </div>
          </div>
          <h2 className='text-xl font-semibold mt-6'>Update Your Profile</h2>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='displayName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Your display name' {...field} />
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
                    <FormLabel>Avatar URL</FormLabel>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select your language' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='en'>English</SelectItem>
                        <SelectItem value='es'>Español</SelectItem>
                        <SelectItem value='fr'>Français</SelectItem>
                        <SelectItem value='id'>Bahasa Indonesia</SelectItem>
                        {/* Add more as needed */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='readingPreferences'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reading Preferences (JSON format)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='e.g., { "genres": ["fantasy", "sci-fi"], "showSpoilers": false }'
                        className='min-h-[100px]'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type='submit' disabled={form.formState.isSubmitting || authLoading}>
                {form.formState.isSubmitting || authLoading ? "Updating..." : "Update Profile"}
              </Button>
              {form.formState.errors._error && (
                <p className='text-sm font-medium text-destructive'>{form.formState.errors._error.message}</p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
