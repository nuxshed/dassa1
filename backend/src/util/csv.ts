export const tocsv = (data: any[], headers: string[]): string => {
  const escape = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}`;
    }
    return str;
  }

  const rows = [headers.join(',')];

  for (const row of data) {
    const vals = headers.map(h => escape(row[h]));
    rows.push(vals.join(','));
  }

  return rows.join('\n');
}
