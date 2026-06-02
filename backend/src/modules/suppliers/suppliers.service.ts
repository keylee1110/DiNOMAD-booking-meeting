import { Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { CreateSupplierApplicationDto } from "./dto/create-supplier-application.dto"
import { UpdateSupplierDto } from "./dto/update-supplier.dto"

type SupplierRow = {
  id: string
  legal_name: string
  display_name: string
  tax_code: string | null
  business_email: string | null
  business_phone: string | null
  status: "pending" | "approved" | "rejected" | "suspended"
  onboarding_note: string | null
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
}

type SupplierMemberRow = {
  supplier_id: string
  role: "owner" | "manager" | "staff"
  is_active: boolean
  suppliers: SupplierRow
}

@Injectable()
export class SuppliersService {
  constructor(private readonly supabase: SupabaseService) {}

  async submitApplication(userId: string, dto: CreateSupplierApplicationDto) {
    const { data, error } = await this.supabase.admin.rpc("submit_supplier_application_for_user", {
      target_user_id: userId,
      legal_name: dto.legalName,
      display_name: dto.displayName,
      tax_code: dto.taxCode ?? null,
      business_email: dto.businessEmail ?? null,
      business_phone: dto.businessPhone ?? null,
      onboarding_note: dto.onboardingNote ?? null,
    })

    if (error) {
      throw new Error(error.message)
    }

    const supplier = await this.findById(String(data))

    return {
      ...supplier,
      ownerUserId: userId,
    }
  }

  async findMine(userId: string) {
    const { data, error } = await this.supabase.admin
      .from("supplier_members")
      .select("supplier_id,role,is_active,suppliers(*)")
      .eq("user_id", userId)
      .eq("is_active", true)
      .returns<SupplierMemberRow[]>()

    if (error) {
      throw new Error(error.message)
    }

    return data.map((membership) => ({
      membership: {
        supplierId: membership.supplier_id,
        role: membership.role,
        isActive: membership.is_active,
      },
      supplier: this.toSupplierResponse(membership.suppliers),
    }))
  }

  async findAll() {
    const { data, error } = await this.supabase.admin
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<SupplierRow[]>()

    if (error) {
      throw new Error(error.message)
    }

    return data.map((supplier) => this.toSupplierResponse(supplier))
  }

  async findById(id: string) {
    const { data, error } = await this.supabase.admin
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .single<SupplierRow>()

    if (error || !data) {
      throw new NotFoundException("Supplier not found")
    }

    return this.toSupplierResponse(data)
  }

  async update(id: string, dto: UpdateSupplierDto, approvedBy?: string) {
    const updateData = {
      legal_name: dto.legalName,
      display_name: dto.displayName,
      tax_code: dto.taxCode,
      business_email: dto.businessEmail,
      business_phone: dto.businessPhone,
      status: dto.status,
      approved_by: dto.status === "approved" ? approvedBy : undefined,
      approved_at: dto.status === "approved" ? new Date().toISOString() : undefined,
    }

    const { data, error } = await this.supabase.admin
      .from("suppliers")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single<SupplierRow>()

    if (error || !data) {
      throw new NotFoundException("Supplier not found")
    }

    return this.toSupplierResponse(data)
  }

  private toSupplierResponse(supplier: SupplierRow) {
    return {
      id: supplier.id,
      legalName: supplier.legal_name,
      displayName: supplier.display_name,
      taxCode: supplier.tax_code,
      businessEmail: supplier.business_email,
      businessPhone: supplier.business_phone,
      status: supplier.status,
      onboardingNote: supplier.onboarding_note,
      approvedAt: supplier.approved_at,
      approvedBy: supplier.approved_by,
      createdAt: supplier.created_at,
      updatedAt: supplier.updated_at,
    }
  }
}
