import React, {
  ComponentType,
  FC,
  FunctionComponent,
  useEffect,
  useState,
} from 'react';

import dynamic, { DynamicOptions, Loader } from 'next/dynamic';

// Define props type for the fallback component
interface FallbackProps {
  onRetry: () => void; // Function to trigger a retry when loading fails
}

// Define props type for the options used in dynamicWithAutoRetry
interface DynamicWithRetryOptions {
  retries: number; // Specifies how many times to retry loading the component
  delay: number; // Delay time (in milliseconds) between each retry attempt
  LoadingComponent: JSX.Element; // Optional custom loading component to display while loading
  FallbackComponent: FC<FallbackProps> | FunctionComponent<FallbackProps>; // Fallback component that displays on loading failure
  dynamicOptions: Partial<Omit<DynamicOptions, 'loading' | 'loader'>>; // Optional options for the dynamic component
}

const DefaultFallbackComponent: FC<FallbackProps> = ({ onRetry }) => (
  <button onClick={onRetry} type="button">
    Retry
  </button>
);

const defaultOptions: DynamicWithRetryOptions = {
  retries: 3,
  delay: 1000,
  LoadingComponent: <p>Loading...</p>,
  FallbackComponent: DefaultFallbackComponent,
  dynamicOptions: {},
};

// Function to create a dynamic component with automatic retry logic
function dynamicWithAutoRetry<P = Record<string, never>>(
  importFunction: () => Promise<{ default: ComponentType<P> }>, // Function to import a dynamic component
  options?: Partial<DynamicWithRetryOptions>, // Options for retries and loading components
) {
  const {
    retries = defaultOptions.retries,
    delay = defaultOptions.delay,
    LoadingComponent = defaultOptions.LoadingComponent,
    FallbackComponent = defaultOptions.FallbackComponent,
    dynamicOptions = defaultOptions.dynamicOptions,
  } = options ?? defaultOptions;
  let attempt = 0; // Counter to keep track of retry attempts

  // Function that tries to load the component and handles retries
  const loadComponent: Loader<P> = () =>
    new Promise<ComponentType<P>>((resolve, reject) => {
      const tryLoad = () => {
        importFunction() // Attempt to load the component
          .then((module) => resolve(module.default)) // On success, resolve the component
          .catch((error) => {
            // On failure, check if we should retry
            if (attempt < retries) {
              attempt += 1; // Increment the attempt counter
              console.log(`Retrying... (${attempt})`); // Log retry attempt
              setTimeout(tryLoad, delay); // Retry after the specified delay
            } else {
              reject(error); // Reject the promise if out of retry attempts
            }
          });
      };
      tryLoad(); // Initial load attempt
    });

  // Use Next.js dynamic to load the component
  const DynamicComponent = dynamic(loadComponent, {
    loading: () => LoadingComponent, // Show loading component if applicable
    ...(dynamicOptions as DynamicOptions<P>),
  });

  // Return a functional component that handles loading and error states
  return function DynamicComponentWithFallback(
    props: P & JSX.IntrinsicAttributes,
  ) {
    const [error, setError] = useState<boolean>(false); // Error state for tracking load failure
    const [loading, setLoading] = useState<boolean>(true); // Loading state to track if the component is still loading

    // Function to retry loading the component
    const retryLoad = () => {
      setError(false); // Reset error state
      setLoading(true);
      attempt = 0; // Reset attempt count to zero
      loadComponent() // Attempt to load the component again
        .then(() => {
          setLoading(false);
        })
        .catch(() => {
          setError(true); // Loading failed, update error state
          setLoading(false);
        });
    };

    useEffect(() => {
      const load = async () => {
        try {
          await loadComponent(); // Try to load the component
          setLoading(false);
        } catch (err) {
          setError(true); // Set error state on failure
          setLoading(false);
        }
      };

      load(); // Call the load function on component mount
    }, []);

    // Return either loading, error fallback, or the dynamic component
    if (loading) {
      return LoadingComponent || <p>Loading...</p>; // Show loading component if in loading state
    }

    // If there was an error, show the fallback component with retry option
    return error ? (
      <FallbackComponent onRetry={retryLoad} /> // Passes retry function to the fallback component
    ) : (
      <DynamicComponent {...props} /> // Render the dynamically loaded component
    );
  };
}

export default dynamicWithAutoRetry; // Export the dynamicWithAutoRetry function as default
