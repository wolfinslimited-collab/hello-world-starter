import React from "react";
import logo from "assets/images/logo.png";
import { env } from "utils/helper";
import { json } from "utils/request";
import useStorage from "context";
import { toast } from "react-toastify";
import { t } from "locales";

const PreError: React.FC = () => {
  return (
    <div className="flex flex-col flex-1 justify-center items-center size-full overflow-hidden">
      <div className="preloading size-32 relative">
        <div className="relative size-full flex justify-center items-center">
          <img alt="logo" src={logo} />
        </div>
      </div>
      <div className="flex flex-col gap-5 mt-4 items-center animate-fade">
        <span>We're updating — back soon!</span>
      </div>
    </div>
  );
};

export default PreError;
