export const FilterIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className={"size-7 " + className}
    color="currentColor"
  >
    <path
      d="M3 7H6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      opacity="0.4"
      d="M3 17H9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M18 17L21 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      opacity="0.4"
      d="M15 7L21 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M6 7C6 6.06812 6 5.60218 6.15224 5.23463C6.35523 4.74458 6.74458 4.35523 7.23463 4.15224C7.60218 4 8.06812 4 9 4C9.93188 4 10.3978 4 10.7654 4.15224C11.2554 4.35523 11.6448 4.74458 11.8478 5.23463C12 5.60218 12 6.06812 12 7C12 7.93188 12 8.39782 11.8478 8.76537C11.6448 9.25542 11.2554 9.64477 10.7654 9.84776C10.3978 10 9.93188 10 9 10C8.06812 10 7.60218 10 7.23463 9.84776C6.74458 9.64477 6.35523 9.25542 6.15224 8.76537C6 8.39782 6 7.93188 6 7Z"
      stroke="currentColor"
      strokeWidth="1.5"
    ></path>
    <path
      d="M12 17C12 16.0681 12 15.6022 12.1522 15.2346C12.3552 14.7446 12.7446 14.3552 13.2346 14.1522C13.6022 14 14.0681 14 15 14C15.9319 14 16.3978 14 16.7654 14.1522C17.2554 14.3552 17.6448 14.7446 17.8478 15.2346C18 15.6022 18 16.0681 18 17C18 17.9319 18 18.3978 17.8478 18.7654C17.6448 19.2554 17.2554 19.6448 16.7654 19.8478C16.3978 20 15.9319 20 15 20C14.0681 20 13.6022 20 13.2346 19.8478C12.7446 19.6448 12.3552 19.2554 12.1522 18.7654C12 18.3978 12 17.9319 12 17Z"
      stroke="currentColor"
      strokeWidth="1.5"
    ></path>
  </svg>
);

