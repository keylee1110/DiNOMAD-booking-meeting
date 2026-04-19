"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { Building2, Plus, Image as ImageIcon, Check, MapPin, Users, Edit2, ArrowLeft, Tags, AlignLeft, DollarSign, LayoutList, Navigation2, Info } from "lucide-react"

export default function VenuesPage() {
  const { t } = useTranslation()

  const [rooms, setRooms] = useState([
    {
      id: "r1",
      name: "Solo Nook A",
      venueName: "DiNOMAD HQ",
      address: "123 Nguyen Hue, Ben Nghe Ward",
      district: "District 1",
      googleMapsLink: "https://maps.google.com/?q=10.7769,106.7009",
      description: "A private pod perfect for deep focus work.",
      capacity: 2,
      pricePerHour: 120000,
      category: "solo_nook",
      specs: { size: "15sqm", floor: "3rd Floor", view: "City View" },
      amenities: ["Whiteboard", "Fast WiFi"],
      vibeTags: ["ultra_quiet", "focus"],
    },
    {
      id: "r2",
      name: "Team Hub B",
      venueName: "DiNOMAD D7",
      address: "456 Nguyen Van Linh, Tan Phong Ward",
      district: "District 7",
      googleMapsLink: "https://maps.google.com/?q=10.7294,106.7029",
      description: "Collaborative space with natural lighting.",
      capacity: 8,
      pricePerHour: 350000,
      category: "team_hub",
      specs: { size: "40sqm", floor: "Ground Floor", view: "Garden" },
      amenities: ["Smart TV", "Whiteboard", "Coffee Machine", "Fast WiFi"],
      vibeTags: ["creative", "bright"],
    }
  ])

  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Create a copy of the room being edited in local state to avoid changing original array before save
  const [formData, setFormData] = useState<any>(null)

  const handleEdit = (room: any) => {
    setEditingId(room.id)
    setFormData({ ...room })
  }

  const handleAddNew = () => {
    const newRoom = {
      id: `r${Date.now()}`,
      name: "New Room",
      venueName: "DiNOMAD Location",
      address: "",
      district: "District 1",
      googleMapsLink: "",
      description: "",
      capacity: 4,
      pricePerHour: 200000,
      category: "team_hub",
      specs: { size: "", floor: "", view: "" },
      amenities: [],
      vibeTags: [],
    }
    setEditingId(newRoom.id)
    setFormData(newRoom)
  }

  const handleSave = () => {
    setRooms(prev => {
      const exists = prev.find(r => r.id === formData.id)
      if (exists) return prev.map(r => r.id === formData.id ? formData : r)
      return [...prev, formData] // Add new
    })
    setEditingId(null)
  }

  const toggleArrayItem = (field: string, item: string) => {
    setFormData((prev: any) => {
      const arr = prev[field] as string[]
      return {
        ...prev,
        [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
      }
    })
  }

  const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  if (editingId && formData) {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-300 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/40 dark:border-white/10 pb-4 mb-6">
          <button onClick={() => setEditingId(null)} className="flex items-center gap-2 font-bold text-sm text-foreground/80 hover:text-primary transition-colors hover:-translate-x-1">
            <ArrowLeft className="h-5 w-5" /> Back to Venues
          </button>
          <div className="flex gap-3">
            <button onClick={() => setEditingId(null)} className="bg-white/60 dark:bg-muted/30 px-6 py-2.5 font-semibold text-foreground rounded-xl hover:bg-white/80 dark:hover:bg-muted/50 transition-colors text-sm shadow-sm active:translate-y-0.5 border border-white/40 dark:border-white/10">
              Cancel
            </button>
            <button onClick={handleSave} className="bg-primary text-primary-foreground px-8 py-2.5 font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm active:translate-y-0.5 text-sm focus:ring-4 focus:ring-primary/20">
              <Check className="h-5 w-5" /> Save Changes
            </button>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-lg flex flex-col gap-10 animate-in slide-in-from-bottom-4">
          
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3 border-b border-white/40 dark:border-white/10 pb-4">
             <div className="p-2 rounded-xl bg-primary/10">
               <Building2 className="h-7 w-7 text-primary" />
             </div>
             Edit: {formData.name}
          </h2>

          <div className="grid gap-10 lg:grid-cols-2">
            
            {/* Left Column Fields */}
            <div className="flex flex-col gap-8">
              
              {/* Box 1: Identity & Location */}
              <div className="flex flex-col gap-5 border border-white/40 dark:border-white/10 bg-white/40 dark:bg-muted/10 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                   <div className="p-1.5 rounded-lg bg-primary/10">
                     <MapPin className="h-4 w-4 text-primary" />
                   </div>
                   <h3 className="font-bold text-base text-foreground">Identity & Location</h3>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">Building / Venue Name</label>
                  <input type="text" value={formData.venueName} onChange={e => setFormData({...formData, venueName: e.target.value})} className="border border-white/60 dark:border-border/50 rounded-xl p-3.5 font-medium text-sm bg-white/50 dark:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">Exact Street Address</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="e.g. 123 Nguyen Hue, Ben Nghe Ward..." className="border border-white/60 dark:border-border/50 rounded-xl p-3.5 font-medium text-sm bg-white/50 dark:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">District</label>
                    <select value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="border border-white/60 dark:border-border/50 rounded-xl p-3.5 font-medium text-sm bg-white/50 dark:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all appearance-none cursor-pointer shadow-sm">
                      <option value="District 1">District 1</option>
                      <option value="District 2">District 2</option>
                      <option value="District 3">District 3</option>
                      <option value="District 7">District 7</option>
                      <option value="Thu Duc">Thu Duc</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Navigation2 className="h-3.5 w-3.5 text-primary"/> Map Link</label>
                    <input type="text" value={formData.googleMapsLink} onChange={e => setFormData({...formData, googleMapsLink: e.target.value})} placeholder="https://maps.google.com/..." className="border border-white/60 dark:border-border/50 rounded-xl p-3.5 font-medium text-sm bg-white/50 dark:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Box 2: Room Details */}
              <div className="flex flex-col gap-5 border border-white/40 dark:border-white/10 bg-white/40 dark:bg-muted/10 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                   <div className="p-1.5 rounded-lg bg-primary/10">
                     <LayoutList className="h-4 w-4 text-primary" />
                   </div>
                   <h3 className="font-bold text-base text-foreground">Room Details</h3>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">Room Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="border border-white/60 dark:border-primary/30 rounded-xl p-3.5 font-bold text-lg bg-white/70 dark:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">Room Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="border border-white/60 dark:border-border/50 rounded-xl p-3.5 font-medium text-sm bg-white/50 dark:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all appearance-none cursor-pointer shadow-sm">
                    <option value="solo_nook">Solo Nook / Focus Pod</option>
                    <option value="team_hub">Team Hub / Meeting Room</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-primary"/> Price/Hr (VND)</label>
                    <input type="number" step="10000" min="0" value={formData.pricePerHour} onChange={e => setFormData({...formData, pricePerHour: Number(e.target.value)})} className="border border-white/60 dark:border-border/50 rounded-xl p-3.5 font-bold text-primary bg-white/50 dark:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary"/> Capacity</label>
                    <input type="number" min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} className="border border-white/60 dark:border-border/50 rounded-xl p-3.5 font-medium bg-white/50 dark:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><AlignLeft className="h-3.5 w-3.5 text-primary"/> Marketing Description</label>
                  <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the vibe and purpose of this room..." className="border border-white/60 dark:border-border/50 rounded-xl p-3.5 font-medium text-sm bg-white/50 dark:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none shadow-sm shadow-inner" />
                </div>
              </div>

            </div>

            {/* Right Column Fields */}
            <div className="flex flex-col gap-8">
              
              {/* Box 3: Specs */}
              <div className="flex flex-col gap-5 border border-white/40 dark:border-white/10 bg-white/40 dark:bg-muted/10 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                   <div className="p-1.5 rounded-lg bg-primary/10">
                     <Info className="h-4 w-4 text-primary" />
                   </div>
                   <h3 className="font-bold text-base text-foreground">Physical Specs</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Size (sqm)</label>
                    <input type="text" value={formData.specs.size} onChange={e => setFormData({...formData, specs: {...formData.specs, size: e.target.value}})} placeholder="e.g. 15sqm" className="border border-white/60 dark:border-border/50 rounded-xl p-3.5 font-medium text-sm bg-white/50 dark:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Floor Level</label>
                    <input type="text" value={formData.specs.floor} onChange={e => setFormData({...formData, specs: {...formData.specs, floor: e.target.value}})} placeholder="e.g. 3rd Floor" className="border border-white/60 dark:border-border/50 rounded-xl p-3.5 font-medium text-sm bg-white/50 dark:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm" />
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">View Feature</label>
                    <input type="text" value={formData.specs.view} onChange={e => setFormData({...formData, specs: {...formData.specs, view: e.target.value}})} placeholder="e.g. Skyline, Internal Garden" className="border border-white/60 dark:border-border/50 rounded-xl p-3.5 font-medium text-sm bg-white/50 dark:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-muted-foreground border-b border-white/40 dark:border-white/10 pb-2">Amenities Provided</label>
                  <div className="grid grid-cols-2 gap-3">
                     {['Whiteboard', 'Smart TV', 'Air Con', 'Coffee Machine', 'Fast WiFi', 'Projector', 'Ergo Chair', 'Power Outlets'].map(item => {
                       const isChecked = formData.amenities.includes(item)
                       return (
                         <label key={item} className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer transition-all shadow-sm ${isChecked ? 'border-primary bg-primary/10' : 'border-white/60 dark:border-border/50 hover:bg-white/60 dark:hover:bg-muted/30 bg-white/40 dark:bg-muted/10'}`}>
                           <input type="checkbox" checked={isChecked} onChange={() => toggleArrayItem("amenities", item)} className="w-5 h-5 accent-primary border-2 border-foreground rounded" />
                           <span className="font-semibold text-xs leading-none mt-0.5">{item}</span>
                         </label>
                       )
                     })}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-muted-foreground border-b border-white/40 dark:border-white/10 pb-2 flex items-center gap-1.5"><Tags className="h-3.5 w-3.5 text-primary"/> Vibe Tags</label>
                  <div className="flex flex-wrap gap-2">
                     {['ultra_quiet', 'focus', 'creative', 'bright', 'cozy', 'premium', 'nature'].map(tag => {
                       const isChecked = formData.vibeTags.includes(tag)
                       return (
                         <button key={tag} onClick={() => toggleArrayItem("vibeTags", tag)} className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all shadow-sm ${isChecked ? 'bg-primary text-primary-foreground border-primary' : 'bg-white/50 dark:bg-muted/30 text-muted-foreground border-white/60 dark:border-border/50 hover:bg-white/80 dark:hover:bg-muted/50'}`}>
                           #{tag}
                         </button>
                       )
                     })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 h-full mt-2">
                  <label className="text-xs font-semibold text-muted-foreground border-b border-white/40 dark:border-white/10 pb-2">Room Gallery</label>
                  <div className="border border-white/60 dark:border-border/50 rounded-2xl border-dashed flex flex-col items-center justify-center p-8 bg-white/30 dark:bg-muted/10 hover:bg-white/60 dark:hover:bg-muted/30 hover:border-primary transition-colors cursor-pointer text-center group h-full shadow-inner min-h-[160px]">
                     <div className="p-4 rounded-2xl bg-white/40 dark:bg-muted/30 mb-4 group-hover:scale-110 transition-transform">
                       <ImageIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                     </div>
                     <span className="font-bold text-sm text-foreground group-hover:text-primary">Upload Photos</span>
                     <span className="text-xs text-muted-foreground mt-1 font-medium">Drag & drop JPG, PNG (Max 5MB)</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List View
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
             <div className="p-2 rounded-xl bg-primary/10 hidden md:block">
               <Building2 className="h-7 w-7 text-primary" />
             </div>
             Venues
          </h1>
          <p className="text-sm md:text-base font-medium text-muted-foreground max-w-xl">
            Manage your physical locations, rooms, capacity, and detailed specifications.
          </p>
        </div>
        <button onClick={handleAddNew} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm active:-translate-y-0.5 text-sm whitespace-nowrap focus:ring-4 focus:ring-primary/20">
          <Plus className="h-5 w-5" /> Add Room
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map(room => (
          <div key={room.id} className="flex flex-col border border-white/50 dark:border-white/10 rounded-2xl bg-white/60 dark:bg-card/60 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all group overflow-hidden">
            <div className="aspect-[16/9] bg-white/40 dark:bg-muted/10 border-b border-white/40 dark:border-white/10 relative flex items-center justify-center overflow-hidden">
               <ImageIcon className="h-12 w-12 text-muted-foreground/30 absolute z-0 group-hover:scale-110 transition-transform" />
               <div className="absolute top-3 right-3 bg-white/80 dark:bg-background/80 backdrop-blur-sm text-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm rounded-lg border border-black/5">
                 {room.category.replace('_', ' ')}
               </div>
            </div>
            <div className="p-5 md:p-6 flex flex-col flex-1 gap-2">
               <h3 className="font-bold text-lg md:text-xl tracking-tight line-clamp-1">{room.name}</h3>
               <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 pb-4 border-b border-white/40 dark:border-white/10 line-clamp-1">
                 <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {room.venueName} • {room.district}
               </p>
               <div className="flex items-center justify-between mt-3 text-sm font-semibold">
                 <span className="flex items-center gap-2 bg-white/50 dark:bg-muted/30 px-3 py-1.5 rounded-lg border border-white/60 dark:border-white/10 shadow-sm"><Users className="h-4 w-4"/> {room.capacity} Pax</span>
                 <span className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 shadow-sm"><DollarSign className="h-4 w-4"/> {formatVND(room.pricePerHour)}/hr</span>
               </div>
            </div>
            <div className="p-4 border-t border-white/40 dark:border-white/10 bg-white/40 dark:bg-muted/10 mt-auto">
               <button onClick={() => handleEdit(room)} className="w-full bg-white dark:bg-background text-foreground hover:bg-white/80 dark:hover:bg-muted px-4 py-3 text-xs font-bold transition-all flex justify-center items-center gap-2 shadow-sm rounded-xl border border-white/60 dark:border-white/10 active:-translate-y-0.5">
                 <Edit2 className="h-4 w-4" /> Edit Room Details
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
