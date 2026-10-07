import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-100">
          <FileQuestion className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Page Not Found (404)
        </h1>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          The requested URL path does not exist in the attendance management system.
        </p>

        <div className="mt-6">
          <Link to="/">
            <Button
              variant="primary"
              size="md"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
