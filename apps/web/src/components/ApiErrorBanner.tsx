import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { apiErrorBus } from '@/lib/apiErrorBus';

export function ApiErrorBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    return apiErrorBus.subscribe((msg) => setMessage(msg));
  }, []);

  if (!message) return null;

  return (
    <div className="mx-4 my-2">
      <div className="flex items-start gap-3 rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <p className="flex-1 text-sm">{message}</p>
        <button
          onClick={() => setMessage(null)}
          className="shrink-0 rounded p-0.5 hover:bg-red-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
