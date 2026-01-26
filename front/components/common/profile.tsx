import React from "react";
import { UserPlus, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

type CompleteProfileNoticeProps = {
  onCompleteClick?: (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => void;
};

export default function CompleteProfileNotice({
  onCompleteClick,
}: CompleteProfileNoticeProps) {
  return (
    <div className={" w-full py-5 flex items-start gap-4 "}>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold">Complete your profile</h3>

        <div className="mt-3 text-neutral-500 text-sm text-justify">
          Add a profile photo and your basic information. This helps personalize
          your account and makes it easier for others to recognize and connect
          with you.
        </div>

        <div className="mt-6">
          <Link
            to="/complete"
            className="flex-1 transition-all duration-500 uppercase flex justify-center bg-linear-to-r from-secondary/80 via-brand to-secondary/80 items-center text-white  hover:scale-[1.05] outline-none rounded-3xl  font-medium  py-3"
          >
            complete profile
          </Link>
        </div>
      </div>
    </div>
  );
}
