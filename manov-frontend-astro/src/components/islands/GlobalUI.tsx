import { Toaster } from 'react-hot-toast';

export default function GlobalUI() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        className: 'shadow-xl',
        style: {
          background: 'var(--toast-bg)',
          color: 'var(--toast-text)',
          border: '1px solid var(--toast-border)',
          padding: '16px',
          borderRadius: '12px',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: 'white',
          },
        },
      }}
    />
  );
}
