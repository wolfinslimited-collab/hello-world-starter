// components/FormInputs.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Search, MapPin } from "lucide-react";
import Loading from "./loading";

const fieldMotion = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export const Input = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: any;
  onChange: (val: any) => void;
  type?: string;
  placeholder?: string;
}) => (
  <motion.div {...fieldMotion} className="flex flex-col gap-1 w-full">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-primary/60 bg-white/50 px-4 py-3 text-neutral-600 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition"
    />
  </motion.div>
);

export const Select = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: any;
  onChange: (val: any) => void;
  options: string[];
}) => (
  <motion.div {...fieldMotion} className="flex flex-col gap-1 w-full">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-primary/60 bg-white/50 px-4 py-3 text-gray-800 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition"
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </motion.div>
);

export const TextArea = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: any;
  onChange: (val: any) => void;
  placeholder?: string;
}) => (
  <motion.div {...fieldMotion} className="flex flex-col gap-1 w-full">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full rounded-2xl border border-primary/60 bg-white/50 px-4 py-3 text-gray-800 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition"
    />
  </motion.div>
);

export function ChoiceGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-4 capitalize py-2 capitalize rounded-full transition-all duration-300 text-sm shadow-sm ${
                active
                  ? "bg-primary text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {opt.toLocaleLowerCase().replace("_", "")}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function TagInput({
  label,
  values,
  onChange,
  placeholder = "Type and press Enter",
}: {
  label: string;
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const addTag = (val: string) => {
    if (val.trim() && !values.includes(val.trim())) {
      onChange([...values, val.trim()]);
    }
    setInput("");
  };

  const removeTag = (val: string) => {
    onChange(values.filter((v) => v !== val));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-primary/60 bg-white/50 p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary">
        {values.map((tag) => (
          <motion.span
            key={tag}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-sm shadow-sm"
          >
            {tag}
            <X
              size={14}
              className="cursor-pointer hover:text-red-300"
              onClick={() => removeTag(tag)}
            />
          </motion.span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-gray-800 placeholder-gray-400"
        />
      </div>
    </div>
  );
}

type location = { lat: string; lng: string };
type allLocation = SelectedLocation | location | null;
export type SelectedLocation = {
  country?: string;
  city?: string;
  location: location;
};
type LocationPickerProps = {
  label?: string;
  value?: allLocation;
  onChange: (val: allLocation) => void;
};
type LocationResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    country?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
};

export default function LocationPicker({
  label,
  value,
  onChange,
}: LocationPickerProps) {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const [geoFailed, setGeoFailed] = useState(false);
  const [search, setSearch] = useState(true);

  const setData = async (lat: any, lng: any) => {
    setGeoFailed(true);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    setGeoFailed(false);

    const city =
      data.address.city ||
      data.address.town ||
      data.address.village ||
      data.address.state ||
      "Unknown";

    const country = data.address.country || "Unknown";

    const locationObj: SelectedLocation = {
      country,
      city,
      location: { lat: lat.toString(), lng: lng.toString() },
    };
    setSelected(locationObj);
    onChange?.(locationObj);
  };

  useEffect(() => {
    if (value && "lat" in value) {
      setData(value?.lat, value?.lng);
    } else if (value?.city && value?.country && value?.location) {
      setSelected(value);
    } else {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            setData(lat, lng);
          } catch (err) {
            console.error("Reverse geocoding error:", err);
            setGeoFailed(true);
          } finally {
            setLoading(false);
            setSearch(false);
          }
        },
        (err) => {
          console.warn("Geolocation error:", err);
          setGeoFailed(true);
          setLoading(false);
          setSearch(false);
        }
      );
    }
  }, [value]);

  const getLocationByCity = async (cityName: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
          cityName
        )}&format=json&addressdetails=1&limit=10`
      );
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Error fetching location:", err);
    } finally {
      setLoading(false);
    }
  };

  const xsearch = () => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    getLocationByCity(query.trim());
  };
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const delay = setTimeout(() => {
      getLocationByCity(query.trim());
    }, 1000);

    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = (loc: LocationResult) => {
    const city =
      loc.address?.city ||
      loc.address?.town ||
      loc.address?.village ||
      loc.address?.state ||
      "Unknown";

    const country = loc.address?.country || "Unknown";

    const locationObj: SelectedLocation = {
      country,
      city,
      location: { lat: loc.lat, lng: loc.lon },
    };

    setSelected(locationObj);
    setQuery("");
    setResults([]);
    onChange?.(locationObj);
  };

  const reset = () => {
    setSelected(null);
    onChange?.(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="w-full flex min-h-12 items-center gap-2 rounded-2xl border border-primary/60 bg-white/50 px-3 py-3 relative">
        {selected && (
          <div className="flex-1 flex items-center gap-2 p-3 rounded-2xl bg-black/5">
            <MapPin className="text-primary size-7" />
            <div className="text-sm flex-1">
              <strong>{selected.city}</strong>, {selected.country} <br />
              <span className="text-xs text-gray-500">
                Lat: {selected.location.lat}, Lng: {selected.location.lng}
              </span>
            </div>
            <X onClick={reset} className="size-6 hover:text-primary" />
          </div>
        )}

        {geoFailed && !selected && (
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 w-full">
              {search ? (
                <div className="flex-1 text-sm">Detecting your location...</div>
              ) : (
                <input
                  type="text"
                  placeholder="Search for a city..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none p-1"
                />
              )}
            </div>
            <div className="size-5">
              {loading ? (
                <Loading relative className="size-5 !text-black" />
              ) : (
                <Search onClick={xsearch} className="size-5 text-gray-700" />
              )}
            </div>
          </div>
        )}

        {/* Dropdown Results */}
        {results.length > 0 && (
          <ul className="absolute top-14 inset-x-0 max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg z-50">
            {results.map((loc, idx) => (
              <li
                key={idx}
                onClick={() => handleSelect(loc)}
                className="p-3 cursor-pointer hover:bg-gray-100 text-sm text-gray-800"
              >
                📍 {loc.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
