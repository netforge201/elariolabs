const rateLimitMap = new Map();

export default function rateLimit(ip: string, limit = 5, windowMs = 60000) {
  const now = Date.now();
  const userRecord = rateLimitMap.get(ip);

  if (!userRecord) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true; // Доступ разрешен
  }

  if (now > userRecord.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true; // Время блокировки вышло, сбрасываем счетчик
  }

  if (userRecord.count >= limit) {
    return false; // Лимит превышен, доступ запрещен
  }

  userRecord.count += 1;
  return true;
}