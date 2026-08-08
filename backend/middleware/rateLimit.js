const buckets = new Map();

const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 10 } = {}) => (req, res, next) => {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (now >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  buckets.set(key, bucket);

  res.set('RateLimit-Remaining', Math.max(0, max - bucket.count));
  if (bucket.count > max) {
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }
  next();
};

module.exports = rateLimit;
