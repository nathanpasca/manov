import React from "react"
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward"

export default function Hero() {
  return (
    <div className='hero bg-base-200'>
      <div className='hero-content flex-col lg:flex-row-reverse'>
        <div className='text-center lg:text-justify w-[50%] justify-center'>
          <h1 className='text-5xl font-bold text-center'>Hi there!</h1>
          <p className='py-6 text-justify'>
            Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem quasi. In
            deleniti eaque aut repudiandae et a id nisi.
          </p>
          <button className='btn btn-outline place-items-center w-full'>
            <ArrowDownwardIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
