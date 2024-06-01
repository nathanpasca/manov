import React from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { setDoc, doc, serverTimestamp } from "firebase/firestore"
import { auth, firestore } from "../../firebase"
import { useNavigate } from "react-router-dom"

function Login() {
  const navigate = useNavigate()

  const validateSchema = Yup.object().shape({
    email: Yup.string().email("Silakan masukkan email yang valid").required("Bagian ini wajib diisi"),
    password: Yup.string().required("Bagian ini wajib diisi"),
  })

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validateSchema,
    onSubmit: async (values, { resetForm }) => {
      // Exclude confirmPassword field from data

      await signInWithEmailAndPassword(auth, values.email, values.password)

      navigate("/")

      resetForm()
    },
  })

  return (
    <section className='bg-base-100 min-h-screen flex items-center justify-center'>
      <div className='bg-base-200 flex rounded-2xl shadow-lg max-w-6xl p-5 items-center'>
        <div className='sm:w-1/2 px-16'>
          <h2 className='font-bold text-2xl pt-4'>Masuk</h2>
          <p className='text-sm mt-2'>Masuk untuk memulai</p>

          <form onSubmit={formik.handleSubmit} className='mt-2'>
            <input
              className='input w-full max-w-md mt-2'
              type='text'
              id='email'
              name='email'
              placeholder='Email'
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
            />
            {formik.touched.email && formik.errors.email ? (
              <div className='label'>
                <span className='label-text-alt text-red-500'>{formik.errors.email}</span>
              </div>
            ) : null}

            <input
              className='input w-full max-w-md mt-2'
              type='password'
              id='password-input'
              name='password'
              placeholder='Kata Sandi'
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
            />
            {formik.touched.password && formik.errors.password ? (
              <div className='label'>
                <span className='label-text-alt text-red-500'>{formik.errors.password}</span>
              </div>
            ) : null}

            <button
              id='login-button'
              type='submit'
              className='btn-primary rounded-xl w-full py-2 mt-2 max-w-md hover:scale-105 duration-300 flex items-center justify-center'
              disabled={formik.isSubmitting}>
              {formik.isSubmitting && <span className='loading loading-spinner mr-2'></span>}
              {formik.isSubmitting ? "Memuat..." : "Masuk"}
            </button>
          </form>

          <div id='error' className='mt-6'></div>

          <div className='text-sm flex justify-between mt-3 items-center'>
            <p>Belum punya akun?</p>
            <a href='/register' className='py-2 px-5 bg-accent text-white rounded-xl hover:scale-110 duration-300'>
              Daftar
            </a>
          </div>
        </div>

        <div className='sm:block hidden w-1/2'>
          <img className='rounded-3xl' src='https://i.ibb.co/VxqT4rk/image-login.png' alt='register' />
        </div>
      </div>
    </section>
  )
}

export default Login
