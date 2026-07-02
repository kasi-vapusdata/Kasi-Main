import * as dotenv from "dotenv";

export const getEnv = () => {
  const env = process.env.ENV || "prod";

  dotenv.config({
    override: true,
    path: `src/helper/env/.env.${env}`
  });
};
