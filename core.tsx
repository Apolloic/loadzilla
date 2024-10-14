/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentType, useEffect, useState } from 'react'

import dynamic, { Loader } from 'next/dynamic'

// Define props type for the fallback component
interface FallbackProps {
  onRetry: () => void // Function to trigger a retry when loading fails
}

// Define props type for the options used in dynamicWithAutoRetry
interface DynamicWithRetryOptions {
  retries?: number // Specifies how many times to retry loading the component
  delay?: number // Delay time (in milliseconds) between each retry attempt
  LoadingComponent?: JSX.Element // Optional custom loading component to display while loading
  FallbackComponent: (props: FallbackProps) => JSX.Element // Fallback component that displays on loading failure
}

// Function to create a dynamic component with automatic retry logic
function dynamicWithAutoRetry<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>, // Function to import a dynamic component
  options: DynamicWithRetryOptions, // Options for retries and loading components
) {
  const { retries = 3, delay = 1000, LoadingComponent, FallbackComponent } = options
  let attempt = 0 // Counter to keep track of retry attempts

  // Function that tries to load the component and handles retries
  const loadComponent: Loader<any> = () =>
    new Promise<T>((resolve, reject) => {
      const tryLoad = () => {
        importFunction() // Attempt to load the component
          .then((module) => resolve(module.default)) // On success, resolve the component
          .catch((error) => {
            // On failure, check if we should retry
            if (attempt < retries) {
              attempt += 1 // Increment the attempt counter
              console.log(`Retrying... (${attempt})`) // Log retry attempt
              setTimeout(tryLoad, delay) // Retry after the specified delay
            } else {
              reject(error) // Reject the promise if out of retry attempts
            }
          })
      }
      tryLoad() // Initial load attempt
    })

  // Use Next.js dynamic to load the component
  const DynamicComponent = dynamic(loadComponent, {
    loading: () => LoadingComponent || <p>Loading...</p>, // Show loading component if applicable
  })

  // Return a functional component that handles loading and error states
  return function DynamicComponentWithFallback(props: any) {
    const [error, setError] = useState<boolean>(false) // Error state for tracking load failure
    const [loading, setLoading] = useState<boolean>(true) // Loading state to track if the component is still loading

    // Function to retry loading the component
    const retryLoad = () => {
      setError(false) // Reset error state
      setLoading(true) // Reset loading state
      attempt = 0 // Reset attempt count to zero
      loadComponent() // Attempt to load the component again
        .then(() => {
          setLoading(false) // Successfully loaded, update state
        })
        .catch(() => {
          setError(true) // Loading failed, update error state
          setLoading(false) // Update loading state
        })
    }

    useEffect(() => {
      const load = async () => {
        try {
          await loadComponent() // Try to load the component
          setLoading(false) // Update loading state on success
        } catch (err) {
          setError(true) // Set error state on failure
          setLoading(false) // Update loading state
        }
      }

      load() // Call the load function on component mount
    }, [])

    // Return either loading, error fallback, or the dynamic component
    if (loading) {
      return LoadingComponent || <p>Loading...</p> // Show loading component if in loading state
    }

    // If there was an error, show the fallback component with retry option
    return error ? (
      <FallbackComponent onRetry={retryLoad} /> // Passes retry function to the fallback component
    ) : (
      <DynamicComponent {...props} /> // Render the dynamically loaded component
    )
  }
}

export default dynamicWithAutoRetry // Export the dynamicWithAutoRetry function as default

