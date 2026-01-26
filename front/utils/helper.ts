export const classes = (...className: any) => className.join(" ");
export const checkProfile = (user: any) => {
  return user.userImages.length === 0 || !user?.userProfile?.age;
};
export const progress = (a: number, b: number) => 100 - ((a - b) / a) * 100;
export const toMoney = (amount: any, join = ",", ret = "") => {
  if ([null, "", undefined].includes(amount)) return ret;
  try {
    const parts = parseFloat(
      parseFloat(amount.toString().replace(/,/g, "")).toFixed(8).toString()
    )
      .toString()
      .split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, join);
    const res = parts.join(".");
    return res;
  } catch (error) {
    return ret;
  }
};
export const env = (key: string) => {
  return import.meta.env[`VITE_${key}`];
};
export const levelUp = (_levelUp: number, currentLevel: number): number => {
  let threshold = _levelUp;

  for (let level = 1; level <= currentLevel; level++) {
    threshold *= 5;
  }

  return threshold;
};
export const formatNumber = (num: number | undefined): string => {
  if (num === undefined || isNaN(num)) {
    return "0"; // Default value or handle the error case
  }

  if (num >= 1e9) {
    return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  } else {
    return num.toString();
  }
};

export const finalPrice = (base: number, x: number) => {
  return base * Math.pow(2, x);
};

export function timing(_date: any) {
  const date = new Date(_date);
  const year = new Intl.DateTimeFormat("en", { year: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("en", { month: "short" }).format(date);
  const day = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
  return `${day} ${month} ${year}`;
}
export function formatNumberK(num: number) {
  if (num < 1000) {
    return num.toString();
  } else {
    return Math.floor(num / 1000) + "k";
  }
}

export const parseInput = (value: any) => {
  try {
    return parseFloat(("" + value).replace(/,/g, "") || "0");
  } catch (error) {
    return 0;
  }
};
export const truncateText = (
  text: string,
  startChars: number,
  endChars: number,
  maxLength: number
): string => {
  try {
    if (text.length <= maxLength) return text;
    const start = text.slice(0, startChars);
    const end = text.slice(-endChars);
    return `${start}...${end}`;
  } catch (error) {
    return "";
  }
};

// export const getImage = (data: any) => {
//   if (data?.telegram) {
//     return removeTrailingSlash(baseUrl) + "/file/telegram/" + data?.telegram;
//   } else {
//     return data?.url;
//   }
// };
const removeTrailingSlash = (url: string) => {
  if (url.endsWith("/")) {
    return url.slice(0, -1);
  }
  return url;
};
export const timeAgo = (date: string | Date): string => {
  if (!date) return "";
  const now = new Date();
  const past = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

export const calculateProfileCompletion = (
  profile: Record<string, any>
): number => {
  const keys = Object.keys(profile);
  let completed = 0;

  for (const key of keys) {
    const value = profile[key];
    if (value !== null && value !== undefined && value !== "") {
      if (Array.isArray(value) && value.length === 0) continue;
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
      )
        continue;
      completed++;
    }
  }
  const percent = Math.round((completed / keys.length) * 100);

  return Math.floor(percent / 5) * 5;
};

export const formatDate = (_date: string): string => {
  const date = new Date(_date);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};
