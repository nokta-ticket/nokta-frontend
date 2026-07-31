import api from "@/lib/axios";

// Espelham exatamente as respostas do GuestsModule (nokta-api,
// src/tickets/guests). Convidado de evento é um UserTicket real (cortesia)
// já transferido para a conta do convidado — nunca um model próprio.

export interface Guest {
  userTicketId: number;
  status: number; // UserTicketStatus: 1=NOT_VALIDATED 2=VALIDATED 3=IN_RESALE 4=TRANSFERRED
  guest: { id: number; nome: string; email: string };
  createdAt: string;
  qrSentAt: string | null;
}

export interface InviteGuestPayload {
  eventId: number;
  email: string;
}

export const guestsApi = {
  list: (eventId: number) => api.get<Guest[]>("/guests", { params: { eventId } }).then((r) => r.data),
  invite: (payload: InviteGuestPayload) =>
    api.post<{ userTicketId: number; message: string }>("/guests/invite", payload).then((r) => r.data),
};
