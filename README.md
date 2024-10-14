# Loadzilla

**Loadzilla** is a powerful React utility that simplifies the dynamic loading of components with built-in automatic retry logic. This package leverages Next.js's dynamic imports while providing robust handling of loading failures, including features such as customizable retry attempts, loading indicators, and fallback components.

## Installation

You can install Loadzilla via npm or yarn:

```bash
# Using npm
npm install loadzilla

# Using yarn
yarn add loadzilla
```

## Usage

The `dynamicWithAutoRetry` function from Loadzilla allows you to dynamically load a React component with automatic retry functionality. You can specify the number of retries, a loading component, and a fallback component to handle loading failures gracefully.

### Example

Here’s how to use Loadzilla in your application:

```typescript
import dynamicWithAutoRetry from 'loadzilla';

// Your fallback component for when loading fails
const FallbackComponent = ({ onRetry }) => (
  <div>
    <p>Failed to load the component. Please try again.</p>
    <button onClick={onRetry}>Retry</button>
  </div>
);

// Your loading component
const LoadingComponent = <div>Loading your component...</div>;

// Import your dynamic component using Loadzilla
const DynamicComponent = dynamicWithAutoRetry(
  () => import('./YourComponent'), // Your async component import
  {
    retries: 3,               // Number of retries
    delay: 1000,              // Delay between retries in milliseconds
    LoadingComponent,         // Custom loading component
    FallbackComponent,        // Custom fallback component
  }
);

const App = () => (
  <div>
    <h1>My Application</h1>
    <DynamicComponent />
  </div>
);

export default App;
```

### API

#### `dynamicWithAutoRetry(importFunction, options)`

- **importFunction**: A function that returns a promise resolving to your dynamic component.
- **options**: An object with the following properties:
  - `retries` (optional): Number of times to retry loading the component (default: `3`).
  - `delay` (optional): Time in milliseconds to wait before retrying (default: `1000`).
  - `LoadingComponent` (optional): A JSX element representing the loading state.
  - `FallbackComponent`: A function that returns a fallback JSX element. It receives an `onRetry` prop which can be called to retry loading the component.

### Handling State

Loadzilla provides a component that manages its own loading and error states:

- While loading, it will display the specified `LoadingComponent` or will fall back to a default loading message.
- If an error occurs during loading, it will display the `FallbackComponent`, which allows users to retry loading the component.

### Example Fallback Component

A simple fallback component could look like this:

```typescript
const FallbackComponent = ({ onRetry }) => (
  <div>
    <p>There was an issue loading the component.</p>
    <button onClick={onRetry}>Retry</button>
  </div>
);
```

## Contribution

Contributions to Loadzilla are welcome! Open issues for any bugs or suggested features, or feel free to submit pull requests for improvements.

## License

Loadzilla is licensed under the MIT License. See the LICENSE file for more details.

## Conclusion

**Loadzilla** provides a seamless way to load React components dynamically with resilience to loading failures. With customizable retry logic, loading indicators, and fallback components, this utility ensures a smoother user experience in your applications. Utilize Loadzilla to enhance the reliability of component loading in your React projects!
