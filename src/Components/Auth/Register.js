import React, { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { setDoc, doc, serverTimestamp } from "firebase/firestore"
import { auth, firestore } from "../../firebase"
import { useNavigate } from "react-router-dom"
import RegisterSvgUndraw from "../../static/undraw_authentication_re_svpt.svg"

function Register() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateSchema = Yup.object().shape({
    username: Yup.string().required("Bagian ini wajib diisi"),
    email: Yup.string().email("Silakan masukkan email yang valid").required("Bagian ini wajib diisi"),
    password: Yup.string()
      .required("Bagian ini wajib diisi")
      .min(8, "Kata sandi harus terdiri dari 8 karakter atau lebih")
      .matches(/(?=.*[a-z])(?=.*[A-Z])\w+/, "Kata sandi harus mengandung setidaknya satu huruf besar dan kecil")
      .matches(/\d/, "Kata sandi harus mengandung setidaknya satu angka"),
    confirmPassword: Yup.string().when("password", (password, field) => {
      if (password) {
        return field.required("Kata sandi tidak cocok").oneOf([Yup.ref("password")], "Kata sandi tidak cocok")
      }
    }),
  })

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: validateSchema,
    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true)

      // Exclude confirmPassword field from data
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password)

      await setDoc(doc(firestore, "users", userCredential.user.uid), {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        username: values.username,
        createdAt: serverTimestamp(),
      })

      navigate("/")
      setIsSubmitting(false)
      resetForm()
    },
  })

  return (
    <section className='bg-base-100 min-h-screen flex items-center justify-center'>
      <div className='bg-base-200 flex rounded-2xl shadow-lg max-w-6xl p-5 items-center'>
        <div className='sm:w-1/2 px-16'>
          <h2 className='font-bold text-2xl pt-4'>Daftar</h2>
          <p className='text-sm mt-4'>Daftarkan akun untuk memulai</p>

          <form onSubmit={formik.handleSubmit} className='mt-8'>
            <input
              className='input w-full max-w-md'
              type='text'
              id='username'
              name='username'
              placeholder='Username'
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.username}
            />
            {formik.touched.username && formik.errors.username ? (
              <div className='label'>
                <span className='label-text-alt text-red-500'>{formik.errors.username}</span>
              </div>
            ) : null}

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

            <input
              className='input w-full max-w-md mt-2'
              type='password'
              id='confirmPassword'
              name='confirmPassword'
              placeholder='Konfirmasi Kata Sandi'
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.confirmPassword}
            />

            {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
              <div className='label'>
                <span className='label-text-alt text-red-500'>{formik.errors.confirmPassword}</span>
              </div>
            ) : null}

            <button
              id='register-button'
              type='submit'
              className='btn-primary rounded-xl w-full py-2 mt-2 max-w-md hover:scale-105 duration-300 flex items-center justify-center'
              disabled={formik.isSubmitting}>
              {isSubmitting && <span className='loading loading-spinner mr-2'></span>}
              {isSubmitting ? "Memuat..." : "Daftar"}
            </button>
          </form>

          <div id='error' className='mt-6'></div>

          <div className='text-sm flex justify-between mt-3 items-center'>
            <p>Sudah punya akun?</p>
            <a href='/register' className='py-2 px-5 bg-accent text-white rounded-xl hover:scale-110 duration-300'>
              Masuk
            </a>
          </div>
        </div>

        <div className='sm:block hidden w-1/2 h-1/2'>
          <img className='rounded-3xl w-[500px] h-[500px]' src={RegisterSvgUndraw} alt='register' />
        </div>
      </div>
    </section>
  )
}

export default Register
