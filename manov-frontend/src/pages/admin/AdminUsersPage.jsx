import React, { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminFetchUsers, adminUpdateUser, adminDeactivateUser } from "@/services/adminService"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { UserEditDialog } from "@/components/admin/UserEditDialog"
import { toast } from "sonner"
import { useSearchParams } from "react-router-dom"
import {
  // REMOVE ColumnDef from here:
  // ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  // SortingState, // Keep if you are explicitly typing state, remove if not
  // PaginationState, // Keep if you are explicitly typing state, remove if not
} from "@tanstack/react-table"
import { CaretSortIcon, DotsHorizontalIcon } from "@radix-ui/react-icons"

const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [isDeactivateAlertOpen, setIsDeactivateAlertOpen] = useState(false)
  const [userToDeactivate, setUserToDeactivate] = useState(null)

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
    username: searchParams.get("username") || "",
    email: searchParams.get("email") || "",
    isActive:
      searchParams.get("isActive") === "true" ? true : searchParams.get("isActive") === "false" ? false : undefined,
    isAdmin:
      searchParams.get("isAdmin") === "true" ? true : searchParams.get("isAdmin") === "false" ? false : undefined,
  })

  const [debouncedUsername, setDebouncedUsername] = useState(filters.username)
  const [debouncedEmail, setDebouncedEmail] = useState(filters.email)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedUsername(filters.username), 500)
    return () => clearTimeout(handler)
  }, [filters.username])

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedEmail(filters.email), 500)
    return () => clearTimeout(handler)
  }, [filters.email])

  const queryParams = useMemo(() => {
    const params = {
      page: pageIndex + 1,
      limit: pageSize,
    }
    if (sorting.length > 0) {
      params.sortBy = sorting[0].id
      params.sortOrder = sorting[0].desc ? "desc" : "asc"
    }
    if (debouncedUsername) params.username = debouncedUsername
    if (debouncedEmail) params.email = debouncedEmail
    if (filters.isActive !== undefined) params.isActive = filters.isActive
    if (filters.isAdmin !== undefined) params.isAdmin = filters.isAdmin
    return params
  }, [pageIndex, pageSize, sorting, debouncedUsername, debouncedEmail, filters.isActive, filters.isAdmin])

  const {
    data: usersResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["adminUsers", queryParams],
    queryFn: () => adminFetchUsers(queryParams),
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
    if (filters.username) newSearchParams.set("username", filters.username)
    if (filters.email) newSearchParams.set("email", filters.email)
    if (filters.isActive !== undefined) newSearchParams.set("isActive", filters.isActive.toString())
    if (filters.isAdmin !== undefined) newSearchParams.set("isAdmin", filters.isAdmin.toString())
    setSearchParams(newSearchParams, { replace: true })
  }, [pageIndex, pageSize, sorting, filters, setSearchParams])

  const defaultData = useMemo(() => [], [])
  const pageCount = usersResponse?.totalPages ?? -1

  // Define columns without importing ColumnDef
  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <span className='text-xs truncate w-20 inline-block'>{row.original.id}</span>,
        size: 100,
      },
      {
        accessorKey: "username",
        header: ({ column }) => (
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Username <CaretSortIcon className='ml-2 h-4 w-4' />
          </Button>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Email <CaretSortIcon className='ml-2 h-4 w-4' />
          </Button>
        ),
      },
      { accessorKey: "displayName", header: "Display Name" },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Active <CaretSortIcon className='ml-2 h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => <Checkbox checked={row.original.isActive} disabled className='ml-4' />,
      },
      {
        accessorKey: "isAdmin",
        header: ({ column }) => (
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Admin <CaretSortIcon className='ml-2 h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => <Checkbox checked={row.original.isAdmin} disabled className='ml-3' />,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Created At <CaretSortIcon className='ml-2 h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        accessorKey: "lastLoginAt",
        header: ({ column }) => (
          <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Last Login <CaretSortIcon className='ml-2 h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => (row.original.lastLoginAt ? new Date(row.original.lastLoginAt).toLocaleString() : "N/A"),
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
              <DropdownMenuItem onClick={() => handleEditUser(row.original)}>Edit User</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-destructive focus:bg-destructive/20 focus:text-destructive-foreground'
                onClick={() => confirmDeactivateUser(row.original)}>
                Deactivate User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  ) // Add dependencies if handleEditUser or confirmDeactivateUser change, but they are stable here.

  const table = useReactTable({
    data: usersResponse?.results ?? defaultData,
    columns,
    pageCount,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    debugTable: process.env.NODE_ENV === "development",
  })

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }))
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setIsEditDialogOpen(true)
  }

  const editUserMutation = useMutation({
    mutationFn: ({ userId, data }) => adminUpdateUser(userId, data),
    onSuccess: () => {
      toast.success("User updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] })
      setIsEditDialogOpen(false)
      setEditingUser(null)
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to update user."),
  })

  const confirmDeactivateUser = (user) => {
    setUserToDeactivate(user)
    setIsDeactivateAlertOpen(true)
  }

  const deactivateUserMutation = useMutation({
    mutationFn: (userId) => adminDeactivateUser(userId),
    onSuccess: (data) => {
      toast.success(data.message || "User deactivated successfully.")
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] })
      setIsDeactivateAlertOpen(false)
      setUserToDeactivate(null)
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to deactivate user."),
  })

  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-bold'>User Management</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-md bg-card text-card-foreground'>
        <Input
          placeholder='Filter by Username...'
          value={filters.username}
          onChange={(e) => handleFilterChange("username", e.target.value)}
          className='md:col-span-1'
        />
        <Input
          placeholder='Filter by Email...'
          value={filters.email}
          onChange={(e) => handleFilterChange("email", e.target.value)}
          className='md:col-span-1'
        />
        <div className='flex items-center space-x-2 md:col-span-1'>
          <Label htmlFor='filter-active-select'>Status:</Label>
          <Select
            value={filters.isActive === undefined ? "all" : filters.isActive ? "active" : "inactive"}
            onValueChange={(value) => {
              let isActiveValue
              if (value === "active") isActiveValue = true
              else if (value === "inactive") isActiveValue = false
              else isActiveValue = undefined // 'all'
              handleFilterChange("isActive", isActiveValue)
            }}>
            <SelectTrigger className='w-[120px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center space-x-2 md:col-span-1'>
          <Label htmlFor='filter-admin-select'>Role:</Label>
          <Select
            value={filters.isAdmin === undefined ? "all" : filters.isAdmin ? "admin" : "user"}
            onValueChange={(value) => {
              let isAdminValue
              if (value === "admin") isAdminValue = true
              else if (value === "user") isAdminValue = false
              else isAdminValue = undefined // 'all'
              handleFilterChange("isAdmin", isAdminValue)
            }}>
            <SelectTrigger className='w-[120px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Roles</SelectItem>
              <SelectItem value='admin'>Admin</SelectItem>
              <SelectItem value='user'>User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && !usersResponse && <LoadingSpinner />}
      {isError && <ErrorMessage error={error} message='Failed to load users.' />}
      {isFetching && <p className='text-sm text-muted-foreground text-center py-2'>Fetching updated data...</p>}

      {!isLoading && !isError && (
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
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className='flex items-center justify-between space-x-2 py-4'>
        <span className='text-sm text-muted-foreground'>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() > 0 ? table.getPageCount() : 1}{" "}
          (Total: {usersResponse?.totalCount ?? 0} users)
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

      {editingUser && (
        <UserEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          user={editingUser}
          onSubmit={(data) => editUserMutation.mutate({ userId: editingUser.id, data })}
          isSubmitting={editUserMutation.isLoading}
        />
      )}

      {userToDeactivate && (
        <AlertDialog open={isDeactivateAlertOpen} onOpenChange={setIsDeactivateAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to deactivate user "{userToDeactivate.username}"? This will set them as inactive.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDeactivate(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deactivateUserMutation.mutate(userToDeactivate.id)}
                className='bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                disabled={deactivateUserMutation.isLoading}>
                {deactivateUserMutation.isLoading ? "Deactivating..." : "Deactivate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
