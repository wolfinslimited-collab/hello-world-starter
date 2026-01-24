import { FastifyReply, FastifyRequest } from "fastify";
import axios from "axios";
import { error, success } from "../helpers/reply";
const path = require("path");
const fs = require("fs");
const _dir = path.join(__dirname, "../../files/");

export const file = async (request, reply: FastifyReply) => {
  try {
    const { folder, name } = request.params;
    const _file = `${_dir}/${folder}/${name}`;
    const buffer = fs.readFileSync(_file);
    reply.type("image/jpeg").send(buffer);
  } catch (err) {
    console.log(err);
    error(reply, "ERROR500", err);
  }
};
