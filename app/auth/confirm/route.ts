import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { trackServer } from '@/lib/analytics-server';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

const OTP_TYPES: EmailOtpType[] = ['signup', 'email', 'magiclink', 'recovery', 'email_change'];

/**
 * Target of the confirmation email. Sets the session cookie and sends the user
 * into the workspace. Two inputs are supported:
 * - `code`: the default Supabase template, which needs the browser that signed up.
 * - `token_hash` and `type`: a custom template (needs custom SMTP), which works anywhere.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const requestedNext = searchParams.get('next');
  // Only local paths, so the link cannot be turned into an open redirect.
  const next = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/generate';
  const supabase = await getSupabaseServerClient();

  if (supabase) {
    const { data, error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && type && OTP_TYPES.includes(type)
        ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
        : { data: { user: null }, error: new Error('Missing token') };

    if (!error && data.user) {
      await trackServer(data.user.id, 'signup_completed');
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL('/?auth=confirm-failed', request.url));
}
