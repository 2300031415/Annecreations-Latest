import { baseApi } from "./baseApi"

export interface SessionHistoryItem {
  _id: string
  id: string
  url: string
  referrer: string
  browsingPhase: string
}

export interface IpHistoryItem {
  _id: string
  id: string
  ip: string
}

export interface SessionPhase {
  _id: string
  id: string
  phase: string
  startTime: string
  endTime: string | null
  pageViews: number
}

export interface BrowsingAnalysis {
  hasBrowsedAsGuest: boolean
  hasBrowsedAsCustomer: boolean
  pagesBeforeLogin: number
  pagesAfterLogin: number
  guestBrowsingDuration: number
}

export interface OnlineUser {
  _id: string
  displayName: string
  source: string
  lastActivity: string
  loginTime: string
  totalPageViews: number,
  ipAddress: string
  ipHistory: IpHistoryItem[]
  userAgent: string
  pageUrl: string
  sessionHistory: SessionHistoryItem[]
  sessionPhases: SessionPhase[]
  browsingAnalysis: BrowsingAnalysis
}

export interface OnlineUsersAnalytics {
  totalOnline: number
  customersOnline: number
  guestsOnline: number
}

export interface OnlineUsersPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface OnlineUsersResponse {
  users: OnlineUser[]
  analytics: OnlineUsersAnalytics
  pagination: OnlineUsersPagination
}

export const onlineUsersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOnlineUsers: builder.query<OnlineUsersResponse, { page: number; limit: number }>({
      query: ({ page, limit }) => `/api/analytics/online-users?page=${page}&limit=${limit}`,
      providesTags: ["Analytics"],
    }),
  }),
})


export const { useGetOnlineUsersQuery } = onlineUsersApi