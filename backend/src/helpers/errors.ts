export const StatusCode = {
  INTERNAL_SERVER_ERROR: 200,
  BAD_RERQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN_ACCESS: 403,
  UNAUTHORIZED: 401,
  TO_MANY_REQUEST: 409,
};

export class IResponseException extends Error {
  statusCode: number;
  message: string;
  name: string;
}

export class InternalServerErrorException extends IResponseException {
  statusCode = StatusCode.INTERNAL_SERVER_ERROR;
  name = "INTERNAL_SERVER_ERROR";
  message = "Internal server error!";
}

export class ForbiddenErrorException extends IResponseException {
  statusCode = StatusCode.FORBIDDEN_ACCESS;
  name = "FORBIDDEN_ACCESS";
  message = "you don't have permission to access this resource!";
}

export class UnAuthorizedErrorException extends IResponseException {
  statusCode = StatusCode.UNAUTHORIZED;
  name = "UNAUTHORIZED";
  message = "unauthorized!";
}

export class ToManyRequestErrorException extends IResponseException {
  statusCode = StatusCode.TO_MANY_REQUEST;
  name = "TO_MANY_REQUEST";
  message = "to many request!";
}

export class InvalidVerifyTokenErrorException extends IResponseException {
  statusCode = StatusCode.BAD_RERQUEST;
  name = "INVALID_VERIFY_TOKEN";
  message = "Invalid verify token!";
}

export class WrongVerifyCodeErrorException extends IResponseException {
  statusCode = StatusCode.BAD_RERQUEST;
  name = "WRONG_VERIFY_CODE";
  message = "wrong verify code!";
}

export class AlreadyExistsErrorException extends IResponseException {
  statusCode = StatusCode.BAD_RERQUEST;
  name = "ALREADY_EXISTS";
  message = "already exists!";
}

export class BadRequestException extends IResponseException {
  statusCode = StatusCode.BAD_RERQUEST;
  name = "BADREQUEST";
  message = "request data is wrong !!";
}

export class IncorrectEmailOrPasswordException extends IResponseException {
  statusCode = StatusCode.BAD_RERQUEST;
  name = "INCORRECT_EMAIL_OR_PASSWORD";
  message = "incorrect email or password";
}

export class RoleNotFoundException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "ROLE_NOT_FOUND";
  message = "Role not found!";
}

export class EntityNotFoundException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "ENTITY_NOT_FOUND";
  message = "Entity not found!";
}

export class AssetNetworkNotFoundException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "ASSET_NETWORK_NOT_FOUND";
  message = "Asset network not found!";
}

export class NetworkNotFoundException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "NETWORK_NOT_FOUND";
  message = "Network not found!";
}

export class TicketNotFoundException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "TICKET_NOT_FOUND";
  message = "Ticket not found!";
}

export class NotFoundException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "NOT_FOUND";
  message = "Not found!";
}

export class TransactionNotFoundException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "TRANSACTION_NOT_FOUND";
  message = "Transaction not found!";
}

export class FileNotFoundException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "FILE_NOT_FOUND";
  message = "File not found!";
}

export class AlreadyExistsTransactionErrorException extends IResponseException {
  statusCode = StatusCode.BAD_RERQUEST;
  name = "ALREADY_TRANSACTION_EXISTS";
  message = "Your transaction has already been registered!";
};

export class InvalidWalletAddressErrorException extends IResponseException {
  statusCode = StatusCode.BAD_RERQUEST;
  name = "INVALID_WALLET_ERROR";
  message = "Wallets are inconsistent!";
};

export class AssetNotFoundException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "ASSET_NOT_FOUND";
  message = "Asset not found!";
}

export class MinWithdrawException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "MIN_WITHDRAW";
  message = "withdraw amount isn't valid!";
}

export class MonoAssetNotFoundException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "MONO_ASSET_NOT_FOUND";
  message = "mono asset not found!";
}

export class LowWalletBalanceException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "LOW_WALLET_BALANCE";
  message = "low wallet balance!";
}

export class WithdrawException extends IResponseException {
  statusCode = StatusCode.NOT_FOUND;
  name = "WithdrawException";
  message = "invalid withdraw amount!";
}