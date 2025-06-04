import React from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchLanguages } from "@/services/contentService"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

// Removed includeAny prop as it's causing the issue.
// The placeholder will be shown if selectedLang is '' or undefined.
export function LanguageSelector({ selectedLang, onLangChange, placeholder = "Select Language" }) {
  const {
    data: languages,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["languages"],
    queryFn: fetchLanguages,
  })

  if (isLoading) return <Skeleton className='h-10 w-full' />
  if (error) return <p className='text-xs text-destructive'>Could not load languages.</p>

  return (
    <Select onValueChange={onLangChange} value={selectedLang || ""}>
      <SelectTrigger className='w-full md:w-[180px]'>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* The "Any" or "All" option is handled by the placeholder when selectedLang is '' */}
        {languages
          ?.filter((l) => l.isActive)
          .map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name} ({lang.nativeName || lang.code})
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}
