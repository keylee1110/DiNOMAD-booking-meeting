import assert from "node:assert/strict"
import test from "node:test"
import {
  buildCheckInQrPayload,
  createAccessCode,
  selectCustomerRooms,
} from "../lib/booking/check-in.ts"

test("database rooms replace demo rooms when public rooms are available", () => {
  const demoRooms = [{ id: "demo" }]
  const publicRooms = [{ id: "database" }]

  assert.deepEqual(selectCustomerRooms(publicRooms, demoRooms), publicRooms)
})

test("demo rooms are not returned when public room loading fails", () => {
  const demoRooms = [{ id: "demo" }]

  assert.deepEqual(selectCustomerRooms([], demoRooms), [])
})

test("check-in QR contains both booking id and access code", () => {
  assert.equal(
    buildCheckInQrPayload("booking-id", "A1B2"),
    "booking-id:A1B2",
  )
})

test("generated access codes contain four uppercase letters or digits", () => {
  assert.match(createAccessCode(), /^[A-Z0-9]{4}$/)
})
