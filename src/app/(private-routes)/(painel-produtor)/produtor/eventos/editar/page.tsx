"use client";
import { useEffect } from "react";
import EventoPage from "../_components/EventoPage";
import { useEvento } from "@/context/EventoContext";
import { useRouter } from "next/navigation";

export default function CriarEvento() {
  const router = useRouter();
  const { data } = useEvento();

  useEffect(() => {
    if (data.id === undefined) {
      router.push("/produtor/eventos");
    }
  }, []);

  return <EventoPage />;
}
