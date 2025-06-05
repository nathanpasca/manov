import React, { useState } from "react"
import { useParams, Link as RouterLink } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  adminFetchNovelDetails,
  adminFetchNovelTranslations,
  adminCreateNovelTranslation,
  adminUpdateNovelTranslation,
  adminDeleteNovelTranslation,
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

export function AdminNovelTranslationsPage() {
  const { novelId } = useParams()
  const queryClient = useQueryClient()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTranslation, setEditingTranslation] = useState(null)

  const { data: novelDetails, isLoading: novelLoading } = useQuery({
    queryKey: ["adminNovelDetails", novelId],
    queryFn: () => adminFetchNovelDetails(novelId),
    enabled: !!novelId,
  })

  const {
    data: translations,
    isLoading: translationsLoading,
    refetch,
  } = useQuery({
    queryKey: ["adminNovelTranslations", novelId],
    queryFn: () => adminFetchNovelTranslations(novelId),
    enabled: !!novelId,
  })

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminNovelTranslations", novelId] })
      setIsFormOpen(false)
      setEditingTranslation(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || "An error occurred."),
  }

  const createMutation = useMutation({
    mutationFn: (data) => adminCreateNovelTranslation(novelId, data),
    onSuccess: () => {
      toast.success("Translation created successfully!"), mutationOptions.onSuccess()
    },
    onError: mutationOptions.onError,
  })

  const updateMutation = useMutation({
    mutationFn: (data) => adminUpdateNovelTranslation(novelId, data.languageCode, data),
    onSuccess: () => {
      toast.success("Translation updated successfully!"), mutationOptions.onSuccess()
    },
    onError: mutationOptions.onError,
  })

  const deleteMutation = useMutation({
    mutationFn: (languageCode) => adminDeleteNovelTranslation(novelId, languageCode),
    onSuccess: () => {
      toast.info("Translation deleted."), mutationOptions.onSuccess()
    },
    onError: mutationOptions.onError,
  })

  const handleFormSubmit = (data) => {
    if (editingTranslation) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
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

  if (novelLoading || translationsLoading) return <LoadingSpinner />

  return (
    <div className='space-y-4'>
      <Button variant='outline' size='sm' asChild>
        <RouterLink to='/admin/novels'>
          <ArrowLeftIcon className='mr-2 h-4 w-4' /> Back to Novels
        </RouterLink>
      </Button>

      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold'>Manage Translations</h1>
          {novelDetails && <p className='text-lg text-muted-foreground'>For Novel: {novelDetails.title}</p>}
        </div>
        <Button onClick={handleAddNewClick}>
          <PlusCircleIcon className='mr-2 h-4 w-4' /> Add New Translation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Translations</CardTitle>
          <CardDescription>
            The original content is defined on the main Novel record. Add translations for other languages here.
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
                    <p className='text-sm text-muted-foreground'>{trans.title}</p>
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
              <p className='text-center text-muted-foreground py-4'>
                No translations found. Click "Add New Translation" to start.
              </p>
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
        translationType='novel'
      />
    </div>
  )
}
