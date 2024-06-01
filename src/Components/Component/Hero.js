import React from "react"
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward"
import HeroSvg from "../../static/undraw_reading_re_29f8.svg"

export default function Hero() {
  return (
    <div className='hero min-h-screen bg-base-200'>
      <div className='hero-content flex-col lg:flex-row-reverse'>
        <img src={HeroSvg} className='max-w-sm rounded-lg' />
        <div>
          <h1 className='text-5xl font-bold'>Selamat datang di Manov!</h1>
          <p className='py-6 text-xl'>
            Temukan dunia menakjubkan dari karya-karya sastra di sini. Mulai membaca atau ciptakan kisahmu sendiri hari
            ini!
          </p>
          <button className='btn btn-primary'>Mulai Sekarang</button>
        </div>
      </div>
    </div>
  )
}
