import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center max-w-sm mx-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        
        <Link href="/" className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  );
}
