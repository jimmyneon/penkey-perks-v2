import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F4]">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-[#4B3028] mb-2">404 - Page Not Found</h1>
        <p className="text-[#4B3028] mb-6">This page doesn't exist or has been moved.</p>
        <Link href="/" className="inline-block px-6 py-3 bg-[#E48A3A] text-white rounded-lg font-semibold">
          Go Home
        </Link>
      </div>
    </div>
  )
}
