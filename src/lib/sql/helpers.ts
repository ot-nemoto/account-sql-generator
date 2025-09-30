export const q = (s: string | number | null) =>
  s === null ? "NULL" : `'${String(s).replace(/'/g, "''")}'`;

export const defaultMailDomain = "kankouyohou.com";
export const defaultZip = "105-0001";
export const defaultCityName = "港区";
export const defaultAddress = "虎ノ門3-1-1";
export const defaultPhone = "012-345-6789";
