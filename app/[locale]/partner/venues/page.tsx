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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-foreground pb-4">
          <button onClick={() => setEditingId(null)} className="flex items-center gap-2 font-black uppercase text-sm hover:text-primary transition-colors hover:-translate-x-1">
            <ArrowLeft className="h-5 w-5" /> Back to Venues
          </button>
          <div className="flex gap-2">
            <button onClick={() => setEditingId(null)} className="border-2 border-foreground bg-background px-6 py-2.5 font-black uppercase tracking-wider hover:bg-muted transition-colors text-xs md:text-sm shadow-sm active:translate-y-0.5">
              Cancel
            </button>
            <button onClick={handleSave} className="border-2 border-primary bg-primary text-primary-foreground px-8 py-2.5 font-black uppercase tracking-wider hover:bg-foreground hover:border-foreground transition-all flex items-center gap-2 shadow-[4px_4px_0px_0px_var(--color-foreground)] active:translate-y-1 active:shadow-none text-xs md:text-sm">
              <Check className="h-5 w-5" /> Save Changes
            </button>
          </div>
        </div>

        <div className="border-4 border-foreground bg-card p-6 md:p-10 shadow-[8px_8px_0px_0px_var(--color-primary)] flex flex-col gap-10 animate-in slide-in-from-bottom-4">
          
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-3 border-b-4 border-foreground pb-4">
             <Building2 className="h-8 w-8 text-primary" /> Edit: {formData.name}
          </h2>

          <div className="grid gap-10 lg:grid-cols-2">
            
            {/* Left Column Fields */}
            <div className="flex flex-col gap-8">
              
              {/* Box 1: Identity & Location */}
              <div className="flex flex-col gap-5 border-2 border-foreground p-5 shadow-[4px_4px_0px_0px_var(--color-foreground)]">
                <div className="flex items-center gap-2 border-b-2 border-foreground pb-2">
                   <MapPin className="h-5 w-5 text-primary" />
                   <h3 className="font-black uppercase tracking-widest text-sm text-foreground">Identity & Location</h3>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Building2 className="h-3 w-3 text-primary"/> Building / Venue Name</label>
                  <input type="text" value={formData.venueName} onChange={e => setFormData({...formData, venueName: e.target.value})} className="border-2 border-border p-3 font-bold uppercase tracking-wider text-sm bg-background focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_var(--color-primary)] transition-all" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">Exact Street Address</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="e.g. 123 Nguyen Hue, Ben Nghe Ward..." className="border-2 border-border p-3 font-bold text-sm bg-background focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_var(--color-primary)] transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">District</label>
                    <select value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="border-2 border-border p-3 font-bold uppercase tracking-wider text-sm bg-background focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_var(--color-primary)] transition-all appearance-none cursor-pointer">
                      <option value="District 1">District 1</option>
                      <option value="District 2">District 2</option>
                      <option value="District 3">District 3</option>
                      <option value="District 7">District 7</option>
                      <option value="Thu Duc">Thu Duc</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Navigation2 className="h-3 w-3 text-primary"/> Map Link</label>
                    <input type="text" value={formData.googleMapsLink} onChange={e => setFormData({...formData, googleMapsLink: e.target.value})} placeholder="https://maps.google.com/..." className="border-2 border-border p-3 font-bold text-xs bg-background focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_var(--color-primary)] transition-all" />
                  </div>
                </div>
              </div>

              {/* Box 2: Room Details */}
              <div className="flex flex-col gap-5 border-2 border-foreground p-5 shadow-[4px_4px_0px_0px_var(--color-foreground)]">
                <div className="flex items-center gap-2 border-b-2 border-foreground pb-2">
                   <LayoutList className="h-5 w-5 text-primary" />
                   <h3 className="font-black uppercase tracking-widest text-sm text-foreground">Room Details</h3>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">Room Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="border-2 border-primary p-3.5 font-black uppercase tracking-wider text-lg bg-primary/5 focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--color-primary)] transition-all" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">Room Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="border-2 border-border p-3 font-bold uppercase tracking-wider text-sm bg-background focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer">
                    <option value="solo_nook">Solo Nook / Focus Pod</option>
                    <option value="team_hub">Team Hub / Meeting Room</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3 w-3 text-primary"/> Price/Hr (VND)</label>
                    <input type="number" step="10000" min="0" value={formData.pricePerHour} onChange={e => setFormData({...formData, pricePerHour: Number(e.target.value)})} className="border-2 border-border p-3 font-black text-primary bg-background focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_var(--color-primary)] transition-all" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3 text-primary"/> Capacity</label>
                    <input type="number" min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} className="border-2 border-border p-3 font-bold bg-background focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_var(--color-primary)] transition-all" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><AlignLeft className="h-3 w-3 text-primary"/> Marketing Description</label>
                  <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the vibe and purpose of this room..." className="border-2 border-border p-3 font-medium bg-background focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_var(--color-primary)] transition-all resize-none" />
                </div>
              </div>

            </div>

            {/* Right Column Fields */}
            <div className="flex flex-col gap-8">
              
              {/* Box 3: Specs */}
              <div className="flex flex-col gap-5 border-2 border-foreground p-5 shadow-[4px_4px_0px_0px_var(--color-foreground)]">
                <div className="flex items-center gap-2 border-b-2 border-foreground pb-2">
                   <Info className="h-5 w-5 text-primary" />
                   <h3 className="font-black uppercase tracking-widest text-sm text-foreground">Physical Specs</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Size (sqm)</label>
                    <input type="text" value={formData.specs.size} onChange={e => setFormData({...formData, specs: {...formData.specs, size: e.target.value}})} placeholder="e.g. 15sqm" className="border-2 border-border p-3 font-bold uppercase text-xs bg-background focus:border-primary transition-all" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Floor Level</label>
                    <input type="text" value={formData.specs.floor} onChange={e => setFormData({...formData, specs: {...formData.specs, floor: e.target.value}})} placeholder="e.g. 3rd Floor" className="border-2 border-border p-3 font-bold uppercase text-xs bg-background focus:border-primary transition-all" />
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">View Feature</label>
                    <input type="text" value={formData.specs.view} onChange={e => setFormData({...formData, specs: {...formData.specs, view: e.target.value}})} placeholder="e.g. Skyline, Internal Garden" className="border-2 border-border p-3 font-bold uppercase text-xs bg-background focus:border-primary transition-all" />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b-2 border-border pb-2">Amenities Provided</label>
                  <div className="grid grid-cols-2 gap-3">
                     {['Whiteboard', 'Smart TV', 'Air Con', 'Coffee Machine', 'Fast WiFi', 'Projector', 'Ergo Chair', 'Power Outlets'].map(item => {
                       const isChecked = formData.amenities.includes(item)
                       return (
                         <label key={item} className={`flex items-center gap-3 border-2 p-3 cursor-pointer transition-all ${isChecked ? 'border-primary bg-primary/10 shadow-[2px_2px_0px_0px_var(--color-primary)]' : 'border-border hover:border-foreground bg-background'}`}>
                           <input type="checkbox" checked={isChecked} onChange={() => toggleArrayItem("amenities", item)} className="w-5 h-5 accent-primary border-2 border-foreground rounded-none" />
                           <span className="font-bold text-[10px] md:text-xs uppercase tracking-widest leading-none mt-0.5">{item}</span>
                         </label>
                       )
                     })}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b-2 border-border pb-2"><Tags className="h-3 w-3 text-primary inline mr-1"/> Vibe Tags</label>
                  <div className="flex flex-wrap gap-2">
                     {['ultra_quiet', 'focus', 'creative', 'bright', 'cozy', 'premium', 'nature'].map(tag => {
                       const isChecked = formData.vibeTags.includes(tag)
                       return (
                         <button key={tag} onClick={() => toggleArrayItem("vibeTags", tag)} className={`px-4 py-2 border-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${isChecked ? 'bg-foreground text-background border-foreground shadow-[2px_2px_0px_0px_var(--color-primary)]' : 'bg-background text-muted-foreground border-border hover:border-foreground'}`}>
                           #{tag}
                         </button>
                       )
                     })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 h-full mt-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b-2 border-border pb-2">Room Gallery</label>
                  <div className="border-4 border-dashed border-border flex flex-col items-center justify-center p-8 bg-muted/20 hover:bg-muted/40 hover:border-primary hover:text-primary transition-colors cursor-pointer text-center group h-full shadow-inner min-h-[160px]">
                     <ImageIcon className="h-10 w-10 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                     <span className="font-black uppercase text-sm tracking-widest text-foreground group-hover:text-primary">Upload Photos</span>
                     <span className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-wider">Drag & drop JPG, PNG (Max 5MB)</span>
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
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter flex items-center gap-3">
             <Building2 className="h-8 w-8 text-primary hidden md:block" /> Venues
          </h1>
          <p className="border-l-4 border-primary pl-3 text-sm md:text-base font-medium text-muted-foreground max-w-xl">
            Manage your physical locations, rooms, capacity, and detailed specifications.
          </p>
        </div>
        <button onClick={handleAddNew} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground border-2 border-primary px-6 py-3 font-black uppercase tracking-wider hover:bg-foreground hover:border-foreground transition-all shadow-[4px_4px_0px_0px_var(--color-foreground)] active:translate-y-1 active:shadow-none text-sm whitespace-nowrap">
          <Plus className="h-5 w-5" /> Add Room
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map(room => (
          <div key={room.id} className="flex flex-col border-2 border-foreground bg-card shadow-[6px_6px_0px_0px_var(--color-primary)] hover:-translate-y-1 transition-transform group">
            <div className="aspect-[16/9] bg-muted/20 border-b-2 border-foreground relative flex items-center justify-center overflow-hidden">
               <ImageIcon className="h-12 w-12 text-muted-foreground/30 absolute z-0 group-hover:scale-110 transition-transform" />
               <div className="absolute top-3 right-3 bg-foreground text-background px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm">
                 {room.category.replace('_', ' ')}
               </div>
            </div>
            <div className="p-4 md:p-6 flex flex-col flex-1 gap-2">
               <h3 className="font-black uppercase text-lg md:text-xl tracking-tighter line-clamp-1">{room.name}</h3>
               <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mt-1 border-b-2 border-border pb-3 line-clamp-1">
                 <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {room.venueName} • {room.district}
               </p>
               <div className="flex items-center justify-between mt-3 text-sm font-black">
                 <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 border border-border"><Users className="h-4 w-4"/> {room.capacity} Pax</span>
                 <span className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1.5 border border-primary"><DollarSign className="h-4 w-4"/> {formatVND(room.pricePerHour)}/hr</span>
               </div>
            </div>
            <div className="p-4 border-t-2 border-border mt-auto bg-muted/10">
               <button onClick={() => handleEdit(room)} className="w-full border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background px-4 py-3 text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 shadow-[2px_2px_0px_0px_var(--color-foreground)] active:translate-y-0.5 active:shadow-none">
                 <Edit2 className="h-4 w-4" /> Edit Room Details
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
