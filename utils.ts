
import { MedicalRecord, RawMedicalRecord, KPIStats, AlertItem } from './types';
import { 
  getYear, 
  getMonth, 
  getQuarter, 
  format, 
  isSameMonth, 
  differenceInDays
} from 'date-fns';

// Implement missing date-fns functions manually
export const subDays = (date: Date | number, amount: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() - amount);
    return d;
};

export const subWeeks = (date: Date | number, amount: number): Date => {
    return subDays(date, amount * 7);
};

export const subMonths = (date: Date | number, amount: number): Date => {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() - amount);
    if (d.getDate() !== day) {
        d.setDate(0);
    }
    return d;
};

export const subYears = (date: Date | number, amount: number): Date => {
    const d = new Date(date);
    const day = d.getDate();
    d.setFullYear(d.getFullYear() - amount);
    if (d.getDate() !== day) {
        d.setDate(0);
    }
    return d;
};

export const startOfWeek = (date: Date | number, options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const start = options?.weekStartsOn || 0;
    const diff = (day < start ? 7 : 0) + day - start;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const endOfWeek = (date: Date | number, options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }): Date => {
    const d = startOfWeek(date, options);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
};

export const startOfMonth = (date: Date | number): Date => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const endOfMonth = (date: Date | number): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
};

export const startOfQuarter = (date: Date | number): Date => {
    const d = new Date(date);
    const q = Math.floor(d.getMonth() / 3);
    d.setMonth(q * 3, 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const endOfQuarter = (date: Date | number): Date => {
    const d = new Date(date);
    const q = Math.floor(d.getMonth() / 3);
    d.setMonth((q + 1) * 3, 0);
    d.setHours(23, 59, 59, 999);
    return d;
};

export const startOfYear = (date: Date | number): Date => {
    const d = new Date(date);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const endOfYear = (date: Date | number): Date => {
    const d = new Date(date);
    d.setMonth(11, 31);
    d.setHours(23, 59, 59, 999);
    return d;
};

// Helper to parse localized date strings (DD/MM/YYYY or MM/DD/YYYY)
const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();

  // 0. Try YYYYMMDDHHmmss (e.g., 20251224111920) - Common in HIS exports
  if (/^\d{14}$/.test(cleanStr)) {
    const y = parseInt(cleanStr.substring(0, 4), 10);
    const m = parseInt(cleanStr.substring(4, 6), 10);
    const d = parseInt(cleanStr.substring(6, 8), 10);
    const h = parseInt(cleanStr.substring(8, 10), 10);
    const min = parseInt(cleanStr.substring(10, 12), 10);
    const s = parseInt(cleanStr.substring(12, 14), 10);
    const date = new Date(y, m - 1, d, h, min, s);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
  }
  
  // Also support YYYYMMDD (8 digits)
  if (/^\d{8}$/.test(cleanStr)) {
     const y = parseInt(cleanStr.substring(0, 4), 10);
     const m = parseInt(cleanStr.substring(4, 6), 10);
     const d = parseInt(cleanStr.substring(6, 8), 10);
     const date = new Date(y, m - 1, d);
     if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
  }

  const datePart = cleanStr.split(' ')[0];

  // 1. Try dd/MM/yyyy
  let match = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const d = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
  }

  // 2. Try yyyy-MM-dd
  match = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const d = parseInt(match[3], 10);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
  }

  // 3. Try MM/dd/yyyy
  match = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const m = parseInt(match[1], 10);
    const d = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
  }

  // 4. Try dd-MM-yyyy
  match = datePart.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    const d = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
  }

  return null;
};