export const ArrowLeft = ({ className = "" }) => (
  <span className={"opacity-50 "}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={"size-6 " + className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  </span>
);
export const ArrowRight = ({ className = "" }) => (
  <span className={"opacity-50 "}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={"size-6 " + className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
      />
    </svg>
  </span>
);
export const Check = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"size-6 " + className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
export const Close = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"size-10 " + className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);
export const Instagram = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"size-8 text-rose-500 " + className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
export const X = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 50 50"
    className={"size-8 text-white " + className}
  >
    <path d="M 5.9199219 6 L 20.582031 27.375 L 6.2304688 44 L 9.4101562 44 L 21.986328 29.421875 L 31.986328 44 L 44 44 L 28.681641 21.669922 L 42.199219 6 L 39.029297 6 L 27.275391 19.617188 L 17.933594 6 L 5.9199219 6 z M 9.7167969 8 L 16.880859 8 L 40.203125 42 L 33.039062 42 L 9.7167969 8 z"></path>
  </svg>
);
export const Telegram = ({ className = "" }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={"size-8 text-blue-500 " + className}
  >
    <path
      d="M27.6132 4.873C27.6132 4.873 30.2032 3.863 29.9866 6.31567C29.9152 7.32567 29.2679 10.861 28.7639 14.6843L27.0372 26.011C27.0372 26.011 26.8932 27.6703 25.5979 27.959C24.3032 28.247 22.3606 26.949 22.0006 26.6603C21.7126 26.4437 16.6046 23.197 14.8059 21.6103C14.3019 21.177 13.7259 20.3117 14.8779 19.3017L22.4319 12.087C23.2952 11.2217 24.1586 9.20167 20.5612 11.6543L10.4879 18.5077C10.4879 18.5077 9.33655 19.2297 7.17855 18.5803L2.50122 17.137C2.50122 17.137 0.774553 16.055 3.72455 14.973C10.9199 11.5823 19.7699 8.11967 27.6119 4.873H27.6132Z"
      fill="currentColor"
    />
  </svg>
);
export const Youtube = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={"size-8 text-red-500 " + className}
    viewBox="0 0 27 20"
  >
    <path fill="none" d="M0 .7h27V20H0z" />
    <path
      fill="currentColor"
      d="m10.7 13.9 7.3-3.8-7.3-3.8v7.6zm2.8-13c1.7 0 3.3 0 4.9.1s2.7.1 3.5.1l1.1.1h.6c.1 0 .2 0 .4.1.2 0 .3.1.4.1.1.1.3.1.4.2.2.1.3.2.5.3.2.1.3.2.4.4.1.1.1.2.2.3.1.1.2.4.4.8.2.5.3 1 .4 1.5.1.6.1 1.3.2 2.1.1.7.1 1.3.1 1.7v2.7c0 1.5-.1 2.9-.3 4.4-.1.6-.2 1.1-.4 1.5-.2.4-.3.8-.5.9l-.2.3c-.1.2-.3.3-.4.4-.2.1-.3.2-.5.3-.2.1-.3.1-.4.2-.1.1-.3.1-.4.1-.2 0-.3.1-.4.1H23c-2.5.2-5.7.3-9.4.3-2.1 0-3.9-.1-5.4-.1s-2.5-.1-3-.1l-.7-.1-.5-.1c-.4-.1-.6-.1-.8-.2-.2-.1-.4-.2-.8-.3l-.9-.6c-.1-.1-.1-.2-.2-.3-.3-.1-.4-.4-.6-.8-.2-.5-.3-1-.4-1.5-.1-.6-.1-1.3-.2-2.1C0 13 0 12.4 0 12V9.3C0 7.9.1 6.4.3 5c.1-.6.2-1.1.4-1.5.1-.5.3-.8.4-1l.2-.3c.2-.1.3-.2.5-.3.2-.1.3-.2.5-.3.2-.1.3-.1.4-.2.1-.1.3-.1.4-.1.2 0 .3-.1.4-.1h.6C6.6 1 9.7.9 13.5.9z"
    />
  </svg>
);
export const Deposit = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={"size-6 " + className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);
export const Play = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"size-6 " + className}
  >
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);
export const Withdraw = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={"size-6 " + className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
    />
  </svg>
);
export const ArrowDown = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={"size-4 " + className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m19.5 8.25-7.5 7.5-7.5-7.5"
    />
  </svg>
);

export const Copy = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={"size-6 " + className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
    />
  </svg>
);
export const Boost = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={"size-5 " + className}
  >
    <path d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
    <path
      fill="#fff"
      d="M5.26 17.242a.75.75 0 1 0-.897-1.203 5.243 5.243 0 0 0-2.05 5.022.75.75 0 0 0 .625.627 5.243 5.243 0 0 0 5.022-2.051.75.75 0 1 0-1.202-.897 3.744 3.744 0 0 1-3.008 1.51c0-1.23.592-2.323 1.51-3.008Z"
    />
  </svg>
);
export const Swap = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"size-5 " + className}
  >
    <path d="m3 16 4 4 4-4" />
    <path d="M7 20V4" />
    <path d="m21 8-4-4-4 4" />
    <path d="M17 4v16" />
  </svg>
);
export const LevelUp = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"size-5 " + className}
  >
    <path d="m17 11-5-5-5 5" />
    <path d="m17 18-5-5-5 5" />
  </svg>
);
export const Crown = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"size-5 " + className}
  >
    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
    <path d="M5 21h14" />
  </svg>
);

