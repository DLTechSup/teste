import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Check, Search, X } from 'lucide-react';

interface BrandFilterSelectProps {
  brands: string[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  counts?: Record<string, number>;
  totalCount?: number;
  label?: string;
  variant?: 'indigo' | 'amber' | 'slate';
}

export const BrandFilterSelect: React.FC<BrandFilterSelectProps> = ({
  brands,
  selectedBrand,
  onSelectBrand,
  counts,
  totalCount,
  label = 'Filtrar Marca',
  variant = 'indigo',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredBrands = brands.filter((b) =>
    b.toLowerCase().includes(search.trim().toLowerCase())
  );

  const isAllSelected = selectedBrand === 'all';
  const displayLabel = isAllSelected ? 'Todas as Marcas' : selectedBrand;

  const colorStyles = {
    indigo: {
      btn: isAllSelected
        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        : 'bg-indigo-600 text-white border-indigo-600 shadow-xs',
      badge: isAllSelected ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'bg-white/20 text-white',
      itemActive: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold',
    },
    amber: {
      btn: isAllSelected
        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        : 'bg-amber-600 text-white border-amber-600 shadow-xs',
      badge: isAllSelected ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'bg-white/20 text-white',
      itemActive: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold',
    },
    slate: {
      btn: isAllSelected
        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        : 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 shadow-xs',
      badge: isAllSelected ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'bg-white/20 text-white',
      itemActive: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-bold',
    },
  }[variant];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Botão de Disparo do Dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${colorStyles.btn}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Filter className="w-3.5 h-3.5 shrink-0 opacity-80" />
        <span className="truncate max-w-[150px] sm:max-w-[200px]">
          {label}: <span className="underline decoration-dotted">{displayLabel}</span>
        </span>
        {counts && (
          <span className={`text-[10px] px-2 py-0.2 rounded-full font-black shrink-0 ${colorStyles.badge}`}>
            {isAllSelected ? (totalCount ?? Object.values(counts).reduce((a, b) => a + b, 0)) : (counts[selectedBrand] ?? 0)}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menu Suspenso Vertical */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header e Busca Interna */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Selecionar Marca
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {brands.length} marcas disponíveis
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar marca na lista..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Lista Vertical de Marcas */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
            {/* Opção Todas as Marcas */}
            {(!search || 'todas as marcas'.includes(search.toLowerCase())) && (
              <button
                type="button"
                onClick={() => {
                  onSelectBrand('all');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isAllSelected
                    ? colorStyles.itemActive
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">Todas as Marcas</span>
                  {isAllSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </div>
                {totalCount !== undefined && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                    {totalCount}
                  </span>
                )}
              </button>
            )}

            {filteredBrands.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Nenhuma marca encontrada com &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredBrands.map((brandName) => {
                const isSelected = selectedBrand.toLowerCase() === brandName.toLowerCase();
                const count = counts ? counts[brandName] ?? 0 : undefined;

                return (
                  <button
                    key={brandName}
                    type="button"
                    onClick={() => {
                      onSelectBrand(brandName);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? colorStyles.itemActive
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold uppercase tracking-tight truncate">
                        {brandName}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    </div>
                    {count !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold shrink-0">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
