"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Empresa, defaultEmpresa } from "./types";
import { supabase } from "./supabase";

type EmpresaContextType = {
  empresa: Empresa;
  setEmpresa: (e: Empresa) => void;
  saveEmpresa: (e: Empresa) => Promise<void>;
};

const EmpresaContext = createContext<EmpresaContextType | null>(null);

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa>(defaultEmpresa);

  useEffect(() => {
    supabase
      .from("company_settings")
      .select("*")
      .single()
      .then(({ data }) => {
        if (data) {
          setEmpresa({
            nombre: data.nombre,
            giro: data.giro,
            direccion: data.direccion,
            telefono: data.telefono,
            whatsapp: data.whatsapp,
            logo: data.logo,
          });
        }
      });
  }, []);

  async function saveEmpresa(e: Empresa) {
    const { data: existing } = await supabase
      .from("company_settings")
      .select("id")
      .single();

    if (existing?.id) {
      await supabase
        .from("company_settings")
        .update({ nombre: e.nombre, giro: e.giro, direccion: e.direccion, telefono: e.telefono, whatsapp: e.whatsapp })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("company_settings")
        .insert({ nombre: e.nombre, giro: e.giro, direccion: e.direccion, telefono: e.telefono, whatsapp: e.whatsapp });
    }
    setEmpresa(e);
  }

  return (
    <EmpresaContext.Provider value={{ empresa, setEmpresa, saveEmpresa }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) throw new Error("useEmpresa must be used within EmpresaProvider");
  return ctx;
}
