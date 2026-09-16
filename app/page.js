"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xbnmzreihrxjsktlpcns.supabase.co";
const SUPABASE_KEY = "sb_publishable_9-xANiS8jgcoITOYNGrQtg_3MWUZpm8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FORM_INICIAL = {
  habitacion_id: "",
  huesped_principal: "",
  telefono: "",
  fecha_entrada: "",
  fecha_salida: "",
  adultos: 1,
  ninos_0_6: 0,
  ninos_7_10: 0,
  observaciones: "",
};

function obtenerHoyParaguay() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = partes.find((p) => p.type === "year")?.value;
  const month = partes.find((p) => p.type === "month")?.value;
  const day = partes.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function formatoGs(valor) {
  return `${new Intl.NumberFormat("es-PY").format(
    Number(valor || 0)
  )} Gs`;
}

function formatoFecha(fecha) {
  if (!fecha) return "—";

  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

export default function Home() {
  const [ingreso, setIngreso] = useState(false);

  const [habitaciones, setHabitaciones] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [tarifas, setTarifas] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [procesando, setProcesando] = useState("");

  const [mostrarReserva, setMostrarReserva] = useState(false);
  const [mostrarCanceladas, setMostrarCanceladas] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);

  const [form, setForm] = useState(FORM_INICIAL);

  const hoy = obtenerHoyParaguay();

  function mostrarExito(texto) {
    setEsError(false);
    setMensaje(texto);
  }

  function mostrarError(texto) {
    setEsError(true);
    setMensaje(texto);
  }

  async function cargarDatos() {
    setCargando(true);

    const [h, r, t] = await Promise.all([
      supabase
        .from("habitaciones")
        .select("*")
        .eq("activa", true)
        .order("numero", { ascending: true }),

      supabase
        .from("reservas")
        .select("*")
        .order("fecha_entrada", { ascending: true }),

      supabase
        .from("tarifas")
        .select("*")
        .eq("activa", true)
        .order("cantidad_personas", { ascending: true }),
    ]);

    if (h.error) {
      mostrarError("Error habitaciones: " + h.error.message);
    } else {
      setHabitaciones(h.data || []);
    }

    if (r.error) {
      mostrarError("Error reservas: " + r.error.message);
    } else {
      setReservas(r.data || []);
    }

    if (t.error) {
      mostrarError("Error tarifas: " + t.error.message);
    } else {
      setTarifas(t.data || []);
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const reservasActivas = useMemo(
    () =>
      reservas.filter(
        (r) =>
          r.estado !== "cancelada" &&
          r.estado !== "check_out"
      ),
    [reservas]
  );

  const reservasFinalizadas = useMemo(
    () =>
      reservas.filter(
        (r) =>
          r.estado === "cancelada" ||
          r.estado === "check_out"
      ),
    [reservas]
  );

  /*
    IMPORTANTE:
    Una reserva de mañana NO cuenta como ocupada hoy.
    La salida tampoco cuenta como noche ocupada.
  */
  const habitacionesOcupadasHoy = useMemo(() => {
    return new Set(
      reservasActivas
        .filter(
          (r) =>
            r.fecha_entrada <= hoy &&
            r.fecha_salida > hoy
        )
        .map((r) => Number(r.habitacion_id))
    );
  }, [reservasActivas, hoy]);

  const adultos = Number(form.adultos || 0);
  const ninosGratis = Number(form.ninos_0_6 || 0);
  const ninosMitad = Number(form.ninos_7_10 || 0);

  const totalPersonas =
    adultos + ninosGratis + ninosMitad;

  const habitacionSeleccionada = habitaciones.find(
    (h) =>
      String(h.id) === String(form.habitacion_id)
  );

  function obtenerTarifa(cantidad) {
    return tarifas.find(
      (t) =>
        Number(t.cantidad_personas) === Number(cantidad)
    );
  }

  function precioPorCantidad(cantidad) {
    if (cantidad <= 0) return 0;

    const tarifa = obtenerTarifa(cantidad);

    if (tarifa) {
      return Number(tarifa.precio_guaranies || 0);
    }

    const respaldo = {
      1: 200000,
      2: 400000,
      3: 540000,
      4: 760000,
      5: 950000,
      6: 1140000,
      7: 1330000,
    };

    return respaldo[cantidad] || 0;
  }

  function calcularTotal() {
    const precioAdultos =
      adultos > 0 ? precioPorCantidad(adultos) : 0;

    const valorPersona =
      adultos > 0
        ? precioAdultos / adultos
        : precioPorCantidad(1);

    const precioNinos =
      ninosMitad * valorPersona * 0.5;

    return Math.round(precioAdultos + precioNinos);
  }

  async function guardarReserva(evento) {
    evento.preventDefault();

    if (guardando) return;

    setMensaje("");

    if (!form.habitacion_id) {
      mostrarError("Seleccioná una habitación.");
      return;
    }

    if (!form.huesped_principal.trim()) {
      mostrarError("Ingresá el nombre del huésped.");
      return;
    }

    if (!form.fecha_entrada || !form.fecha_salida) {
      mostrarError("Completá entrada y salida.");
      return;
    }

    if (form.fecha_salida <= form.fecha_entrada) {
      mostrarError(
        "La fecha de salida debe ser posterior a la entrada."
      );
      return;
    }

    if (totalPersonas < 1) {
      mostrarError("Debe haber al menos una persona.");
      return;
    }

    if (
      habitacionSeleccionada &&
      totalPersonas >
        Number(habitacionSeleccionada.capacidad_maxima)
    ) {
      mostrarError(
        `La habitación ${habitacionSeleccionada.numero} admite máximo ${habitacionSeleccionada.capacidad_maxima} personas.`
      );
      return;
    }

    setGuardando(true);

    try {
      /*
        Comprobamos superposición:
        entrada existente < nueva salida
        Y salida existente > nueva entrada.
      */
      const { data: ocupaciones, error: errorDisponibilidad } =
        await supabase
          .from("reservas")
          .select("id")
          .eq("habitacion_id", Number(form.habitacion_id))
          .neq("estado", "cancelada")
          .neq("estado", "check_out")
          .lt("fecha_entrada", form.fecha_salida)
          .gt("fecha_salida", form.fecha_entrada);

      if (errorDisponibilidad) {
        throw errorDisponibilidad;
      }

      if (ocupaciones?.length > 0) {
        mostrarError(
          "Esa habitación ya está reservada en esas fechas."
        );
        return;
      }

      const tarifa = obtenerTarifa(Math.max(adultos, 1));
      const total = calcularTotal();

      const { data: creada, error: errorInsert } =
        await supabase
          .from("reservas")
          .insert([
            {
              habitacion_id: Number(form.habitacion_id),

              huesped_principal:
                form.huesped_principal.trim(),

              telefono:
                form.telefono.trim() || null,

              fecha_entrada: form.fecha_entrada,
              fecha_salida: form.fecha_salida,

              hora_checkin: "12:00",
              hora_checkout: "10:00",

              adultos,
              ninos_0_6: ninosGratis,
              ninos_7_10: ninosMitad,
              total_personas: totalPersonas,

              tarifa_id: tarifa?.id || null,

              precio_base: total,
              descuento: 0,
              total,

              estado: "reservada",
              estado_pago: "pendiente",

              desayuno: true,

              observaciones:
                form.observaciones.trim() || null,
            },
          ])
          .select()
          .single();

      if (errorInsert) {
        if (errorInsert.code === "23P01") {
          mostrarError(
            "Esa habitación ya está reservada en esas fechas."
          );
        } else {
          mostrarError(
            "No se pudo guardar: " + errorInsert.message
          );
        }

        return;
      }

      if (!creada?.id) {
        mostrarError(
          "No se pudo confirmar la reserva."
        );
        return;
      }

      setForm(FORM_INICIAL);
      setMostrarReserva(false);

      await cargarDatos();

      mostrarExito(
        "Reserva guardada correctamente."
      );
    } catch (err) {
      mostrarError(
        "No se pudo guardar: " +
          (err?.message || "Error desconocido")
      );
    } finally {
      setGuardando(false);
    }
  }

  async function actualizarReserva(
    reserva,
    cambios,
    mensajeCorrecto
  ) {
    if (procesando) return;

    setProcesando(reserva.id);
    setMensaje("");

    try {
      const { data, error: errorUpdate } =
        await supabase
          .from("reservas")
          .update(cambios)
          .eq("id", reserva.id)
          .select()
          .single();

      if (errorUpdate) {
        mostrarError(
          "No se pudo actualizar: " +
            errorUpdate.message
        );
        return;
      }

      if (!data?.id) {
        mostrarError(
          "No se pudo confirmar el cambio."
        );
        return;
      }

      await cargarDatos();
      mostrarExito(mensajeCorrecto);
    } catch (err) {
      mostrarError(
        "Error: " +
          (err?.message || "Error desconocido")
      );
    } finally {
      setProcesando("");
    }
  }

  async function confirmarPago(reserva) {
    const ok = window.confirm(
      `¿Confirmar pago de ${formatoGs(
        reserva.total
      )} de ${reserva.huesped_principal}?`
    );

    if (!ok) return;

    await actualizarReserva(
      reserva,
      { estado_pago: "pagado" },
      "Pago confirmado correctamente."
    );
  }

  async function pagoPendiente(reserva) {
    const ok = window.confirm(
      "¿Volver a marcar este pago como pendiente?"
    );

    if (!ok) return;

    await actualizarReserva(
      reserva,
      { estado_pago: "pendiente" },
      "Pago marcado como pendiente."
    );
  }

  async function cancelarReserva(reserva) {
    const ok = window.confirm(
      `¿Cancelar la reserva de ${reserva.huesped_principal}?\n\nLa habitación quedará libre nuevamente para esas fechas.`
    );

    if (!ok) return;

    await actualizarReserva(
      reserva,
      { estado: "cancelada" },
      "Reserva cancelada. Habitación liberada."
    );
  }

  async function checkIn(reserva) {
    const ok = window.confirm(
      `¿Registrar CHECK-IN de ${reserva.huesped_principal}?`
    );

    if (!ok) return;

    await actualizarReserva(
      reserva,
      { estado: "check_in" },
      "Check-in registrado."
    );
  }

  async function checkOut(reserva) {
    const ok = window.confirm(
      `¿Registrar CHECK-OUT de ${reserva.huesped_principal}?`
    );

    if (!ok) return;

    await actualizarReserva(
      reserva,
      { estado: "check_out" },
      "Check-out registrado. Habitación liberada."
    );
  }

  function textoEstado(estado) {
    switch (estado) {
      case "reservada":
        return "Reservada";
      case "check_in":
        return "Hospedado";
      case "check_out":
        return "Finalizada";
      case "cancelada":
        return "Cancelada";
      default:
        return estado || "—";
    }
  }

  function colorEstado(estado) {
    if (estado === "cancelada") {
      return {
        background: "#F3E3DF",
        color: "#A35C4E",
      };
    }

    if (estado === "check_out") {
      return {
        background: "#ECEAE5",
        color: "#746E62",
      };
    }

    if (estado === "check_in") {
      return {
        background: "#E4EEE0",
        color: "#496640",
      };
    }

    return {
      background: "#EAF0E6",
      color: "#55704C",
    };
  }

  function TarjetaReserva({ reserva, historial = false }) {
    const habitacion = habitaciones.find(
      (h) =>
        Number(h.id) ===
        Number(reserva.habitacion_id)
    );

    const ocupado =
      procesando === reserva.id;

    return (
      <div style={estilos.reserva}>
        <div style={estilos.reservaArriba}>
          <div style={{ flex: 1 }}>
            <strong style={estilos.nombreReserva}>
              {reserva.huesped_principal}
            </strong>

            <span style={estilos.detalle}>
              Habitación {habitacion?.numero || "—"} ·{" "}
              {reserva.total_personas} huésped
              {Number(reserva.total_personas) !== 1
                ? "es"
                : ""}
            </span>

            <span style={estilos.detalle}>
              {formatoFecha(reserva.fecha_entrada)} →{" "}
              {formatoFecha(reserva.fecha_salida)}
            </span>

            {reserva.telefono && (
              <span style={estilos.detalle}>
                Tel. {reserva.telefono}
              </span>
            )}

            <strong style={estilos.total}>
              {formatoGs(reserva.total)}
            </strong>
          </div>

          <span
            style={{
              ...estilos.estado,
              ...colorEstado(reserva.estado),
            }}
          >
            {textoEstado(reserva.estado)}
          </span>
        </div>

        {!historial && (
          <>
            <div style={estilos.pago}>
              <span>Pago</span>

              <strong
                style={{
                  color:
                    reserva.estado_pago === "pagado"
                      ? "#55704C"
                      : "#A48650",
                }}
              >
                {reserva.estado_pago === "pagado"
                  ? "PAGADO"
                  : reserva.estado_pago === "parcial"
                  ? "PARCIAL"
                  : "PENDIENTE"}
              </strong>
            </div>

            <div style={estilos.acciones}>
              {reserva.estado_pago !== "pagado" && (
                <button
                  type="button"
                  disabled={ocupado}
                  style={estilos.botonPago}
                  onClick={() => confirmarPago(reserva)}
                >
                  CONFIRMAR PAGO
                </button>
              )}

              {reserva.estado_pago === "pagado" && (
                <button
                  type="button"
                  disabled={ocupado}
                  style={estilos.botonSecundario}
                  onClick={() => pagoPendiente(reserva)}
                >
                  MARCAR PAGO PENDIENTE
                </button>
              )}

              {reserva.estado === "reservada" && (
                <button
                  type="button"
                  disabled={ocupado}
                  style={estilos.botonCheck}
                  onClick={() => checkIn(reserva)}
                >
                  HACER CHECK-IN
                </button>
              )}

              {reserva.estado === "check_in" && (
                <button
                  type="button"
                  disabled={ocupado}
                  style={estilos.botonCheck}
                  onClick={() => checkOut(reserva)}
                >
                  HACER CHECK-OUT
                </button>
              )}

              <button
                type="button"
                disabled={ocupado}
                style={estilos.botonCancelar}
                onClick={() => cancelarReserva(reserva)}
              >
                CANCELAR RESERVA
              </button>
            </div>

            {ocupado && (
              <div style={estilos.procesando}>
                Procesando...
              </div>
            )}
          </>
        )}

        {historial && (
          <div style={estilos.historialTexto}>
            {reserva.estado === "cancelada"
              ? "Reserva cancelada · Habitación liberada"
              : "Estadía finalizada"}
          </div>
        )}
      </div>
    );
  }

  if (!ingreso) {
    return (
      <main style={estilos.portada}>
        <section style={estilos.centro}>
          <div style={estilos.hotel}>
            HOTEL BOUTIQUE
          </div>

          <h1 style={estilos.logo}>JABIRÚ</h1>

          <p style={estilos.subtitulo}>
            Gestión del hotel
          </p>

          <button
            type="button"
            style={estilos.botonPrincipal}
            onClick={() => setIngreso(true)}
          >
            INGRESAR
          </button>

          <p style={estilos.pie}>
            Sistema de administración
          </p>
        </section>
      </main>
    );
  }

  return (
    <main style={estilos.app}>
      <section style={estilos.contenedor}>
        <header style={estilos.header}>
          <div>
            <div style={estilos.hotel}>
              HOTEL BOUTIQUE
            </div>

            <h1 style={estilos.titulo}>JABIRÚ</h1>
          </div>

          <button
            type="button"
            style={estilos.botonSalir}
            onClick={() => setIngreso(false)}
          >
            Salir
          </button>
        </header>

        <h2 style={estilos.h2}>Administración</h2>

        {mensaje && (
          <div
            style={{
              ...estilos.mensaje,
              background: esError
                ? "#F6E4E0"
                : "#E7EFE3",
              color: esError
                ? "#A05446"
                : "#496640",
            }}
          >
            {mensaje}
          </div>
        )}

        <div style={estilos.resumen}>
          <div style={estilos.tarjetaResumen}>
            <strong style={estilos.numero}>
              {habitaciones.length}
            </strong>
            <span>Habitaciones</span>
          </div>

          <div style={estilos.tarjetaResumen}>
            <strong style={estilos.numero}>
              {habitacionesOcupadasHoy.size}
            </strong>
            <span>Ocupadas hoy</span>
          </div>

          <div style={estilos.tarjetaResumen}>
            <strong style={estilos.numero}>
              {Math.max(
                habitaciones.length -
                  habitacionesOcupadasHoy.size,
                0
              )}
            </strong>
            <span>Disponibles</span>
          </div>
        </div>

        <button
          type="button"
          style={estilos.botonPrincipal}
          onClick={() => {
            setMensaje("");
            setMostrarReserva(!mostrarReserva);
          }}
        >
          {mostrarReserva
            ? "CERRAR"
            : "+ NUEVA RESERVA"}
        </button>

        {mostrarReserva && (
          <form
            style={estilos.formulario}
            onSubmit={guardarReserva}
          >
            <h3 style={{ marginTop: 0 }}>
              Nueva reserva
            </h3>

            <label style={estilos.label}>
              Habitación
            </label>

            <select
              style={estilos.input}
              value={form.habitacion_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  habitacion_id: e.target.value,
                })
              }
              required
            >
              <option value="">
                Seleccionar habitación
              </option>

              {habitaciones.map((h) => (
                <option key={h.id} value={h.id}>
                  Habitación {h.numero} — {h.tipo}
                </option>
              ))}
            </select>

            <label style={estilos.label}>
              Huésped principal
            </label>

            <input
              style={estilos.input}
              value={form.huesped_principal}
              onChange={(e) =>
                setForm({
                  ...form,
                  huesped_principal: e.target.value,
                })
              }
              placeholder="Nombre y apellido"
              required
            />

            <label style={estilos.label}>
              Teléfono
            </label>

            <input
              style={estilos.input}
              type="tel"
              value={form.telefono}
              onChange={(e) =>
                setForm({
                  ...form,
                  telefono: e.target.value,
                })
              }
              placeholder="Número de teléfono"
            />

            <div style={estilos.dosColumnas}>
              <div>
                <label style={estilos.label}>
                  Entrada
                </label>

                <input
                  style={estilos.input}
                  type="date"
                  value={form.fecha_entrada}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fecha_entrada: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label style={estilos.label}>
                  Salida
                </label>

                <input
                  style={estilos.input}
                  type="date"
                  value={form.fecha_salida}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fecha_salida: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div style={estilos.tresColumnas}>
              <div>
                <label style={estilos.label}>
                  Adultos / 11+
                </label>

                <input
                  style={estilos.input}
                  type="number"
                  min="0"
                  max="7"
                  value={form.adultos}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      adultos: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={estilos.label}>
                  Niños 0–6
                </label>

                <input
                  style={estilos.input}
                  type="number"
                  min="0"
                  max="7"
                  value={form.ninos_0_6}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ninos_0_6: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={estilos.label}>
                  Niños 7–10
                </label>

                <input
                  style={estilos.input}
                  type="number"
                  min="0"
                  max="7"
                  value={form.ninos_7_10}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ninos_7_10: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div style={estilos.info}>
              Huéspedes: <strong>{totalPersonas}</strong>
              <br />
              Niños 0–6: sin cargo
              <br />
              Niños 7–10: 50%
              <br />
              Total estimado:{" "}
              <strong>
                {formatoGs(calcularTotal())}
              </strong>
            </div>

            <label style={estilos.label}>
              Observaciones
            </label>

            <textarea
              style={{
                ...estilos.input,
                minHeight: 80,
              }}
              value={form.observaciones}
              onChange={(e) =>
                setForm({
                  ...form,
                  observaciones: e.target.value,
                })
              }
              placeholder="Observaciones"
            />

            <button
              type="submit"
              disabled={guardando}
              style={{
                ...estilos.botonGuardar,
                opacity: guardando ? 0.6 : 1,
              }}
            >
              {guardando
                ? "GUARDANDO..."
                : "GUARDAR RESERVA"}
            </button>
          </form>
        )}

        <h3 style={estilos.seccion}>
          Habitaciones
        </h3>

        {cargando ? (
          <p>Cargando...</p>
        ) : (
          habitaciones.map((h) => {
            const ocupada =
              habitacionesOcupadasHoy.has(Number(h.id));

            return (
              <div
                key={h.id}
                style={estilos.habitacion}
              >
                <div style={estilos.circulo}>
                  {h.numero}
                </div>

                <div style={{ flex: 1 }}>
                  <strong style={estilos.tipo}>
                    {h.tipo}
                  </strong>

                  <span style={estilos.detalle}>
                    {h.camas_matrimoniales > 0 &&
                      `${h.camas_matrimoniales} matrimonial${
                        h.camas_matrimoniales > 1
                          ? "es"
                          : ""
                      }`}

                    {h.camas_matrimoniales > 0 &&
                      h.camas_individuales > 0 &&
                      " + "}

                    {h.camas_individuales > 0 &&
                      `${h.camas_individuales} individual${
                        h.camas_individuales > 1
                          ? "es"
                          : ""
                      }`}
                  </span>

                  <span style={estilos.detalle}>
                    Máximo {h.capacidad_maxima} personas
                  </span>
                </div>

                <span
                  style={{
                    ...estilos.estado,
                    background: ocupada
                      ? "#F3E3DF"
                      : "#EAF0E6",
                    color: ocupada
                      ? "#A35C4E"
                      : "#55704C",
                  }}
                >
                  {ocupada ? "Ocupada" : "Disponible"}
                </span>
              </div>
            );
          })
        )}

        <h3 style={estilos.seccion}>
          Reservas activas
        </h3>

        {reservasActivas.length === 0 ? (
          <div style={estilos.vacio}>
            No hay reservas activas.
          </div>
        ) : (
          reservasActivas.map((reserva) => (
            <TarjetaReserva
              key={reserva.id}
              reserva={reserva}
            />
          ))
        )}

        <button
          type="button"
          style={estilos.botonHistorial}
          onClick={() =>
            setMostrarCanceladas(!mostrarCanceladas)
          }
        >
          {mostrarCanceladas
            ? "OCULTAR HISTORIAL"
            : `VER HISTORIAL (${reservasFinalizadas.length})`}
        </button>

        {mostrarCanceladas && (
          <>
            <h3 style={estilos.seccion}>
              Historial
            </h3>

            {reservasFinalizadas.length === 0 ? (
              <div style={estilos.vacio}>
                No hay reservas finalizadas o canceladas.
              </div>
            ) : (
              reservasFinalizadas.map((reserva) => (
                <TarjetaReserva
                  key={reserva.id}
                  reserva={reserva}
                  historial
                />
              ))
            )}
          </>
        )}
      </section>
    </main>
  );
}

