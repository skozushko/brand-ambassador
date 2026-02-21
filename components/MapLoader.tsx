"use client"

import dynamic from "next/dynamic"

const WorldMapDashboard = dynamic(() => import("@/components/WorldMapDashboard"), { ssr: false })

export default function MapLoader() {
  return <WorldMapDashboard />
}
