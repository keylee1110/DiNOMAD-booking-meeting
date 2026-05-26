"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { Building2, Plus, Image as ImageIcon, Check, MapPin, Users, Edit2, ArrowLeft, Tags, AlignLeft, DollarSign, LayoutList, Navigation2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

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
      <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-6xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <button 
            onClick={() => setEditingId(null)} 
            className="flex items-center gap-2 font-semibold text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:-translate-x-0.5"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Venues
          </button>
          <div className="flex gap-2.5">
            <Button 
              variant="outline" 
              onClick={() => setEditingId(null)} 
              className="rounded-xl px-5 font-semibold text-sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="rounded-xl px-6 font-semibold text-sm flex items-center gap-2 shadow-sm"
            >
              <Check className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-sm flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-300">
          
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight flex items-center gap-3 border-b border-border/50 pb-4 text-foreground">
             <Building2 className="h-6 w-6 text-primary" /> Edit: {formData.name}
          </h2>

          <div className="grid gap-8 lg:grid-cols-2">
            
            {/* Left Column Fields */}
            <div className="flex flex-col gap-8">
              
              {/* Box 1: Identity & Location */}
              <div className="rounded-xl border border-border/40 bg-muted/5 p-5 flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-border/30 pb-2.5">
                   <MapPin className="h-4 w-4 text-primary" />
                   <h3 className="font-semibold text-sm text-foreground tracking-tight">Identity & Location</h3>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> Building / Venue Name
                  </label>
                  <input 
                    type="text" 
                    value={formData.venueName} 
                    onChange={e => setFormData({...formData, venueName: e.target.value})} 
                    className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-medium text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary/80 transition-all duration-200" 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">Exact Street Address</label>
                  <input 
                    type="text" 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder="e.g. 123 Nguyen Hue, Ben Nghe Ward..." 
                    className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-medium text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary/80 transition-all duration-200" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">District</label>
                    <div className="relative">
                      <select 
                        value={formData.district} 
                        onChange={e => setFormData({...formData, district: e.target.value})} 
                        className="w-full rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary/80 transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="District 1">District 1</option>
                        <option value="District 2">District 2</option>
                        <option value="District 3">District 3</option>
                        <option value="District 7">District 7</option>
                        <option value="Thu Duc">Thu Duc</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Navigation2 className="h-3.5 w-3.5 text-primary" /> Map Link
                    </label>
                    <input 
                      type="text" 
                      value={formData.googleMapsLink} 
                      onChange={e => setFormData({...formData, googleMapsLink: e.target.value})} 
                      placeholder="https://maps.google.com/..." 
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-medium text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary/80 transition-all duration-200" 
                    />
                  </div>
                </div>
              </div>

              {/* Box 2: Room Details */}
              <div className="rounded-xl border border-border/40 bg-muted/5 p-5 flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-border/30 pb-2.5">
                   <LayoutList className="h-4 w-4 text-primary" />
                   <h3 className="font-semibold text-sm text-foreground tracking-tight">Room Details</h3>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">Room Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 font-semibold text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all" 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">Room Category</label>
                  <div className="relative">
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      className="w-full rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary/80 transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="solo_nook">Solo Nook / Focus Pod</option>
                      <option value="team_hub">Team Hub / Meeting Room</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-1">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-primary" /> Price/Hr (VND)
                    </label>
                    <input 
                      type="number" 
                      step="10000" 
                      min="0" 
                      value={formData.pricePerHour} 
                      onChange={e => setFormData({...formData, pricePerHour: Number(e.target.value)})} 
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary/80 transition-all duration-200" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" /> Capacity
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      value={formData.capacity} 
                      onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} 
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary/80 transition-all duration-200" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <AlignLeft className="h-3.5 w-3.5 text-primary" /> Marketing Description
                  </label>
                  <textarea 
                    rows={4} 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Describe the vibe and purpose of this room..." 
                    className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-medium text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary/80 transition-all duration-200 resize-none" 
                  />
                </div>
              </div>

            </div>

            {/* Right Column Fields */}
            <div className="flex flex-col gap-8">
              
              {/* Box 3: Specs */}
              <div className="rounded-xl border border-border/40 bg-muted/5 p-5 flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-border/30 pb-2.5">
                   <Info className="h-4 w-4 text-primary" />
                   <h3 className="font-semibold text-sm text-foreground tracking-tight">Physical Specs</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Size (sqm)</label>
                    <input 
                      type="text" 
                      value={formData.specs.size} 
                      onChange={e => setFormData({...formData, specs: {...formData.specs, size: e.target.value}})} 
                      placeholder="e.g. 15sqm" 
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary/80 transition-all duration-200" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Floor Level</label>
                    <input 
                      type="text" 
                      value={formData.specs.floor} 
                      onChange={e => setFormData({...formData, specs: {...formData.specs, floor: e.target.value}})} 
                      placeholder="e.g. 3rd Floor" 
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary/80 transition-all duration-200" 
                    />
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">View Feature</label>
                    <input 
                      type="text" 
                      value={formData.specs.view} 
                      onChange={e => setFormData({...formData, specs: {...formData.specs, view: e.target.value}})} 
                      placeholder="e.g. Skyline, Internal Garden" 
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary/80 transition-all duration-200" 
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-muted-foreground border-b border-border/40 pb-2">Amenities Provided</label>
                  <div className="grid grid-cols-2 gap-2.5">
                     {['Whiteboard', 'Smart TV', 'Air Con', 'Coffee Machine', 'Fast WiFi', 'Projector', 'Ergo Chair', 'Power Outlets'].map(item => {
                       const isChecked = formData.amenities.includes(item)
                       return (
                         <label 
                           key={item} 
                           className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-200 ${
                             isChecked 
                               ? 'border-primary/30 bg-primary/5 text-primary shadow-[0_2px_10px_rgba(100,181,246,0.08)]' 
                               : 'border-border/60 hover:border-border hover:bg-muted/30 bg-background/50 text-foreground/90'
                           }`}
                         >
                           <input 
                             type="checkbox" 
                             checked={isChecked} 
                             onChange={() => toggleArrayItem("amenities", item)} 
                             className="w-4 h-4 accent-primary border-border rounded-lg" 
                           />
                           <span className="font-semibold text-xs leading-none mt-0.5">{item}</span>
                         </label>
                       )
                     })}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold text-muted-foreground border-b border-border/40 pb-2 flex items-center gap-1">
                    <Tags className="h-3.5 w-3.5 text-primary" /> Vibe Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                     {['ultra_quiet', 'focus', 'creative', 'bright', 'cozy', 'premium', 'nature'].map(tag => {
                       const isChecked = formData.vibeTags.includes(tag)
                       return (
                         <button 
                           key={tag} 
                           onClick={() => toggleArrayItem("vibeTags", tag)} 
                           className={`px-4 py-2 rounded-full border text-xs font-medium transition-all duration-200 ${
                             isChecked 
                               ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_2px_10px_rgba(100,181,246,0.06)] font-semibold' 
                               : 'bg-background/60 text-muted-foreground border-border/60 hover:text-foreground hover:border-border'
                           }`}
                         >
                           #{tag}
                         </button>
                       )
                     })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 h-full mt-2">
                  <label className="text-xs font-semibold text-muted-foreground border-b border-border/40 pb-2">Room Gallery</label>
                  <div className="border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center p-8 bg-muted/5 hover:bg-muted/10 hover:border-primary/50 hover:text-primary transition-all duration-200 cursor-pointer text-center group h-full min-h-[160px]">
                     <ImageIcon className="h-10 w-10 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                     <span className="font-semibold text-sm text-foreground/90 group-hover:text-primary transition-colors">Upload Photos</span>
                     <span className="text-xs text-muted-foreground mt-1.5 font-medium">Drag & drop JPG, PNG (Max 5MB)</span>
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
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 text-foreground">
             <Building2 className="h-8 w-8 text-primary hidden md:block" /> Venues
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your physical locations, rooms, capacity, and detailed specifications.
          </p>
        </div>
        <Button onClick={handleAddNew} className="font-semibold rounded-xl flex items-center gap-2 px-6 shadow-sm">
          <Plus className="h-5 w-5" /> Add Room
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map(room => (
          <div key={room.id} className="flex flex-col rounded-2xl border border-border/50 bg-card shadow-[0_4px_20px_-4px_rgba(41,35,30,0.04)] hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="aspect-[16/9] bg-muted/20 border-b border-border/40 relative flex items-center justify-center overflow-hidden rounded-t-2xl">
               <ImageIcon className="h-12 w-12 text-muted-foreground/30 absolute z-0 group-hover:scale-110 transition-transform" />
               <div className="absolute top-3 right-3 bg-foreground/90 backdrop-blur-sm text-background px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase shadow-sm">
                 {room.category.replace('_', ' ')}
               </div>
            </div>
            <div className="p-4 md:p-6 flex flex-col flex-1 gap-2">
               <h3 className="font-semibold text-lg md:text-xl tracking-tight text-foreground line-clamp-1">{room.name}</h3>
               <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mt-1 border-b border-border/40 pb-3 line-clamp-1">
                 <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {room.venueName} • {room.district}
               </p>
               <div className="flex items-center justify-between mt-3 text-sm font-semibold">
                 <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-semibold text-foreground"><Users className="h-4 w-4 text-muted-foreground"/> {room.capacity} Pax</span>
                 <span className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 text-xs font-semibold"><DollarSign className="h-4 w-4"/> {formatVND(room.pricePerHour)}/hr</span>
               </div>
            </div>
            <div className="p-4 border-t border-border/40 mt-auto bg-muted/10 rounded-b-2xl">
               <Button onClick={() => handleEdit(room)} variant="outline" className="w-full font-semibold rounded-xl shadow-sm bg-transparent">
                 <Edit2 className="h-4 w-4" /> Edit Room Details
               </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
