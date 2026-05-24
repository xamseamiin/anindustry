// lib/hooks.ts - Custom React Hooks

import { useState, useEffect } from 'react';

/**
 * Hook si loo maareeyo state-ka modal-ka (furan/xiran).
 * @param initialOpen - Haddii modal-ku uu bilow ahaan furan yahay.
 * @returns [isOpen, openModal, closeModal, toggleModal]
 */
export const useModal = (initialOpen: boolean = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen(prev => !prev);

  return { isOpen, openModal, closeModal, toggleModal };
};

/**
 * Hook si loo maareeyo state-ka loading-ka iyo qaladka ee API calls.
 * @returns [loading, error, setLoading, setError]
 */
export const useApiStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetStatus = () => {
    setLoading(false);
    setError(null);
  };

  return { loading, error, setLoading, setError, resetStatus };
};

/**
 * Hook si loo maareeyo state-ka foomka iyo validation-ka fudud.
 * @param initialValues - Qiimaha bilowga ah ee foomka.
 * @param validate - Shaqo lagu xaqiijiyo beeraha foomka.
 * @returns [values, errors, handleChange, handleSubmit, resetForm]
 */
export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validate: (values: T) => Record<string, string>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setValues({ ...values, [name]: parseFloat(value) || '' });
    } else if (type === 'checkbox') {
        setValues({ ...values, [name]: (e.target as HTMLInputElement).checked });
    }
    else {
      setValues({ ...values, [name]: value });
    }
  };

  const handleSubmit = (callback: () => void) => (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setIsSubmitting(true);

    if (Object.keys(validationErrors).length === 0) {
      callback();
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (isSubmitting) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length === 0) {
        // Form is valid, can proceed with submission logic (handled by callback)
      } else {
        setIsSubmitting(false); // Stop submitting if errors found
      }
    }
  }, [values, isSubmitting, validate]);

  return { values, errors, handleChange, handleSubmit, resetForm, isSubmitting };
};

// Add more custom hooks as needed for common UI patterns or logic
