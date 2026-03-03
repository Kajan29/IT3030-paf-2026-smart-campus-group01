import { useState } from 'react'

const useForm = (initialValues = {}, validate = null) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    
    if (validate) {
      const validationErrors = validate(values)
      setErrors(validationErrors)
    }
  }

  const handleSubmit = (callback) => (e) => {
    e.preventDefault()
    
    if (validate) {
      const validationErrors = validate(values)
      setErrors(validationErrors)
      
      if (Object.keys(validationErrors).length > 0) {
        return
      }
    }
    
    callback(values)
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  const setFieldValue = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
  }
}

export default useForm
