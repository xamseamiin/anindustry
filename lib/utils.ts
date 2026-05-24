// lib/utils.ts - General Utility Functions

/**
 * Shaqo lagu qaabeeyo lacagta.
 * @param amount - Qiimaha lacagta.
 * @param currency - Nooca lacagta (default: ETB).
 * @returns Lacagta oo qaabaysan.
 */
export const formatCurrency = (amount: number, currency: string = 'ETB'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Shaqo lagu qaabeeyo taariikhda.
 * @param dateString - Taariikhda qaab string ah.
 * @param format - Qaabka taariikhda (e.g., 'DD/MM/YYYY').
 * @returns Taariikhda oo qaabaysan.
 */
export const formatDate = (dateString: string, format: string = 'YYYY-MM-DD'): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`;
  }
};

/**
 * Shaqo lagu xaqiijiyo qaabka email-ka.
 * @param email - Email-ka la xaqiijinayo.
 * @returns run/been.
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Shaqo lagu xisaabiyo boqolleyda.
 * @param part - Qaybta.
 * @param total - Wadarta.
 * @returns Boqolleyda.
 */
export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return (part / total) * 100;
};

/**
 * Shaqo lagu xisaabiyo qiimaha hoos u dhaca (depreciation) ee hantida.
 * @param initialValue - Qiimaha hore.
 * @param depreciationRate - Boqolleyda hoos u dhaca sannadkii (tusaale, 0.10 for 10%).
 * @param yearsInUse - Tirada sanooyinka la isticmaalay.
 * @returns Qiimaha buuga ee hadda.
 */
export const calculateBookValue = (initialValue: number, depreciationRate: number, yearsInUse: number): number => {
  const depreciatedValue = initialValue * (1 - depreciationRate * yearsInUse);
  return Math.max(0, depreciatedValue); // Qiimaha buuga ma noqon karo mid ka yar eber
};

/**
 * Shaqo lagu soo koobo qoraal dheer.
 * @param text - Qoraalka.
 * @param maxLength - Tirada ugu badan ee xarfaha.
 * @returns Qoraalka oo soo kooban.
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Shaqo lagu xisaabiyo wadarta mushahaarka shaqaalaha.
 * @param monthlySalary - Mushahaarka bilaha ah.
 * @param startDate - Taariikhda uu shaqaalaha bilaabay.
 * @param currentDate - Taariikhda hadda (default: today).
 * @param salaryPaidThisMonth - Lacagta la bixiyay bishan (default: 0).
 * @returns Object with total salary owed, months worked, and remaining amount.
 */
export const calculateEmployeeSalary = (
  monthlySalary: number,
  startDate: string | Date,
  currentDate: string | Date = new Date(),
  salaryPaidThisMonth: number = 0
) => {
  const start = new Date(startDate);
  const current = new Date(currentDate);
  
  // Calculate months worked (including current month)
  const yearDiff = current.getFullYear() - start.getFullYear();
  const monthDiff = current.getMonth() - start.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff + 1; // +1 to include current month
  
  // Calculate total salary owed
  const totalSalaryOwed = monthlySalary * totalMonths;
  
  // Calculate remaining salary (total owed minus what's been paid this month)
  const remainingSalary = totalSalaryOwed - salaryPaidThisMonth;
  
  return {
    totalMonths,
    totalSalaryOwed,
    remainingSalary,
    monthlySalary,
    salaryPaidThisMonth
  };
};

/**
 * Shaqo lagu xisaabiyo maalmaha aan la bixin ee bilihii hore iyo maalmaha shaqeeyay bishan.
 * @param monthlySalary - Mushahaarka bilaha ah.
 * @param startDate - Taariikhda uu shaqaalaha bilaabay.
 * @param currentDate - Taariikhda hadda (default: today).
 * @param salaryPaidThisMonth - Lacagta la bixiyay bishan (default: 0).
 * @returns Object with detailed day calculations including unpaid days from previous months.
 */
export const calculateEmployeeDays = (
  monthlySalary: number,
  startDate: string | Date,
  currentDate: string | Date = new Date(),
  salaryPaidThisMonth: number = 0
) => {
  const start = new Date(startDate);
  const current = new Date(currentDate);
  
  // Calculate total months worked
  const yearDiff = current.getFullYear() - start.getFullYear();
  const monthDiff = current.getMonth() - start.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff + 1;
  
  // Calculate days in current month
  const daysInCurrentMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  
  // Calculate days worked this month
  let daysWorkedThisMonth = 0;
  if (current.getMonth() === start.getMonth() && current.getFullYear() === start.getFullYear()) {
    // If started in current month
    daysWorkedThisMonth = current.getDate() - start.getDate() + 1;
  } else {
    // If started in previous month, count all days up to today
    daysWorkedThisMonth = current.getDate();
  }
  daysWorkedThisMonth = Math.max(0, daysWorkedThisMonth);
  
  // Calculate daily rate
  const dailyRate = monthlySalary / daysInCurrentMonth;
  
  // Calculate total days that should have been worked (all previous months + current month)
  let totalDaysShouldWork = 0;
  
  // Add days from previous complete months
  for (let i = 0; i < totalMonths - 1; i++) {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    totalDaysShouldWork += daysInMonth;
  }
  
  // Add days from current month
  totalDaysShouldWork += daysWorkedThisMonth;
  
  // Calculate total days that should have been paid for
  const totalDaysShouldBePaid = totalDaysShouldWork;
  
  // Calculate how many days have been paid for based on salary paid
  const daysPaidFor = salaryPaidThisMonth > 0 ? Math.floor(salaryPaidThisMonth / dailyRate) : 0;
  
  // Calculate unpaid days from previous months
  const unpaidDaysFromPreviousMonths = Math.max(0, totalDaysShouldBePaid - daysWorkedThisMonth - daysPaidFor);
  
  // Calculate total unpaid days
  const totalUnpaidDays = Math.max(0, totalDaysShouldBePaid - daysPaidFor);
  
  // Calculate earned this month
  const earnedThisMonth = dailyRate * daysWorkedThisMonth;
  
  // Calculate overpaid amount
  const overpaidAmount = Math.max(0, salaryPaidThisMonth - earnedThisMonth);
  
  return {
    totalMonths,
    daysInCurrentMonth,
    daysWorkedThisMonth,
    dailyRate: parseFloat(dailyRate.toFixed(2)),
    totalDaysShouldWork,
    totalDaysShouldBePaid,
    daysPaidFor,
    unpaidDaysFromPreviousMonths,
    totalUnpaidDays,
    earnedThisMonth: parseFloat(earnedThisMonth.toFixed(2)),
    overpaidAmount: parseFloat(overpaidAmount.toFixed(2)),
    monthlySalary,
    salaryPaidThisMonth
  };
};

// Add more utility functions as needed (e.g., data validation, string manipulation, array helpers)
