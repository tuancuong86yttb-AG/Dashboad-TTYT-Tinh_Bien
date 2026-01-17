
import React, { useState, useRef, useEffect } from 'react';
import { FilterState, MedicalRecord } from '../types';
import { Filter, ChevronDown, ChevronUp, Search, X, Calendar, Check } from 'lucide-react';
import { format } from 'date-fns';
import { 
  subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, 
  startOfQuarter, endOfQuarter, startOfYear, endOfYear 
} from '../utils';

interface FilterBarProps {
  data: MedicalRecord[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const FilterBar: React.FC<FilterBarProps> = ({ data, filters, setFilters }) => {
  const [expanded, setExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Local state for the date picker popup
  const [tempStart, setTempStart] = useState(filters.startDate);
  const [tempEnd, setTempEnd] = useState(filters.endDate);
  const [activePreset, setActivePreset] = useState('custom');

  useEffect(() => {
    setTempStart(filters.startDate);
    setTempEnd(filters.endDate);
  }, [filters.startDate, filters.endDate, showDatePicker]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to get unique options
  const getOptions = (field: keyof MedicalRecord): string[] => {
    const values: string[] = data.map(d => {
        const val = d[field];
        return val !== null && val !== undefined ? String(val) : '';
    });
    return Array.from(new Set(values)).sort();
  };

  const handleChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    const today = new Date();
    let start = today;
    let end = today;

    // Vietnam starts week on Monday (1)
    const options = { weekStartsOn: 1 as 0 | 1 | 2 | 3 | 4 | 5 | 6 }; 

    switch (preset) {
      case 'today':
        break; // start=end=today
      case 'yesterday':
        start = subDays(today, 1);
        end = subDays(today, 1);
        break;
      case 'thisWeek':
        start = startOfWeek(today, options);
        end = endOfWeek(today, options);
        break;
      case 'lastWeek':
        const lastWeek = subDays(today, 7);
        start = startOfWeek(lastWeek, options);
        end = endOfWeek(lastWeek, options);
        break;
      case 'last7Days':
        start = subDays(today, 6); // including today
        end = today;
        break;
      case 'last30Days':
        start = subDays(today, 29);
        end = today;
        break;
      case 'thisMonth':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'thisQuarter':
        start = startOfQuarter(today);
        end = endOfQuarter(today);
        break;
      case 'thisYear':
        start = startOfYear(today);
        end = endOfYear(today);
        break;
      case 'lastYear':
        const lastYear = subMonths(today, 12);
        start = startOfYear(lastYear);
        end = endOfYear(lastYear);
        break;
      case 'custom':
      default:
        // Do not update dates, just set mode
        return;
    }

    setTempStart(format(start, 'yyyy-MM-dd'));
    setTempEnd(format(end, 'yyyy-MM-dd'));
  };

  const applyDateFilter = () => {
    setFilters(prev => ({
        ...prev,
        startDate: tempStart,
        endDate: tempEnd
    }));
    setShowDatePicker(false);
  };

  const clearFilters = () => {
      setFilters({
        startDate: filters.startDate, 
        endDate: filters.endDate,
        KHOA: '',
        BAC_SY: '',
        TEN_NHOM: '',
        DICH_VU: '',
        TEN_DOI_TUONG: '',
        MA_LOAI_KCB: '',
        MA_BENH: '',
        KET_QUA_DTRI: '',
        TINH_TRANG_RV: ''
      });
  };

  const formatDisplayDate = (dateStr: string) => {
      if (!dateStr) return '...';
      const [y, m, d] = dateStr.split('-');
      return `${d} thg ${m}, ${y}`;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
        
        {/* Primary Filters */}
        <div className="flex flex-wrap gap-4 w-full items-end">
          
          {/* LOOKER STUDIO STYLE DATE PICKER */}
          <div className="flex flex-col gap-1 w-full md:w-auto relative" ref={datePickerRef}>
             <label className="text-xs font-semibold text-slate-500">Khoảng thời gian</label>
             <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center justify-between gap-3 border border-slate-300 rounded px-3 py-1.5 text-sm hover:bg-slate-50 min-w-[240px] focus:ring-2 focus:ring-medical-500 transition-shadow bg-white text-slate-700"
             >
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-500"/>
                    <span className="font-medium">
                        {filters.startDate ? formatDisplayDate(filters.startDate) : 'Từ ngày'} 
                        {' - '} 
                        {filters.endDate ? formatDisplayDate(filters.endDate) : 'Đến ngày'}
                    </span>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
             </button>

             {/* POPOVER */}
             {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-white shadow-xl rounded-lg border border-slate-200 z-50 flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[500px]">
                    {/* Sidebar Presets */}
                    <div className="w-48 bg-slate-50 border-r border-slate-100 flex flex-col p-2 gap-0.5 text-sm overflow-y-auto max-h-[400px]">
                        {[
                            { id: 'custom', label: 'Cố định' },
                            { id: 'today', label: 'Hôm nay' },
                            { id: 'yesterday', label: 'Hôm qua' },
                            { id: 'thisWeek', label: 'Tuần này (T2-CN)' },
                            { id: 'lastWeek', label: 'Tuần trước' },
                            { id: 'last7Days', label: '7 ngày qua' },
                            { id: 'last30Days', label: '30 ngày qua' },
                            { id: 'thisMonth', label: 'Tháng này' },
                            { id: 'lastMonth', label: 'Tháng trước' },
                            { id: 'thisQuarter', label: 'Quý này' },
                            { id: 'thisYear', label: 'Năm nay' },
                            { id: 'lastYear', label: 'Năm trước' },
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => applyPreset(p.id)}
                                className={`text-left px-3 py-2 rounded flex justify-between items-center transition-colors ${
                                    activePreset === p.id 
                                    ? 'bg-blue-100 text-blue-700 font-medium' 
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {p.label}
                                {activePreset === p.id && <Check size={14} />}
                            </button>
                        ))}
                    </div>

                    {/* Main Date Inputs */}
                    <div className="p-5 flex-1 flex flex-col gap-6">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày bắt đầu</label>
                                <input 
                                    type="date" 
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={tempStart}
                                    onChange={(e) => {
                                        setTempStart(e.target.value);
                                        setActivePreset('custom');
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày kết thúc</label>
                                <input 
                                    type="date" 
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={tempEnd}
                                    onChange={(e) => {
                                        setTempEnd(e.target.value);
                                        setActivePreset('custom');
                                    }}
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end pt-4 border-t border-slate-100 gap-2 mt-auto">
                            <button 
                                onClick={() => setShowDatePicker(false)}
                                className="px-4 py-2 rounded text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={applyDateFilter}
                                className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
                            >
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </div>
             )}
          </div>

           <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
             <label className="text-xs font-semibold text-slate-500">Khoa</label>
             <select 
                className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full focus:ring-2 focus:ring-medical-500 outline-none"
                value={filters.KHOA}
                onChange={(e) => handleChange('KHOA', e.target.value)}
             >
                <option value="">Tất cả khoa</option>
                {getOptions('KHOA').map(opt => <option key={opt} value={opt}>{opt}</option>)}
             </select>
          </div>
        </div>
        
        <div className="flex gap-2 min-w-fit">
           <button 
            onClick={clearFilters}
            className="flex items-center gap-1 text-slate-600 hover:text-red-600 px-3 py-1.5 text-sm border rounded hover:bg-slate-50"
           >
             <X size={14} /> Xóa bộ lọc
           </button>
           <button 
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm border rounded transition-colors ${expanded ? 'bg-medical-50 text-medical-700 border-medical-200' : 'text-slate-600 hover:bg-slate-50'}`}
           >
             <Filter size={14} /> {expanded ? 'Thu gọn' : 'Bộ lọc nâng cao'} {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
           </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
            {[
                { label: 'Bác sĩ', key: 'BAC_SY' },
                { label: 'Nhóm Dịch vụ', key: 'TEN_NHOM' },
                { label: 'Đối tượng', key: 'TEN_DOI_TUONG' },
                { label: 'Loại KCB', key: 'MA_LOAI_KCB' },
                { label: 'Mã Bệnh (ICD)', key: 'MA_BENH' },
                { label: 'Kết quả ĐT', key: 'KET_QUA_DTRI' },
                { label: 'Tình trạng RV', key: 'TINH_TRANG_RV' },
            ].map((f) => (
                <div key={f.key} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">{f.label}</label>
                     <select 
                        className="border border-slate-300 rounded px-2 py-1.5 text-sm w-full focus:ring-2 focus:ring-medical-500 outline-none"
                        value={filters[f.key as keyof FilterState]}
                        onChange={(e) => handleChange(f.key as keyof FilterState, e.target.value)}
                    >
                        <option value="">Tất cả</option>
                        {getOptions(f.key as keyof MedicalRecord).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            ))}
            <div className="flex flex-col gap-1">
                 <label className="text-xs font-semibold text-slate-500">Tên Dịch Vụ (Tìm kiếm)</label>
                 <div className="relative">
                    <input 
                        type="text"
                        placeholder="Nhập tên dịch vụ..."
                        className="border border-slate-300 rounded pl-8 pr-2 py-1.5 text-sm w-full focus:ring-2 focus:ring-medical-500 outline-none"
                        value={filters.DICH_VU}
                        onChange={(e) => handleChange('DICH_VU', e.target.value)}
                    />
                    <Search className="absolute left-2 top-2 text-slate-400" size={14} />
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
