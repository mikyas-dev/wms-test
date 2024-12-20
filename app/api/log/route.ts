import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, data } = body

    // Log to server console with timestamp
    const timestamp = new Date().toISOString()
    console.log(`\n[${timestamp}] ${message}`)
    if (data) {
      console.log(JSON.stringify(data, null, 2))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
} 