export const processRawData = (data: RawMedicalRecord[]): MedicalRecord[] => {
  return data.map((row, index) => {
    const ngayVaoVien = parseDateString(row.NGAY_VAO_VIEN);
    const ngayRaVien = parseDateString(row.NGAY_RA_VIEN);
    const ngayThanhToan = parseDateString(row.NGAY_THANH_TOAN);
    
    let ngayThongKe = ngayThanhToan || ngayRaVien || ngayVaoVien;
    if (!ngayThongKe) {
        ngayThongKe = new Date(); 
    }

    const soLuong = parseFloat(row.SO_LUONG?.replace(/,/g, '') || '0');
    const thanhTien = parseFloat(row.THANH_TIEN?.replace(/,/g, '') || '0');
    
    let soNgayDtri = parseInt(row.SO_NGAY_DTRI || '0', 10);
    if ((!soNgayDtri || isNaN(soNgayDtri)) && ngayRaVien && ngayVaoVien) {
        soNgayDtri = differenceInDays(ngayRaVien, ngayVaoVien) + 1;
    }
    if (isNaN(soNgayDtri)) soNgayDtri = 0;

    // Standardize MA_BENH to 'Unknown' if missing or empty
    const maBenh = (row.MA_BENH || '').trim() || 'Unknown';

    return {
      id: `${index}-${row.MA_LK}`,
      TEN_DOI_TUONG: row.TEN_DOI_TUONG || 'Unknown',
      MA_LK: row.MA_LK,
      MA_BN: row.MA_BN,
      NGAY_VAO_VIEN: ngayVaoVien,
      NGAY_VAO_KHOA: parseDateString(row.NGAY_VAO_KHOA),
      NGAY_RA_VIEN: ngayRaVien,
      NGAY_THANH_TOAN: ngayThanhToan,
      NGAY_THONG_KE: ngayThongKe,
      SO_NGAY_DTRI: soNgayDtri,
      KET_QUA_DTRI: row.KET_QUA_DTRI || 'Unknown',
      MA_BENH: maBenh,
      CHAN_DOAN: row.CHAN_DOAN || '',
      BAC_SY: row.BAC_SY || 'Unknown',
      KHOA: row.KHOA || 'Unknown',
      TEN_NHOM: row.TEN_NHOM || 'Other',
      DICH_VU: row.DICH_VU || 'Unknown',
      SO_LUONG: soLuong,
      THANH_TIEN: thanhTien,
      MA_LOAI_KCB: row.MA_LOAI_KCB || '',
      TINH_TRANG_RV: row.TINH_TRANG_RV || '',
      NAM: getYear(ngayThongKe),
      THANG: getMonth(ngayThongKe) + 1,
      QUY: getQuarter(ngayThongKe)
    };
  });
};

