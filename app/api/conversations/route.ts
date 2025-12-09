import { NextRequest, NextResponse } from "next/server";

const GET_CONVERSATIONS_URL =
  "https://getconversations-ieskeqprjq-uc.a.run.app";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get("phone");
    const date = searchParams.get("date");
    const startAfter = searchParams.get("startAfter");

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 },
      );
    }

    const url = new URL(GET_CONVERSATIONS_URL);
    url.searchParams.set("phone", phone);
    url.searchParams.set("type", "Whatsapp agent");
    
    if (date) {
      url.searchParams.set("date", date);
    }
    
    if (startAfter) {
      url.searchParams.set("startAfter", startAfter);
    }

    console.log("Fetching conversations from:", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          phone: phone,
          totalReturned: 0,
          hasMore: false,
          nextStartAfter: null,
          messages: [],
        });
      }
      return NextResponse.json(
        { success: false, error: "Failed to fetch conversations" },
        { status: response.status },
      );
    }

    const data = await response.json();
    
    if (data.success === false) {
      return NextResponse.json({
        success: true,
        phone: phone,
        totalReturned: 0,
        hasMore: false,
        nextStartAfter: null,
        messages: [],
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
