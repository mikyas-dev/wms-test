import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password === process.env.SITE_PASSWORD) {
    // Set cookie
    cookies().set('auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })

    return new NextResponse('Success', { status: 200 })
  }

  return new NextResponse('Unauthorized', { status: 401 })
} 