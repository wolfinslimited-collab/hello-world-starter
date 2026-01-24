var JSONbig = require("json-bigint");

export const formatGifts = (gifts) => {
  const entries = Object.entries(gifts);
  return entries.map(([name, amount]) => `${amount} ${name}`).join(", ");
};

// Custom replacer function to handle BigInt
function replacer(key: string, value: any): any {
  return typeof value === "bigint"
    ? { type: "BigInt", value: value.toString() }
    : value;
}

// Custom reviver function to handle BigInt
function reviver(key: string, value: any): any {
  return value && value.type === "BigInt" ? BigInt(value.value) : value;
}

export const JSONstringify = (obj: any): string => {
  return JSONbig.stringify(obj, replacer);
};

// Method to parse a JSON string with BigInt support
export const JSONparse = (jsonString: string): any => {
  return JSONbig.parse(jsonString, reviver);
};
