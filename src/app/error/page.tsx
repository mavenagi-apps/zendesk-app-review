export default function ErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg bg-red-50 p-8 text-center">
        <h1 className="text-xl font-semibold text-red-800">
          Authentication Error
        </h1>
        <p className="mt-2 text-red-600">
          Unable to verify Zendesk authentication. Please ensure you&apos;re accessing this app through Zendesk.
        </p>
      </div>
    </div>
  );
} 