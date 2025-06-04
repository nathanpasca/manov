import React, { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  adminFetchLanguages,
  adminCreateLanguage,
  adminUpdateLanguage,
  adminDeleteLanguage,
} from "@/services/adminService"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LanguageFormDialog } from "@/components/admin/LanguageFormDialog"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel, // For client-side filtering
  useReactTable,
} from "@tanstack/react-table"
import { PlusCircleIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

export function AdminLanguagesPage() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLanguage, setEditingLanguage] = useState(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [languageToDelete, setLanguageToDelete] = useState(null)
  const [globalFilter, setGlobalFilter] = useState("") // For client-side search

  const {
    data: languages = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["adminLanguages"],
    queryFn: adminFetchLanguages, // Fetches all languages; backend returns an array
  })

  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "ID", size: 50 },
      { accessorKey: "code", header: "Code", size: 100 },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "nativeName", header: "Native Name" },
      {
        accessorKey: "isActive",
        header: "Active",
        cell: ({ row }) => <Checkbox checked={row.original.isActive} disabled className='ml-3' />,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <DotsHorizontalIcon className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(row.original)}>Edit Language</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-destructive focus:bg-destructive/20 focus:text-destructive-foreground'
                onClick={() => confirmDelete(row.original)}>
                Delete Language
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: languages,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // Client-side filtering
    getPaginationRowModel: getPaginationRowModel(), // Client-side pagination
  })

  const createMutation = useMutation({
    mutationFn: adminCreateLanguage,
    onSuccess: () => {
      toast.success("Language added successfully!")
      queryClient.invalidateQueries({ queryKey: ["adminLanguages"] })
      setIsFormOpen(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add language."),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminUpdateLanguage(id, data),
    onSuccess: () => {
      toast.success("Language updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["adminLanguages"] })
      setIsFormOpen(false)
      setEditingLanguage(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update language."),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteLanguage(id),
    onSuccess: () => {
      toast.info("Language deleted.")
      queryClient.invalidateQueries({ queryKey: ["adminLanguages"] })
      setIsDeleteAlertOpen(false)
      setLanguageToDelete(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete language. It might be in use."),
  })

  const handleEdit = (lang) => {
    setEditingLanguage(lang)
    setIsFormOpen(true)
  }

  const confirmDelete = (lang) => {
    setLanguageToDelete(lang)
    setIsDeleteAlertOpen(true)
  }

  const handleFormSubmit = (data) => {
    if (editingLanguage) {
      updateMutation.mutate({ id: editingLanguage.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage error={error} message='Failed to load languages.' />

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold'>Language Management</h1>
        <Button
          onClick={() => {
            setEditingLanguage(null)
            setIsFormOpen(true)
          }}>
          <PlusCircleIcon className='mr-2 h-4 w-4' /> Add Language
        </Button>
      </div>

      {/* Client-side search input */}
      <div className='py-2'>
        <Input
          placeholder='Search languages (name, code...)'
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className='max-w-sm'
        />
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.column.getSize() !== 150 ? header.column.getSize() : undefined }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No languages found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Client-side Pagination */}
      {table.getPageCount() > 1 && (
        <div className='flex items-center justify-between space-x-2 py-4'>
          <span className='text-sm text-muted-foreground'>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className='space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button variant='outline' size='sm' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      )}

      <LanguageFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        language={editingLanguage}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isLoading || updateMutation.isLoading}
      />

      {languageToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Language</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete the language "{languageToDelete.name} ({languageToDelete.code})"? This
              action cannot be undone and might fail if the language is in use.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setLanguageToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(languageToDelete.id)}
                className='bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                disabled={deleteMutation.isLoading}>
                {deleteMutation.isLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
