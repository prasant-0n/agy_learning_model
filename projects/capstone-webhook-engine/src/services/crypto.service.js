import crypto from 'node:crypto';

export class CryptoService {
  static computeSignature(secret, timestamp, rawBody) {
    const payload = `${timestamp}.${typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody)}`;
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  static verifySignature(secret, timestamp, rawBody, providedSignature) {
    if (!providedSignature || typeof providedSignature !== 'string') {
      return false;
    }

    const expectedSignature = this.computeSignature(secret, timestamp, rawBody);
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const providedBuf = Buffer.from(providedSignature, 'utf8');

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  }
}
