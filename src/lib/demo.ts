// Demo file to trigger ReviewAI on a Pull Request

export function calculateDiscount(price: number, percent: number) {
  // Bug: no validation — percent could be > 100 or negative
  const discount = price * percent / 100;
  return price - discount;
}

export function getUserById(id: string) {
  // Potential issue: no input sanitization
  const query = `SELECT * FROM users WHERE id = '${id}'`;
  console.log('Running query:', query);
  return query;
}

export async function fetchUserData(userId: string) {
  // Missing error handling
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data;
}

export function formatDate(date: Date) {
  // Inconsistent date formatting
  return date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate();
}
