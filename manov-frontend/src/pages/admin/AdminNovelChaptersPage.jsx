import React, { useState, useMemo, useEffect } from "react"
import { useParams, Link as RouterLink, useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  adminFetchChaptersList,
  adminCreateChapter,
  adminUpdateChapter,
  adminDeleteChapter,
  adminFetchNovelDetails, // To display novel title
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
import { ChapterFormDialog } from "@/components/admin/ChapterFormDialog"
import { CaretSortIcon, DotsHorizontalIcon, ArrowLeftIcon } from "@radix-ui/react-icons" // Or use Lucide icons
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { PlusCircleIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

export function AdminNovelChaptersPage() {
  const { novelId } = useParams() // This is the ID of the parent novel
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [chapterToDelete, setChapterToDelete] = useState(null)

  const [{ pageIndex, pageSize }, setPagination] = useState(() => ({
    pageIndex: parseInt(searchParams.get("page") || (DEFAULT_PAGE_INDEX + 1).toString()) - 1,
    pageSize: parseInt(searchParams.get("limit") || DEFAULT_PAGE_SIZE.toString()),
  }))
  const [sorting, setSorting] = useState(() => {
    const sortBy = searchParams.get("sortBy")
    const sortOrder = searchParams.get("sortOrder")
    return sortBy && sortOrder ? [{ id: sortBy, desc: sortOrder === "desc" }] : [{ id: "chapterNumber", desc: false }] // Default sort by chapterNumber asc
  })
  // Add other filters like isPublished if needed, similar to other admin tables
  const [filters, setFilters] = useState({
    isPublished:
      searchParams.get("isPublished") === "true"
        ? true
        : searchParams.get("isPublished") === "false"
        ? false
        : undefined,
  })

  // Fetch Novel details to display its title
  const { data: novelDetails, isLoading: novelDetailsLoading } = useQuery({
    queryKey: ["adminNovelDetailsForChaptersPage", novelId],
    queryFn: () => adminFetchNovelDetails(novelId),
    enabled: !!novelId,
  })

  const queryParams = useMemo(() => {
    const params = { page: pageIndex + 1, limit: pageSize }
    if (sorting.length > 0) {
      params.sortBy = sorting[0].id
      params.sortOrder = sorting[0].desc ? "desc" : "asc"
    }
    if (filters.isPublished !== undefined) params.isPublished = filters.isPublished
    // params.lang can be added if admin needs to see/manage different language versions directly
    return params
  }, [pageIndex, pageSize, sorting, filters.isPublished])

  const {
    data: chaptersResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["adminNovelChapters", novelId, queryParams],
    queryFn: () => adminFetchChaptersList(novelId, queryParams),
    enabled: !!novelId,
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
    if (filters.isPublished !== undefined) newSearchParams.set("isPublished", filters.isPublished.toString())
    setSearchParams(newSearchParams, { replace: true })
  }, [pageIndex, pageSize, sorting, filters, setSearchParams])

  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "Ch. ID", size: 70 },
      {
        accessorKey: "chapterNumber",
        header: ({ column }) => (
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Number <CaretSortIcon className='ml-2 h-4 w-4' />
          </Button>
        ),
        size: 100,
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => row.original.title || <span className='text-muted-foreground italic'>No Title</span>,
      },
      {
        accessorKey: "isPublished",
        header: "Published",
        cell: ({ row }) => <Checkbox checked={row.original.isPublished} disabled className='ml-3' />,
        size: 100,
      },
      { accessorKey: "wordCount", header: "Words", size: 100 },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
        size: 120,
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
              <DropdownMenuItem onClick={() => handleEdit(row.original)}>Edit Chapter</DropdownMenuItem>
              {/* View chapter could link to public reading page: <DropdownMenuItem asChild><RouterLink to={`/novels/${novelId}/chapters/${row.original.chapterNumber}`}>View Chapter</RouterLink></DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-destructive focus:bg-destructive/20 focus:text-destructive-foreground'
                onClick={() => confirmDelete(row.original)}>
                Delete Chapter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [novelId]
  )

  const table = useReactTable({
    data: chaptersResponse?.results ?? [],
    columns,
    pageCount: chaptersResponse?.totalPages ?? -1,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true, // Assuming filters like isPublished are server-side
  })

  const createMutation = useMutation({
    mutationFn: (data) => adminCreateChapter(novelId, data),
    onSuccess: () => {
      toast.success("Chapter added successfully!")
      queryClient.invalidateQueries({ queryKey: ["adminNovelChapters", novelId] })
      setIsFormOpen(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add chapter."),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminUpdateChapter(id, data),
    onSuccess: () => {
      toast.success("Chapter updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["adminNovelChapters", novelId] })
      queryClient.invalidateQueries({ queryKey: ["chapter", editingChapter?.id] })
      setIsFormOpen(false)
      setEditingChapter(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update chapter."),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteChapter(id),
    onSuccess: () => {
      toast.info("Chapter deleted.")
      queryClient.invalidateQueries({ queryKey: ["adminNovelChapters", novelId] })
      setIsDeleteAlertOpen(false)
      setChapterToDelete(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete chapter."),
  })

  const handleEdit = (chapter) => {
    // For chapter content, it's best to fetch the full details if the list view omits it.
    // Assuming chapter object from list is complete enough for now, or fetch full:
    // const detailedChapter = await adminFetchChapterDetails(chapter.id); setEditingChapter(detailedChapter);
    setEditingChapter(chapter)
    setIsFormOpen(true)
  }
  const confirmDelete = (chapter) => {
    setChapterToDelete(chapter)
    setIsDeleteAlertOpen(true)
  }
  const handleFormSubmit = (data) => {
    if (editingChapter) updateMutation.mutate({ id: editingChapter.id, data })
    else createMutation.mutate(data)
  }
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }))
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  return (
    <div className='space-y-4'>
      <Button variant='outline' size='sm' asChild className='mb-4'>
        <RouterLink to='/admin/novels'>
          <ArrowLeftIcon className='mr-2 h-4 w-4' /> Back to Novels
        </RouterLink>
      </Button>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold'>Manage Chapters</h1>
          {novelDetailsLoading && <p className='text-sm text-muted-foreground'>Loading novel title...</p>}
          {novelDetails && (
            <p className='text-lg text-muted-foreground'>
              For Novel: {novelDetails.titleTranslated || novelDetails.title}
            </p>
          )}
        </div>
        <Button
          onClick={() => {
            setEditingChapter(null)
            setIsFormOpen(true)
          }}>
          <PlusCircleIcon className='mr-2 h-4 w-4' /> Add Chapter
        </Button>
      </div>

      {/* Filters: Example for isPublished */}
      <div className='py-2'>
        <label htmlFor='filter-published' className='mr-2 text-sm font-medium'>
          Filter by Status:
        </label>
        <Select
          value={filters.isPublished === undefined ? "all" : filters.isPublished ? "published" : "unpublished"}
          onValueChange={(value) => {
            let pubStatus
            if (value === "published") pubStatus = true
            else if (value === "unpublished") pubStatus = false
            else pubStatus = undefined
            handleFilterChange("isPublished", pubStatus)
          }}>
          <SelectTrigger id='filter-published' className='w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Chapters</SelectItem>
            <SelectItem value='published'>Published Only</SelectItem>
            <SelectItem value='unpublished'>Unpublished Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && !chaptersResponse && <LoadingSpinner />}
      {isError && <ErrorMessage error={error} message='Failed to load chapters.' />}
      {isFetching && <p className='text-sm text-muted-foreground text-center py-2'>Fetching chapters...</p>}

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
                    No chapters found for this novel with current filters.
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
            {chaptersResponse?.totalCount ?? 0} chapters)
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

      <ChapterFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        novelId={novelId}
        chapter={editingChapter}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isLoading || updateMutation.isLoading}
      />
      {chapterToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete Chapter {chapterToDelete.chapterNumber} (ID: {chapterToDelete.id})? This
              action cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setChapterToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(chapterToDelete.id)}
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
