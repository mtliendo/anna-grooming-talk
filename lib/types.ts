export type AppointmentStatus = "booked" | "cancel_pending" | "cancelled";
export type CibaStatus = "pending" | "approved" | "denied";

export type Dog = {
  id: string;
  userSub: string;
  name: string;
  breed: string;
  notes: string | null;
  createdAt: string;
};

export type Appointment = {
  id: string;
  userSub: string;
  dogId: string;
  serviceId: string;
  visitDate: string;
  visitTime: string;
  notes: string | null;
  status: AppointmentStatus;
  calendarEventId: string | null;
  calendarEventLink: string | null;
  cancelCibaAuthReqId: string | null;
  cancelCibaStatus: CibaStatus | null;
  cancelCibaIntervalSec: number | null;
  cancelCibaLastPolledAt: string | null;
  cancelCibaExpiresAt: string | null;
  createdAt: string;
  dogName?: string;
  dogBreed?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta: ChatMeta | null;
  createdAt: string;
};

export type ChatMeta = {
  kind?:
    | "token_vault"
    | "ciba_pending"
    | "ciba_approved"
    | "ciba_denied"
    | "booked";
  connectUrl?: string;
  appointmentId?: string;
  bindingMessage?: string;
};

export type SalonSnapshot = {
  dogs: Dog[];
  appointments: Appointment[];
  googleConnected: boolean;
  messages?: ChatMessage[];
};
