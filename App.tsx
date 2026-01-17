
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { format, isWithinInterval, endOfDay } from 'date-fns';
import { 
    UploadCloud, Activity, Users, DollarSign, FileText, 
    LayoutDashboard, Building2, Stethoscope, Pill, AlertTriangle, ClipboardCopy, Link2, X, PlusCircle, CheckCircle2,
    BedDouble, PersonStanding, BriefcaseMedical, Scan, FlaskConical, TrendingUp, PieChart as PieChartIcon, UserCheck,
    ArrowLeft, Filter
} from 'lucide-react';

import { MedicalRecord, RawMedicalRecord, FilterState, KPIStats } from './types';
import { processRawData, calculateKPIs, generateAlerts, formatCurrency, formatNumber } from './utils';
import FilterBar from './components/FilterBar';
import KPICard from './components/KPICard';
import { 
    CostByTimeLineChart, CostByDeptBarChart, VisitsByDeptBarChart, CostByObjectPieChart, 
    GenericBarChart, GenericLineChart, MultiLineChart, GenericPieChart, RevenueStructureChart
} from './components/DashboardCharts';
import DataTable from './components/DataTable';

// Helper functions for date operations without full library dependency
const parseDateInput = (str: string): Date => {
  // Input from type="date" is YYYY-MM-DD
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// --- MAIN COMPONENT ---

const App: React.FC = () => {
  const [rawData, setRawData] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'dept' | 'icd' | 'service'>('overview');
  
  // Input mode state - DEFAULT TO URL FOR TESTING
  const [inputMode, setInputMode] = useState<'file' | 'url'>('url');
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1bnNszjpn8hD7r8fjH_8wd1B-UzoOJtlbHD6tGMbcgIU/edit?gid=366163500#gid=366163500');

  // Initial Filter State
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
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

  // ICD Comparison State
  const [selectedICDs, setSelectedICDs] = useState<string[]>([]);

  // --- SHARED: DATA PROCESSING CALLBACK ---
  const handleParseComplete = (results: Papa.ParseResult<RawMedicalRecord>) => {
    try {
      if (results.errors.length > 0) {
        console.warn("CSV Warnings:", results.errors);
      }
      // Basic validation of required columns
      const requiredCols = ['MA_LK', 'MA_BN', 'THANH_TIEN', 'KHOA'];
      const headers = results.meta.fields || [];
      const missing = requiredCols.filter(c => !headers.includes(c));
      
      if (missing.length > 0) {
        setError(`Dữ liệu thiếu các cột bắt buộc: ${missing.join(', ')}`);
        setLoading(false);
        return;
      }

      const processed = processRawData(results.data);
      if (processed.length === 0) {
          setError("File không có dữ liệu hợp lệ.");
          setLoading(false);
          return;
      }

      setRawData(processed);
      
      // Set default dates based on data range
      const dates = processed.map(d => d.NGAY_THONG_KE.getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      setFilters(prev => ({
           ...prev,
           startDate: format(minDate, 'yyyy-MM-dd'),
           endDate: format(maxDate, 'yyyy-MM-dd')
      }));

      setLoading(false);
    } catch (err) {
      setError("Lỗi xử lý dữ liệu. Vui lòng kiểm tra format file.");
      setLoading(false);
    }
  };

  // --- 1. FILE UPLOAD HANDLER ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    Papa.parse<RawMedicalRecord>(file, {
      header: true,
      skipEmptyLines: true,
      complete: handleParseComplete,
      error: (err) => {
        setError(`Lỗi đọc file: ${err.message}`);
        setLoading(false);
      }
    });
  };

  // --- 2. GOOGLE SHEET URL HANDLER ---
  const handleSheetFetch = async () => {
    if (!sheetUrl) {
        setError("Vui lòng nhập đường dẫn Google Sheet.");
        return;
    }

    setLoading(true);
    setError(null);

    // Extract Spreadsheet ID
    // Supports: docs.google.com/spreadsheets/d/LONG_ID/edit...
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
        setError("Đường dẫn không hợp lệ. Vui lòng dùng link dạng 'docs.google.com/spreadsheets/d/...'");
        setLoading(false);
        return;
    }

    const sheetId = match[1];
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    try {
        const response = await fetch(exportUrl);
        if (!response.ok) {
            if (response.status === 404) throw new Error("Không tìm thấy Sheet. Kiểm tra lại đường dẫn.");
            if (response.status === 403 || response.status === 401) throw new Error("Không có quyền truy cập. Vui lòng chuyển Sheet sang chế độ 'Bất kỳ ai có liên kết' (Anyone with the link).");
            throw new Error(`Lỗi tải dữ liệu (${response.status})`);
        }
        
        const csvText = await response.text();
        
        Papa.parse<RawMedicalRecord>(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: handleParseComplete,
            error: (err) => {
                setError(`Lỗi phân tích CSV từ Sheet: ${err.message}`);
                setLoading(false);
            }
        });

    } catch (err: any) {
        setError(err.message || "Lỗi kết nối đến Google Sheet.");
        setLoading(false);
    }
  };

  // --- AUTO-LOAD DEFAULT DATA FOR TESTING ---
  useEffect(() => {
    const defaultUrl = 'https://docs.google.com/spreadsheets/d/1bnNszjpn8hD7r8fjH_8wd1B-UzoOJtlbHD6tGMbcgIU/edit?gid=366163500#gid=366163500#gid=366163500';
    // Check if it's the specific test URL and try to load it immediately
    if (inputMode === 'url' && sheetUrl === defaultUrl) {
        handleSheetFetch();
    }
  }, []); // Run once on mount

  // --- 3. FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    if (rawData.length === 0) return [];

    let start = filters.startDate ? startOfDay(parseDateInput(filters.startDate)) : null;
    let end = filters.endDate ? endOfDay(parseDateInput(filters.endDate)) : null;

    return rawData.filter(item => {
      // Date Filter
      if (start && end) {
        if (!isWithinInterval(item.NGAY_THONG_KE, { start, end })) return false;
      }
      
      // Exact Match Filters
      if (filters.KHOA && item.KHOA !== filters.KHOA) return false;
      if (filters.BAC_SY && item.BAC_SY !== filters.BAC_SY) return false;
      if (filters.TEN_NHOM && item.TEN_NHOM !== filters.TEN_NHOM) return false;
      if (filters.TEN_DOI_TUONG && item.TEN_DOI_TUONG !== filters.TEN_DOI_TUONG) return false;
      if (filters.MA_LOAI_KCB && item.MA_LOAI_KCB !== filters.MA_LOAI_KCB) return false;
      if (filters.MA_BENH && item.MA_BENH !== filters.MA_BENH) return false;
      if (filters.KET_QUA_DTRI && item.KET_QUA_DTRI !== filters.KET_QUA_DTRI) return false;
      if (filters.TINH_TRANG_RV && item.TINH_TRANG_RV !== filters.TINH_TRANG_RV) return false;

      // Partial Match
      if (filters.DICH_VU && !item.DICH_VU.toLowerCase().includes(filters.DICH_VU.toLowerCase())) return false;

      return true;
    });
  }, [rawData, filters]);

  // --- 4. AGGREGATION & STATS ---
  const kpiStats = useMemo(() => calculateKPIs(filteredData), [filteredData]);
  const alerts = useMemo(() => generateAlerts(filteredData), [filteredData]);

  // --- 5. DATA PREP FOR CHARTS ---
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return { byDate: [], byDept: [], byObject: [], topICD: [], topServices: [], byDoc: [], allDocs: [], docPieData: [], byGroup: [], byTreatmentResult: [], byDischargeStatus: [], revenueByDischargeStatus: [], topServicesPie: [], revenueStructurePie: [] };

    // 5.1 By Time (Line Chart)
    const dateMap = new Map<string, { dateStr: string, cost: number, visits: Set<string> }>();
    
    // Aggregations for pie charts
    const resultMap = new Map<string, number>();
    const statusMap = new Map<string, number>();
    const statusRevenueMap = new Map<string, number>();
    const processedVisits = new Set<string>();

    // New: Revenue Structure Accumulators
    let revMedicine = 0;
    let revCLS = 0;
    let revBed = 0;
    let revOther = 0;

    filteredData.forEach(d => {
        // Use YYYY-MM-DD for sorting-friendly key
        const sortKey = format(d.NGAY_THONG_KE, 'yyyy-MM-dd');
        const displayKey = format(d.NGAY_THONG_KE, 'dd/MM');

        if (!dateMap.has(sortKey)) {
            dateMap.set(sortKey, { dateStr: displayKey, cost: 0, visits: new Set() });
        }
        const entry = dateMap.get(sortKey)!;
        entry.cost += d.THANH_TIEN;
        entry.visits.add(d.MA_LK);
        
        // Count Treatment Result & Discharge Status (Unique by Visit)
        if (!processedVisits.has(d.MA_LK)) {
            processedVisits.add(d.MA_LK);
            
            const res = d.KET_QUA_DTRI || 'Chưa ghi nhận';
            const stat = d.TINH_TRANG_RV || 'Chưa ghi nhận';
            
            resultMap.set(res, (resultMap.get(res) || 0) + 1);
            statusMap.set(stat, (statusMap.get(stat) || 0) + 1);
        }

        // Revenue by Discharge Status (Sum of all rows)
        const stat = d.TINH_TRANG_RV || 'Chưa ghi nhận';
        statusRevenueMap.set(stat, (statusRevenueMap.get(stat) || 0) + d.THANH_TIEN);

        // Revenue Structure Logic
        const groupRaw = (d.TEN_NHOM || '').trim();
        const group = groupRaw.toLowerCase();
        
        const isMedicine = groupRaw === '4' || groupRaw === '5' || groupRaw === '6' || group.includes('thuốc') || group.includes('dược') || group.includes('vắc xin');
        const isCLS = groupRaw === '1' || groupRaw === '2' || groupRaw === '3' || group.includes('xét nghiệm') || group.includes('chẩn đoán') || group.includes('siêu âm') || group.includes('x-quang') || group.includes('pttt'); // Including Surgery/Procedure in technical/CLS context often, but strictly code 1,2,3 is CLS
        const isBed = groupRaw === '14' || groupRaw === '15' || group.includes('giường');

        if (isMedicine) revMedicine += d.THANH_TIEN;
        else if (isCLS) revCLS += d.THANH_TIEN;
        else if (isBed) revBed += d.THANH_TIEN;
        else revOther += d.THANH_TIEN;

    });

    const revenueStructurePie = [
        { name: 'Thuốc', value: revMedicine },
        { name: 'Cận Lâm Sàng', value: revCLS },
        { name: 'Tiền Giường', value: revBed },
        { name: 'Khác', value: revOther }
    ].filter(i => i.value > 0);

    const byDate = Array.from(dateMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0])) // Sort chronologically
        .map(([_, val]) => ({
            date: val.dateStr,
            totalCost: val.cost,
            totalVisits: val.visits.size
        }));

    const byTreatmentResult = Array.from(resultMap.entries()).map(([name, value]) => ({ name, value }));
    const byDischargeStatus = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));
    
    const revenueByDischargeStatus = Array.from(statusRevenueMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // 5.2 By Dept (Bar Charts)
    const deptCostMap = new Map<string, number>();
    const deptVisitMap = new Map<string, Set<string>>();
    filteredData.forEach(d => {
        deptCostMap.set(d.KHOA, (deptCostMap.get(d.KHOA) || 0) + d.THANH_TIEN);
        if(!deptVisitMap.has(d.KHOA)) deptVisitMap.set(d.KHOA, new Set());
        deptVisitMap.get(d.KHOA)?.add(d.MA_LK);
    });
    const byDept = Array.from(deptCostMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value).slice(0, 10);
    const visitsByDept = Array.from(deptVisitMap.entries())
        .map(([name, set]) => ({ name, value: set.size }))
        .sort((a, b) => b.value - a.value).slice(0, 10);

    // 5.3 By Object
    const objMap = new Map<string, number>();
    filteredData.forEach(d => {
        objMap.set(d.TEN_DOI_TUONG, (objMap.get(d.TEN_DOI_TUONG) || 0) + d.THANH_TIEN);
    });
    const byObject = Array.from(objMap.entries()).map(([name, value]) => ({ name, value }));

    // 5.4 Top ICD (By Visits)
    const icdMap = new Map<string, Set<string>>();
    const icdCostMap = new Map<string, number>();
    
    filteredData.forEach(d => {
        if(!icdMap.has(d.MA_BENH)) icdMap.set(d.MA_BENH, new Set());
        icdMap.get(d.MA_BENH)?.add(d.MA_LK);
        icdCostMap.set(d.MA_BENH, (icdCostMap.get(d.MA_BENH) || 0) + d.THANH_TIEN);
    });
    const topICD = Array.from(icdMap.entries())
        .map(([name, set]) => ({ name, value: set.size, cost: icdCostMap.get(name) || 0 }))
        .sort((a, b) => b.value - a.value).slice(0, 20);

    // 5.5 Top Services & Pie Data (Modified to include Group Name in Label)
    const svcMap = new Map<string, {cost: number, qty: number, group: string}>();
    
    filteredData.forEach(d => {
        if(!svcMap.has(d.DICH_VU)) {
            svcMap.set(d.DICH_VU, { cost: 0, qty: 0, group: d.TEN_NHOM });
        }
        const entry = svcMap.get(d.DICH_VU)!;
        entry.cost += d.THANH_TIEN;
        entry.qty += d.SO_LUONG;
    });

    // Standard Top Services for Bar Charts/Tables
    const topServices = Array.from(svcMap.entries())
        .map(([name, val]) => ({ name, value: val.cost, qty: val.qty }))
        .sort((a, b) => b.value - a.value).slice(0, 20);

    // Special Pie Data: Service + Group Name
    const allServicesForPie = Array.from(svcMap.entries())
        .map(([name, val]) => ({ 
            name: `${name} (${val.group})`, 
            value: val.cost 
        }))
        .sort((a, b) => b.value - a.value);
    
    // Top 6 services + Others for cleaner Pie Chart legend
    const topServicesPie = [
        ...allServicesForPie.slice(0, 6),
        { 
            name: 'Khác', 
            value: allServicesForPie.slice(6).reduce((sum, i) => sum + i.value, 0) 
        }
    ].filter(d => d.value > 0);

    // 5.6 Doctors - FULL LIST & TOP
    const docMap = new Map<string, {cost: number, visits: Set<string>}>();
    filteredData.forEach(d => {
        if (d.BAC_SY === 'Unknown') return;
        if (!docMap.has(d.BAC_SY)) docMap.set(d.BAC_SY, { cost: 0, visits: new Set() });
        const entry = docMap.get(d.BAC_SY)!;
        entry.cost += d.THANH_TIEN;
        entry.visits.add(d.MA_LK);
    });
    
    const allDocs = Array.from(docMap.entries()).map(([name, val]) => ({
        name,
        cost: val.cost,
        visits: val.visits.size
    })).sort((a, b) => b.cost - a.cost);

    const byDoc = allDocs.slice(0, 20); // Top 20 for Bar Chart

    // Doctor Pie Data (Top 5 + Others)
    const top5Docs = allDocs.slice(0, 5);
    const otherDocsCost = allDocs.slice(5).reduce((sum, d) => sum + d.cost, 0);
    const docPieData = [
        ...top5Docs.map(d => ({ name: d.name, value: d.cost })),
        { name: 'Khác', value: otherDocsCost }
    ].filter(d => d.value > 0);

    // 5.7 By Group (TEN_NHOM)
    const groupMap = new Map<string, number>();
    filteredData.forEach(d => {
        groupMap.set(d.TEN_NHOM, (groupMap.get(d.TEN_NHOM) || 0) + d.THANH_TIEN);
    });
    const byGroup = Array.from(groupMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return { 
        byDate, byDept, visitsByDept, byObject, topICD, topServices, 
        byDoc, allDocs, docPieData, byGroup, byTreatmentResult, byDischargeStatus, 
        revenueByDischargeStatus, topServicesPie, revenueStructurePie 
    };
  }, [filteredData]);

  // --- 6. ICD TREND DATA COMPUTATION ---
  const icdTrendData = useMemo(() => {
    if (selectedICDs.length === 0) return [];
    
    const timeMap = new Map<string, any>();
    const visitSet = new Set<string>();

    filteredData.forEach(d => {
        if (selectedICDs.includes(d.MA_BENH)) {
            const monthStr = format(d.NGAY_THONG_KE, 'MM/yyyy');
            const visitKey = `${monthStr}-${d.MA_BENH}-${d.MA_LK}`; 
            
            if (!visitSet.has(visitKey)) {
                visitSet.add(visitKey);
                
                if (!timeMap.has(monthStr)) {
                    timeMap.set(monthStr, { date: monthStr });
                }
                const entry = timeMap.get(monthStr);
                entry[d.MA_BENH] = (entry[d.MA_BENH] || 0) + 1;
            }
        }
    });
    
    return Array.from(timeMap.values()).sort((a, b) => {
         const [m1, y1] = a.date.split('/').map(Number);
         const [m2, y2] = b.date.split('/').map(Number);
         return y1 - y2 || m1 - m2;
    });
  }, [filteredData, selectedICDs]);

  const toggleICD = (icd: string) => {
    if (selectedICDs.includes(icd)) {
        setSelectedICDs(prev => prev.filter(i => i !== icd));
    } else {
        if (selectedICDs.length >= 5) {
            alert("Chỉ được chọn tối đa 5 bệnh để so sánh.");
            return;
        }
        setSelectedICDs(prev => [...prev, icd]);
    }
  };


  // --- 7. EXPORT REPORT ---
  const handleCopyReport = () => {
    const text = `
BÁO CÁO TỔNG HỢP HOẠT ĐỘNG KHÁM CHỮA BỆNH
Thời gian: ${filters.startDate} đến ${filters.endDate}
---------------------------------------------
1. TỔNG QUAN
- Tổng lượt điều trị: ${formatNumber(kpiStats.totalVisits)}
  + Khám bệnh (01): ${formatNumber(kpiStats.countKhamBenh)} (${formatCurrency(kpiStats.revenueKhamBenh)})
  + ĐT Ngoại trú (02): ${formatNumber(kpiStats.countDieuTriNgoaiTru)} (${formatCurrency(kpiStats.revenueDieuTriNgoaiTru)})
  + Nội trú (03): ${formatNumber(kpiStats.countNoiTru)} (${formatCurrency(kpiStats.revenueNoiTru)})
  + Khác: ${formatNumber(kpiStats.countKhac)} (${formatCurrency(kpiStats.revenueKhac)})
- Tổng bệnh nhân: ${formatNumber(kpiStats.totalPatients)}
- Tổng chi phí: ${formatCurrency(kpiStats.totalCost)}
- Số ngày điều trị TB: ${kpiStats.avgTreatmentDays.toFixed(1)} ngày

2. TOP 5 KHOA (CHI PHÍ CAO NHẤT)
${chartData.byDept.slice(0, 5).map((d, i) => `${i+1}. ${d.name}: ${formatCurrency(d.value)}`).join('\n')}

3. TOP 5 BỆNH ICD (SỐ LƯỢT CAO NHẤT)
${chartData.topICD.slice(0, 5).map((d, i) => `${i+1}. ${d.name}: ${formatNumber(d.value)} lượt`).join('\n')}

4. TOP 5 DỊCH VỤ (CHI PHÍ CAO NHẤT)
${chartData.topServices.slice(0, 5).map((d, i) => `${i+1}. ${d.name}: ${formatCurrency(d.value)}`).join('\n')}

5. CẢNH BÁO
${alerts.length > 0 ? alerts.map(a => `- [${a.type.toUpperCase()}] ${a.message}: ${a.detail}`).join('\n') : '- Không có cảnh báo nổi bật.'}

6. KHUYẾN NGHỊ
- Kiểm soát chi phí tại các khoa Top đầu.
- Rà soát chỉ định với các dịch vụ chi phí cao bất thường.
    `.trim();

    navigator.clipboard.writeText(text);
    alert('Đã copy báo cáo vào bộ nhớ đệm!');
  };

  const exportCSV = (dataSet: any[], filename: string) => {
      const headers = Object.keys(dataSet[0]).join(',');
      const rows = dataSet.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.click();
  };

  const handleSelectDoctor = (docName: string) => {
      setFilters(prev => ({...prev, BAC_SY: docName}));
      // Scroll to top to see details
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- RENDER ---
  if (rawData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full text-center">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <UploadCloud size={40} className="text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">HIS Dashboard System</h1>
            <p className="text-slate-500 mb-6">Phân tích dữ liệu Y tế từ File CSV hoặc Google Sheet</p>
            
            {/* Input Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg mb-6 w-full max-w-sm mx-auto">
                <button 
                    onClick={() => { setInputMode('file'); setError(null); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${inputMode === 'file' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    File CSV
                </button>
                <button 
                    onClick={() => { setInputMode('url'); setError(null); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${inputMode === 'url' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Google Sheet
                </button>
            </div>

            {inputMode === 'file' ? (
                <label className="block w-full animate-in fade-in">
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    <div className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {loading ? 'Đang xử lý...' : <>Tải File CSV lên <UploadCloud size={20} /></>}
                    </div>
                </label>
            ) : (
                <div className="flex flex-col gap-3 animate-in fade-in">
                    <input 
                        type="text" 
                        placeholder="Dán link Google Sheet vào đây..."
                        className="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                    />
                     <div className="text-xs text-slate-500 text-left bg-slate-50 p-2 rounded border border-slate-200">
                        * Yêu cầu: Sheet phải được đặt ở chế độ <strong>"Bất kỳ ai có liên kết"</strong> (Anyone with the link can view).
                    </div>
                    <button 
                        onClick={handleSheetFetch}
                        disabled={loading || !sheetUrl}
                        className={`cursor-pointer bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${loading || !sheetUrl ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {loading ? 'Đang tải về...' : <>Kết nối Google Sheet <Link2 size={20} /></>}
                    </button>
                </div>
            )}

            {error && <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
             <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Activity size={24} />
             </div>
             <div>
                <h1 className="font-bold text-lg text-slate-800 leading-tight">HIS Dashboard</h1>
                <p className="text-xs text-slate-500">Trung tâm Y tế - Phân tích dữ liệu điều trị</p>
             </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            {[
                { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
                { id: 'dept', label: 'Khoa & Bác sĩ', icon: Building2 },
                { id: 'icd', label: 'Bệnh tật (ICD)', icon: Stethoscope },
                { id: 'service', label: 'Dịch vụ & CP', icon: Pill },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* GLOBAL FILTERS */}
        <FilterBar data={rawData} filters={filters} setFilters={setFilters} />

        {/* ALERTS SECTION */}
        {alerts.length > 0 && (
            <div className="mb-6 grid gap-2">
                {alerts.map((alert, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border flex items-start gap-3 ${
                        alert.type === 'danger' ? 'bg-red-50 border-red-200 text-red-800' :
                        alert.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                        'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                        <AlertTriangle size={18} className="mt-0.5" />
                        <div>
                            <span className="font-bold block text-sm">{alert.message}</span>
                            <span className="text-xs opacity-90">{alert.detail}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in">
                
                {/* 1. KEY METRICS GRID - ORGANIZED BY CATEGORY */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                        <DollarSign size={16} /> Chỉ số Tài chính
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <KPICard title="Tổng chi phí" value={formatCurrency(kpiStats.totalCost)} icon={DollarSign} color="red" />
                        <KPICard title="Doanh thu Thuốc" value={formatCurrency(kpiStats.totalMedicineRevenue)} icon={Pill} color="green" />
                        <KPICard title="Doanh thu CĐHA" value={formatCurrency(kpiStats.totalCDHARevenue)} icon={Scan} color="green" />
                        <KPICard title="Doanh thu XN" value={formatCurrency(kpiStats.totalLabRevenue)} icon={FlaskConical} color="green" />
                        <KPICard title="Doanh thu Giường" value={formatCurrency(kpiStats.totalBedRevenue)} icon={BedDouble} color="green" />
                    </div>

                    {/* NEW: FINANCIAL CHARTS ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                        <RevenueStructureChart 
                            data={chartData.revenueStructurePie} 
                        />
                        <CostByObjectPieChart data={chartData.byObject} />
                    </div>

                    <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mt-6">
                         <Activity size={16} /> Hoạt động Khám chữa bệnh
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                         <KPICard title="Tổng lượt" value={formatNumber(kpiStats.totalVisits)} icon={Users} color="blue" />
                         <KPICard title="Nội trú (03)" value={formatNumber(kpiStats.countNoiTru)} subtext={formatCurrency(kpiStats.revenueNoiTru)} icon={BedDouble} color="purple" />
                         <KPICard title="ĐT Ngoại trú (02)" value={formatNumber(kpiStats.countDieuTriNgoaiTru)} subtext={formatCurrency(kpiStats.revenueDieuTriNgoaiTru)} icon={BriefcaseMedical} color="blue" />
                         <KPICard title="Khám bệnh (01)" value={formatNumber(kpiStats.countKhamBenh)} subtext={formatCurrency(kpiStats.revenueKhamBenh)} icon={PersonStanding} color="orange" />
                         <KPICard title="Ngày điều trị TB" value={kpiStats.avgTreatmentDays.toFixed(1)} icon={Activity} color="blue" />
                    </div>
                </div>

                {/* 2. MAIN CHART AREA */}
                <div>
                     <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-4">
                        <TrendingUp size={16} /> Biểu đồ phân tích
                    </h3>
                    {/* Row 1: Time Trend (Full Width now since pie charts moved up) */}
                    <div className="mb-6 h-[400px]">
                        <CostByTimeLineChart data={chartData.byDate} />
                    </div>

                    {/* Row 2: Department Performance */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <CostByDeptBarChart data={chartData.byDept} />
                        <VisitsByDeptBarChart data={chartData.visitsByDept} />
                    </div>

                    {/* Row 3: Quality Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                         <GenericPieChart data={chartData.byTreatmentResult} title="Kết quả điều trị (Theo lượt)" formatType="number" />
                         <GenericPieChart data={chartData.byDischargeStatus} title="Tình trạng ra viện (Theo lượt)" formatType="number" />
                    </div>

                    {/* Row 4: Revenue Analysis (New) */}
                    <div className="grid grid-cols-1 gap-6 mb-6">
                        <GenericPieChart data={chartData.revenueByDischargeStatus} title="Cơ cấu Doanh thu theo Tình trạng ra viện" formatType="currency" />
                    </div>
                </div>

                {/* 3. DETAIL TABLES */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-4">
                        <FileText size={16} /> Bảng chi tiết nổi bật
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-[400px]">
                            <DataTable 
                                title="Top 10 Khoa Chi Phí Cao"
                                data={chartData.byDept}
                                columns={[
                                    { header: 'Khoa', accessor: (row: any) => row.name },
                                    { header: 'Chi phí', accessor: (row: any) => formatCurrency(row.value), align: 'right' }
                                ]}
                                onExport={() => exportCSV(chartData.byDept, 'Top_Khoa')}
                            />
                        </div>
                        <div className="h-[400px]">
                            <DataTable 
                                title="Top 10 ICD Theo Lượt"
                                data={chartData.topICD.slice(0, 10)}
                                columns={[
                                    { header: 'Mã Bệnh', accessor: (row: any) => row.name },
                                    { header: 'Số lượt', accessor: (row: any) => formatNumber(row.value), align: 'right' },
                                    { header: 'Chi phí', accessor: (row: any) => formatCurrency(row.cost), align: 'right' }
                                ]}
                                onExport={() => exportCSV(chartData.topICD, 'Top_ICD')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TAB 2: DEPARTMENT & DOCTOR */}
        {activeTab === 'dept' && (
             <div className="space-y-6 animate-in fade-in">
                {filters.BAC_SY ? (
                  // --- DOCTOR DETAIL VIEW (DRILL DOWN) ---
                  <div className="bg-slate-50/50 -mx-4 px-4 py-4 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setFilters(prev => ({...prev, BAC_SY: ''}))}
                                className="p-2 bg-white rounded-full hover:bg-slate-100 border border-slate-200 transition-colors"
                                title="Quay lại danh sách"
                            >
                                <ArrowLeft size={20} className="text-slate-600" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <UserCheck size={24} className="text-blue-600" />
                                    {filters.BAC_SY}
                                </h2>
                                <p className="text-sm text-slate-500">Chi tiết hoạt động khám chữa bệnh</p>
                            </div>
                         </div>
                         <div className="hidden md:flex gap-2">
                             <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-200">
                                Đang xem chi tiết cá nhân
                             </span>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <KPICard title="Tổng Bệnh Nhân" value={formatNumber(kpiStats.totalPatients)} icon={Users} color="blue" />
                        <KPICard title="Tổng Lượt Khám" value={formatNumber(kpiStats.totalVisits)} icon={Activity} color="green" />
                        <KPICard title="Tổng Doanh Thu" value={formatCurrency(kpiStats.totalCost)} icon={DollarSign} color="red" />
                        <KPICard title="TB Chi Phí/Lượt" value={formatCurrency(kpiStats.totalVisits ? kpiStats.totalCost/kpiStats.totalVisits : 0)} icon={TrendingUp} color="purple" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* CHART: Structure of Prescriptions */}
                        <div className="lg:col-span-1">
                             <RevenueStructureChart 
                                data={chartData.revenueStructurePie} 
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <GenericPieChart 
                                data={chartData.topServicesPie} 
                                title={`Top Dịch vụ chỉ định của BS ${filters.BAC_SY}`} 
                                formatType="currency" 
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 mb-6">
                         <CostByTimeLineChart data={chartData.byDate} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <GenericBarChart 
                            data={chartData.topServices} 
                            title="Top 20 Dịch vụ chỉ định (Chi phí)" 
                            dataKey="value" 
                            name="Chi phí" 
                            color="#0ea5e9" 
                            format="currency" 
                        />
                        <GenericBarChart 
                            data={chartData.topServices.sort((a,b) => b.qty - a.qty)} 
                            title="Top 20 Dịch vụ chỉ định (Số lượng)" 
                            dataKey="qty" 
                            name="Số lượng" 
                            color="#f59e0b" 
                        />
                    </div>
                  </div>
                ) : (
                  // --- DEFAULT OVERVIEW VIEW ---
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KPICard title="Số lượt (Toàn viện)" value={formatNumber(kpiStats.totalVisits)} icon={Users} color="blue" />
                        <KPICard title="Chi phí (Toàn viện)" value={formatCurrency(kpiStats.totalCost)} icon={DollarSign} color="red" />
                        <KPICard title="Số Khoa tham gia" value={kpiStats.activeDepts} icon={Building2} color="orange" />
                        <KPICard title="Số Bác Sĩ tham gia" value={kpiStats.activeDoctors} icon={Stethoscope} color="purple" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GenericBarChart data={chartData.byDept} title="Top Khoa (Chi phí)" dataKey="value" name="Chi phí" format="currency" />
                        <GenericBarChart data={chartData.byDoc} title="Top Bác Sĩ (Chi phí)" dataKey="cost" name="Chi phí" color="#10b981" format="currency" />
                        <RevenueStructureChart data={chartData.revenueStructurePie} />
                        <GenericPieChart data={chartData.docPieData} title="Tỷ trọng chi phí theo Bác sĩ (Top 5)" />
                    </div>
                  </>
                )}

                {/* DOCTOR TABLE (Always visible, acts as navigation) */}
                <DataTable 
                    title="Chi tiết Tổng hợp Bác Sĩ"
                    data={chartData.allDocs}
                    columns={[
                        { 
                            header: 'Bác Sĩ', 
                            accessor: (row: any) => (
                                <button 
                                    onClick={() => handleSelectDoctor(row.name)}
                                    className={`font-medium hover:underline text-left ${filters.BAC_SY === row.name ? 'text-blue-700 font-bold' : 'text-slate-700 hover:text-blue-600'}`}
                                >
                                    {row.name}
                                </button>
                            ) 
                        },
                        { header: 'Tổng chi phí', accessor: (row: any) => formatCurrency(row.cost), align: 'right' },
                        { header: 'Số lượt', accessor: (row: any) => formatNumber(row.visits), align: 'right' },
                        { header: 'TB chi phí / lượt', accessor: (row: any) => formatCurrency(row.visits ? row.cost / row.visits : 0), align: 'right' },
                        { 
                            header: 'Thao tác', 
                            accessor: (row: any) => (
                                <button 
                                    onClick={() => handleSelectDoctor(row.name)}
                                    className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-200 transition-colors"
                                >
                                    Xem chi tiết
                                </button>
                            ),
                            align: 'center',
                            width: 'w-24'
                        }
                    ]}
                    onExport={() => exportCSV(chartData.allDocs, 'Chi_tiet_BS_All')}
                />
             </div>
        )}

        {/* TAB 3: ICD-10 */}
        {activeTab === 'icd' && (
            <div className="space-y-6 animate-in fade-in">
                 {/* ICD SELECTION AREA */}
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase flex items-center gap-2">
                        <Activity size={16} /> So sánh xu hướng bệnh tật (Đã chọn {selectedICDs.length}/5)
                    </h3>
                    
                    {/* Selected Chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {selectedICDs.length === 0 && <span className="text-sm text-slate-400 italic">Chưa chọn bệnh nào. Nhấn vào dấu cộng (+) ở bảng bên dưới để thêm.</span>}
                        {selectedICDs.map(icd => (
                            <span key={icd} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                {icd}
                                <button onClick={() => toggleICD(icd)} className="hover:text-blue-900"><X size={14} /></button>
                            </span>
                        ))}
                    </div>

                    {selectedICDs.length > 0 && (
                        <div className="h-[300px] w-full mt-4">
                             <MultiLineChart data={icdTrendData} lines={selectedICDs} />
                        </div>
                    )}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <GenericBarChart data={chartData.topICD} title="Top 20 ICD (Số lượt)" dataKey="value" name="Lượt" color="#f59e0b" />
                     <GenericBarChart data={chartData.topICD.sort((a,b) => b.cost - a.cost)} title="Top 20 ICD (Chi phí)" dataKey="cost" name="Chi phí" color="#ef4444" format="currency" />
                 </div>

                 <DataTable 
                    title="Bảng tổng hợp ICD"
                    data={chartData.topICD}
                    columns={[
                        { header: 'Mã Bệnh', accessor: (row: any) => row.name },
                        { header: 'Số lượt', accessor: (row: any) => formatNumber(row.value), align: 'right' },
                        { header: 'Tổng chi phí', accessor: (row: any) => formatCurrency(row.cost), align: 'right' },
                        { 
                            header: 'So sánh', 
                            accessor: (row: any) => (
                                <button 
                                    onClick={() => toggleICD(row.name)}
                                    className={`p-1 rounded transition-colors ${selectedICDs.includes(row.name) ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'}`}
                                    title={selectedICDs.includes(row.name) ? 'Bỏ chọn' : 'Thêm vào so sánh'}
                                >
                                    {selectedICDs.includes(row.name) ? <CheckCircle2 size={18} /> : <PlusCircle size={18} />}
                                </button>
                            ),
                            align: 'center',
                            width: 'w-16'
                        }
                    ]}
                    onExport={() => exportCSV(chartData.topICD, 'Bang_ICD')}
                />
            </div>
        )}

        {/* TAB 4: SERVICE */}
        {activeTab === 'service' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1">
                     <GenericBarChart data={chartData.byGroup} title="Tổng chi phí theo Nhóm Dịch Vụ" dataKey="value" name="Chi phí" color="#6366f1" format="currency" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GenericBarChart data={chartData.topServices} title="Top Dịch Vụ (Chi phí)" dataKey="value" name="Chi phí" color="#0ea5e9" format="currency" />
                    <GenericBarChart data={chartData.topServices.sort((a,b) => b.qty - a.qty)} title="Top Dịch Vụ (Số lượng)" dataKey="qty" name="Số lượng" color="#22c55e" />
                </div>

                <DataTable 
                    title="Chi tiết Dịch vụ"
                    data={chartData.topServices}
                    columns={[
                        { header: 'Tên Dịch Vụ', accessor: (row: any) => row.name, width: 'w-1/2' },
                        { header: 'Số lượng', accessor: (row: any) => formatNumber(row.qty), align: 'right' },
                        { header: 'Tổng tiền', accessor: (row: any) => formatCurrency(row.value), align: 'right' },
                        { header: 'Đơn giá TB', accessor: (row: any) => formatCurrency(row.qty ? row.value / row.qty : 0), align: 'right' },
                    ]}
                    onExport={() => exportCSV(chartData.topServices, 'Dich_vu')}
                />
             </div>
        )}

      </main>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6">
        <button 
            onClick={handleCopyReport}
            className="bg-slate-800 hover:bg-slate-900 text-white p-4 rounded-full shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
            title="Xuất báo cáo tổng hợp"
        >
            <ClipboardCopy size={24} />
            <span className="font-semibold hidden md:inline">Sao chép Báo Cáo</span>
        </button>
      </div>
    </div>
  );
};

export default App;