export const calculateKPIs = (data: MedicalRecord[]): KPIStats => {
  const uniqueVisits = new Set(data.map(d => d.MA_LK));
  const uniquePatients = new Set(data.map(d => d.MA_BN));
  const uniqueDepts = new Set(data.map(d => d.KHOA).filter(k => k !== 'Unknown'));
  const uniqueDocs = new Set(data.map(d => d.BAC_SY).filter(d => d !== 'Unknown'));

  const totalCost = data.reduce((sum, d) => sum + d.THANH_TIEN, 0);

  // Helper for cleaner text matching
  const normalize = (str: string) => str.normalize("NFC").toLowerCase();

  // New: Calculate Medicine Revenue
  const totalMedicineRevenue = data.reduce((sum, d) => {
    const groupRaw = (d.TEN_NHOM || '').trim();
    const group = normalize(groupRaw);
    
    // Updated Logic: Check for code '4', '5', '6' or keywords
    if (
        groupRaw === '4' || // XML Standard Code for Medicine
        groupRaw === '5' || 
        groupRaw === '6' ||
        group.includes('thuốc') || 
        group.includes('thuoc') || 
        group.includes('dược') || 
        group.includes('duoc') ||
        group.includes('huyết thanh') ||
        group.includes('vắc xin')
    ) {
        return sum + d.THANH_TIEN;
    }
    return sum;
  }, 0);

  // New: Calculate Diagnostic Imaging (CĐHA) Revenue
  const totalCDHARevenue = data.reduce((sum, d) => {
    const groupRaw = (d.TEN_NHOM || '').trim();
    const group = normalize(groupRaw);
    if (
        groupRaw === '2' || // XML Standard Code for CDHA
        groupRaw === '3' || // Tham do chuc nang (often grouped with imaging/diagnostics in basic dashboards)
        group.includes('chẩn đoán hình ảnh') || 
        group.includes('cđha') || 
        group.includes('x-quang') || 
        group.includes('xquang') || 
        group.includes('siêu âm') || 
        group.includes('ct scanner') || 
        group.includes('cắt lớp') ||
        group.includes('mri') ||
        group.includes('cộng hưởng từ')
    ) {
        return sum + d.THANH_TIEN;
    }
    return sum;
  }, 0);

  // New: Calculate Laboratory (Xét nghiệm) Revenue
  const totalLabRevenue = data.reduce((sum, d) => {
    const groupRaw = (d.TEN_NHOM || '').trim();
    const group = normalize(groupRaw);
    // Keywords: xét nghiệm, huyết học, sinh hóa, vi sinh, miễn dịch, giải phẫu bệnh
    if (
        groupRaw === '1' || // XML Standard Code for Lab (Xet Nghiem)
        group.includes('xét nghiệm') || 
        group.includes('xn') ||
        group.includes('huyết học') || 
        group.includes('sinh hóa') || 
        group.includes('vi sinh') || 
        group.includes('miễn dịch') || 
        group.includes('giải phẫu bệnh')
    ) {
        return sum + d.THANH_TIEN;
    }
    return sum;
  }, 0);

  // New: Calculate Bed (Giường) Revenue
  const totalBedRevenue = data.reduce((sum, d) => {
    const groupRaw = (d.TEN_NHOM || '').trim();
    const group = normalize(groupRaw);
    if (
        groupRaw === '14' || // XML Standard Code for Bed (Giuong)
        groupRaw === '15' ||
        group.includes('giường') || 
        group.includes('giuong')
    ) {
        return sum + d.THANH_TIEN;
    }
    return sum;
  }, 0);

  const visitDaysMap = new Map<string, number>();
  const visitTypeMap = new Map<string, string>();
  const visitCostMap = new Map<string, number>();

  data.forEach(d => {
    // 0. Accumulate Cost per Visit
    visitCostMap.set(d.MA_LK, (visitCostMap.get(d.MA_LK) || 0) + d.THANH_TIEN);

    // 1. Calculate Max Days per unique visit
    const currentDays = visitDaysMap.get(d.MA_LK) || 0;
    if (d.SO_NGAY_DTRI > currentDays) visitDaysMap.set(d.MA_LK, d.SO_NGAY_DTRI);

    // 2. Determine Visit Type with Priority for unique visit
    // Priority: Nội trú (03) > ĐT Ngoại trú (02) > Khám (01)
    const currentType = visitTypeMap.get(d.MA_LK);
    const newTypeRaw = String(d.MA_LOAI_KCB || '').trim();
    
    // Check flags for new row (Updated to accept '1', '2', '3' as '01', '02', '03')
    const isNoiTru = newTypeRaw === '03' || newTypeRaw === '3' || newTypeRaw.toLowerCase().includes('nội') || newTypeRaw.toLowerCase().includes('noi');
    const isDTNgoaiTru = newTypeRaw === '02' || newTypeRaw === '2' || newTypeRaw.toLowerCase().includes('điều trị ngoại') || newTypeRaw.toLowerCase().includes('dt ngoai');

    if (!currentType) {
        visitTypeMap.set(d.MA_LK, newTypeRaw);
    } else {
        // Check flags for existing classification
        const currentIsNoiTru = currentType === '03' || currentType === '3' || currentType.toLowerCase().includes('nội') || currentType.toLowerCase().includes('noi');
        const currentIsDTNgoaiTru = currentType === '02' || currentType === '2' || currentType.toLowerCase().includes('điều trị ngoại') || currentType.toLowerCase().includes('dt ngoai');

        if (isNoiTru && !currentIsNoiTru) {
             visitTypeMap.set(d.MA_LK, newTypeRaw); // Upgrade to Inpatient (High priority)
        } else if (isDTNgoaiTru && !currentIsNoiTru && !currentIsDTNgoaiTru) {
             visitTypeMap.set(d.MA_LK, newTypeRaw); // Upgrade to Outpatient Treatment (Medium priority)
        }
    }
  });

  let totalDays = 0;
  visitDaysMap.forEach(days => totalDays += days);
  const avgDays = uniqueVisits.size > 0 ? totalDays / uniqueVisits.size : 0;

  let countKhamBenh = 0;
  let countDieuTriNgoaiTru = 0;
  let countNoiTru = 0;
  let countKhac = 0;

  // Revenue Variables
  let revenueKhamBenh = 0;
  let revenueDieuTriNgoaiTru = 0;
  let revenueNoiTru = 0;
  let revenueKhac = 0;

  // STRICTLY COUNT FROM THE MAP OF UNIQUE VISITS
  visitTypeMap.forEach((type, maLk) => {
      const t = String(type).trim().toLowerCase();
      const cost = visitCostMap.get(maLk) || 0;

      if (t === '03' || t === '3' || t.includes('nội') || t.includes('noi')) {
          countNoiTru++;
          revenueNoiTru += cost;
      } else if (t === '02' || t === '2' || t.includes('điều trị ngoại') || t.includes('dt ngoai')) {
          countDieuTriNgoaiTru++;
          revenueDieuTriNgoaiTru += cost;
      } else if (t === '01' || t === '1' || (t.includes('khám') && !t.includes('sức khỏe'))) {
          countKhamBenh++;
          revenueKhamBenh += cost;
      } else {
          countKhac++;
          revenueKhac += cost;
      }
  });

  const icdCounts = new Map<string, Set<string>>();
  data.forEach(d => {
    if (!icdCounts.has(d.MA_BENH)) icdCounts.set(d.MA_BENH, new Set());
    icdCounts.get(d.MA_BENH)?.add(d.MA_LK);
  });
  let topICD = 'N/A';
  let maxICDCount = 0;
  icdCounts.forEach((visits, icd) => {
    if (visits.size > maxICDCount) {
      maxICDCount = visits.size;
      topICD = icd;
    }
  });

  const serviceCost = new Map<string, number>();
  data.forEach(d => {
     serviceCost.set(d.DICH_VU, (serviceCost.get(d.DICH_VU) || 0) + d.THANH_TIEN);
  });
  let topService = 'N/A';
  let maxServiceCost = 0;
  serviceCost.forEach((cost, svc) => {
      if (cost > maxServiceCost) {
          maxServiceCost = cost;
          topService = svc;
      }
  });

  return {
    totalVisits: uniqueVisits.size,
    totalPatients: uniquePatients.size,
    totalCost,
    totalRows: data.length,
    activeDepts: uniqueDepts.size,
    activeDoctors: uniqueDocs.size,
    avgTreatmentDays: avgDays,
    topICD,
    topService,
    // Counts
    countKhamBenh,
    countDieuTriNgoaiTru,
    countNoiTru,
    countKhac,
    // Revenue by Visit Type
    revenueKhamBenh,
    revenueDieuTriNgoaiTru,
    revenueNoiTru,
    revenueKhac,
    // Specific Categories
    totalMedicineRevenue,
    totalCDHARevenue,
    totalLabRevenue,
    totalBedRevenue
  };
};

