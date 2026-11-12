import { listAppointments } from "@/lib/appointments";
import { pollAllPendingCancels } from "@/lib/ciba-cancel";
import { listDogs } from "@/lib/dogs";
import { isGoogleConnected } from "@/lib/google";
import { listMessages } from "@/lib/chat";
import { isDatabaseConfigured } from "@/lib/config";
import type { SalonSnapshot } from "@/lib/types";

export async function loadSalonSnapshot(
  userSub: string,
  options?: { includeChat?: boolean; tickCiba?: boolean },
): Promise<SalonSnapshot> {
  if (!isDatabaseConfigured()) {
    return { dogs: [], appointments: [], googleConnected: false, messages: [] };
  }

  let appointments = await listAppointments(userSub);
  if (options?.tickCiba !== false) {
    appointments = await pollAllPendingCancels(userSub, appointments);
  }

  const [dogs, googleConnected, messages] = await Promise.all([
    listDogs(userSub),
    isGoogleConnected(),
    options?.includeChat ? listMessages(userSub) : Promise.resolve(undefined),
  ]);

  return {
    dogs,
    appointments,
    googleConnected,
    messages,
  };
}
