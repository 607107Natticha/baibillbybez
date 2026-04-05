// Helper functions สำหรับจัดการวันที่

// แปลง Date object หรือ ISO string เป็น DD/MM/YYYY
export const formatDateThai = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// แปลง Date object หรือ ISO string เป็น DD/MM/YYYY (พ.ศ.)
export const formatDateThaiWithBE = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
  return `${day}/${month}/${year}`;
};

// แปลง DD/MM/YYYY เป็น YYYY-MM-DD (สำหรับ input[type="date"])
export const parseDateThai = (thaiDate) => {
  if (!thaiDate) return '';
  const [day, month, year] = thaiDate.split('/');
  return `${year}-${month}-${day}`;
};

// แปลง Date object เป็น YYYY-MM-DD (สำหรับ input[type="date"])
export const formatDateISO = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toISOString().split('T')[0];
};
