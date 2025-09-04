import { isPlatformBrowser } from '@angular/common';
import {
  Inject,
  Injectable,
  PLATFORM_ID,
  TransferState,
  makeStateKey,
} from '@angular/core';
import { AUTH_EXPIRATION_TS_KEY } from '../../core.states.key';
import { AuthService } from './auth.service';

const AUTH_EXP_TS_STATE = makeStateKey<number>(AUTH_EXPIRATION_TS_KEY);

@Injectable({ providedIn: 'root' })
export class AuthExpiryService {
  private timer: any | null = null;
  private readonly refreshThresholdMs = 60_000; // refresh 60s before expiry
  private readonly isBrowser: boolean;

  constructor(
    private ts: TransferState,
    private auth: AuthService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  start(): void {
    const exp = this.ts.hasKey(AUTH_EXP_TS_STATE)
      ? this.ts.get(AUTH_EXP_TS_STATE, 0)
      : 0;
    if (exp && exp > 0) {
      // Clear it after reading to avoid reusing stale value on SPA navs
      this.ts.remove(AUTH_EXP_TS_STATE);
      this.scheduleFromExp(exp);
    }
  }

  private scheduleFromExp(expSeconds: number) {
    this.clear();
    const nowMs = Date.now();
    const expMs = expSeconds * 1000;
    const fireIn = Math.max(0, expMs - nowMs - this.refreshThresholdMs);

    if (fireIn <= 0) {
      // Already close to/past expiry -> try refresh immediately
      this.refreshAndReschedule();
    } else {
      this.timer = setTimeout(() => this.refreshAndReschedule(), fireIn);
    }
  }

  private refreshAndReschedule() {
    if (confirm('Token is about to expire. Refresh now?')) {
      this.auth.refresh();
    }
  }

  stop(): void {
    this.clear();
  }

  private clear() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
