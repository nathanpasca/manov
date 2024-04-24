import React from "react"
import { useFormik } from "formik"
import * as Yup from "yup"

function Register() {
  const validateSchema = Yup.object().shape({
    username: Yup.string().required("This field is required"),
    email: Yup.string().email("Please enter a valid email").required("This field is required"),
    password: Yup.string()
      .required("This field is required")
      .min(8, "Password must be 8 or more characters")
      .matches(/(?=.*[a-z])(?=.*[A-Z])\w+/, "Password should contain at least one uppercase and lowercase character")
      .matches(/\d/, "Password should contain at least one number")
      .matches(/[`!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/, "Password should contain at least one special character"),
    confirmPassword: Yup.string().when("password", (password, field) => {
      if (password) {
        return field.required("The passwords do not match").oneOf([Yup.ref("password")], "The passwords do not match")
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
    onSubmit: (values, { resetForm }) => {
      // Exclude confirmPassword field from data
      const { confirmPassword, ...dataToSend } = values
      console.log(values)
      resetForm()
    },
  })

  return (
    <section className='bg-base-100 min-h-screen flex items-center justify-center'>
      <div className='bg-base-200 flex rounded-2xl shadow-lg max-w-6xl p-5 items-center'>
        <div className='sm:w-1/2 px-16'>
          <h2 className='font-bold text-2xl pt-4'>Register</h2>
          <p className='text-sm mt-4'>Lorem ipsum dolor sit amet consectetur adipisicing</p>

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
              placeholder='Password'
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
              placeholder='Confirm Password'
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
              className='btn-primary rounded-xl w-full py-2 mt-2 max-w-md hover:scale-105 duration-300'
              disabled={formik.isSubmitting}>
              Register
            </button>
          </form>

          <div id='error' className='mt-6'></div>

          <div className='text-sm flex justify-between mt-3 items-center'>
            <p>Already have an account?</p>
            <a href='/register' className='py-2 px-5 bg-accent text-white rounded-xl hover:scale-110 duration-300'>
              Login
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

export default Register
