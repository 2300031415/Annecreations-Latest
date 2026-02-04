// Helper function to get date range that covers whole day in IST
const getDateRangeIST = (dateFrom?: string, dateTo?: string) => {
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (dateFrom) {
    // Parse the date string and create IST date
    const [year, month, day] = dateFrom.split('-').map(Number);
    // Create UTC date that represents IST midnight (IST is UTC+5:30)
    // IST midnight = UTC 18:30 of previous day
    startDate = new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0, 0));
  }

  if (dateTo) {
    // Parse the date string and create IST date
    const [year, month, day] = dateTo.split('-').map(Number);
    // Create UTC date that represents IST end of day (IST is UTC+5:30)
    // IST 23:59:59 = UTC 18:29:59 of same day
    endDate = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));
  }

  return { startDate, endDate };
};

const getDateStartIST = (date?: string) => {
  let startDate: Date | undefined;

  if (date) {
    // Parse the date string and create IST date
    const [year, month, day] = date.split('-').map(Number);
    // Create UTC date that represents IST midnight (IST is UTC+5:30)
    // IST midnight = UTC 18:30 of previous day
    startDate = new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0, 0));
  }

  return startDate;
};

const getDateEndIST = (date?: string) => {
  let endDate: Date | undefined;
  if (date) {
    // Parse the date string and create IST date
    const [year, month, day] = date.split('-').map(Number);
    // Create UTC date that represents IST end of day (IST is UTC+5:30)
    // IST 23:59:59 = UTC 18:29:59 of same day
    endDate = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));
  }
  return endDate;
};

const formatDateIST = (date: Date | null) => {
  if (!date) return null;
  return date.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });
};

// Helper function to get date range that ignores time (in IST)
const getDateRangeDaysAgo = (days: number) => {
  const now = new Date();

  // Get current IST date
  const istOffset = 5.5 * 60; // IST is UTC+5:30
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + istOffset * 60000);

  // Get IST date components
  const istYear = istTime.getFullYear();
  const istMonth = istTime.getMonth();
  const istDay = istTime.getDate();

  // End date: IST end of today = UTC 18:29:59 of same day
  const endDate = new Date(Date.UTC(istYear, istMonth, istDay, 18, 29, 59, 999));

  // Start date: IST start of (X-1) days ago = UTC 18:30 of (X-1) days ago
  // This ensures we include X days total (including today)
  const startIstTime = new Date(istTime);
  startIstTime.setDate(startIstTime.getDate() - (days - 1));
  const startIstYear = startIstTime.getFullYear();
  const startIstMonth = startIstTime.getMonth();
  const startIstDay = startIstTime.getDate();
  const startDate = new Date(Date.UTC(startIstYear, startIstMonth, startIstDay - 1, 18, 30, 0, 0));

  return { startDate, endDate };
};

export { getDateRangeIST, getDateStartIST, getDateEndIST, formatDateIST, getDateRangeDaysAgo };
