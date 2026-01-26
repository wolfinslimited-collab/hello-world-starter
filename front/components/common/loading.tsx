const Svg = ({ className }: { className?: string }) => (
  <svg
    className={"animate-spin text-white " + className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-70"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
    ></circle>
    <path
      className=""
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
const Loading = ({
  className = "",
  relative = false,
  overly = "",
}: {
  className?: string;
  relative?: boolean;
  overly?: string;
}) => {
  if (relative) {
    return (
      <div className={"flex items-center justify-center w-full " + overly}>
        <Svg className={"size-4 " + className} />
      </div>
    );
  }
  return (
    <div
      className={
        "absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center rounded-md " +
        overly
      }
    >
      <Svg className={"size-4 " + className} />
    </div>
  );
};
export default Loading;
