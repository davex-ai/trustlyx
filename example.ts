
const sdk = new AuthSDK({
  jwtSecret: "secret",
  refreshSecret: "refresh",
  appUrl: "http://localhost:3000",
  adapters: {
    email: new ResendAdapter("API_KEY"),
    cache: new RedisAdapter(redisClient)
  },
  getTenant: (req) => req.headers["x-tenant-id"],
});
