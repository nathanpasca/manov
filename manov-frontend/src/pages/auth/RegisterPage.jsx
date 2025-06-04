import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema } from "@/lib/validators/userSchemas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Added
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"

export function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      displayName: "",
      preferredLanguage: "en", // Default to 'en'
    },
  })

  const onSubmit = async (data) => {
    try {
      // Ensure optional fields that are empty strings are submitted as undefined or null if backend expects that
      const submissionData = {
        ...data,
        displayName: data.displayName || undefined,
        preferredLanguage: data.preferredLanguage || undefined,
      }
      await registerUser(submissionData)
      navigate("/profile/me") // Navigate to profile or home after successful registration
    } catch (error) {
      // Error toast is handled by AuthContext
      console.error("Registration submission error:", error)
    }
  }

  return (
    <div className='flex justify-center items-center min-h-[calc(100vh-10rem)] py-12'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-2xl'>Create an Account</CardTitle>
          <CardDescription>Enter your details below to register.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder='yourusername' {...field} />
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
                      <Input type='email' placeholder='m@example.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type='password' placeholder='••••••••' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='displayName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='Your Name' {...field} />
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
                    <FormLabel>Preferred Language (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a language' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='en'>English</SelectItem>
                        <SelectItem value='es'>Español</SelectItem>
                        <SelectItem value='fr'>Français</SelectItem>
                        <SelectItem value='id'>Bahasa Indonesia</SelectItem>
                        {/* Add more languages as needed */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type='submit' className='w-full' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Registering..." : "Create Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className='text-center text-sm'>
          Already have an account?{" "}
          <Link to='/login' className='underline ml-1'>
            Login here
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
