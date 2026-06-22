"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { formatVND } from "@/lib/format"
import { useTranslation } from "@/lib/i18n/context"
import type { Room } from "@/lib/types"

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export function MapView({ results }: { results: Room[] }) {
  const { t } = useTranslation()

  return (
    <MapContainer
      center={[10.78, 106.70]}
      zoom={12}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {results.map((room: Room) => (
        <Marker
          key={room.id}
          position={[room.lat, room.lng]}
          icon={defaultIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{room.name}</p>
              <p className="text-xs text-muted-foreground">{room.venueName}</p>
              <p className="mt-1 font-bold text-primary">{formatVND(room.pricePerHour)}{t("common.perHour")}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
