import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarIcon } from "lucide-react"

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Daily Planner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
            <div className="text-center">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">FullCalendar integration coming soon</p>
              <p className="text-sm mt-1">Schedule visits, payment reminders, and follow-ups</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
