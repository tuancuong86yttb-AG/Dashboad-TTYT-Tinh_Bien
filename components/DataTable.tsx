
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search, Inbox } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  onExport: () => void;
}

const DataTable = <T extends object>({ data, columns, title, onExport }: DataTableProps<T>) => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter((item) => 
     Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
     )
  );

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden group hover:shadow-md transition-shadow duration-300">
        {/* Header Section */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 bg-white">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-l-4 border-blue-500 pl-3">
                {title}
            </h3>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Search Input */}
                <div className="relative w-full sm:w-64 group/search">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={14} className="text-slate-400 group-focus-within/search:text-blue-500 transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm..."
                        className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    />
                </div>

                {/* Export Button */}
                <button 
                    onClick={onExport}
                    className="flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 text-slate-500 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-all shadow-sm"
                    title="Xuất Excel/CSV"
                >
                    <Download size={16} />
                </button>
            </div>
        </div>

        {/* Table Content */}
        <div className="overflow-auto flex-1 relative">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12 text-center border-b border-slate-200">
                            #
                        </th>
                        {columns.map((col, idx) => (
                            <th 
                                key={idx} 
                                className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-${col.align || 'left'} ${col.width || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedData.length > 0 ? (
                        paginatedData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors duration-150 group/row">
                                <td className="px-5 py-3.5 text-center text-xs font-medium text-slate-400 group-hover/row:text-slate-600">
                                    {(page - 1) * pageSize + idx + 1}
                                </td>
                                {columns.map((col, cIdx) => (
                                    <td 
                                        key={cIdx} 
                                        className={`px-5 py-3.5 text-slate-700 text-${col.align || 'left'} ${col.align === 'right' ? 'tabular-nums font-medium' : ''}`}
                                    >
                                        {col.accessor(row)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400 bg-slate-50/30">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Inbox size={32} className="text-slate-300 mb-1" />
                                    <p className="text-sm font-medium">Không tìm thấy dữ liệu</p>
                                    <p className="text-xs opacity-70">Vui lòng thử từ khóa khác</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-white text-xs font-medium text-slate-500 shrink-0 select-none">
            <span className="tabular-nums">
                Hiển thị {filteredData.length > 0 ? ((page - 1) * pageSize) + 1 : 0}-{Math.min(page * pageSize, filteredData.length)} / {filteredData.length} dòng
            </span>
            
            <div className="flex items-center gap-1">
                <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                
                <div className="bg-slate-100 px-3 py-1 rounded text-slate-700 min-w-[2rem] text-center border border-slate-200">
                    {page}
                </div>
                
                <button 
                     disabled={page === totalPages || totalPages === 0}
                     onClick={() => setPage(p => p + 1)}
                     className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default DataTable;
