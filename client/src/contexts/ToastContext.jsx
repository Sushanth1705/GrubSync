import { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, variant = 'success') => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-16 flex flex-col gap-3 z-50">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-xl border px-4 py-3 shadow-2xl ${toast.variant === 'success' ? 'bg-slate-900 border-green-500 text-slate-100' : 'bg-orange/95 border-orange-600 text-white'}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
