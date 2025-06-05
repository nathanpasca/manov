import React, { useState } from "react"
import { useParams, Link as RouterLink } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  adminFetchChapterDetails,
  adminFetchChapterTranslations,
  adminCreateChapterTranslation,
  adminUpdateChapterTranslation,
  adminDeleteChapterTranslation,
} from "@/services/adminService"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TranslationFormDialog } from "@/components/admin/TranslationFormDialog"
import { PlusCircleIcon, ArrowLeftIcon } from "lucide-react"

export function AdminChapterTranslationsPage() {
  const { chapterId } = useParams()
  const queryClient = useQueryClient()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTranslation, setEditingTranslation] = useState(null)

  const { data: chapterDetails, isLoading: chapterLoading } = useQuery({
    queryKey: ["adminChapterDetails", chapterId],
    queryFn: () => adminFetchChapterDetails(chapterId),
    enabled: !!chapterId,
  })

  const { data: translations, isLoading: translationsLoading } = useQuery({
    queryKey: ["adminChapterTranslations", chapterId],
    queryFn: () => adminFetchChapterTranslations(chapterId),
    enabled: !!chapterId,
  })

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChapterTranslations", chapterId] })
      setIsFormOpen(false)
      setEditingTranslation(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || "An error occurred."),
  }

  const createMutation = useMutation({
    mutationFn: (data) => adminCreateChapterTranslation(chapterId, data),
    onSuccess: () => {
      toast.success("Translation created successfully!"), mutationOptions.onSuccess()
    },
    onError: mutationOptions.onError,
  })

  const updateMutation = useMutation({
    mutationFn: (data) => adminUpdateChapterTranslation(chapterId, data.languageCode, data),
    onSuccess: () => {
      toast.success("Translation updated successfully!"), mutationOptions.onSuccess()
    },
    onError: mutationOptions.onError,
  })

  const deleteMutation = useMutation({
    mutationFn: (languageCode) => adminDeleteChapterTranslation(chapterId, languageCode),
    onSuccess: () => {
      toast.info("Translation deleted."), mutationOptions.onSuccess()
    },
    onError: mutationOptions.onError,
  })

  const handleFormSubmit = (data) => {
    // Ensure the correct field ('content' or 'synopsis') is passed.
    const payload = {
      languageCode: data.languageCode,
      title: data.title,
      content: data.content,
    }

    if (editingTranslation) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEditClick = (translation) => {
    setEditingTranslation(translation)
    setIsFormOpen(true)
  }

  const handleAddNewClick = () => {
    setEditingTranslation(null)
    setIsFormOpen(true)
  }

  if (chapterLoading || translationsLoading) return <LoadingSpinner />

  return (
    <div className='space-y-4'>
      <Button variant='outline' size='sm' asChild>
        {chapterDetails && (
          <RouterLink to={`/admin/novels/${chapterDetails.novelId}/chapters`}>
            <ArrowLeftIcon className='mr-2 h-4 w-4' /> Back to Chapter List
          </RouterLink>
        )}
      </Button>

      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold'>Manage Chapter Translations</h1>
          {chapterDetails && (
            <p className='text-lg text-muted-foreground'>
              For: Chapter {chapterDetails.chapterNumber} (ID: {chapterDetails.id})
            </p>
          )}
        </div>
        <Button onClick={handleAddNewClick}>
          <PlusCircleIcon className='mr-2 h-4 w-4' /> Add New Translation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Translations</CardTitle>
          <CardDescription>
            The original content is defined on the main Chapter record. Add translations for other languages here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {translations?.length > 0 ? (
              translations.map((trans) => (
                <div key={trans.id} className='flex items-center justify-between p-3 border rounded-md'>
                  <div>
                    <p className='font-semibold'>
                      {trans.language.name} ({trans.languageCode.toUpperCase()})
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {trans.title || `Chapter ${chapterDetails.chapterNumber}`}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm' onClick={() => handleEditClick(trans)}>
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant='destructive' size='sm'>
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the {trans.language.name} translation. This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(trans.languageCode)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-center text-muted-foreground py-4'>No translations found for this chapter.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <TranslationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isLoading || updateMutation.isLoading}
        existingTranslation={editingTranslation}
        translationType='chapter'
      />
    </div>
  )
}
