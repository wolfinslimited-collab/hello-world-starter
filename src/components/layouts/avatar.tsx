import { baseUrl } from "utils/request";
import Avatar from "boring-avatars";

const TheAvatar = ({ user, size = 40 }: { user: any; size?: number }) => {
  const name = user?.fullName || " ";
  return (
    <div className="flex relative justify-center items-center  size-full overflow-hidden">
      <div className="opacity-70">
        <Avatar
          name={name}
          size={size}
          colors={["#ffffff", "#000000", "#277F64", "#7ac2e6", "#ca73e2"]}
          variant="pixel"
        />
      </div>
      <div
        style={{
          backgroundImage: `url(${getTelegramImg(user?.telegramId)})`,
        }}
        className="absolute w-full h-full bg-cover	"
      />
    </div>
  );
};

const getTelegramImg = (id: number) => {
  return removeTrailingSlash(baseUrl) + "/file/telegram/" + id;
};
const removeTrailingSlash = (url: string) => {
  if (url.endsWith("/")) {
    return url.slice(0, -1);
  }
  return url;
};
export default TheAvatar;
