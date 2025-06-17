import rateLimit from "express-rate-limit";
import helmet from "helmet";
import xss from "xss-clean";

export const applySecurityMiddlewares = (app) => {
  // Set security headers
  app.use(helmet());

  // Prevent XSS attacks
  app.use(xss());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: "Too many requests from this IP, please try again later",
  });

  app.use(limiter);
};
