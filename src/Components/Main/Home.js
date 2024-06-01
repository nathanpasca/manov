import { useState, useEffect } from "react"
import Hero from "../Component/Hero"

function Home() {
  const [popularMangaData, setPopularMangaData] = useState([])

  useEffect(() => {
    const getData = async () => {
      const url = "http://localhost:8080/api/manga/manhwaindo/popular/1"

      try {
        const resp = await fetch(url)
        const data = await resp.json()
        // Do anything you need to do to
        // data before this call:
        setPopularMangaData(data.manhwas)
      } catch (err) {
        console.error(err)
      }
    }

    getData()
  }, [])

  return (
    <>
      <Hero />
      <div className='my-24 mx-8'>
        <h1 className='text-3xl text-primary p-2'>Popular</h1>
        <div className='flex justify-start '>
          {popularMangaData.slice(0, 5).map((manga) => (
            <div key={manga.endpoint} className='card w-96 bg-base-100 shadow-xl mx-4'>
              <figure>
                <img className='w-[225px] h-[265px] rounded-xl' src={manga.thumbnail} alt='Manga Thumbnail' />
              </figure>
              <div className='card-body'>
                <h2 className='card-title'>{manga.title}</h2>
                <div className='card-actions justify-start'>
                  <div className='badge badge-outline'>Fashion</div>
                  <div className='badge badge-outline'>Products</div>
                </div>
                <div className='card-actions justify-end  pt-4'>
                  <button className='btn btn-primary'>Read Now</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Home
