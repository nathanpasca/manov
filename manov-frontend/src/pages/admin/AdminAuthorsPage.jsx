import React, { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  adminFetchAuthors,
  adminCreateAuthor,
  adminUpdateAuthor,
  adminDeleteAuthor,
  adminFetchAuthorDetails,
} from "@/services/adminService"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" // For filtering
import { Checkbox } from "@/components/ui/checkbox"
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
import { AuthorFormDialog } from "@/components/admin/AuthorFormDialog"
import { CaretSortIcon, DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useSearchParams } from "react-router-dom"
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { PlusCircleIcon } from "lucide-react"
import { Label } from "@/components/ui/label"

const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

export function AdminAuthorsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState(null) // Author object for editing
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [authorToDelete, setAuthorToDelete] = useState(null)

  const [{ pageIndex, pageSize }, setPagination] = useState(() => ({
    pageIndex: parseInt(searchParams.get("page") || (DEFAULT_PAGE_INDEX + 1).toString()) - 1,
    pageSize: parseInt(searchParams.get("limit") || DEFAULT_PAGE_SIZE.toString()),
  }))
  const [sorting, setSorting] = useState(() => {
    const sortBy = searchParams.get("sortBy")
    const sortOrder = searchParams.get("sortOrder")
    return sortBy && sortOrder ? [{ id: sortBy, desc: sortOrder === "desc" }] : []
  })
  const [filters, setFilters] = useState({
    // Add any server-side supported filters here
    name: searchParams.get("name") || "",
    isActive:
      searchParams.get("isActive") === "true" ? true : searchParams.get("isActive") === "false" ? false : undefined,
  })
  const [debouncedNameFilter, setDebouncedNameFilter] = useState(filters.name)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedNameFilter(filters.name), 500)
    return () => clearTimeout(handler)
  }, [filters.name])

  const queryParams = useMemo(() => {
    const params = { page: pageIndex + 1, limit: pageSize }
    if (sorting.length > 0) {
      params.sortBy = sorting[0].id
      params.sortOrder = sorting[0].desc ? "desc" : "asc"
    }
    if (debouncedNameFilter) params.name = debouncedNameFilter // Assuming backend supports name filter
    if (filters.isActive !== undefined) params.isActive = filters.isActive
    return params
  }, [pageIndex, pageSize, sorting, debouncedNameFilter, filters.isActive])

  const {
    data: authorsResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["adminAuthors", queryParams],
    queryFn: () => adminFetchAuthors(queryParams),
    keepPreviousData: true,
  })

  useEffect(() => {
    const newSearchParams = new URLSearchParams()
    newSearchParams.set("page", (pageIndex + 1).toString())
    newSearchParams.set("limit", pageSize.toString())
    if (sorting.length > 0) {
      newSearchParams.set("sortBy", sorting[0].id)
      newSearchParams.set("sortOrder", sorting[0].desc ? "desc" : "asc")
    }
    if (filters.name) newSearchParams.set("name", filters.name)
    if (filters.isActive !== undefined) newSearchParams.set("isActive", filters.isActive.toString())
    setSearchParams(newSearchParams, { replace: true })
  }, [pageIndex, pageSize, sorting, filters, setSearchParams])

  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "ID", size: 50 },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Name <CaretSortIcon className='ml-2 h-4 w-4' />
          </Button>
        ),
      },
      { accessorKey: "originalLanguage", header: "Orig. Lang", size: 100 },
      {
        accessorKey: "isActive",
        header: "Active",
        cell: ({ row }) => <Checkbox checked={row.original.isActive} disabled className='ml-3' />,
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
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
              <DropdownMenuItem onClick={() => handleEdit(row.original)}>Edit Author</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-destructive focus:bg-destructive/20 focus:text-destructive-foreground'
                onClick={() => confirmDelete(row.original)}>
                Delete Author
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: authorsResponse?.results ?? [],
    columns,
    pageCount: authorsResponse?.totalPages ?? -1,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true, // As filters are passed to backend
  })

  const createMutation = useMutation({
    mutationFn: adminCreateAuthor,
    onSuccess: () => {
      toast.success("Author added successfully!")
      queryClient.invalidateQueries({ queryKey: ["adminAuthors"] })
      setIsFormOpen(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add author."),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminUpdateAuthor(id, data),
    onSuccess: () => {
      toast.success("Author updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["adminAuthors"] })
      queryClient.invalidateQueries({ queryKey: ["author", editingAuthor?.id] })
      setIsFormOpen(false)
      setEditingAuthor(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update author."),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteAuthor(id),
    onSuccess: () => {
      toast.info("Author deleted.")
      queryClient.invalidateQueries({ queryKey: ["adminAuthors"] })
      setIsDeleteAlertOpen(false)
      setAuthorToDelete(null)
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete author. They might have associated novels."),
  })

  const handleEdit = async (authorRow) => {
    // Fetch full details for editing if needed, or use row data if sufficient
    // For simplicity, we'll use row data, but fetching is more robust for complex objects
    // const detailedAuthor = await adminFetchAuthorDetails(authorRow.id);
    setEditingAuthor(authorRow) // Or detailedAuthor
    setIsFormOpen(true)
  }
  const confirmDelete = (author) => {
    setAuthorToDelete(author)
    setIsDeleteAlertOpen(true)
  }
  const handleFormSubmit = (data) => {
    if (editingAuthor) {
      updateMutation.mutate({ id: editingAuthor.id, data })
    } else {
      createMutation.mutate(data)
    }
  }
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }))
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold'>Author Management</h1>
        <Button
          onClick={() => {
            setEditingAuthor(null)
            setIsFormOpen(true)
          }}>
          <PlusCircleIcon className='mr-2 h-4 w-4' /> Add Author
        </Button>
      </div>

      {/* Filters */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-card'>
        <Input
          placeholder='Filter by Name...'
          value={filters.name}
          onChange={(e) => handleFilterChange("name", e.target.value)}
        />
        <div className='flex items-center space-x-2'>
          <Label htmlFor='filter-active-select-author'>Status:</Label>
          <Select
            value={filters.isActive === undefined ? "all" : filters.isActive ? "active" : "inactive"}
            onValueChange={(value) => {
              let isActiveValue
              if (value === "active") isActiveValue = true
              else if (value === "inactive") isActiveValue = false
              else isActiveValue = undefined // 'all'
              handleFilterChange("isActive", isActiveValue)
            }}>
            <SelectTrigger id='filter-active-select-author' className='w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && !authorsResponse && <LoadingSpinner />}
      {isError && <ErrorMessage error={error} message='Failed to load authors.' />}
      {isFetching && <p className='text-sm text-muted-foreground text-center py-2'>Fetching updated data...</p>}

      {!isLoading && !isError && (
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead
                      key={h.id}
                      style={{ width: h.column.getSize() !== 150 ? h.column.getSize() : undefined }}>
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    No authors found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {table.getPageCount() > 0 && (
        <div className='flex items-center justify-between space-x-2 py-4'>
          <span className='text-sm text-muted-foreground'>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} (Total:{" "}
            {authorsResponse?.totalCount ?? 0} authors)
          </span>
          <div className='space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}>
              First
            </Button>
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
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}>
              Last
            </Button>
          </div>
        </div>
      )}

      <AuthorFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        author={editingAuthor}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isLoading || updateMutation.isLoading}
      />
      {authorToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Author</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete author "{authorToDelete.name}"? This may fail if the author has associated
              novels.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAuthorToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(authorToDelete.id)}
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
