
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

// The client you created from the Server-Side Auth instructions

const logDir = './oauth_logs/';
const logFilePath = path.join(logDir, 'oauth_callback_log.txt');

async function logCallbackStep(message: string) {
  try {
    mkdirSync(logDir, { recursive: true }); // Ensure directory exists
    const timestamp = new Date().toISOString();
    writeFileSync(logFilePath, `${timestamp} - ${message}\n`, { flag: 'a+' });
  } catch (error) {
    console.error(`Failed to write to callback log file: ${error}`);
  }
}

export async function GET(request: Request) {
  await logCallbackStep('Callback GET function started.');
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  let errorMessage: string | null = null;

  await logCallbackStep(`Code parameter: ${code}`);

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    // --- Debugging: Save callback data to a file ---
    const logFile = path.join(logDir, 'oauth_callback_data.json');
    try {
      mkdirSync(logDir, { recursive: true }); // Create directory if it doesn't exist
      writeFileSync(logFile, JSON.stringify(data, null, 2), 'utf-8');
      await logCallbackStep(`OAuth callback data saved to ${logFile}`);
    } catch (fileError) {
      await logCallbackStep(`Error saving OAuth callback data to file: ${fileError}`);
    }

    if (error) {
      await logCallbackStep(`Supabase exchangeCodeForSession error: ${error.message}`);
      errorMessage = error.message;
    }
    // --- End Debugging ---

    if (!error) {
      await logCallbackStep('Supabase exchangeCodeForSession successful.');
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        await logCallbackStep(`Redirecting to local: ${origin}${next}`);
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        await logCallbackStep(`Redirecting to forwarded host: https://${forwardedHost}${next}`);
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        await logCallbackStep(`Redirecting to origin: ${origin}${next}`);
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }
  await logCallbackStep(`Redirecting to login with error: ${errorMessage || 'Unknown OAuth callback error'}`);

  // return the user to an error page with instructions
  // If there's an error, you might want to redirect to a login page with an error message
 return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed&message=${encodeURIComponent(errorMessage || 'Unknown OAuth callback error')}`);
}



