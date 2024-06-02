import firebase from "firebase/compat/app"
import { useFormik } from "formik"
import React, { Component, useEffect, useState } from "react"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"

function CreateNovel() {
  const [content, setContent] = useState("")

  const formik = useFormik({
    initialValues: {
      title: "",
      authorId: null,
      authorName: null,
      description: "",
      content: "",
      createdAt: Date.now,
      imageUrl: "",
    },

    onSubmit: async (values) => {
      alert(JSON.stringify(values, null, 2))
    },
  })
  return (
    <section className=''>
      <div className='flex justify-center md:mx-24 sm:mx-8 flex-col'>
        <h1 className='text-4xl'>Create Your Own Novel!</h1>
        <div className='w-full max-h-min mt-24'>
          <form>
            <label class='form-control w-full max-w-md my-2'>
              <div class='label'>
                <span class='label-text'>Thumbnail:</span>
              </div>
              <input
                id='thumbnail'
                name='thumbnail'
                onChange={formik.handleChange}
                value={formik.values.imageUrl}
                type='file'
                class='file-input file-input-bordered w-full max-w-md'
              />
            </label>
            <label class='form-control w-full max-w-lg my-2'>
              <div class='label'>
                <span class='label-text'>Judul:</span>
              </div>
              <input type='text' placeholder='Type here' class='input input-bordered w-full max-w-lg' />
            </label>
            <label class='form-control w-full max-w-lg my-2'>
              <div class='label'>
                <span class='label-text'>Deskripsi:</span>
              </div>
              <input type='text' placeholder='Type here' class='input input-bordered w-full max-w-lg' />
            </label>

            <ReactQuill value={content} onChange={setContent} className='w-[50%] mt-4' />
          </form>
        </div>
      </div>
    </section>
  )
}

export default CreateNovel
