export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

export class PermissionError extends UserFacingError {
  constructor(message = 'You do not have permission to do that.') {
    super(message);
    this.name = 'PermissionError';
  }
}

export class RateLimitError extends UserFacingError {
  retryAfterSec?: number;
  constructor(message = 'Too many requests. Please slow down.', retryAfterSec?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterSec = retryAfterSec;
  }
}

