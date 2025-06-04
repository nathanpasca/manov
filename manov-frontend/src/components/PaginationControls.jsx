import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useSearchParams } from "react-router-dom"

export function PaginationControls({ currentPage, totalPages, onPageChange }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    onPageChange(newPage) // Propagate for TanStack Query state

    // Update URL search params
    searchParams.set("page", newPage.toString())
    setSearchParams(searchParams)
  }

  if (totalPages <= 1) return null

  const renderPageNumbers = () => {
    const pages = []
    const pageLimit = 5 // Max pages to show directly
    let startPage = Math.max(1, currentPage - Math.floor(pageLimit / 2))
    let endPage = Math.min(totalPages, startPage + pageLimit - 1)

    if (endPage - startPage + 1 < pageLimit) {
      startPage = Math.max(1, endPage - pageLimit + 1)
    }

    if (startPage > 1) {
      pages.push(
        <PaginationItem key='1'>
          <PaginationLink onClick={() => handlePageChange(1)} isActive={1 === currentPage}>
            1
          </PaginationLink>
        </PaginationItem>
      )
      if (startPage > 2) {
        pages.push(<PaginationEllipsis key='start-ellipsis' />)
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={i === currentPage}>
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<PaginationEllipsis key='end-ellipsis' />)
      }
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={totalPages === currentPage}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }
    return pages
  }

  return (
    <Pagination className='mt-8'>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => handlePageChange(currentPage - 1)}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        {renderPageNumbers()}
        <PaginationItem>
          <PaginationNext
            onClick={() => handlePageChange(currentPage + 1)}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
