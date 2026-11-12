"use server";

import { revalidatePath } from "next/cache";
import { getSessionSafe } from "@/lib/auth0";
import { addDog, addSampleDog, deleteDog } from "@/lib/dogs";
import { bookAppointment, getAppointment, listAppointments } from "@/lib/appointments";
import { requestCancelAppointment } from "@/lib/ciba-cancel";

async function requireSub() {
  const session = await getSessionSafe();
  const sub = session?.user?.sub;
  if (!sub) throw new Error("Please sign in to manage your dogs.");
  return { sub, session };
}

export async function addDogAction(formData: FormData) {
  const { sub } = await requireSub();
  const name = String(formData.get("name") ?? "").trim();
  const breed = String(formData.get("breed") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!name || !breed) throw new Error("Name and breed are required.");
  await addDog(sub, { name, breed, notes });
  revalidatePath("/book");
  revalidatePath("/");
}

export async function addSampleDogAction() {
  const { sub } = await requireSub();
  await addSampleDog(sub);
  revalidatePath("/book");
}

export async function deleteDogAction(formData: FormData) {
  const { sub } = await requireSub();
  const dogId = String(formData.get("dogId") ?? "");
  if (!dogId) throw new Error("Missing dog id.");
  await deleteDog(sub, dogId);
  revalidatePath("/book");
}

function composeBookingNotes(formData: FormData): string {
  const lines = [
    String(formData.get("notes") ?? "").trim(),
    `Day-of phone: ${String(formData.get("phone") ?? "").trim()}`,
    `Reach by: ${String(formData.get("reachBy") ?? "").trim()}`,
    `Drop-off: ${String(formData.get("dropOff") ?? "").trim()}`,
  ];
  const altDate = String(formData.get("altDate") ?? "").trim();
  if (altDate) lines.push(`Second-choice date: ${altDate}`);
  const lastGroomed = String(formData.get("lastGroomed") ?? "").trim();
  if (lastGroomed) lines.push(`Last groomed: ${lastGroomed}`);
  if (formData.get("vaccines") === "yes") lines.push("Vaccines: current");
  if (formData.get("cancelAck") === "yes") {
    lines.push("Cancel policy: email confirmation acknowledged");
  }
  return lines.filter(Boolean).join(" · ");
}

export async function bookAppointmentAction(formData: FormData) {
  const { sub } = await requireSub();
  const dogId = String(formData.get("dogId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  const visitDate = String(formData.get("date") ?? "");
  const visitTime = String(formData.get("time") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const dropOff = String(formData.get("dropOff") ?? "").trim();
  const vaccines = formData.get("vaccines") === "yes";
  const cancelAck = formData.get("cancelAck") === "yes";
  const altDate = String(formData.get("altDate") ?? "").trim();
  if (!dogId || !serviceId || !visitDate || !visitTime || !phone || !dropOff || !altDate) {
    throw new Error("Please complete every required field on the booking form.");
  }
  if (!vaccines || !cancelAck) {
    throw new Error("Please confirm vaccines and the cancellation email.");
  }
  const notes = composeBookingNotes(formData);
  await bookAppointment(sub, { dogId, serviceId, visitDate, visitTime, notes });
  revalidatePath("/book");
}

export async function cancelAppointmentAction(formData: FormData) {
  const { sub } = await requireSub();
  const appointmentId = String(formData.get("appointmentId") ?? "");
  if (!appointmentId) throw new Error("Missing appointment id.");
  const appointment = await getAppointment(sub, appointmentId);
  if (!appointment) throw new Error("That appointment is not on your book.");
  await requestCancelAppointment(appointment, sub, appointmentId);
  revalidatePath("/book");
  revalidatePath("/chat");
}

export async function refreshBookAction() {
  const { sub } = await requireSub();
  await listAppointments(sub);
  revalidatePath("/book");
}
