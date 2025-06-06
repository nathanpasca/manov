import React from "react"
import ReactQuill from "react-quill-new"
import "react-quill-new/dist/quill.snow.css"

// Define the toolbar options for a clean, simple editor
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"], // The "remove formatting" button
  ],
}

const formats = ["header", "bold", "italic", "underline", "strike", "list", "bullet", "link"]

// Use React.forwardRef to pass the ref down to ReactQuill, which is needed by react-hook-form
export const RichTextEditor = React.forwardRef(({ value, onChange, placeholder, ...rest }, ref) => {
  return (
    <div className='bg-background text-foreground rounded-md border border-input'>
      <ReactQuill
        ref={ref}
        theme='snow'
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        {...rest}
      />
    </div>
  )
})

// Set a display name for the component for better debugging
RichTextEditor.displayName = "RichTextEditor"
