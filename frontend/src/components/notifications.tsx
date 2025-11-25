"use client"

import { useState, useEffect } from "react"
import { Bell, X, Info, AlertTriangle, CreditCard, TrendingUp, Gift, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useFamilyNotifications, useDeleteNotification } from "@/hooks/use-api"
import { useFamily } from "@/contexts/family-context"
import { format } from "date-fns"
import { Notification } from "@/types/notification-type"
import toast from "react-hot-toast"

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false)
  const { familyId, notificationRefreshTrigger, refreshNotifications } = useFamily()
  const { data: notifications, isLoading, execute } = useFamilyNotifications()
  const { execute: deleteNotification } = useDeleteNotification()
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

  // Helper function to map notification type to icon and color
  const getNotificationDisplay = (notificationType: string): { icon: LucideIcon; color: string } => {
    switch (notificationType) {
      case 'BUDGET_EXCEEDED':
        return { icon: AlertTriangle, color: 'text-red-500' }
      case 'PAYMENT_DUE':
        return { icon: CreditCard, color: 'text-red-500' }
      case 'INVESTMENT_UPDATE':
        return { icon: TrendingUp, color: 'text-green-500' }
      case 'NEW_OFFER':
        return { icon: Gift, color: 'text-purple-500' }
      default:
        return { icon: Info, color: 'text-blue-500' }
    }
  }

  // Handle delete notification
  const handleDeleteNotification = async (notificationId: number) => {
    if (!familyId) {
      toast.error("Family ID is required")
      return
    }

    setDeletingIds(prev => new Set(prev).add(notificationId))

    try {
      await deleteNotification({ id: notificationId, familyId }, { suppressToast: true })
      
      // Optimistically update local state
      setLocalNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      // Refresh notifications to ensure consistency
      if (refreshNotifications) {
        refreshNotifications()
      }
      
      toast.success("Notificação removida")
    } catch (error: any) {
      console.error("Error deleting notification:", error)
      toast.error(error?.message || "Erro ao remover notificação")
      
      // Refresh to get the correct state
      try {
        const data = await execute(familyId, { suppressToast: true })
        if (data) {
          setLocalNotifications(data)
        }
      } catch (refreshError) {
        console.error("Error refreshing notifications:", refreshError)
      }
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
    }
  }

  // Helper function to format notification message
  const formatNotificationMessage = (notification: Notification): string => {
    let message = notification.message
    
    if (notification.metadata?.budgetAmount !== undefined && 
        notification.metadata?.currentSpending !== undefined) {
      const budgetAmount = notification.metadata.budgetAmount
      const currentSpending = notification.metadata.currentSpending
      
      // Format currency values
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value)
      }
      
      message += ` (Gastou ${formatCurrency(currentSpending)} de ${formatCurrency(budgetAmount)})`
      
      if (notification.metadata?.exceededBy !== undefined) {
        const exceededBy = notification.metadata.exceededBy
        message += ` - Excedeu por ${formatCurrency(exceededBy)}`
      }
    }
    
    return message
  }

  // Fetch notifications on mount and when familyId or refresh trigger changes
  useEffect(() => {
    if (!familyId) {
      return
    }

    const fetchNotifications = async () => {
      try {
        const data = await execute(familyId)
        if (data) {
          setLocalNotifications(data)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    fetchNotifications()
  }, [familyId, execute, notificationRefreshTrigger])

  // Set up 30-second polling (only when panel is open and tab is visible)
  useEffect(() => {
    if (!familyId || !isOpen) {
      return
    }

    let intervalId: NodeJS.Timeout | null = null

    const startPolling = () => {
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId)
      }

      // Only start polling if visible and open
      if (document.visibilityState === 'visible' && isOpen) {
        intervalId = setInterval(async () => {
          // Double-check visibility before polling
          if (document.visibilityState === 'hidden' || !isOpen) {
            return
          }

          try {
            const data = await execute(familyId, { suppressToast: true })
            if (data) {
              setLocalNotifications(data)
            }
          } catch (error) {
            console.error("Error polling notifications:", error)
          }
        }, 30000) // 30 seconds
      }
    }

    // Start polling initially
    startPolling()

    // Listen for visibility changes to pause/resume polling
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      } else if (document.visibilityState === 'visible' && isOpen) {
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [familyId, execute, isOpen])

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {localNotifications.length > 0 && (
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
        )}
      </Button>
      {isOpen && (
        <Card className="absolute right-0 mt-2 w-96 z-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close notifications">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading && localNotifications.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                {localNotifications.length === 0 ? (
                  <div className="flex items-center justify-center h-[400px] text-sm text-muted-foreground">
                    Nenhuma notificação
                  </div>
                ) : (
                  [...localNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notification) => {
                    const { icon: Icon, color } = getNotificationDisplay(notification.notificationType)
                    const formattedMessage = formatNotificationMessage(notification)
                    const formattedDate = format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm')
                    
                    const isDeleting = deletingIds.has(notification.id)
                    
                    return (
                      <Card key={notification.id} className="mb-4 last:mb-0 border shadow-sm relative group">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className={`${color} p-2 rounded-full bg-opacity-10`}>
                              <Icon className={`h-5 w-5 ${color}`} />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none">{notification.title}</p>
                              <p className="text-sm text-muted-foreground">{formattedMessage}</p>
                              <p className="text-xs text-muted-foreground">{formattedDate}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteNotification(notification.id)}
                              disabled={isDeleting}
                              aria-label="Delete notification"
                            >
                              <X className="h-4 w-4"></X>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

