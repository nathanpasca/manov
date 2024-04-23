import React from "react"
import { useFormik } from "formik"

function Register() {
  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
    },
  })
  return (
    <div>
      <h1>Register PAGE</h1>
    </div>
  )
}

export default Register
