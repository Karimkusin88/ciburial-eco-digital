import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cwd = process.cwd();
    // Try to execute git pull
    const output = execSync('git pull origin main', { cwd, encoding: 'utf8' });
    return NextResponse.json({ success: true, output });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message, 
      stdout: error.stdout, 
      stderr: error.stderr,
      cwd: process.cwd()
    });
  }
}
