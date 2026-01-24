const IPBASE_API_KEY = process.env.IPBASE_API_KEY;

export async function getIpInfo(ip: string) {
  const emptyData = {
    ip: "",
    country_code: "",
    country_name: "",
    city: "",
    latitude: "",
    longitude: "",
  };

  if (!ip) return emptyData;

  try {
    const url = `https://api.ipbase.com/v2/info?ip=${ip}${
      IPBASE_API_KEY ? `&apikey=${IPBASE_API_KEY}` : ""
    }`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const json = await res.json();

    const data = json?.data || {};
    const location = data.location || {};

    return {
      ip: data.ip || "",
      country_code: location.country?.alpha2 || "",
      country_name: location.country?.name || "",
      city: location.city?.name || "",
      latitude: String(location.latitude ?? ""),
      longitude: String(location.longitude ?? ""),
    };
  } catch (err) {
    console.error("getIpInfo error:", err.message);
    return emptyData;
  }
}
