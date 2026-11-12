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

export async function bookAppointmentAction(formData: FormData) {
  const { sub } = await requireSub();
  const dogId = String(formData.get("dogId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  const visitDate = String(formData.get("date") ?? "");
  const visitTime = String(formData.get("time") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!dogId || !serviceId || !visitDate || !visitTime) {
    throw new Error("Pick a dog, a service, a date, and a time slot.");
  }
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
