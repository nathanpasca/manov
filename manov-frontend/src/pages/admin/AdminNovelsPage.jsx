import React, { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetchNovelsList, adminCreateNovel, adminUpdateNovel, adminDeleteNovel } from "@/services/adminService"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { NovelFormDialog } from "@/components/admin/NovelFormDialog"
import { CaretSortIcon, DotsHorizontalIcon } from "@radix-ui/react-icons" // Or use Lucide icons
import { toast } from "sonner"
import { useSearchParams, Link as RouterLink } from "react-router-dom" // Renamed Link
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { BookCopy, PlusCircleIcon } from "lucide-react"

const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

export function AdminNovelsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNovel, setEditingNovel] = useState(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [novelToDelete, setNovelToDelete] = useState(null)

  const [{ pageIndex, pageSize }, setPagination] = useState(() => ({
    pageIndex: parseInt(searchParams.get("page") || (DEFAULT_PAGE_INDEX + 1).toString()) - 1,
    pageSize: parseInt(searchParams.get("limit") || DEFAULT_PAGE_SIZE.toString()),
  }))
  const [sorting, setSorting] = useState(() => {
    const sortBy = searchParams.get("sortBy")
    const sortOrder = searchParams.get("sortOrder")
    return sortBy && sortOrder ? [{ id: sortBy, desc: sortOrder === "desc" }] : []
  })
  const [filters, setFilters] = useState({ title: searchParams.get("title") || "" }) // Add more server-side filters here
  const [debouncedTitleFilter, setDebouncedTitleFilter] = useState(filters.title)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTitleFilter(filters.title), 500)
    return () => clearTimeout(handler)
  }, [filters.title])

  const queryParams = useMemo(() => {
    const params = { page: pageIndex + 1, limit: pageSize }
    if (sorting.length > 0) {
      params.sortBy = sorting[0].id
      params.sortOrder = sorting[0].desc ? "desc" : "asc"
    }
    if (debouncedTitleFilter) params.title = debouncedTitleFilter // Assuming backend supports 'title' filter (e.g. title_contains)
    // Add other filters like publicationStatus, authorId etc. to params if backend supports them
    return params
  }, [pageIndex, pageSize, sorting, debouncedTitleFilter])

  const {
    data: novelsResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["adminNovels", queryParams],
    queryFn: () => adminFetchNovelsList(queryParams),
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
    if (filters.title) newSearchParams.set("title", filters.title)
    setSearchParams(newSearchParams, { replace: true })
  }, [pageIndex, pageSize, sorting, filters, setSearchParams])

  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "ID", size: 50 },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Title <CaretSortIcon className='ml-2 h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => row.original.titleTranslated || row.original.title,
      },
      { accessorKey: "author.name", header: "Author", cell: ({ row }) => row.original.author?.name || "N/A" },
      { accessorKey: "publicationStatus", header: "Pub. Status" },
      { accessorKey: "translationStatus", header: "Trans. Status" },
      {
        accessorKey: "isActive",
        header: "Active",
        cell: ({ row }) => <Checkbox checked={row.original.isActive} disabled className='ml-3' />,
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Last Updated <CaretSortIcon className='ml-2 h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
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
              <DropdownMenuItem onClick={() => handleEdit(row.original)}>Edit Novel</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <RouterLink to={`/admin/novels/${row.original.id}/chapters`}>Manage Chapters</RouterLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-destructive focus:bg-destructive/20 focus:text-destructive-foreground'
                onClick={() => confirmDelete(row.original)}>
                Delete Novel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: novelsResponse?.results ?? [],
    columns,
    pageCount: novelsResponse?.totalPages ?? -1,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

  const createMutation = useMutation({
    mutationFn: adminCreateNovel,
    onSuccess: () => {
      toast.success("Novel added successfully!")
      queryClient.invalidateQueries({ queryKey: ["adminNovels"] })
      setIsFormOpen(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add novel."),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminUpdateNovel(id, data),
    onSuccess: () => {
      toast.success("Novel updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["adminNovels"] })
      queryClient.invalidateQueries({ queryKey: ["novel", editingNovel?.id] })
      queryClient.invalidateQueries({ queryKey: ["novel", editingNovel?.slug] })
      setIsFormOpen(false)
      setEditingNovel(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update novel."),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteNovel(id),
    onSuccess: () => {
      toast.info("Novel deleted.")
      queryClient.invalidateQueries({ queryKey: ["adminNovels"] })
      setIsDeleteAlertOpen(false)
      setNovelToDelete(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete novel."),
  })

  const handleEdit = (novel) => {
    setEditingNovel(novel)
    setIsFormOpen(true)
  }
  const confirmDelete = (novel) => {
    setNovelToDelete(novel)
    setIsDeleteAlertOpen(true)
  }
  const handleFormSubmit = (data) => {
    if (editingNovel) updateMutation.mutate({ id: editingNovel.id, data })
    else createMutation.mutate(data)
  }
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }))
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold'>Novel Management</h1>
        <Button
          onClick={() => {
            setEditingNovel(null)
            setIsFormOpen(true)
          }}>
          <PlusCircleIcon className='mr-2 h-4 w-4' /> Add Novel
        </Button>
      </div>
      <Input
        placeholder='Filter by Title...'
        value={filters.title}
        onChange={(e) => handleFilterChange("title", e.target.value)}
        className='max-w-sm'
      />
      {isLoading && !novelsResponse && <LoadingSpinner />}
      {isError && <ErrorMessage error={error} message='Failed to load novels.' />}
      {isFetching && <p className='text-sm text-muted-foreground text-center py-2'>Fetching novels...</p>}
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
                    No novels found.
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
            {novelsResponse?.totalCount ?? 0} novels)
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
      <NovelFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        novel={editingNovel}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isLoading || updateMutation.isLoading}
      />
      {novelToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Novel</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete novel "{novelToDelete.title}"? This cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNovelToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(novelToDelete.id)}
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