export const generateAlerts = (currentData: MedicalRecord[]): AlertItem[] => {
    const alerts: AlertItem[] = [];
    if (currentData.length === 0) return alerts;

    const maxDate = new Date(Math.max(...currentData.map(d => d.NGAY_THONG_KE.getTime())));
    const prevMonthDate = subMonths(maxDate, 1);

    const currentMonthData = currentData.filter(d => isSameMonth(d.NGAY_THONG_KE, maxDate));
    const prevMonthData = currentData.filter(d => isSameMonth(d.NGAY_THONG_KE, prevMonthDate));

    if (prevMonthData.length === 0) {
        alerts.push({ type: 'info', message: 'Thiếu dữ liệu kỳ trước', detail: 'Không thể so sánh tăng trưởng do thiếu dữ liệu tháng trước trong bộ lọc hiện tại.' });
        return alerts;
    }

    // 1. Dept Cost Alert
    const getDeptCost = (ds: MedicalRecord[]) => {
        const map = new Map<string, number>();
        ds.forEach(d => map.set(d.KHOA, (map.get(d.KHOA) || 0) + d.THANH_TIEN));
        return map;
    };
    const curDeptCost = getDeptCost(currentMonthData);
    const prevDeptCost = getDeptCost(prevMonthData);

    curDeptCost.forEach((cost, dept) => {
        const prev = prevDeptCost.get(dept);
        if (prev && prev > 0) {
            const growth = (cost - prev) / prev;
            if (growth > 0.3) {
                alerts.push({ 
                    type: 'danger', 
                    message: `Khoa ${dept} tăng chi phí cao`, 
                    detail: `Tăng ${(growth * 100).toFixed(1)}% so với tháng trước.` 
                });
            }
        }
    });

    // 2. ICD Visit Alert
    const getICDVisits = (ds: MedicalRecord[]) => {
        const map = new Map<string, Set<string>>();
        ds.forEach(d => {
            if(!map.has(d.MA_BENH)) map.set(d.MA_BENH, new Set());
            map.get(d.MA_BENH)?.add(d.MA_LK);
        });
        return map;
    };
    const curICD = getICDVisits(currentMonthData);
    const prevICD = getICDVisits(prevMonthData);

    curICD.forEach((visits, icd) => {
        const count = visits.size;
        const prevCount = prevICD.get(icd)?.size;
        if (prevCount && prevCount > 10) { 
            const growth = (count - prevCount) / prevCount;
            if (growth > 0.3) {
                alerts.push({
                    type: 'warning',
                    message: `Bệnh ${icd} tăng số lượt`,
                    detail: `Tăng ${(growth * 100).toFixed(1)}% (${count} lượt) so với tháng trước.`
                });
            }
        }
    });

    // 3. Service Cost Alert (New)
    const getServiceCost = (ds: MedicalRecord[]) => {
        const map = new Map<string, number>();
        ds.forEach(d => map.set(d.DICH_VU, (map.get(d.DICH_VU) || 0) + d.THANH_TIEN));
        return map;
    };
    const curSvcCost = getServiceCost(currentMonthData);
    const prevSvcCost = getServiceCost(prevMonthData);

    curSvcCost.forEach((cost, svc) => {
        const prev = prevSvcCost.get(svc);
        // Only alert if previous cost was significant (> 1,000,000 VND) to avoid noise from small items
        if (prev && prev > 1000000) {
            const growth = (cost - prev) / prev;
            if (growth > 0.3) {
                 alerts.push({
                    type: 'danger', 
                    message: `Dịch vụ tăng chi phí bất thường: ${svc}`,
                    detail: `Tăng ${(growth * 100).toFixed(1)}% (${formatCurrency(cost - prev)}) so với tháng trước.`
                });
            }
        }
    });

    return alerts;
};

export const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

export const formatNumber = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val);
};
