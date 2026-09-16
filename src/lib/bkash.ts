import { config } from "../config/index.ts";
import { redisClient } from "./redis.ts";

export const getBkashIdToken = async () => {
  try {
    const IdTokenKey = "bkash:idToken";
    const RefreshTokenKey = "bkash:refreshToken";

    let BkashIdToken = await redisClient.get(IdTokenKey);
    const BkashIdTokenTTL = await redisClient.ttl(IdTokenKey);
    const BkashRefreshToken = await redisClient.get(RefreshTokenKey);
    const BkashRefreshTokenTTL = await redisClient.ttl(RefreshTokenKey);

    if (BkashIdTokenTTL > 600) {
      return BkashIdToken;
    }

    if (
      (BkashIdTokenTTL <= 600 || !BkashIdToken) &&
      BkashRefreshToken &&
      BkashRefreshTokenTTL > 600
    ) {
      const refreshTokenResponse = await fetch(
        `${config.bkash_tokenize_base_url}/tokenized/checkout/token/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: config.bkash_tokenize_user_name,
            password: config.bkash_tokenize_password,
          },
          body: JSON.stringify({
            app_key: config.bkash_tokenize_app_key,
            app_secret: config.bkash_tokenize_app_secret,
            refresh_token: BkashRefreshToken,
          }),
        },
      );
      if (!refreshTokenResponse.ok) {
        throw new Error("Bkash Access Token Grant Failed");
      }

      const bkashRefreshTokenResult = await refreshTokenResponse.json();

      BkashIdToken = bkashRefreshTokenResult.id_token as string;

      await redisClient.set(IdTokenKey, BkashIdToken, {
        expiration: {
          type: "EX",
          value: 60 * 60,
        },
      });

      return BkashIdToken;
    }

    const response = await fetch(
      `${config.bkash_tokenize_base_url}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: config.bkash_tokenize_user_name,
          password: config.bkash_tokenize_password,
        },
        body: JSON.stringify({
          app_key: config.bkash_tokenize_app_key,
          app_secret: config.bkash_tokenize_app_secret,
        }),
      },
    );

    const data = await response.json();
    BkashIdToken = data.id_token;

    await redisClient.set(IdTokenKey, data.id_token, {
      expiration: {
        type: "EX",
        value: 60 * 60, // 1 hour
      },
    });
    await redisClient.set(RefreshTokenKey, data.refresh_token, {
      expiration: {
        type: "EX",
        value: 60 * 60 * 24 * 28, // 28 days
      },
    });

    return BkashIdToken;

    //new token create
  } catch (error) {
    console.error("Failed to get Bkash token from Redis:", error);
    return null;
  }
};
