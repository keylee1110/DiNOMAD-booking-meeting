"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Star } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { submitReview } from "@/lib/api/reviews"

const reviewSchema = z.object({
  rating: z.number().min(1, "Vui lòng chọn số sao").max(5),
  comment: z.string().optional(),
})

type ReviewFormValues = z.infer<typeof reviewSchema>

interface ReviewFormProps {
  roomId: string
  bookingId: string
  accessToken: string
  onSuccess?: () => void
}

export function ReviewForm({ roomId, bookingId, accessToken, onSuccess }: ReviewFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: "" },
  })

  const onSubmit = async (values: ReviewFormValues) => {
    try {
      setIsLoading(true)
      await submitReview({
        roomId,
        bookingId,
        rating: values.rating,
        comment: values.comment,
      }, accessToken)

      toast({
        title: "Thành công!",
        description: "Cảm ơn bạn đã gửi đánh giá.",
      })
      onSuccess?.()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Thất bại",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chất lượng phòng</FormLabel>
              <FormControl>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => field.onChange(star)}
                      className={`p-1 transition-colors ${
                        field.value >= star ? "text-yellow-500" : "text-gray-300"
                      }`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bình luận (Tuỳ chọn)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Chia sẻ trải nghiệm của bạn về căn phòng này..." 
                  {...field} 
                  rows={4} 
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Đang gửi..." : "Gửi Đánh Giá"}
        </Button>
      </form>
    </Form>
  )
}