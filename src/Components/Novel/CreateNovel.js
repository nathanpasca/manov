import React, { Component, useEffect, useState } from "react"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"

function CreateNovel() {
  const [content, setContent] = useState("")

  return (
    <section>
      <div className='flex justify-center md:mx-24 sm:mx-8 flex-col'>
        <h1 className='text-4xl'>Create Your Own Novel!</h1>
        <div className='w-full max-h-min mt-24'>
          <label class='form-control w-full max-w-lg'>
            <div class='label'>
              <span class='label-text'>Judul:</span>
            </div>
            <input type='text' placeholder='Type here' class='input input-bordered w-full max-w-lg' />
          </label>
          <ReactQuill value={content} onChange={setContent} className='w-[50%]' />
        </div>
      </div>
    </section>
  )
}

export default CreateNovel
