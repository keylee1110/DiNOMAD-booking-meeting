export async function submitReview(data: { roomId: string; bookingId: string; rating: number; comment?: string }, token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || "Lỗi khi gửi đánh giá")
  }

  return response.json()
}