export const Energy = ({ className = "" }) => (
  <svg
    className={"size-4 " + className}
    viewBox="0 0 22 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="energy2"
        x1="8.50006"
        y1="-0.000122016"
        x2="13.5001"
        y2="35.4999"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FCD924" />
        <stop offset="1" stopColor="#FF5F1B" />
      </linearGradient>
    </defs>
    <path
      d="M21.7312 14.6825L7.73123 29.6825C7.58287 29.8408 7.38704 29.9466 7.17329 29.9839C6.95953 30.0211 6.73946 29.9879 6.54627 29.8891C6.35308 29.7903 6.19726 29.6314 6.10233 29.4363C6.00739 29.2412 5.97849 29.0205 6.01999 28.8075L7.85248 19.6412L0.648735 16.9362C0.494024 16.8784 0.356059 16.7831 0.247164 16.6589C0.138268 16.5347 0.0618354 16.3854 0.0246932 16.2245C-0.012449 16.0635 -0.00914339 15.8959 0.0343144 15.7365C0.0777721 15.5772 0.160028 15.431 0.273735 15.3112L14.2737 0.311236C14.4221 0.152905 14.6179 0.047125 14.8317 0.00985718C15.0454 -0.0274107 15.2655 0.00585619 15.4587 0.104638C15.6519 0.203419 15.8077 0.362356 15.9026 0.557463C15.9976 0.75257 16.0265 0.973262 15.985 1.18624L14.1475 10.3625L21.3512 13.0637C21.5048 13.122 21.6417 13.2172 21.7497 13.3409C21.8578 13.4646 21.9337 13.613 21.9707 13.773C22.0078 13.933 22.0049 14.0997 21.9622 14.2583C21.9196 14.417 21.8385 14.5626 21.7262 14.6825H21.7312Z"
      fill={`url(#energy2)`}
    />
  </svg>
);
export const Dollar = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"size-5 " + className}
  >
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
export const PressIcon = ({ className = "" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      version="1.1"
      viewBox="0 0 499.42 499.42"
      className={className}
    >
      <g>
        <path d="M277.087,180.337c12.604-13.077,19.558-30.285,19.558-48.467c0-38.499-31.31-69.81-69.809-69.81   c-38.496,0-69.809,31.311-69.809,69.81c0,18.176,6.945,35.39,19.564,48.467c2.226,2.313,2.17,5.998-0.143,8.229   c-1.13,1.087-2.582,1.635-4.034,1.635c-1.528,0-3.042-0.6-4.183-1.784c-14.724-15.256-22.834-35.342-22.834-56.547   c0-44.914,36.532-81.452,81.452-81.452c44.917,0,81.452,36.538,81.452,81.452c0,21.205-8.104,41.291-22.828,56.547   c-2.223,2.32-5.9,2.375-8.227,0.149C274.919,186.328,274.846,182.65,277.087,180.337z M140.803,224.185   c2.292-2.247,2.338-5.931,0.091-8.232c-22.116-22.597-34.3-52.458-34.3-84.082c0-66.296,53.938-120.236,120.236-120.236   c66.295,0,120.234,53.94,120.234,120.236c0,31.63-12.179,61.491-34.301,84.088c-2.247,2.296-2.21,5.979,0.092,8.227   c1.133,1.108,2.606,1.662,4.067,1.662c1.504,0,3.014-0.584,4.159-1.744c24.265-24.786,37.618-57.546,37.618-92.232   C358.7,59.153,299.543,0,226.83,0C154.114,0,94.96,59.153,94.96,131.87c0,34.687,13.363,67.44,37.616,92.227   C134.823,226.389,138.513,226.429,140.803,224.185z M383.654,473.81l-6.681,21.495c-0.755,2.447-3.032,4.115-5.596,4.115   c-0.006,0-0.006,0-0.006,0l-124.414-0.182c-2.451,0-4.628-1.522-5.486-3.807c-0.862-2.283-0.213-4.858,1.632-6.467   c-0.018,0,0.993-1.113,0.911-3.111c-0.085-1.961-1.315-6.187-8.574-12.403c-2.268-2.149-51.055-48.445-71.843-84.657   c-5.742-8.08-48.241-69.216-38.06-96.1c2.408-6.369,7.419-10.644,14.529-12.379c3.206-1.139,6.479-1.717,9.733-1.717   c18.669,0,32.516,18.328,42.624,31.706c2.226,2.959,5.033,6.667,7.134,8.976c0.91-4.074,1.888-13.208,1.79-33.686   c0-0.207,0.006-0.426,0.03-0.646c0.037-0.305,3.105-30.957,3.285-128.828c-1.184-0.244-2.338-0.761-3.203-1.735   c-5.514-6.211-8.549-14.203-8.549-22.521c0-18.712,15.22-33.938,33.932-33.938s33.932,15.226,33.932,33.938   c0,7.389-2.502,14.428-6.901,20.283c0.124,1.184,0.249,2.415,0.387,3.742c1.142,11.305,2.368,26.101,3.659,41.763   c1.692,20.584,3.897,47.246,5.614,59.542c5.078-2.594,12.306-5.352,20.137-5.352c8.616,0,20.222,3.349,28.832,18.371   c4.007-1.529,9.768-3.179,16.1-3.179c10.218,0,23.748,4.183,31.664,23.479c7.185,1.279,23.047,5.389,33.381,17.756   c7.246,8.665,10.363,19.547,9.292,32.37C403.838,348.684,411.061,420.968,383.654,473.81z M204.532,131.87   c0,2.362,0.438,4.664,1.16,6.872c3.574-21.062,12.607-25.815,19.966-25.815c9.931,0,19.129,9.252,23.352,17.747   c-0.643-11.731-10.291-21.103-22.18-21.103C214.527,109.565,204.532,119.573,204.532,131.87z M391.204,341.438   c-0.049-0.42-0.049-0.84-0.012-1.261c0.92-9.84-1.267-18.023-6.516-24.332c-10.235-12.331-29.015-14.157-29.21-14.176   c-2.302-0.213-4.286-1.747-5.035-3.927c-4.402-12.781-11.552-18.986-21.854-18.986c-8.378,0-15.795,4.158-15.868,4.201   c-1.425,0.816-3.16,0.999-4.725,0.481c-1.571-0.512-2.862-1.656-3.532-3.167c-5.042-11.24-11.85-16.708-20.807-16.708   c-10.382,0-20.21,7.331-20.308,7.41c-1.491,1.145-3.446,1.504-5.236,0.968c-5.413-1.607-5.985-1.777-11.886-73.328   c-1.34-16.146-2.887-34.924-4.196-46.829c-0.076-0.387-0.137-0.749-0.131-1.136c-0.53-4.683-1.017-8.205-1.428-9.819   c-0.38-0.587-0.648-1.248-0.804-1.951c-1.212-5.624-8.948-14.237-14.018-14.237c-3.318,0-7.721,5.913-9.28,22.56   c-0.006,101.366-2.947,134.848-3.321,138.647c0.131,31.943-2.128,40.511-6.086,44.487c-1.677,1.687-3.766,2.575-6.049,2.575   c-6.129,0-10.799-6.18-17.869-15.533c-8.625-11.423-20.429-27.048-33.265-27.048c-1.985,0-4.022,0.378-6.038,1.12   c-0.225,0.08-0.459,0.146-0.697,0.207c-4.472,1.035-5.849,3.312-6.567,5.188c-6.092,16.1,19.342,60.916,36.809,85.376   c0.119,0.152,0.216,0.322,0.317,0.499c19.848,34.727,69.182,81.552,69.672,82.015c8.162,6.99,12.415,14.213,12.452,21.275   c0,0.524-0.024,1.023-0.061,1.511l111.386,0.164l5.56-17.865c0.104-0.335,0.23-0.664,0.396-0.98   C400.045,417.26,391.307,342.192,391.204,341.438z" />
      </g>
    </svg>
  );
};

export const MinusIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"size-5 " + className}
  >
    <path d="M5 12h14" />
  </svg>
);
export const PlusIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"size-5 " + className}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);
export const UsersIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"size-5 " + className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
export const CloseIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={"size-8 " + className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);