const estilos = {
  portada: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#F5F0E6,#E7DECE)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "Arial,sans-serif",
  },

  centro: {
    width: "100%",
    maxWidth: 430,
    textAlign: "center",
  },

  hotel: {
    fontSize: 11,
    letterSpacing: 4,
    color: "#987F52",
    marginBottom: 8,
  },

  logo: {
    margin: 0,
    fontSize: 48,
    letterSpacing: 3,
    color: "#394332",
  },

  subtitulo: {
    color: "#706857",
    margin: "12px 0 38px",
  },

  pie: {
    color: "#948B7A",
    fontSize: 12,
    marginTop: 25,
  },

  botonPrincipal: {
    width: "100%",
    border: 0,
    borderRadius: 12,
    padding: 16,
    background: "#4E5B43",
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: 15,
  },

  app: {
    minHeight: "100vh",
    background: "#F5F0E6",
    fontFamily: "Arial,sans-serif",
    color: "#394332",
  },

  contenedor: {
    maxWidth: 600,
    margin: "auto",
    padding: "22px 16px 60px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #D8CEBD",
    paddingBottom: 16,
  },

  titulo: {
    margin: 0,
    fontSize: 28,
    letterSpacing: 2,
  },

  botonSalir: {
    border: "1px solid #B9AD98",
    borderRadius: 9,
    background: "transparent",
    padding: "8px 13px",
    color: "#706857",
  },

  h2: {
    margin: "25px 0 15px",
    fontSize: 26,
  },

  resumen: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 8,
    marginBottom: 16,
  },

  tarjetaResumen: {
    background: "#FFFFFF",
    borderRadius: 12,
    padding: "14px 5px",
    textAlign: "center",
    fontSize: 11,
  },

  numero: {
    display: "block",
    fontSize: 20,
    color: "#4E5B43",
    marginBottom: 4,
  },

  mensaje: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    fontSize: 13,
    fontWeight: 600,
  },

  formulario: {
    background: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
  },

  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    margin: "12px 0 5px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    borderRadius: 9,
    border: "1px solid #D5CCBC",
    background: "#FFFFFF",
    fontSize: 15,
  },

  dosColumnas: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },

  tresColumnas: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 7,
  },

  info: {
    background: "#F5F0E6",
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    lineHeight: 1.6,
    marginTop: 12,
  },

  botonGuardar: {
    width: "100%",
    marginTop: 15,
    padding: 15,
    border: 0,
    borderRadius: 10,
    background: "#A48650",
    color: "#FFFFFF",
    fontWeight: 700,
  },

  seccion: {
    margin: "28px 0 10px",
    fontSize: 20,
  },

  habitacion: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    background: "#FFFFFF",
    borderRadius: 12,
    padding: 13,
    marginBottom: 9,
  },

  circulo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: "#E7E1D4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    flexShrink: 0,
  },

  tipo: {
    display: "block",
    fontSize: 13,
    marginBottom: 4,
  },

  detalle: {
    display: "block",
    color: "#817866",
    fontSize: 12,
    marginTop: 4,
  },

  estado: {
    fontSize: 11,
    borderRadius: 20,
    padding: "7px 10px",
    whiteSpace: "nowrap",
    height: "fit-content",
  },

  reserva: {
    background: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  reservaArriba: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },

  nombreReserva: {
    display: "block",
    fontSize: 17,
    marginBottom: 5,
  },

  total: {
    display: "block",
    marginTop: 7,
    fontSize: 14,
  },

  pago: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 13,
    paddingTop: 11,
    borderTop: "1px solid #EEE8DD",
    fontSize: 12,
  },

  acciones: {
    display: "grid",
    gap: 7,
    marginTop: 11,
  },

  botonPago: {
    width: "100%",
    border: 0,
    borderRadius: 9,
    padding: 12,
    background: "#A48650",
    color: "#FFFFFF",
    fontWeight: 700,
  },

  botonCheck: {
    width: "100%",
    border: 0,
    borderRadius: 9,
    padding: 12,
    background: "#4E5B43",
    color: "#FFFFFF",
    fontWeight: 700,
  },

  botonSecundario: {
    width: "100%",
    border: "1px solid #C9BEAA",
    borderRadius: 9,
    padding: 11,
    background: "#FFFFFF",
    color: "#706857",
    fontWeight: 700,
  },

  botonCancelar: {
    width: "100%",
    border: "1px solid #DABBB4",
    borderRadius: 9,
    padding: 11,
    background: "#FFFFFF",
    color: "#A35C4E",
    fontWeight: 700,
  },

  botonHistorial: {
    width: "100%",
    marginTop: 20,
    border: "1px solid #C9BEAA",
    borderRadius: 10,
    padding: 12,
    background: "transparent",
    color: "#706857",
    fontWeight: 700,
  },

  procesando: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 12,
    color: "#817866",
  },

  historialTexto: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid #EEE8DD",
    fontSize: 11,
    color: "#817866",
  },

  vacio: {
    background: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    textAlign: "center",
    color: "#817866",
    fontSize: 13,
  },
};
