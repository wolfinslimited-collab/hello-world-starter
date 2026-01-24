import { error, ERRORS } from "../helpers/reply";
import { getString, markUserOnline } from "../helpers/redis";
import { getUser } from "../services/user.service";

export const optionalAuthenticate = async (request, reply) => {
  const authHeader = request.headers["authorization"];
  const token = authHeader ? authHeader.split(" ")[1] : request?.body?.token;
  if (token) {
    const userId = await getString(`dex_auth_${token}`);
    if (userId) {
      markUserOnline(String(userId));
      const user = await getUser(Number(userId));
      request.user = user;
    }
  }
  // const { user } = userLogin;
};
