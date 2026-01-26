const Footer = () => {
  return (
    <div className="pt-8 px-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row justify-between text-sm text-neutral-500 dark:text-neutral-400 gap-4">
      <p>© 2024 Timetrade . All rights reserved.</p>

      <div className="flex items-center gap-6">
        <a
          href="#"
          className="hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Privacy Policy
        </a>
        <a
          href="#"
          className="hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Terms of Service
        </a>
        <div className="bg-neutral-900 dark:bg-neutral-300 h-4 w-[2px] rounded-md" />
        {/* Social Icons */}
        <div className="flex gap-4 items-center">
          {/* X (Twitter) */}
          <a
            href="https://x.com/timetradedex"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
            aria-label="X (Twitter)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.809 17.727L8.85769 12.1705L3.91109 17.727H1.81836L7.92924 10.8646L1.81836 2.27246H7.19131L10.9154 7.50946L15.5816 2.27246H17.6743L11.847 8.8171L18.182 17.727H12.809ZM15.1395 16.1605H13.7306L4.81483 3.83899H6.22394L9.79478 8.77261L10.4123 9.62873L15.1395 16.1605Z"
                fill="currentColor"
              />
            </svg>
          </a>

          {/* Telegram */}
          <a
            href="https://t.me/timetradedex"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
            aria-label="Telegram"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0ZM14.0889 6.02051C13.7127 6.02713 13.1355 6.22772 10.3584 7.38281C9.38572 7.78739 7.44147 8.62447 4.52637 9.89453C4.05313 10.0827 3.8048 10.2672 3.78223 10.4473C3.73929 10.7927 4.23731 10.9 4.86328 11.1035C5.37386 11.2695 6.06092 11.464 6.41797 11.4717C6.74173 11.4786 7.10304 11.3452 7.50195 11.0713C10.2257 9.23267 11.6324 8.30324 11.7207 8.2832C11.7829 8.26908 11.8694 8.25185 11.9277 8.30371C11.9857 8.35579 11.9798 8.45413 11.9736 8.48047C11.9205 8.69437 9.37008 11.0143 9.21875 11.1709C8.65613 11.7553 8.01594 12.1131 9.00293 12.7637C9.85712 13.3266 10.3545 13.6859 11.2344 14.2627C11.7967 14.6313 12.2379 15.0688 12.8184 15.0156C13.0856 14.991 13.3618 14.7396 13.502 13.9902C13.8332 12.2192 14.4843 8.38201 14.6348 6.80078C14.6479 6.66225 14.6315 6.48506 14.6182 6.40723C14.6049 6.3295 14.5774 6.21877 14.4766 6.13672C14.3568 6.03958 14.1717 6.01909 14.0889 6.02051Z"
                fill="currentColor"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
