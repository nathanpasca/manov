export function ErrorMessage({ message, error }) {
  const displayMessage = message || error?.message || "An unexpected error occurred."
  // You could inspect error.response.data for more specific messages from backend
  // For example: const backendMsg = error?.response?.data?.message || error?.response?.data?.errors?.[0]?.msg;
  return (
    <div className='text-center py-10 text-destructive'>
      <h3 className='text-xl font-semibold'>Oops! Something went wrong.</h3>
      <p>{displayMessage}</p>
      {/* {process.env.NODE_ENV === 'development' && error?.response?.data && (
        <pre className="mt-4 text-xs text-left bg-muted p-2 rounded">
          {JSON.stringify(error.response.data, null, 2)}
        </pre>
      )} */}
    </div>
  )
}
