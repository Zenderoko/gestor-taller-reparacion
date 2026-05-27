import { Search, X } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm border border-secondary-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder:text-secondary-400"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
