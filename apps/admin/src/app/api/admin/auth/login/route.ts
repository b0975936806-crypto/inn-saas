import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // TODO: Replace with actual authentication logic
    // For demo purposes, accept any credentials in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        token: "demo-token",
        user: {
          id: "1",
          email,
          name: "管理員",
          role: "admin",
        },
      })
    }

    // Production authentication logic would go here
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}